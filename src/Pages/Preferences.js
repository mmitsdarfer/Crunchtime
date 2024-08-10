import { useEffect, useState } from "react";
import { logos } from '../logos';

const PORT = process.env.PORT || 5000;
const baseUrl = `http://localhost:${PORT}`;

//merge and mergesort used to rank leagues by most views
function merge(left, right){
    let sortedArr = [];
    while(left.length && right.length){
        if(left[0] < right[0]){
            sortedArr.push(left.shift());
        }
        else{
            sortedArr.push(right.shift());
        }
    }
    return [...sortedArr, ...left, ...right];
}
function mergeSort(arr){
    if(arr.length <= 1) return arr;
    let mid = Math.floor(arr.length /2 );
    let left = mergeSort(arr.slice(0, mid));
    let right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function makeCapital(lower){
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function Preferences(){
    const [reset, setReset] = useState(false); 

    function ResetButton(){
        async function updateDbReset(){
            await fetch(`${baseUrl}/preferences/${USER}`, {
                method: "PATCH",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    user: USER, 
                    priority: priority, 
                    streams: nets,
                    leagues: [{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}],
                    take: take,
                    refresh: refresh
                })
            });
            console.log('Visits reset');
        }
        return(
            <button id="reset" type="button" onClick={(e) => {
                setLeagues([{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}]);
                setReset(true);
                updateDbReset();
                }}> 
                Reset visit data 
            </button> 
        )
    }

    const USER = 'mikeymits'; //TODO: replace with login
    const [priority, setPriority] = useState(['times', 'diffs', 'stands']);
    const [nets, setNets] = useState(["TNT","ESPN+","FOX","ABC","NBC","CBS","AppleTV+","TBS","FS1","MLB Network","MLBTV","NBATV","NBCSP"]);
    const [leagues, setLeagues] = useState([{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}]);
    const [take, setTake] = useState(false);
    const [refresh, setRefresh] = useState(0);

    const [topPriority, setTop] = useState(); 
    const [midPriority, setMid] = useState();
    const [lastPriority, setLast] = useState();
    
    useEffect(() => {
        async function loadLatest(){
            let results = await fetch(`${baseUrl}/preferences/${USER}`)
            .then(resp => resp.json())
            .catch(err => {console.log(`No user "${USER}" found`)});
            if(results !== undefined){          
                setPriority(results.priority);
                setTop(results.priority[0]);
                setMid(results.priority[1]);
                setLast(results.priority[2]);
                setNets(results.streams);
                setLeagues(results.leagues);
                setTake(results.take);
                setRefresh(results.refresh);
            }   
        }
        loadLatest();
    }, []);   

    let prefHits = [];
    for(let i = 0; i < leagues.length; i++){
        prefHits[i] = leagues[i][Object.keys(leagues[i])];
    }
    let sorted = mergeSort(prefHits);
    let outList = [];
    let outCt = 0;
    for(let i = 0; i < sorted.length+1; i++){
        for(let j = 0; j < leagues.length; j++){
            if(sorted.indexOf(leagues[j][Object.keys(leagues[j])]) === i){
                outList[outCt] = leagues[j];  
                outCt++;            
            }
        }
    }
    
    async function updateDbPriority(top, mid, last){
            await fetch(`${baseUrl}/preferences/${USER}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user: USER, 
                priority: [top, mid, last], 
                streams: nets,
                leagues: leagues,
                take: take,
                refresh: refresh
            })
            });
            console.log('Priority updated');
    }
    
    function Dropdowns({priority}){    
        function TopDrop(){
            return(
                <div className="drop">
                    Top:
                    <select className="select-priority" value={topPriority} onChange={(e) => {
                        setTop(e.target.value); 
                        if(e.target.value !== priority[1]){
                            setPriority([e.target.value, priority[0], priority[1]]);
                            updateDbPriority(e.target.value, priority[0], priority[1]);
                        }
                        else{
                            setPriority([e.target.value, priority[0], priority[2]]);
                            updateDbPriority(e.target.value, priority[0], priority[2]);
                        }
                        setMid(priority[0]);
                        setLast(priority[2]);                        
                    }}>
                        <option value="diffs">Diffs</option>
                        <option value="times">Times</option> 
                        <option value="stands">Stands</option>
                    </select>            
                </div>
            )
        }
    
        function MidDrop(){
            if(priority[0] === 'diffs'){
                return(
                    <div className="drop">
                        2nd:
                    <select className="select-priority" value={midPriority} onChange={(e) => {
                        setMid(e.target.value); 
                        setPriority([priority[0], e.target.value, priority[1]]);
                        setLast(priority[2]);
                        updateDbPriority(priority[0], e.target.value, priority[1]);
                    }
                    }>
                        <option value="times">Times</option> 
                        <option value="stands">Stands</option>
                    </select>
                    </div>
                )
            }
            else if(priority[0] === 'times'){
                return(
                    <div className="drop">
                        2nd:
                        <select className="select-priority" value={midPriority} onChange={(e) => {
                            setMid(e.target.value);
                            setPriority([priority[0], e.target.value, priority[1]]);
                            setLast(priority[2]);
                            updateDbPriority(priority[0], e.target.value, priority[1]);
                            }}>
                        <option value="diffs">Diffs</option>
                        <option value="stands">Stands</option>
                    </select>
                    </div>
                    
                )
            }
            else if(priority[0] === 'stands'){
                return(
                    <div className="drop">
                        2nd:
                        <select className="select-priority" value={midPriority} onChange={(e) => 
                            {setMid(e.target.value);
                            setPriority([priority[0], e.target.value, priority[1]]);
                            setLast(priority[2]);
                            updateDbPriority(priority[0], e.target.value, priority[1]);
                            }}>
                            <option value="diffs">Diffs</option>
                            <option value="times">Times</option> 
                        </select>
                    </div>             
                )
            }
        }
    
        function LastDrop(){
            return(
                <div className="drop">
                    3rd:
                <select className="select-priority" defaultValue={lastPriority}>
                    <option value={priority[2]}>{makeCapital(priority[2])}</option>
                </select>
                </div>
               
            )
        }
    
        return(
            <div>
                <div className="drop-list">
                <TopDrop></TopDrop><MidDrop></MidDrop><LastDrop></LastDrop>     
                </div> 
                Sort by games with closest scores (diffs),
                <br></br>closest to ending (times),
                <br></br>or highest average of 2 teams' league rankings (stands)
                <br></br>
            </div>
             
        )
    }

    function Switch(){  
        async function updateDbTake(newTake){
            await fetch(`${baseUrl}/preferences/${USER}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user: USER, 
                priority: [topPriority, midPriority, lastPriority], 
                streams: nets,
                leagues: leagues,
                take: newTake,
                refresh: refresh
            })
            });
            console.log('Take updated');
    }
        
        function changeTake(){
            updateDbTake(!take);
            setTake(!take);
        }
    
        function TakeMe(){
            return( 
                <input className="switch-input" id="check" type="checkbox" onChange={e => changeTake()} checked={take}/>
            )
        }

        return(
          <div>
            <label className="switch">
              <TakeMe></TakeMe>
              <span className="switch-label" data-on="On" data-off="Off"></span> 
              <span className="switch-handle"></span> 
            </label>
          </div>
          
        )
    }
    
    function Timer(){  
        async function updateDbTimer(newTime){
            setRefresh(newTime);
            await fetch(`${baseUrl}/preferences/${USER}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user: USER, 
                priority: [topPriority, midPriority, lastPriority], 
                streams: nets,
                leagues: leagues,
                take: take,
                refresh: newTime
            })
            });
            console.log('Timer updated');
        }

        return(
            <div>
                <h4>Choose auto-refresh frequency:</h4>
                <div id="timer">
                    <select id="select-timer" defaultValue={refresh} onChange={(e) => {
                        //this if/else protects against people changing reset via dev tools because refreshing too much can crash
                        if(e.target.value !== '0' & e.target.value !== '30' & e.target.value !== '60' & e.target.value !== '300'){
                            updateDbTimer('0');
                        }
                        else{
                            updateDbTimer(e.target.value);
                        }
                        }}>
                        <option value="0">Don't auto refresh</option>
                        <option value="30">30 seconds</option> 
                        <option value="60">1 minute</option> 
                        <option value="300">5 minutes</option> 
                    </select>
                </div>          
            </div>  
        )
    }

    async function addDbVisit(key){
        let leagueStrs = [];
        for(let i = 0; i < leagues.length; i++){
            leagueStrs[i] = Object.keys(leagues[i])[0];
        } 
        for(let i = 0; i < leagueStrs.length; i++){
            if(leagueStrs[i] === key){
                ++leagues[i][Object.keys(leagues[i])];
                break;
            }  
        }
        
        await fetch(`${baseUrl}/preferences/${USER}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user: USER, 
                priority: priority, 
                streams: nets,
                leagues: leagues,
                take: take,
                refresh: refresh
            })
        });      
    }

    //nested in Preferences function because it uses state of reset
    function VisitData(){
        function League({current}){    
            for (let [key, value] of Object.entries(logos)) {
                if (key === current) {
                    return(
                        <div>
                            <a href={'//localhost:3000/'+key}>
                                <button className="logo-img" type="submit" onClick={(e) => {addDbVisit(key)}}>
                                    <img width={value.width} height={value.height} src={value.link} alt={key + " logo"}/>
                                </button>
                            </a>
                        </div>
                    )     
                }
            }
        }
        function Visits({current}){
            if(reset){
                return(
                    <div>
                     <br></br>0 
                    </div> 
                )
            }
            return(   
                <div>
                    <br></br>{current} 
                </div> 
            ) 
        }
    
        function LeagueList(){
            let leagueList = []; 
            for(let i = 0; i < leagues.length; i++){
            Object.values(logos).forEach((value, index) => 
                {  
                    if(Object.keys(leagues[i])[0] === Object.keys(logos)[index]){
                        //if name of league object === name of logo object, send them and visit # to <League> and <Visits>
                        leagueList[i] = (
                            <div key={"leagueList"+(i)}>
                                <div key={"leagueId"+index} className="column">
                                    <League current={Object.keys(outList[i])[0]}></League>
                                </div>
                                <div key={"visitId"+index}>
                                    <Visits current={outList[i][Object.keys(outList[i])]}></Visits>
                                </div>
                            </div>      
                        )
                    } 
                    index++;
                })
            }
            return leagueList.reverse();
        }
    

        return(
            <div className="logo-vis">
                <div> 
                    <div id="vert-space"></div>         
                    Times Visited:
                </div> 
                <LeagueList></LeagueList>
                <div id="spacer">          
                </div>               
            </div>            
        )
    }

    return(
    <div>
        <h1>Preferences</h1>
        <div className="top">     
            <div className="top-left">
                <h4>Priorities:</h4>
                <Dropdowns priority={priority}></Dropdowns>
                <br></br>
            </div>
            <div className="top-right">
            <h4>Take me out to the ball (or puck) game:</h4> 
                <Switch></Switch>
                Turn on to be sent to a stream of #1 game by priority if available<br></br>
                (You must allow popups to automatically be redirected to your stream)<br></br>
            </div>
        </div>

        <div className="middle">
            <div className="mid-left">
                <a href={'//localhost:3000/stream'}>
                    <button id="reset" type="submit">Go to stream preferences</button>
                </a>
            </div>
            <div className="mid-right">
                <Timer></Timer>
            </div>
        </div>

        <br></br>
        <VisitData></VisitData>
        <ResetButton></ResetButton>
    </div>
    
    )
}