import {useEffect, useState} from 'react';
import { noLinks } from '../backend/scrape-sort/netLinks';
import { useNavigate } from 'react-router-dom';
import * as Realm from 'realm-web';

const app = new Realm.App({id: 'application-0-ejwdagr'});
const PORT = 5000;
const baseUrl = `http://localhost:${PORT}`;

var fullNets = [['TNT', 'https://www.tntdrama.com/watchtnt/east'], ['ESPN+', 'https://www.espn.com/watch/'], ['FOX', 'https://www.foxsports.com/live'],
['CBS', 'https://www.cbs.com/live-tv/stream'], ['ABC', 'https://abc.com/watch-live/abc'], 
['NBC', 'https://www.nbc.com/live?brand=nbc'],
['AppleTV+', 'https://tv.apple.com/us/room/apple-tv-major-league-baseball/edt.item.62327df1-6874-470e-98b2-a5bbeac509a2'],
['TBS', 'https://www.tbs.com/watchtbs/east'], ['FS1', 'https://www.foxsports.com/live/fs1'], ['MLB Network', 'https://www.mlb.com/network/live?success=true'],
['MLBTV', 'https://www.mlb.com/tv'], ['NBA TV', 'https://www.nba.com/watch/nba-tv'],
['NBCSP', 'https://www.nbc.com/live?brand=rsn-philadelphia&callsign=nbcsphiladelphia']];

function makeCapital(lower){
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function League({league, logoData}){
    document.title = 'Crunch Time: ' + league;
    const navigate = useNavigate();



    const USER = 'mikeymits'; //TODO: replace with login

    const [priority, setPriority] = useState(['times', 'diffs', 'stands']);
    const [streams, setStreams] = useState(["TNT","ESPN+","FOX","ABC","NBC","CBS","AppleTV+","TBS","FS1","MLB Network","MLBTV","NBATV","NBCSP"]);
    const [take, setTake] = useState(false);
    const [date, setDate] = useState('Dec 21 2000');
    
    useEffect(() => {
        //load in user preferences from db
        async function loadLatest(){
            let results = await fetch(`${baseUrl}/preferences/${USER}`)
            .then(resp => resp.json())
            .catch(err => {console.log(`No user "${USER}" found`)});

            if(results !== undefined){        
                setPriority(results.priority);
                setStreams(results.streams);
                setTake(results.take);
            } 
        }
        loadLatest();
    }, [take]);

    const [events, setEvents] = useState([]);
    const [leagueData, setLeagueData] = useState();
    const [len, setLen] = useState(0);  
    useEffect(() => {
        const  login = async () => {
            // Connect to db so changes cause page to re-render
            const  mongodb = app.currentUser.mongoClient("mongodb-atlas");
            let leagueLower = league.toLowerCase()
            const  collection = mongodb.db("crunchtime").collection(leagueLower);

            for  await (const  change  of  collection.watch()) {
                setEvents(events  => [...events, change]);
            }
        }
        login();

        //gets league score data from db
        async function loadLeague(){
            let loadLeague = await fetch(`${baseUrl}/${league}`)
            .then(resp => resp.json())
            .catch(err => {console.log(`Failed to load ${league} data`)});
            setLen(loadLeague[0].sorted.length);
            setLeagueData(loadLeague[loadLeague.length-1]);
            console.log('test')
            let date = new Date(loadLeague[loadLeague.length-1].leagueDate);
            date = date.toLocaleString('default', { day: 'numeric', month: 'long', year: 'numeric'});
            if(league === 'NFL') date = 'Week of ' + date;
            setDate(date)
        }
        loadLeague();

        //fetches the server which calls the scrape function, updates db, etc.
        fetch(`${baseUrl}/league/${league}`)
    
        
       // console.log(`${baseUrl}/league`)
    }, [league]);

    function Priority(){
        return(
            <div>
                <p>
                    Priorities: <br></br>
                    {makeCapital(priority[0])} <br></br>
                    {makeCapital(priority[1])} <br></br>
                    {makeCapital(priority[2])}
                </p>
            </div>
        )
      } 
    
    const [origin, setOrigin] = useState(document.referrer); // gives url of previous page
    function writeData(){
        let haveTopLink = false;
        if(leagueData.sorted[0].network !== undefined){
            if(streams.find(chan => chan === leagueData.sorted[0].network) !== undefined) haveTopLink = true;
        }

        function getLink(net){
            if(fullNets.find(chan => chan[0] === net) !== undefined) return fullNets.find(chan => chan[0] === net)[1];
        }

        //if coming from different page (not refreshing) with takeMe on, open in a new window so this only happens once
        if(origin !== window.location.href) { 
            if(!noLinks(leagueData.sorted[0].network) && take && leagueData.sorted[0].progress !== 'ended' && haveTopLink){
                window.open(getLink(leagueData.sorted[0].network)); //use getLink w/ net instead of sorted.link so it never goes to /stream
                            //(would only happen if takeMe is on after updating streamPrefs to include top network)
                setTake(false);
                setOrigin(window.location.href);
            } 
        }
        
        function Net({i}){
            if(leagueData.sorted[i].network === 'ESPN') leagueData.sorted[i].network = 'ESPN+';
            if(leagueData.sorted[i].progress !== 'ended'){
                if(leagueData.sorted[i].network === undefined || leagueData.sorted[i].network === ''){
                    return <br></br>
                }
                else if(noLinks(leagueData.sorted[i].network)) {
                        return <div className="net">{leagueData.sorted[i].network} has no available links</div>
                }
                else if(leagueData.sorted[i].network !== undefined && streams.indexOf(leagueData.sorted[i].network) !== -1){
                    return <a id="btn" href={leagueData.sorted[i].link} target="_blank" rel="noreferrer">Watch on {leagueData.sorted[i].network}</a>
                }
                else {
                    return(
                        <div>
                            <a id="btn" href={getLink(leagueData.sorted[i].network)} target="_blank" rel="noreferrer" 
                                onClick={() => {navigate('/stream'); alert('Select ok to go to login for '+leagueData.sorted[i].network+
                                ', then make sure to update your stream preferences')}}>Log in to {leagueData.sorted[i].network}</a>
                        </div>
                    )
                }
            }
            else{
                return <br></br>
            }
        }
        function Time({i}){
            if(leagueData.sorted[i].time !== undefined){
                return <div id="time">{leagueData.sorted[i].time}</div>
            }
        }
        function Logo1({i}){
            if(leagueData.sorted[i].logo1 !== undefined){
                return(
                    <img className='team-logo' width={30} height={30} src={leagueData.sorted[i].logo1} alt={leagueData.sorted[i].team1 + " logo"}/>
                )
            }
        }
        function Logo2({i}){
            if(leagueData.sorted[i].logo2 !== undefined){
                return(
                    <img className='team-logo' width={30} height={30} src={leagueData.sorted[i].logo2} alt={leagueData.sorted[i].team2 + " logo"}/>
                )
            }
        }
        function Game({i}){
            if(typeof leagueData.sorted[i] === 'undefined'){
                return;
                
            }
            return(
                <div>
                    <div className="games">
                        <div className='team-info'> {/*team-info is nested in games so position: absolute can be inside of a position: relative*/}
                            <Logo1 i={i}></Logo1>
                            <span className='team'>{leagueData.sorted[i].team1}</span>
                            <div className="scores">{leagueData.sorted[i].score1}</div>
                        </div>      
                    </div>
                    <div className="games">
                        <div className='team-info'>
                            <Logo2 i={i}></Logo2>
                            <span className='team'>{leagueData.sorted[i].team2}</span>
                            <div className="scores">{leagueData.sorted[i].score2}</div>
                        </div>
                    </div>
                    <Time i={i}></Time>
                    <div className="net"><Net i={i}></Net></div>
                    <br></br>
                </div> 
            )
        }
        function Col({colVal}){
            let colArr = [];
            let rows = Math.ceil(len/4); 
            for(let j = 0; j < rows; j++){
                colArr[j] = <Game key={"game" + colVal + 4 * j} i={colVal + 4 * j}></Game>
            }
            return colArr;
        }

        function FullLeague(){
            return(
                <div>
                    <div id="date">
                            <h2>{date}</h2>
                    </div>
                    <div id='league-row'>
                        <div className='league-column'>
                            <h3>
                                <Col colVal={0}></Col>
                            </h3>
                        </div>
                        <div className="league-column" id="alt-column">
                            <h3>
                            <Col colVal={1}></Col>
                            </h3>
                        </div>
                        <div className='league-column'>
                            <h3>
                                <Col colVal={2}></Col>
                            </h3>
                        </div>
                        <div className="league-column" id="alt-column">
                            <h3>
                            <Col colVal={3}></Col>
                            </h3>
                        </div>
                    </div> 
                </div>
            )
        };

        /*THIS WAS CAUSING INFINITE RENDERS
        BUT NOW IT NEVER RE-RENDERS. GOTTA FIND A WAY TO BRING THIS BACK W/O CONSTANTLY TRIGGERING
        function Loaded(){  
            useEffect(() => {
                if(events.length > 0){
                //gets league score data from db
                async function loadLeague(){
                    let loadLeague = await fetch(`${baseUrl}/${league}`)
                    
                    .then(resp => resp.json())
                    .catch(err => {console.log(`Failed to load ${league} data`)});
                    setLen(loadLeague[0].sorted.length);
                   // setLeagueData(loadLeague[loadLeague.length-1]);
                    let date = new Date(loadLeague[loadLeague.length-1].leagueDate);
                    date = date.toLocaleString('default', { day: 'numeric', month: 'long', year: 'numeric'});
                    if(league === 'NFL') date = 'Week of ' + date;
                    setDate(date)
                }
                loadLeague();
                }
            }, []); 
            return <FullLeague></FullLeague> 
        }*/

        return(
            <div>        
                <h1>{league} Games</h1>
                <div id="league-logo">
                    <a href={'//localhost:3000/'+league}>
                        <button className="logo-img" type="submit">
                            <img width={logoData.width} height={logoData.height} src={logoData.link} alt={league + " logo"}/>
                        </button>
                    </a>
                </div>
                <h2>Click the league logo to refresh scores</h2>
                <FullLeague></FullLeague>
                <Priority></Priority>  
            </div>
        )
    }
    
    //wait until leagueData has been defined from db to start writing to DOM
    if(leagueData) return writeData();      
}