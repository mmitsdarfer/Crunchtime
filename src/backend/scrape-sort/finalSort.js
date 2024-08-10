import database from './database.js';

//merge & mergesort to rank the diffs
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
    let mid = Math.floor(arr.length / 2);
    let left = mergeSort(arr.slice(0, mid));
    let right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

//puts game start tme into value that can be compared to game progress time
function militaryTime(time){
    if(time == 'Postponed' || time == 'Canceled') time = '11:59 PM';
    time = time.split(':');
    time[0] = parseInt(time[0]);
    if(time[1].includes('PM')){
        if(time[0] == 12){
            time[0] = 0;
        }
        time[0] += 12;
    }
    time[0] *= -60;
    time = time[0] - parseInt(time[1]);
    return time;
}

//groups games by progress and sorts them by time remaining
function timeSort(data){
    let sorted = [];
    let times = [];   
    for(let i = 0; i < data.length; i++){
        if(data[i].convertedTime.includes('Final')){
            times[i] = 0;
        }
        else if(data[i].convertedTime.includes('PM') || data[i].time.includes('AM') || data[i].time == 'Postponed'){
            times[i] = parseInt(militaryTime(data[i].time));
        }
        else{
            times[i] = parseInt(data[i].convertedTime);
        }
    }
    sorted = mergeSort(times).reverse();

    for(let i = 0; i < data.length; i++){
        for(let j = 0; j < data.length; j++){
            if(sorted[j] == times[i] && !data[i].time.includes('Final')){
                data[i].timeRank = j;
            }
            else if(data[i].time.includes('Final')){
                data[i].timeRank = data.length;
            }
        }
    }
    return data;
}

//remove empty arrays from an array of arrays
function dropEmpties(data){
    for(let i = 0; i < data.length; i++){
        if(data[i] !== undefined){
            if(data[i].length == 0){
                data.splice(i, 1);
                i = i-1; //reset since changing length skips numbers
            }
        }
        else{
            data.splice(i, 1);
                i = i-1;
        }
    }
    return data;
}

//groups games by progress and sorts them by point differential 
function diffSort(data){
    let ongoingDiffs = [];
    let endedDiffs = [];
    for(let i = 0; i < data.length; i++){
        if(data[i].progress == 'ongoing'){
            ongoingDiffs[i] = data[i].diff;
        }
    }
    for(let i = 0; i < data.length; i++){
        if(data[i].progress == 'ended'){
            endedDiffs[i] = data[i].diff;
        }
        else if(data[i].progress == 'unstarted'){
            data[i].diffRank = ongoingDiffs.length;
        }
    }

    let ongoingSort = dropEmpties(mergeSort(ongoingDiffs));
    let endedSort  = dropEmpties(mergeSort(endedDiffs));
    
    for(let i = 0; i < data.length; i++){
        for(let j = 0; j < ongoingSort.length; j++){
            if(data[i].diff == ongoingSort[j] && data[i].progress == 'ongoing'){
                data[i].diffRank = j;
            }
        }
        for(let j = 0; j < endedSort.length; j++){
            if(data[i].diff == endedSort[j] && data[i].progress == 'ended'){
                data[i].diffRank = j + ongoingSort.length + 1; //put ended games after ongoing and unstarted
            }
        }
    }
    return data;
}

//groups games by progress and sorts them by average standings of teams
function standSort(data){
    let ongoingStands = [];
    let unstartedStands = [];
    let endedStands = [];
    for(let i = 0; i < data.length; i++){
        if(data[i].progress == 'ongoing'){
            ongoingStands.push(data[i].avgStanding);
        }
    }
    for(let i = 0; i < data.length; i++){
        if(data[i].progress == 'unstarted'){
            unstartedStands.push(data[i].avgStanding);
        }
    }
    for(let i = 0; i < data.length; i++){
        if(data[i].progress == 'ended'){
            endedStands.push(data[i].avgStanding);
        }
    }
    
    let onStandSort = mergeSort(ongoingStands);
    let unstartStandSort = mergeSort(unstartedStands);
    let endStandSort = mergeSort(endedStands);

    for(let i = 0; i < data.length; i++){
        for(let j = 0; j < ongoingStands.length; j++){
            if(data[i].progress == 'ongoing' && data[i].avgStanding == onStandSort[j]){
                data[i].standRank = j
            }
        }
        for(let j = 0; j < unstartedStands.length; j++){
            if(data[i].progress == 'unstarted' && data[i].avgStanding == unstartStandSort[j]){
                data[i].standRank = j + ongoingStands.length;
            }
        }
        for(let j = 0; j < endedStands.length; j++){
            if(data[i].progress == 'ended' && data[i].avgStanding == endStandSort[j]){
                data[i].standRank = j + ongoingStands.length + unstartedStands.length;
            }
        }
    }
    return data;
}

//calls each type of sort and uses those rankings with priorities to come up with final sorted order and send that to json
export function finalSort(data, priority, league, date){
    data = timeSort(data);
    data = diffSort(data);
    data = standSort(data);

    let firstOrder = [];
    let secondOrder = [];
    let thirdOrder = [];
    if(priority[0] == 'diffs'){
        for(let i = 0; i < data.length+1; i++){    //+1 because max diff/time/stand is set equal to length
            firstOrder[i] = [];
            for(let j = 0; j < data.length; j++){
                if(data[j].diffRank == i) firstOrder[i].push(data[j]);
            }
        }
        dropEmpties(firstOrder);
        if(priority[1] == 'times'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].standRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].timeRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        }
        else if(priority[1] == 'stands'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].timeRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].standRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }             
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        }   
    }
    else if(priority[0] == 'times'){
        for(let i = 0; i < data.length+1; i++){    //+1 because max diff/time/stand is set equal to length
            firstOrder[i] = [];
            for(let j = 0; j < data.length; j++){
                if(data[j].timeRank == i) firstOrder[i].push(data[j]);
            }
        }
        dropEmpties(firstOrder);
        if(priority[1] == 'diffs'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].standRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].diffRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }                
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        }
        else if(priority[1] == 'stands'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].diffRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].standRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }          
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        }
    }
    else if(priority[0] == 'stands'){
        for(let i = 0; i < data.length+1; i++){    //+1 because max diff/time/stand is set equal to length
            firstOrder[i] = [];
            for(let j = 0; j < data.length; j++){
                if(data[j].standRank == i) firstOrder[i].push(data[j]);
            }
        }
        dropEmpties(firstOrder);
        if(priority[1] == 'diffs'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].timeRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].diffRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }    
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        }
        else if(priority[1] == 'times'){
            for(let i = 0; i < firstOrder.length; i++){
                secondOrder[i] = [];
                if(firstOrder[i] !== undefined){
                    if(firstOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < firstOrder[i].length; k++){
                                if(firstOrder[i][k].standRank == j) secondOrder[i].push(firstOrder[i][k]);
                            }
                        }
                    }
                    else if(firstOrder[i].length == 1){
                        secondOrder[i].push(firstOrder[i][0]);
                    }
                }
            }
            //priority[2] starts here
            for(let i = 0; i < secondOrder.length; i++){
                thirdOrder[i] = [];
                if(secondOrder !== undefined){
                    if(secondOrder[i].length > 1){
                        for(let j = 0; j < data.length+1; j++){
                            for(let k = 0; k < secondOrder[i].length; k++){
                                if(secondOrder[i][k].timeRank == j) thirdOrder[i].push(secondOrder[i][k]);
                            }
                        }
                    }
                    else if(secondOrder[i].length == 1){
                        thirdOrder[i].push(secondOrder[i][0]);
                    }
                }
            }
        } 
    }
    console.log(thirdOrder);
    database(thirdOrder, league, date);    
}

export default finalSort;