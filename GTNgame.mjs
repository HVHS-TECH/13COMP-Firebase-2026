/*******************************************************/
// GTNgame.mjs
// Guess The Number Lobby Page
// Made by Dylan Figliola
/*******************************************************/

console.log(
  "%c🎲 GUESS THE NUMBER GAME 🎲",
  `
  color: #ffffff;
  background: linear-gradient(90deg, #000000, #00ffcc);
  font-size: 18px;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 6px;
  border: 2px solid #00ffcc;
  letter-spacing: 1px;
  text-shadow: 0 0 6px #00ffcc;
  `
);
/*******************************************************/
//VARIABLES AND GAME SETUP
/*******************************************************/
let currentUser = null; // will hold the authenticated user object
let confirmState = false; // for menu button confirmation
let randomNumber;
/*******************************************************/
//FIREBASE IMPORTS AND PAGE SETUP
/*******************************************************/

import { FB_GAMEAPP, FB_GAMEDB, FB_AUTH, fb_getPfp } from './fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue, get, set, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
/**********************************************************/
//setupGTNgame
// Check if user is signed in and runs initialization functions for GTN game
// If not signed in, redirect to index.html
// Calls fb_getPfp() to display user's profile picture
// Input: n/a
// Return n/a
/*******************************************************/

export function setupGTNgame() {
  const auth = FB_AUTH;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("User signed in:", currentUser.displayName || currentUser.email);
    } else {
      console.warn("No user signed in.");
      // window.location.href = "index.html";
    }
  });
  fb_getPfp(currentUser);
  loadActiveGame();
  createGTNgameNumber();

}


/**********************************************************/
//createGTNgameNumber
// Centralized function to generate random number for GTN game
// Generates a random number between 1 and 100
// Input: n/a
// Returns the random number
/*******************************************************/
function createGTNgameNumber() {
  randomNumber = Math.floor(Math.random() * 100) + 1;
  console.log("%c Random Number Generated: " + randomNumber,
  `
  color: #ffffff;
  background: linear-gradient(180deg, #390250, #b66ee0);
  border-radius: 4px;
  border: 2px solid #ff00fb;
  `
  );
  return randomNumber;
}


function loadActiveGame() {
 const gameID = localStorage.getItem("GTNgameID");

 const GAMEREF = ref(FB_GAMEDB, "GTN/activeGames/" + gameID);

   onValue(GAMEREF, (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Active game no longer exists.");
      // window.location.href = "GTNpage.html";
      return;
    }
        const gameData = snapshot.val();

    if (gameData.player1 === currentUser.uid || gameData.player2 === currentUser.uid) {
      console.log("Player is part of this game.");
    } else {
      console.warn("Player is not part of this game.");
      // window.location.href = "GTNpage.html";
      return;
    }

    playerPFPDisplay(gameData);

});
}

function playerPFPDisplay(gameData) {
  const p1Pfp = document.getElementById("player1Pfp");
  const p2Pfp = document.getElementById("player2Pfp");

  const p1Name = document.getElementById("player1Name");
  const p2Name = document.getElementById("player2Name");

  if (p1Pfp) p1Pfp.src = gameData.player1Pfp || "images/defaultpfp.png";
  if (p2Pfp) p2Pfp.src = gameData.player2Pfp || "images/defaultpfp.png";

  if (p1Name) p1Name.innerText = gameData.player1Name || "Player 1";
  if (p2Name) p2Name.innerText = gameData.player2Name || "Player 2";
}

/*******************************************************/
// TO DO
// The player with the most wins needs a crown displayed over their pfp