import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8000;
import { parse } from 'url';
import cors from 'cors';
import { callScrape } from './scrape-sort/scrape.js';
import nets from './nets.js';

const dbPORT = process.env.dbPORT || 5000;
const baseUrl = `http://localhost:${dbPORT}`;
const USER = 'mikeymits'; //TODO: replace with login

var current;
var time = 0;
var priority = [];

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

app.get('/nhl', (req, res) => {
    current = parse(req.url).pathname.replace('/', '').toUpperCase();
    leagueCall(current, req, res);
});

app.get('/nfl', (req, res) => {
    current = parse(req.url).pathname.replace('/', '').toUpperCase();
    leagueCall(current, req, res);    
});

app.get('/nba', (req, res) => {
    current = parse(req.url).pathname.replace('/', '').toUpperCase();
    leagueCall(current, req, res);
});

import mlbScrape from './scrape-sort/mlbScrape.js';
app.get('/mlb', (req, res) => {
    current = parse(req.url).pathname.replace('/', '').toUpperCase();
    leagueCall(current, req, res);
});

app.use(cors({origin:true,credentials: true}));

app.post((req, res) => {
    res.status(404).send('Page not found');
})

app.listen(port, () => {
    console.log('Running on ' + port);
})