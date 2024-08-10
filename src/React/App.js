import '../main.css';
import Home from '../Pages/Home.js';
import League from '../Pages/League.js';
import Preferences from '../Pages/Preferences.js';
import Stream from '../Pages/StreamPref.js';
import { logos } from '../logos.js';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import React from 'react';

function HomeButton(){
  return (
    <a href="//localhost:3000">
      <button id="home" type="submit" > 
          <br></br><img type="image" width="70" height="70" src="./goHome.png" alt="home"/>
      </button> 
    </a>
  )
}

function PrefButton(){
  return(
    <a href="//localhost:3000/preferences">
      <button id="prefs" type="submit"  >
        Preferences <img type="image" width="60" height="60" src="./podium.png" alt="prefImage"/>
      </button>
    </a>      
  )
}

function LeaguePage({league}){
  function leagueLogo(){
    if(league === 'NHL') return logos.NHL;
    else if(league === 'NFL') return logos.NFL;
    else if(league === 'MLB') return logos.MLB;
    else if(league === 'NBA') return logos.NBA;
  }
  
  return(
  <div>
    <HomeButton></HomeButton>
    <PrefButton></PrefButton>
    <League league={league} logoData={leagueLogo()}></League>
  </div>
  )
}

function App(){  
  return (
    <Router>
      <Routes>
        <Route exact path='/' element={
          <div>    
            <Home></Home>
            <PrefButton></PrefButton>
          </div>
        } />
        <Route exact path='/preferences' element={
          <div>
          <HomeButton></HomeButton>
          <Preferences></Preferences>  
          </div>
        } />
        <Route exact path='/stream' element={
          <div>
            <HomeButton></HomeButton>
            <PrefButton></PrefButton>
            <Stream></Stream>
          </div>
        } />
        <Route exact path='/nhl' element={
          <LeaguePage league={'NHL'}></LeaguePage>
        } />
        <Route exact path='/nfl' element={
            <LeaguePage league={'NFL'}></LeaguePage>
        } />
        <Route exact path='/mlb' element={
            <LeaguePage league={'MLB'}></LeaguePage>
        } />
        <Route exact path='/nba' element={
            <LeaguePage league={'NBA'}></LeaguePage>
        } />
      </Routes>
    </Router>      
  );
}

export default App;
