import fetch from 'node-fetch';

const PORT = process.env.PORT || 5000;
const baseUrl = `http://localhost:${PORT}`;

export async function database(sorted, league, date){
    let leagueDate = new Date(Date.parse(date.replace(',',''))); //date scraped from espn.com, but temp so it doesn't change on page
    leagueDate = leagueDate.getFullYear() + '-' + (leagueDate.getMonth()+1) + '-' + leagueDate.getDate();

    let id; //id of previous db entry

    const loadLatest = async () => {
        let results = await fetch(`${baseUrl}/${league}/latest`).then(resp => resp.json());
        if(results[0] === undefined){
            return;
        }
        id = results[0]._id;
    }

    async function dbFormat(){
        let dbData = {};
        dbData.table = [];
        let obj = {};
        for(let i = 0; i < sorted.length; i++){
            if(sorted[i] !== undefined){
                for(let j = 0; j < sorted[i].length; j++){
                    obj = {
                        team1: sorted[i][j].team1,
                        score1: sorted[i][j].score1,
                        logo1: sorted[i][j].logo1,
                        team2: sorted[i][j].team2,
                        score2: sorted[i][j].score2,
                        logo2: sorted[i][j].logo2,
                        progress: sorted[i][j].progress,
                        time: sorted[i][j].time,
                        network: sorted[i][j].network,
                        link: sorted[i][j].link
                    }
                    dbData.table.push(obj);
                }
            }
            else{
                obj = {
                    team1: sorted[i].team1,
                    score1: sorted[i].score1,
                    team2: sorted[i].team2,
                    score2: sorted[i].score2,
                    progress: sorted[i].progress,
                    time: sorted[i].time,
                    network: sorted[i].network,
                    link: sorted[i].link
                }
                dbData.table.push(obj);
            }      
        }
    
        const updateDb = async () => {
            await fetch(`${baseUrl}/${league}/${id}`, {
              method: "PATCH",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                sorted: dbData.table, leagueDate
              })
            });
        }
        await updateDb();
    }

    await loadLatest();    
    
    async function sendFinal(){
        dbFormat();
    }
    sendFinal();
}

export default database;