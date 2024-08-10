import { useState, useEffect } from "react";
import netLinks from "../backend/nets";

const PORT = process.env.PORT || 5000;
const baseUrl = `http://localhost:${PORT}`;

export default function Stream(){
    const USER = 'mikeymits'; //TODO: replace with login
    const [priority, setPriority] = useState(['times', 'diffs', 'stands']);
    const [streams, setStreams] = useState(netLinks);
    const [availNets, setAvailNets] = useState(streams); 
    const [leagues, setLeagues] = useState([{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}]);
    const [take, setTake] = useState(false);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        async function loadLatest(){
            let results = await fetch(`${baseUrl}/preferences/${USER}`)
            .then(resp => resp.json())
            .catch(err => {console.log(`No user "${USER}" found`)});
            if(results === undefined){
                results = {
                    priority: ['diffs', 'times', 'stands'],
                    streams: streams,
                    leagues: [{NBA: 0}, {MLB: 0}, {NFL: 0}, {NHL: 0}],
                    take: take,
                    refresh: refresh
                }
                //top = diffs, mid = times, last = stands
            }
            else{           
                setPriority(results.priority);
                setStreams(results.streams);
                setAvailNets(results.streams)
                setLeagues(results.leagues);
                setTake(results.take);
                setRefresh(results.refresh);
            }
            
        }
        loadLatest();
        //line below gets rid of misleading warning
        // eslint-disable-next-line
    }, []);  

    document.title = 'Crunch Time: Streams';
    /*
    let netLinks = [['TNT', 'https://www.tntdrama.com/watchtnt/east'], ['ESPN+', 'https://www.espn.com/watch/'],
        ['FOX', 'https://www.foxsports.com/live'], ['ABC', 'https://abc.com/watch-live/abc'],
        ['NBC', 'https://www.nbc.com/live?brand=nbc'], ['CBS', 'https://www.cbs.com/live-tv/stream'], 
        ['AppleTV+', 'https://tv.apple.com/us/room/apple-tv-major-league-baseball/edt.item.62327df1-6874-470e-98b2-a5bbeac509a2'],
        ['TBS', 'https://www.tbs.com/watchtbs/east'], ['FS1', 'https://www.foxsports.com/live/fs1'],
        ['MLB Network', 'https://www.mlb.com/network/live?success=true'], ['MLBTV', 'https://www.mlb.com/tv'],
        ['NBATV', 'https://www.nba.com/watch/nba-tv'],
        ['NBCSP', 'https://www.nbc.com/live?brand=rsn-philadelphia&callsign=nbcsphiladelphia']]; 
    */
        let nets = streams;
    if(nets === null) nets = netLinks.map(net => net[0]);    
    
    async function updateDbStreams(newNets){
        await fetch(`${baseUrl}/preferences/${USER}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user: USER, 
                priority: priority, 
                streams: newNets,
                leagues: leagues,
                take: take,
                refresh: refresh
            })
        });
        console.log('Streams updated');
    }

    function NetBox(){
        let allNets = [];
        for(let i = 0; i < netLinks.length; i++){
            function handleCheck(e){ //nested to be able to use i
                let temp = availNets;
                if(e.target.checked){
                    temp[i] = e.target.value; 
                    setAvailNets(temp);
                }
                else {
                    temp[i] = false;
                    setAvailNets(temp);
                }   
                updateDbStreams(availNets);             
            }
    
            allNets.push(
                <div key={netLinks[i][0]+'box'} className="net-box">
                    <input className="net-check" value={netLinks[i][0]} type="checkbox" defaultChecked={availNets[i] === netLinks[i][0]} onChange={handleCheck}></input>
                    <span className="net-text">{netLinks[i][0]}</span>         
                        <button className="net-button" type="submit" onClick={() =>  window.open(netLinks[i][1])}>Let me try</button>          
                    <br></br><br></br>
                </div>
            )
        }
        return allNets;
    }

    return(
    <div>
        <h1>Stream Preferences</h1>
        <h3>Select the streams you have access to:</h3>
        (or visit the site to see if you can log in) <br></br><br></br>
        <NetBox></NetBox>
    </div>
    )
}