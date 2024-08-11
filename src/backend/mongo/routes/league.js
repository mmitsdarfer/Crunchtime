import express from "express";
import { callScrape } from "../../scrape-sort/scrape.js";
import mlbScrape from "../../scrape-sort/mlbScrape.js";
const router = express.Router();
import nets from "../../nets.js";

let current, time, priority;

const PORT = 5000;
const baseUrl = `http://localhost:${PORT}`;
const USER = 'mikeymits'; //TODO: replace with login
async function loadDb(){
    let results = await fetch(`${baseUrl}/preferences/${USER}`)
    .then(resp => resp.json())
    .catch(err => {console.log(`No user "${USER}" found`)});
    time = parseInt(results.refresh);
    priority = results.priority;
}


function timer(league, req, res){
  if(time == 0) {
      console.log('Auto-refresh set to manual');
  }
  else if (time == 30 || time == 60 || time == 300){
      console.log('Timer length: ' + time);
      function redir(){;
          leagueCall(league, req, res);
      }
      setTimeout(redir, time*1000);
  }
  else{
      time = 'manual';
  }
}

async function leagueCall(league, req, res){
  await loadDb(); //need to get priority from db first

  async function callLeague(){
      setTimeout(function () {
          if(league == 'MLB') mlbScrape(priority, nets); 
          else callScrape(current, priority, nets);     
          timer(current, req, res);  
          
      }, 100);       
  }
  callLeague();
}

router.get("/:current", async (req, res) => {
    current = req._parsedUrl.path;
    current = current.replace('/', '').toUpperCase();
    leagueCall(current, req, res);
    res.send('Scraping ' + current);;
    
});

export default router;