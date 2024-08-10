import { logos } from '../logos';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

function LeagueList(){
    const USER = 'mikeymits'; //replace with login

    async function addDbVisit(key){
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

    function League({current}){    
        for (let [key, value] of Object.entries(logos)) {
            if (key === current) {
                return(
                    <div>
                        <Link to={'/'+key}>
                            <button className="logo-img" type="submit" onClick={(e) => {addDbVisit(key)}}>
                                <img width={value.width} height={value.height} src={value.link} alt={key + " logo"}/>
                            </button>
                        </Link>
                    </div>
                )    
            }
        }
    }

    const [priority, setPriority] = useState(['times', 'diffs', 'stands']);
    const [nets, setNets] = useState(["TNT","ESPN+","FOX","ABC","NBC","CBS","AppleTV+","TBS","FS1","MLB Network","MLBTV","NBATV","NBC Sports (local)"]);
    const [leagues, setLeagues] = useState([{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}]);
    const [take, setTake] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        const loadLatest = async () => {
            let results = await fetch(`${baseUrl}/preferences/${USER}`)
            .then(resp => resp.json())
            .catch(err => {console.log(`No user ${USER} found`)});
            if(results === undefined){
                results = {
                    user: USER,
                    priority: ['diffs', 'times', 'stands'],
                    leagues: [{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}],
                }       
            } 
            else{       
                setPriority(results.priority);
                setNets(results.streams);
                setLeagues(results.leagues);
                setTake(results.take);
                setRefresh(results.refresh);
            }
        }
        loadLatest();
    }, 
    []); 
    
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

    let leagueStrs = [];
    for(let i = 0; i < leagues.length; i++){
        leagueStrs[i] = Object.keys(leagues[i])[0];
    } 

    let leagueList = [];
    for(let i = 0; i < leagueStrs.length; i++){
        leagueList[i] = (
        <div key={"leagueId"+(i)} className="column">
            <League current={Object.keys(outList[i])[0]}></League>
        </div>
        )
    }
    
  return leagueList.reverse();
}

export default function Home(){
    return(
        <div>        
            <title>Crunch Time</title>
                <h1>Crunch Time</h1>
                <br></br>
                <h3>Select a sport</h3>
                <br></br>
                <div className="logo-vis">  
                    <LeagueList></LeagueList>             
                </div>        
        </div>
    )
}