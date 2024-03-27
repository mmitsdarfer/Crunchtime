const logos = {
    'NHL':{
        width: 120,
        height: 120,
        link: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/05_NHL_Shield.svg/1200px-05_NHL_Shield.svg.png'
    },
    'NFL':{
        width: 100,
        height: 120,
        link: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/1200px-National_Football_League_logo.svg.png'
    },
    'MLB':{
        width: 160,
        height: 86,
        link: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Major_League_Baseball_logo.svg/1200px-Major_League_Baseball_logo.svg.png'
    },
    'NBA':{
        width: 73,
        height: 120,
        link: 'https://brandlogos.net/wp-content/uploads/2014/09/NBA-logo-big.png'
    }
}

let test = 'NFL';
let data = ["NHL",["diffs","times","standings"],["NFL",1],["MLB",2],["NBA",3],["NHL",18]];

/*
for (let [key, value] of Object.entries(logos)) {
    if (key == test) {
      console.log(value)
    }
   }
*/
   let index = 0;
   let leagueList = [];
   //for(let i = data.length-1; i >= 2; i--){
    for(let i = 2; i < data.length; i++){
    Object.values(logos).forEach((value, index) => 
    {  
            if(data[i][0] === Object.keys(logos)[index]){
                console.log(data[i][0]);
                console.log(i);
                leagueList[i] = Object.keys(logos)[index];
            } 
        
        index++;
    }
)}
console.log(leagueList.reverse());