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
let gameID = localStorage.getItem("GTNgameID");
const GAMEREF = ref(FB_GAMEDB, "GTN/activeGames/" + gameID);
let USERREF = null;

let isPlayer1 = false;
let isPlayer2 = false;
let isMyTurn = false;
let player1Guesses = [];
let player2Guesses = [];
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
      USERREF = ref(FB_GAMEDB, "userInfo/" + currentUser.uid);
     
      fb_getPfp(currentUser);
      loadActiveGame();
      loadPlayerData();
      createGTNgameNumber();
      setupGuessButton();

    } else {
      console.warn("No user signed in.");
      // window.location.href = "index.html";
    }
  });

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
  background: linear-gradient(180deg, #5c1879, #b66ee0);
  border-radius: 4px;
  border: 2px solid #000000;
  `
  );


  update(GAMEREF, {
    gameNum: randomNumber
  });
  return randomNumber;
}

/**********************************************************/
//loadActiveGame
// Loads the active game data from Firebase and sets up real-time listeners
// Checks if the current user is part of the game and updates the UI accordingly
// Calls playerPFPDisplay() to show player profile pictures and names
// Input: n/a
// Return n/a
/*******************************************************/
function loadActiveGame() {

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
    displayTurn(gameData);

  });
}

function loadPlayerData() {
  get(USERREF).then((snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Active game no longer exists.");
      // window.location.href = "GTNpage.html";
      return;
    }
    const userData = snapshot.val();
    displayCrown(GAMEREF, userData);

  });
}
/**********************************************************/
//playerPFPDisplay
// Displays player profile pictures and names in the game lobby
// Uses default pfp if player has left, or player has no pfp set
// Called by loadActiveGame() to update the UI whenever game data changes
// Return: n/a
/*******************************************************/
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
// setupGuessButton
// attaches click event to guess button
// calls submitGuess when button is pressed
/*******************************************************/
function setupGuessButton() {
  const guessBtn = document.getElementById("guessBtn");
  guessBtn.addEventListener("click", submitGuess);
}

/*******************************************************/
//submitGuess
// Handles logic for entering guesses
// Validates input: checks if 1 < guess < 100, and checks for if it's the player's turn
// If valid, displays the guess and calls displayGuessResult() to show if guess is too high, low, or correct
// Then calls turnSwitch() to update the turn in Firebase
/*******************************************************/
function submitGuess() {
  const guessInput = document.getElementById("guessInput");
  const guess = parseInt(guessInput.value);

  if (isNaN(guess) || guess < 1 || guess > 100) {
    alert("Please enter a valid number between 1 and 100.");
    return;
  }

  get(GAMEREF).then((snapshot) => {
    if (!snapshot.exists()) {
      alert("Game does not exist anymore.");
      return;
    }

    const gameData = snapshot.val();
    if (gameData.turn !== currentUser.uid) {
      alert("It is not your turn.");
      return;
    }

    document.getElementById("guessStatus").innerText = "Guessed: " + guess;
    console.log("Player guessed: " + guess);
    displayGuessResult(guess, gameData);
    turnSwitch(gameData);
  });
}
/*******************************************************/
//turnSwitch
// Switches the turn between player 1 and player 2 in Firebase after a guess is made
// Compares stored turn uid with player1 and player2 uid to determine whose turn is next
// Called by submitGuess() after validating the guess and displaying the result
// Only updates turn after guess has been processed.
/*******************************************************/

function turnSwitch(gameData) {

  if (gameData.player1 === gameData.turn) {
    update(GAMEREF, {
      turn: gameData.player2
    });

  } else {
    update(GAMEREF, {
      turn: gameData.player1
    });
  }


}

/*******************************************************/
//displayGuessResult
// Displays the result of the player's guess (too high, too low, or correct)
// Compares the player's guess to the random number stored in Firebase and updates the UI accordingly
// Called by submitGuess() after validating the guess and logging it to the console
/*******************************************************/
function displayGuessResult(guess, gameData) {
  const RESULT = document.getElementById("guessResultDisplay");

  if (guess < gameData.gameNum) {
    RESULT.innerText = "Too low!";
  } else if (guess > gameData.gameNum) {
    RESULT.innerText = "Too high!";
  } else {
    RESULT.innerText = "Correct!";
  }
}

/*******************************************************/
//displayTurn
// Checks whose turn it is based on the turn uid stored in Firebase
// Updates turn indicator pfp in the guess box

/*******************************************************/
function displayTurn(gameData) {
  const pfpTurn = document.querySelector(".pfpTurn");

  if (gameData.turn === gameData.player1) {
    pfpTurn.src = gameData.player1Pfp;
  } else {
    pfpTurn.src = gameData.player2Pfp;
  }

  pfpTurn.classList.remove("yourTurn");
  if (gameData.turn === currentUser.uid) {
    pfpTurn.classList.add("yourTurn");
  }
}

/*******************************************************/
//displayCrown
// Displays a crown over the profile picture of the player with the most wins
// Compares the win counts of player 1 and player 2 stored in Firebase and updates the UI to show a crown over the player with more wins
// Input: n/a
// Return: n/a
/*******************************************************/
function displayCrown(GAMEREF) {
  const p1Crown = document.getElementById("player1Crown");
  const p2Crown = document.getElementById("player2Crown");

  onValue(GAMEREF, (snapshot) => {
    if (!snapshot.exists()) {
      console.error("Game data not found for crown display.");
      return;
    }
    const gameData = snapshot.val();
    const p1ID = gameData.player1;
    const p2ID = gameData.player2;

    const p1Ref = ref(FB_GAMEDB, "userInfo/" + p1ID + "/GTNwins");
    const p2Ref = ref(FB_GAMEDB, "userInfo/" + p2ID + "/GTNwins");

    get(p1Ref).then((p1Snap) => {
      let p1Wins = 0;

      if (p1Snap.exists()) {
        p1Wins = p1Snap.val();
      }

      get(p2Ref).then((p2Snap) => {
        let p2Wins = 0;

        if (p2Snap.exists()) {
          p2Wins = p2Snap.val();
        }

        displayWins(p1Wins, p2Wins);


        if (p1Wins > p2Wins) {
          p1Crown.style.display = "block";
          p2Crown.style.display = "none";
        } else if (p2Wins > p1Wins) {
          p1Crown.style.display = "none";
          p2Crown.style.display = "block";
        } else {
          p1Crown.style.display = "none";
          p2Crown.style.display = "none";
        }
      });
    });
  });
}

function displayWins(p1Wins, p2Wins) {
  const p1Info = document.querySelector(".leftPlayer .gamePlayerInfo");
  const p2Info = document.querySelector(".rightPlayer .gamePlayerInfo");


  console.log(`Player 1 Wins: ${p1Wins}, Player 2 Wins: ${p2Wins}`);
  p1Info.innerText = ` Player 1 \n
  Wins: ${p1Wins}`;
  p2Info.innerText = ` Player 2 \n
  Wins: ${p2Wins}`;
}
/*******************************************************/
// TO DO
// Turn indicator needs to be improved
// Add array with each players guesses to be displayed
// Game over screen when someone wins with bakc to lobby button
// Display list of guesses for each player to both players
// Add 🔥 when guesses are within 10 numbers
// Add wins from firebase to display
/*******************************************************/