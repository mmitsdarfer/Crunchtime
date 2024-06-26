//MLB has many edge cases (e.g. innings, bottom/top), so it has its own scrape file

import puppeteer from 'puppeteer';
import fs from 'fs';
import { timeConversion, standingsScrape, needStandings, reuseStands  } from './standings-time.js';
import finalSort from './finalSort.js';
import netLinks from './netLinks.js';
var url;

//converts time and saves it to data obj separately
function timeToObj(data, league){   
    for(let i = 0; i < data.length; i++){
        data[i].convertedTime = timeConversion(league, data[i].time).toString();
    }
}

export async function mlbScrape(priority, availNets){
    var league = 'MLB'; 
    console.log('Current league: ' + league);
    console.log('Priority: ' + priority);
    url = 'https://www.espn.com/'+league.toLowerCase()+'/scoreboard';
    var data = {};
    data.table = []; 

    //use puppeteer to open link
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    var fullDate, teams, times, scores, nets, numGames, links, logos;

    await page.waitForSelector('div.ScoreCell__Score'); //scores are loaded a bit later, so need to wait for them (I think...)
    
    [fullDate, teams, times, scores, nets, numGames, links, logos] = await page.evaluate(() => {
        fullDate = document.querySelector('.Card__Header__Title__Wrapper .Card__Header__Title').textContent;
        teams = [];
        scores = [];
        times = [];
        nets = [];
        links = [];
        logos = [];
        let firstFin = 0;
        //let firstUnstart = 0;

        teamLen = document.querySelectorAll('.Scoreboard__Row .ScoreCell__TeamName').length;
        numGames = teamLen/2;

        for(let i = 0; i < numGames; i++){
            times[i] = document.querySelectorAll('.Scoreboard .ScoreCell__Time')[i].textContent;
        }
        
        scoreLen = document.querySelectorAll('.ScoreCell__Score').length;
        let notStarted = 0;

        for(let i = 0; i < teamLen; i++){
            teams[i] = document.querySelectorAll('.Scoreboard__Row .ScoreCell__TeamName')[i].textContent;
            logos[i] = document.querySelectorAll('.AnchorLink .ScoreboardScoreCell__Logo')[i].src;
            if(!(i%2)){
                if(times[i/2] == ('Final')){
                    if(firstFin == 0) firstFin = i;
                    scores[i] = document.querySelectorAll('.ScoreboardScoreCell__Value')[(i-notStarted)*3].textContent;
                    scores[i+1] =  document.querySelectorAll('.ScoreboardScoreCell__Value')[(i-notStarted+1)*3].textContent;
                }
                else if(times[i/2] == 'Postponed' || times[i/2] == 'Canceled'){
                    scores[i] = '-';
                    scores[i+1] = '-';              
                }
                else if(times[i/2].includes('AM') || times[i/2].includes('PM')){
                    //if(firstUnstart == 0) firstUnstart = i;
                    scores[i] = '-';
                    scores[i+1] = '-';
                    notStarted += 2; 
                }
                else{
                    scores[i] = document.querySelectorAll('.ScoreCell__Score')[i].textContent;
                    scores[i+1] = document.querySelectorAll('.ScoreCell__Score')[i+1].textContent;
                }
            }
        }

        for(let i = 0; i < teamLen; i++){
            if(scores[i].includes('-') && /^\d/.test(scores[i])){   //if has dash and starts with a number for when espn puts records in place of scores for unstarted games 
                scores.splice(i, 1);
                i--;
            }
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
        linkArr = Array.from(links);
        linkArr = linkArr.map(link => link.href);

        return [fullDate, teams, times, scores, nets, numGames, linkArr, logos];
    })

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
        if(times[i].endsWith('PM') || times[i].endsWith('AM') || times[i] == 'Postponed' || times[i] == 'Canceled'){
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

    var obj = {};
    for(let i = 0; i < numGames; i++){
        obj = {
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
        data.table.push(obj);
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
                await reuseStands(league, data.table);
                timeToObj(data.table, league);
                finalSort(data.table, priority, league, date);

                //then scrape standings and update if needed
                standingsScrape(league, data, needUpdate, standsExist);
                timeToObj(data.table, league);
                finalSort(data.table, priority, league, date);
            }
            else if(needUpdate === null){ //null = not in json
                standingsScrape(league, data, needUpdate, standsExist);
                timeToObj(data.table, league);
                finalSort(data.table, priority, league, date);
            }
            else{ //false = in json & updated
                 await reuseStands(league, data.table);
                 timeToObj(data.table, league);
                 finalSort(data.table, priority, league, date);
            }
        }
        else{
            standingsScrape(league, data, false, standsExist);
            timeToObj(data.table, league);
            finalSort(data.table, priority, league, date);
        }        
      }
    callStandings();
      
    await browser.close();
}

export default mlbScrape;