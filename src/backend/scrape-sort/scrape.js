import puppeteer from 'puppeteer';
import fs from 'fs';
import { timeConversion, standingsScrape } from './standings-time.js';
import finalSort from './finalSort.js';
import netLinks from './netLinks.js';

var url;
var data = {};  //object json data will be stored in
var gameData = {};

//converts time and saves it to data obj separately
function timeToObj(data, league){   
    for(let i = 0; i < data.length; i++){
        data[i].convertedTime = timeConversion(league, data[i].time).toString();
    }
}

//scrapes all of the game data for a league
var scrape = async function scrape(league, priority, availNets){
    console.log('Current league: ' + league);
    console.log('Priority: ' + priority);
    url = 'https://www.espn.com/'+league.toLowerCase()+'/scoreboard';
    data.table = []; 
    
    //use puppeteer to open link
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    var fullDate, teams, times, scores, nets, numGames, links, logos;
    
    [fullDate, teams, times, scores, nets, numGames, links, logos] = await page.evaluate((league) => {
        fullDate = document.querySelector('.Card__Header__Title__Wrapper .Card__Header__Title').textContent;
        teams = [];
        scores = [];
        times = [];
        nets = [];
        links = [];
        logos = [];
        let teamLen = document.querySelectorAll('.AnchorLink .ScoreCell__TeamName').length;
        numGames = teamLen/2;
        
        times = document.querySelectorAll('.ScoreboardScoreCell__Overview .ScoreCell__Time');
        let timeArr = Array.from(times);
        timeArr = timeArr.map(game => game.textContent);

        let endedLen = 0;
        let scoreLen = 0;
        let notEnded = 0;

        for(let i = 0; i < teamLen; i++){
            teams[i] = document.querySelectorAll('.AnchorLink .ScoreCell__TeamName')[i];
            logos[i] = document.querySelectorAll('.AnchorLink .ScoreboardScoreCell__Logo')[i].src;
            if(!(i%2) && timeArr[i/2].includes('Final')){
                endedLen++;
            }
        }
        endedLen *= 2;  //each 1 game ended has 2 teams and scores
        scoreLen = document.querySelectorAll('.ScoreboardScoreCell__Item .ScoreCell__Score').length;
        notEnded = teamLen - endedLen;

        //put scores in array
        for(let i = 0; i < scoreLen; i++){
            scores[i] = document.querySelectorAll('.ScoreboardScoreCell__Item .ScoreCell__Score')[i];
            if(scores[i] == null){
                scores[i] = '-';
            } 
        }
        let scoreArr = Array.from(scores);
        scoreArr = scoreArr.map(game => game.textContent);  
        for(let i = scoreLen - endedLen; i < teamLen - endedLen; i++){
            scoreArr[i] = '-';  //placeholder before score exists
        }

        //scores only exist for ongoing and ended, so scores have to split around unstarted games
        //because ongoing games are always first and ended are always last on espn
        for(let i = teamLen - endedLen; i < teamLen; i++){
            scoreArr[i] =  document.querySelectorAll('.ScoreboardScoreCell__Item .ScoreCell__Score')[scoreLen - endedLen + i - notEnded].textContent;
        }
        
        //put networks and links in respective lists
        for(let i = 0; i < numGames; i++){
            if(document.querySelectorAll('.ScoreboardScoreCell')[i].querySelector('.ScoreCell__NetworkItem') != null){
                nets[i] = document.querySelectorAll('.ScoreboardScoreCell')[i].querySelector('.ScoreCell__NetworkItem').textContent;
            }
            else nets[i] = '';
            if(document.querySelectorAll('.Scoreboard .Scoreboard__Callouts .WatchListenButtons .AnchorLink')[i] !== undefined){
                links[i] = document.querySelectorAll('.Scoreboard .Scoreboard__Callouts .WatchListenButtons .AnchorLink')[i];
            }
        }
        
        //convert nodelists into arrays
        let teamArr = Array.from(teams);
        teamArr = teamArr.map(team => team.textContent);  
        let linkArr = Array.from(links);
        linkArr = linkArr.map(link => link.href);

        return [fullDate, teamArr, timeArr, scoreArr, nets, numGames, linkArr, logos];
    }, league);

    //date with day of the week stripped off
    let i = 0;
    for(i; i < fullDate.length; i++){
        if(fullDate[i] == ','){
          break;
        }
    }
    var date = [];
    for(let j = 0; j < fullDate.length; j++){
        date[j] = fullDate[i+2];
        i++;
    }
    date = date.toString().replace(',,,', '|').replaceAll(',', '').replace('|', ',');
    console.log(date + '\n');

    //sets progress and diff values
    var ongoingDiffs = [];
    var endedDiffs = [];
    var progress = [];
    var diffs = [];
    for(let i = 0; i < numGames; i++){   
        if(times[i].endsWith('PM') || times[i].endsWith('AM')){
            progress[i] = 'unstarted';
            diffs[i] = 100;
        }
        else if(times[i].includes('Final')){
            progress[i] = 'ended';
            diffs[i] = Math.abs(scores[i*2] - scores[i*2+1]);
            endedDiffs.push(diffs[i]);
        }
        else{
            progress[i] = 'ongoing';
            diffs[i] = Math.abs(scores[i*2] - scores[i*2+1]);
            ongoingDiffs.push(diffs[i]);
        } 
    }

    var channels = [];
    if(nets.length > 0) channels = netLinks(nets, teams, progress, numGames, links, league, availNets);
    else{
        for(let i = 0; i < numGames; i++){
            channels[i] = '';
        }
    }

    gameData.table = [];
    var gameObj = {};
    for(let i = 0; i < numGames; i++){
        gameObj = {
            team1: teams[2*i],
            score1: scores[2*i],
            logo1: logos[2*i],
            team2: teams[2*i+1],
            score2: scores[2*i+1],
            logo2: logos[2*i+1],
            progress: progress[i],  //unstarted, ended, ongoing
            time: times[i],   //time left or start time
            network: nets[i],
            link: channels[i],
            diff: diffs[i]
        }
        gameData.table.push(gameObj);
    } 

    const callStandings = async () => {
        let standsExist = true; //if file exists
        let needUpdate = false; 
        if(!fs.existsSync('../json/standings.json')){
            standsExist = false;
        }
        if(standsExist){
            needUpdate = await needStandings(league);
            if(needUpdate === true){ //true = in json & out of date
                //use outdated stands for quick response (it's just an extra scrape)
                await reuseStands(league, gameData.table);
                timeToObj(gameData.table, league);
                finalSort(gameData.table, priority, league, date);

                //then scrape standings and update if needed
                standingsScrape(league, data, needUpdate, standsExist);
                timeToObj(gameData.table, league);
                finalSort(gameData.table, priority, league, date);
            }
            else if(needUpdate === null){ //null = not in json
                standingsScrape(league, data, needUpdate, standsExist);
                timeToObj(gameData.table, league);
                finalSort(gameData.table, priority, league, date);
            }
            else{ //false = in json & updated
                 await reuseStands(league, gameData.table);
                 timeToObj(gameData.table, league);
                 finalSort(gameData.table, priority, league, date);
            }
        }
        else{
            standingsScrape(league, data, false, standsExist);
            timeToObj(gameData.table, league);
            finalSort(gameData.table, priority, league, date);
        }        
      }
      
    callStandings();

    //close puppeteer browser
    await browser.close();
}

export function callScrape(league, priority, availNets){
    scrape(league, priority, availNets);
}

export default scrape;