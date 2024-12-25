//converts networks to applicable links and determines if those links are available
import streamLinks from "../nets.js";

export default function netLinks(nets, teams, progress, numGames, links, league, availNets){
    const locTeams = ['Flyers', 'Phillies', '76ers'];
    const channels = [];
    let notPlus = 0; //need non-ESPN+ links since I can get specific games just for ESPN+
    function localStream(i){
        for(let j = 0; j < locTeams.length; j++){
            if((locTeams[j] === teams[i*2] || locTeams[j] === teams[i*2+1]) && !(nets[j] === 'ABC' || nets[j] === 'TNT' || nets[j] === 'FOX')){ 
                nets[i] = 'NBCSP';
                if(availNets.find(chan => chan[0] === 'NBCSP') !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === 'NBCSP')[1];
                }
                else channels[i] = '/stream';
                notPlus++;
                return true;
            }
        }
        return false;
    }

     for(let i = 0; i < numGames; i++){
        if(progress[i] !== 'ended' && nets[i] !== undefined){
            if(i > 0){
                if(nets[i-1] === 'ESPN+' && nets[i] === 'Hulu'){
                    nets[i-1] = 'ESPN+/Hulu';
                    nets[i] = nets[i-1];
                }
                else if(nets[i-1] === 'NESN' && nets[i] === 'NESN+'){
                    nets[i-1] = 'NESN/NESN+';
                    nets[i] = nets[i-1];
                }
                else if(nets[i-1] === 'ESPN' && nets[i] === 'NESN'){
                    nets[i-1] = 'ESPN/NESN';
                    nets[i] = nets[i-1];
                }
            }
            if(nets[i] === 'TNT'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i] === 'ABC'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i].includes('ESPN') || nets[i].includes('Hulu')){
                if(!localStream(i)){
                    if(links[i-notPlus] != null && links[i-notPlus] !== undefined) channels[i] = links[i-notPlus];
                    else {
                        nets[i] = 'ESPN+';
                        if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                            channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                        }
                        else channels[i] = '/stream';
                    }
                }
            }
            else if(nets[i] === 'FOX'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i] === 'NBC'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i] === 'CBS'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i] === 'Prime Video'){
                if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                    channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                }
                else channels[i] = '/stream';
                notPlus++;
            }
            else if(nets[i] === 'Apple TV+'){
                if(!localStream(i)){
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else if(nets[i] === 'MLBN'){
                nets[i] = 'MLB Network';
                if(!localStream(i)){
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else if(nets[i] === 'TBS'){
                if(!localStream(i)){
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else if(nets[i] === 'FS1'){
                if(!localStream(i)){
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else if((nets[i].includes('NESN') && league === 'MLB') || nets[i].includes('MLBTV')){
                if(!localStream(i)){
                    nets[i] = 'MLBTV';
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else if(nets[i].includes('NESN') && league === 'NHL'){ //standard espn+ has nhl games, not mlb games
                if(!localStream(i)){
                    nets[i] = 'ESPN+';
                    i--; //go back thru loop with new net to check for specific espn+ link
                }
            }
            else if(nets[i] === 'NBA TV'){
                if(!localStream(i)){
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                }
            }
            else if(league === 'MLB'){
                if(!localStream(i)){
                    nets[i] = 'MLBTV';
                    if(availNets.find(chan => chan[0] === nets[i]) !== undefined){
                        channels[i] = streamLinks.find(chan => chan[0] === nets[i])[1];
                    }
                    else channels[i] = '/stream';
                    notPlus++;
                }
            }
            else{ 
                if(!localStream(i)){
                    channels[i] = '';
                    notPlus++;
                }
            }
        }
        else if(progress[i] !== 'ended' && nets[i] === undefined){
            localStream(i);
            notPlus++;
        }
    }
    return channels;
}

export function noLinks(net){
    let noNet = ['NHL NET']; //ESPN.com will show these nets but they don't have streaming links 

    for(let no of noNet){
        if(no === net) return true;
    }
    return false;
}