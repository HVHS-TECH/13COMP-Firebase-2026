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
let numberGenerated = false;
/*******************************************************/
//FIREBASE IMPORTS AND PAGE SETUP
/*******************************************************/

import { FB_GAMEAPP, FB_GAMEDB, FB_AUTH, fb_getPfp } from '../firebase/fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue, get, set, remove, update, onDisconnect } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
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
      loadActiveGame(USERREF);
      setupGuessButton();
      setupLeaveButton();
      console.log("GAME ID: " + gameID);

      // onDisconnect handling functions
      onDisconHandler();
      onDisconListener();

    } else {
      console.warn("No user signed in.");
      // window.location.href = "../registration/index.html";
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
function createGTNgameNumber(gameData) {
  if (currentUser.uid === gameData.player1) {
    randomNumber = Math.floor(Math.random() * 100) + 1;

    update(GAMEREF, {
      gameNum: randomNumber
    });

  }
  console.log("RANDOM NUMBER IS: " + randomNumber);
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
function loadActiveGame(USERREF) {
  onValue(GAMEREF, (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Active game no longer exists.");
      // window.location.href = "./GTNpage.html";
      return;
    }

    const gameData = snapshot.val();

    if (gameData.player1 !== currentUser.uid && gameData.player2 !== currentUser.uid) {
      console.warn("Player is not part of this game.");
      return;
    }

    updateGuessControls(gameData);

    if (checkGameEnd(gameData, USERREF)) {
      return;
    }


    displayCrown(gameData);
    playerPFPDisplay(gameData);
    displayTurn(gameData);
    displayLastGuess(gameData);

    if (!numberGenerated) {
      numberGenerated = true;
      if (gameData.player1 === currentUser.uid || gameData.player2 === currentUser.uid) {
        console.log("Player is part of this game.");
      } else {
        console.warn("Player is not part of this game.");
        // window.location.href = "./GTNpage.html";
        return;
      }
      createGTNgameNumber(gameData);

      update(GAMEREF, {
        gameState: "playing"
      });
    }
  });
}
/*******************************************************/
// loadPlayerData
// Loads player data from Firebase for the current GTN match
// Checks if the active game still exists before displaying crowns
// Calls displayCrown() using the user data
// Input: USERREF (Firebase reference)
// Return: n/a
/*******************************************************/
// function loadPlayerData() {
//   get(USERREF).then((snapshot) => {
//     if (!snapshot.exists()) {
//       console.warn("Active game no longer exists.");
//       // window.location.href = "./GTNpage.html";
//       return;
//     }
//     const userData = snapshot.val();

//   })
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

  if (p1Pfp) p1Pfp.src = gameData.player1Pfp || "../images/defaultpfp.png";
  if (p2Pfp) p2Pfp.src = gameData.player2Pfp || "../images/defaultpfp.png";

  if (p1Name) p1Name.innerText = gameData.player1Name || "Player 1";
  if (p2Name) p2Name.innerText = gameData.player2Name || "Player 2";
}

/*******************************************************/
// displayLastGuess
// Displays the most recent guess and who made it
// Called by loadActiveGame()
// Input: gameData
// Return: n/a
/*******************************************************/
function displayLastGuess(gameData) {
  const LASTGUESS = document.getElementById("otherGuessDisplay");

  if (!LASTGUESS || gameData.lastGuess === undefined) {
    return;
  }

  let name = "Someone";

  if (gameData.lastGuesser === currentUser.uid) {
    name = "You";
  } else if (gameData.lastGuesser === gameData.player1) {
    name = gameData.player1Name || "Player 1";
  } else if (gameData.lastGuesser === gameData.player2) {
    name = gameData.player2Name || "Player 2";
  }

  LASTGUESS.innerText = `Last guess: ${gameData.lastGuess} - ${name}`;
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

    // store last guess info in the game record so all clients can see it
    update(GAMEREF, {
      lastGuess: guess,
      lastGuesser: currentUser.uid
    });

    // attach to local snapshot so the immediate UI update can use it
    gameData.lastGuess = guess;
    gameData.lastGuesser = currentUser.uid;

    console.log("Player guessed: " + guess);
    displayGuessResult(guess, gameData);
    turnSwitch(gameData, guess);
  });
}
/*******************************************************/
// storeGuess
// Stores the player's submitted guess locally and in Firebase
// Updates the most recent guess for each player in the active game
// Called after a valid guess is submitted
// Input: guess, gameData
// Return: n/a
/*******************************************************/
function storeGuess(guess, gameData) {
  if (gameData.player1 === currentUser.uid) {
    player1Guesses.push(guess);
    console.log(guess + " stored for Player 1");
    update(GAMEREF, {
      lastGuessp1: guess
    });
  } else if (gameData.player2 === currentUser.uid) {
    player2Guesses.push(guess);
    console.log(guess + " stored for Player 2");
    update(GAMEREF, {
      lastGuessp2: guess
    });
  }
}

/*******************************************************/
//turnSwitch
// Switches the turn between player 1 and player 2 in Firebase after a guess is made
// Compares stored turn uid with player1 and player2 uid to determine whose turn is next
// Called by submitGuess() after validating the guess and displaying the result
// Only updates turn after guess has been processed.
/*******************************************************/

function turnSwitch(gameData, guess) {

  if (gameData.player1 === gameData.turn) {
    update(GAMEREF, {
      turn: gameData.player2
    });
    fb_AddGuess(gameData.player1Guesses, "player1Guesses");
    storeGuess(guess, gameData);

  } else {
    update(GAMEREF, {
      turn: gameData.player1
    });
    fb_AddGuess(gameData.player2Guesses, "player2Guesses");
    storeGuess(guess, gameData);
  }
}

/*******************************************************/
// updateGuessControls
// Enables the guess input and button only when it is the current user's turn
// Disables them when it is not their turn or when the game is finished
// Input: gameData
// Return: n/a
/*******************************************************/
function updateGuessControls(gameData) {
  const guessInput = document.getElementById("guessInput");
  const guessBtn = document.getElementById("guessBtn");
  const isMyTurn = gameData.turn === currentUser.uid;
  const isPlaying = gameData.gameState === "playing";

  guessInput.disabled = !isMyTurn || !isPlaying; // disable if not turn or game ended
  guessBtn.disabled = !isMyTurn || !isPlaying;
}
/*******************************************************/
// fb_AddGuess
// Adds 1 to a player's guess count in Firebase
// Input: playerWhoGuessed, playerField
// Return: n/a
/*******************************************************/
function fb_AddGuess(playerWhoGuessed, playerField) {
  update(GAMEREF, {
    [playerField]: playerWhoGuessed + 1
  });
}

/*******************************************************/
//displayGuessResult
// Displays the result of the player's guess (too high, too low, or correct)
// Compares the player's guess to the random number stored in Firebase and updates the UI accordingly
// Called by submitGuess() after validating the guess and logging it to the console
/*******************************************************/
function displayGuessResult(guess, gameData) {
  const RESULT = document.getElementById("guessResultDisplay");

  let message = "";
  if (typeof gameData.gameNum === 'number') {
    if (guess < gameData.gameNum) {
      message = "Too low!";
      console.log(message);
      if (guess >= gameData.gameNum - 10 && guess <= gameData.gameNum + 10) {
        message = "Too Low! 🔥🔥🔥";
        console.log(message);
      }
    } else if (guess > gameData.gameNum) {
      message = "Too high!";
      console.log(message);
      if (guess >= gameData.gameNum - 10 && guess <= gameData.gameNum + 10) {
        message = "Too High! 🔥🔥🔥";
        console.log(message);
      }
    } else if (guess === gameData.gameNum) {
      message = "Correct!";
      console.log(message);

      update(GAMEREF, {
        gameState: "finished",
        winner: currentUser.uid,
        winnerName: currentUser.displayName || "Player",
        winType: "guess"
      });
    }
  } else {
    message = "Result pending...";
  }
  RESULT.innerText = message;
}

/*******************************************************/
//displayTurn
// Checks whose turn it is based on the turn uid stored in Firebase
// Updates turn indicator pfp in the guess box
/*******************************************************/
function displayTurn(gameData) {
  const pfpTurn = document.querySelector(".pfpTurn");

  if (gameData.turn === gameData.player1) {
    pfpTurn.src = gameData.player1Pfp || "../images/defaultpfp.png";
  } else {
    pfpTurn.src = gameData.player2Pfp || "../images/defaultpfp.png";
  }

  pfpTurn.classList.remove("yourTurn");
  if (gameData.turn === currentUser.uid) {
    pfpTurn.classList.add("yourTurn");
  }
}

/*******************************************************/
// displayCrown
// Displays a crown over the player with the most GTN wins
// Reads both player win counts from Firebase and updates the crown UI
// Also calls displayWins() to update displayed win totals
// Input: gameData
// Return: n/a
/*******************************************************/
function displayCrown(gameData) {

  const p1Crown = document.getElementById("player1Crown");
  const p2Crown = document.getElementById("player2Crown");

  const p1Ref = ref(FB_GAMEDB, "userInfo/" + gameData.player1 + "/GTNwins");
  const p2Ref = ref(FB_GAMEDB, "userInfo/" + gameData.player2 + "/GTNwins");

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
}
/*******************************************************/
// displayWins
// Displays the current win count for both players in the GTN game UI
// Updates the player info text to show Player 1 and Player 2 win totals
// Called after win data is read from Firebase
// Input: p1Wins (number), p2Wins (number)
// Return: n/a
/*******************************************************/
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
// displayGameOver
// Displays game over info when a player wins, showing winners name and guesses
// Shows the winner and disables further guesses
// Input: gameData
// Return: n/a
/*******************************************************/
function displayGameOver(gameData) {
  const RESULT = document.getElementById("guessResultDisplay");
  const guessBtn = document.getElementById("guessBtn");
  const guessInput = document.getElementById("guessInput");

  RESULT.innerText = gameData.winnerName + " wins!";

  guessBtn.disabled = true;
  guessInput.disabled = true;
}

/*******************************************************/
// saveGameResult
// Saves the winning player's game statistics to Firebase
// Adds 1 to the player's GTN wins and stores amount of guesses taken
// Called when a player correctly guesses the number
// Input: gameData, USERREF
// Return: n/a
/*******************************************************/
function saveGameResult(gameData, USERREF) {

  get(USERREF).then((snapshot) => {

    if (!snapshot.exists()) {
      console.warn("User data not found.");
      return;
    }

    const userData = snapshot.val();

    let currentWins = userData.GTNwins || 0;
    let fewestGuesses = userData.GTNFewestGuesses || null;
    let guessAmount = 0;

    if (gameData.player1 === currentUser.uid) {
      guessAmount = gameData.player1Guesses;
    } else if (gameData.player2 === currentUser.uid) {
      guessAmount = gameData.player2Guesses;
    }
    update(USERREF, {
      GTNwins: currentWins + 1,
      lastWinGuessCount: guessAmount
    });

    updateFewestGuesses(userData, USERREF, guessAmount);

    update(GAMEREF, {
      resultSaved: true
    });

    console.log("Game result saved.");
  });
}

/*******************************************************/
// updateFewestGuesses
// Checks if the current win used fewer guesses than the user's saved best
// Updates GTNFewestGuesses only if the new guess amount is lower
// Input: userData, USERREF, guessAmount
// Return: n/a
/*******************************************************/
function updateFewestGuesses(userData, USERREF, guessAmount) {
  const fewestGuesses = userData.GTNFewestGuesses || null;

  if (fewestGuesses === null || guessAmount < fewestGuesses) {
    update(USERREF, {
      GTNFewestGuesses: guessAmount
    });

    console.log("New fewest guesses saved:", guessAmount);
  }
}

/*******************************************************/
// setupLeaveButton
// Attaches click event to the leave button
// Calls leaveActiveGame when the player chooses to leave
/*******************************************************/
function setupLeaveButton() {
  const leaveBtn = document.getElementById("leaveBtn");

  if (!leaveBtn) {
    console.warn("leaveBtn not found in HTML.");
    return;
  }

  leaveBtn.addEventListener("click", leaveActiveGame);
}

/*******************************************************/
// leaveActiveGame
// Handles a player leaving an active GTN game
// Prevents duplicate wins if the game has already ended
// Awards the win to the remaining player and updates Firebase
// Return: N/A
/*******************************************************/
function leaveActiveGame() {


  get(GAMEREF).then((snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Game does not exist.");
      return;
    }

    const gameData = snapshot.val();

    if (gameData.gameState === "finished") {
      console.log("Game already finished. Leave button will not award another win.");
      window.location.href = "./GTNpage.html";
      return;
    }

    let winner;
    let winnerName;

    if (currentUser.uid === gameData.player1) {
      winner = gameData.player2;
      winnerName = gameData.player2Name || "Player 2";
    } else if (currentUser.uid === gameData.player2) {
      winner = gameData.player1;
      winnerName = gameData.player1Name || "Player 1";
    } else {
      console.warn("Current user is not part of this game.");
      return;
    }


    saveLeaveWin(winner);

    update(GAMEREF, {
      gameState: "finished",
      winner: winner,
      winnerName: winnerName,
      winType: "leave",
      resultSaved: true
    }).then(() => {
      console.log("Player left the game. Winner declared: " + winnerName);
      window.location.href = "./GTNpage.html";
    });


  });
}

/*******************************************************/
// logPlayerWins
// Reads and logs both players' GTN win counts
// Input: gameData
// Return: n/a
/*******************************************************/
function logPlayerWins(gameData) {
  const p1Ref = ref(FB_GAMEDB, "userInfo/" + gameData.player1 + "/GTNwins");
  const p2Ref = ref(FB_GAMEDB, "userInfo/" + gameData.player2 + "/GTNwins");

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

      console.log("Player 1 wins: " + p1Wins);
      console.log("Player 2 wins: " + p2Wins);
    });
  });
}

/*******************************************************/
// saveLeaveWin
// Adds one GTN win to the player who won because the other player left
// Does not update guess count or fewest guesses
// Input: winnerUID
// Return: n/a
/*******************************************************/
function saveLeaveWin(winnerUID) {
  const WINNERREF = ref(FB_GAMEDB, "userInfo/" + winnerUID);

  get(WINNERREF).then((snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Winner data not found.");
      return;
    }

    const userData = snapshot.val();
    const currentWins = userData.GTNwins || 0;

    update(WINNERREF, {
      GTNwins: currentWins + 1,
    });

    console.log("Leave win saved.");
  });
}


/*******************************************************/
// checkGameEnd
// Checks if the game has finished
// Saves result only if the win came from a correct guess
// Displays the game over screen for all finished game types
// Return: T/F
/*******************************************************/
function checkGameEnd(gameData, USERREF) {
  if (gameData.gameState !== "finished") {
    return false;
  }

  if (gameData.winType === "guess" && gameData.winner === currentUser.uid && !gameData.resultSaved) {
    saveGameResult(gameData, USERREF);
  }
  logPlayerWins(gameData);
  displayGameOver(gameData);
  return true;
}

/*******************************************************/
// onDisconHandler
// Sets up Firebase onDisconnect for the current player.
// If this player loses connection, their UID is written to the game.
// This does not give the win by itself.
/*******************************************************/
function onDisconHandler() {
  if (!currentUser || !gameID) {
    console.warn("Cannot setup disconnect handler. Missing user or gameID.");
    return;
  }

  const DISCONREF = ref(FB_GAMEDB, "GTN/activeGames/" + gameID + "/disconnectedUser");

  onDisconnect(DISCONREF).set(currentUser.uid);
  console.log("discon handler set");
}

/*******************************************************/
// getDisconWinner
// Finds the winner by checking which player did not disconnect.
// Input: gameData
// Return: winner UID, or null if data is invalid
/*******************************************************/
function getDisconWinner(gameData) {
  const disconUID = gameData.disconnectedUser;

  if (!disconUID) {
    return null;
  }
  if (disconUID === gameData.player1) {
    return gameData.player2;
  }
  if (disconUID === gameData.player2) {
    return gameData.player1;
  }

  console.warn("Disconnected UID does not match either player.");
  return null;
}

/*******************************************************/
// OnDisconListener
// Listens for changes to the disconnectedUser field in Firebase.
// If a player disconnects, determines the winner and updates the game state.
/*******************************************************/
function onDisconListener() {
  onValue(GAMEREF, (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Game no longer exists.");
      return;
    }

    const gameData = snapshot.val();

    if (!gameData.disconnectedUser) {
      return;
    }

    if (gameData.winner) {
      return;
    }

    const winnerUID = getDisconWinner(gameData);

    if (!winnerUID) {
      return;
    }

    if (currentUser.uid !== winnerUID) {
      console.log("This user is not the winner, so they will not save the win.");
      return;
    }
    handleDisconnectWin(winnerUID, gameData);
  });
}

/*******************************************************/
// handleDisconnectWin
// Handles awarding a win to the remaining player after a disconnect.
// Updates Firebase with the winner and saves the leave win.
// Input: winnerUID, gameData
// Return: n/a
/*******************************************************/
function handleDisconnectWin(winnerUID, gameData) {
  const winnerName = getDisconWinnerName(gameData, winnerUID);

  update(GAMEREF, {
    winner: winnerUID,
    winnerName: winnerName,
    gameState: "finished",
    winType: "leave",
    resultSaved: true
  })
    .then(() => {
      console.log("Leave/disconnect win saved for:", winnerUID);
      saveLeaveWin(winnerUID);
    })
    .catch((error) => {
      console.error("Error handling disconnect win:", error);
    });
}

/*******************************************************/
// getDisconWinnerName
// Retrieves the display name of the winner based on their UID
// Called by handleDisconnectWin to display winner name in the game over info
// Input: gameData, winnerUID
// Return: the winner's display name, or a default p1/p2
/*******************************************************/
function getDisconWinnerName(gameData, winnerUID) {
  if (winnerUID === gameData.player1) {
    return gameData.player1Name || "Player 1";
  }
  if (winnerUID === gameData.player2) {
    return gameData.player2Name || "Player 2";
  }
}

/*******************************************************/
// TO DO
// Turn indicator needs to be improved
// Display list of guesses for each player to both players


// OPTIONAL: Add a chat feature for players to talk during the game
//Add data stealer for google autofill, to get classmates address
/*******************************************************/