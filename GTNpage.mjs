/*******************************************************/
// GTNpage.mjs
// Guess The Number Game
// Made by Dylan Figliola
/*******************************************************/

console.log(
  "%c🎲 GUESS THE NUMBER LOBBY 🎲",
  `
  color: #c77dff;
  background: linear-gradient(90deg, #000000, #111111);
  `
);
/*******************************************************/
//VARIABLES AND GAME SETUP
/*******************************************************/
let currentUser = null; // will hold the authenticated user object
let confirmState = false; // for menu button confirmation
let redirected = false;
/*******************************************************/
//FIREBASE IMPORTS AND PAGE SETUP
/*******************************************************/

import { FB_GAMEAPP, FB_GAMEDB, FB_AUTH, fb_getPfp } from './fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue, get, set, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
/**********************************************************/
//setupGTN
// Check if user is signed in and runs initialization functions for GTN game
// If not signed in, redirect to index.html
// Calls fb_getPfp() to display user's profile picture
// Input: n/a
// Return n/a

/*******************************************************/
export function setupGTN() {
  const auth = FB_AUTH;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("User signed in:", currentUser.displayName || currentUser.email);
    } else {
      console.warn("No user signed in.");
      window.location.href = "index.html";
    }
  });
  fb_getPfp(currentUser);
  lobbyDetect();
  waveText();

}

/************************************************************/
//waveText
// Adds a wave animation to the match status text on GTNpage.html
// Called by setupGTN() on page load
/*******************************************************/

function waveText() {
  const WAVETEXT = document.getElementById("matchStatus");
  const text = WAVETEXT.innerText;
  console.log("Applying wave animation to text:", text);
  WAVETEXT.innerHTML = "";

  [...text].forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char; // preserve spaces by replacing normal spaces with non-breaking spaces
    span.style.animationDelay = `${i * 0.06}s`;
    WAVETEXT.appendChild(span);
  });
}
/************************************************************/
//generateLobbyID
//Generates a unique lobby ID everytime a lobby is created
//Attaches Lobby with the user that created it
//Binds the lobby to their username
//Input: n/a
// Called by lobbyCreate() when "Create a Lobby" button is clicked on GTNpage.html
/*******************************************************/
function generateLobbyID() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    // DASH AFTER EVERY 4 CHARACTERS 
    if ((i + 1) % 4 === 0 && i < 15) {
      result += '-';
    }
  }
  // Removes spaces from username if there is no name, sets Anon Player Lobby
  const NAMEATTACH = currentUser.displayName ? currentUser.displayName.replace(/\s+/g, '') : "Anon Player";
  let lobbyID = NAMEATTACH + ": " + result; // 1 in 580 tredicillion chance of collision with 16 char ID and username match.
  console.log("Generated lobby ID:", lobbyID);
  return lobbyID;


}
/************************************************************/
//lobbyCreate
// Called when "Create a Lobby" button is clicked on GTNpage.html (button with id "createLobbyBtn")
// Creates a new lobby in Firebase with a unique ID, and adds the current user to it
// Input: n/a
/*******************************************************/
export function lobbyCreate() {


  currentUser = FB_AUTH.currentUser;
  lobbyClear();
  console.log("%cCreated lobby for user:" + currentUser.displayName, "color: green; font-weight: bold;");
  if (!currentUser) {
    console.error("No user found, please log in.");
    p_lobbyStatus.innerText = "Error: No user found. Please log in.";
    window.location.href = "index.html";
    return;
  }
  const RECORDPATH = "GTN/lobbies/" + generateLobbyID(currentUser);
  const DATAREF = ref(FB_GAMEDB, RECORDPATH);
  set(DATAREF, {
    player1: currentUser.uid,
    active: true,
    players: 1,
    player1Name: currentUser.displayName || "Anon Player",
    player1Pfp: currentUser.photoURL || null,
  })
    .then(() => {
      console.log("Lobby created with ID:", RECORDPATH);
    });

}


/*******************************************************/
// lobbyAdd
// Displays created lobbys as a box sidebar on the left side
// Each lobby box displays the Username of the creator
// Shows amount of players in the lobby (max 2)
// Called by lobbyDetect() after a lobby is created
/*******************************************************/
function lobbyAdd(lobbyID, lobbyData) {

  const LOBBYELM = document.getElementById("lobbyElm");
  const LOBBY = document.createElement("div");
  LOBBY.className = "lobbyBox";
  LOBBY.user = lobbyData.player1;
  LOBBY.innerText = "Lobby Name: " + lobbyData.player1Name + "\nPlayers: " + lobbyData.players + "/2";
  LOBBYELM.appendChild(LOBBY);

  lobbyBtn(LOBBY, lobbyID);

  if (lobbyData.player1 === currentUser.uid && lobbyData.players === 2) {
    const startBtn = document.createElement("button");
    startBtn.innerText = "Start Game";

    startBtn.onclick = () => sendToGame(lobbyID);

    LOBBY.appendChild(startBtn);
  }
}

/*******************************************************/
// lobbyBtn
// Creates a button for each Lobby created, allowing other users to join the lobby by clicking the button
// Called by lobbyAdd() when a lobby box is created.
/*******************************************************/
function lobbyBtn(lobbyDiv, lobbyID) {
  // Create the Join button
  const joinBtn = document.createElement("button");
  joinBtn.innerText = "Join Lobby";
  joinBtn.className = "joinBtn";
  lobbyDiv.appendChild(joinBtn);

  ownerCheck(joinBtn, lobbyID);


  // Event listener for the Join button
  joinBtn.addEventListener("click", async () => {
    console.log("Attempting to join lobby:", lobbyID);

    joinBtn.disabled = true;
    const JOINED = await lobbyJoin(lobbyID, joinBtn);

    if (JOINED) {
      joinBtn.remove();
    } else {
      joinBtn.disabled = false;
    }
  });

  const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies/" + lobbyID);
  onValue(LOBBYREF, (snapshot) => {
    const LOBBY = snapshot.val();
    if (!LOBBY || !currentUser) return;

    if (LOBBY.player2) {
      joinBtn.remove();
    }

    if (LOBBY.player2 === currentUser.uid && !lobbyDiv.querySelector(".disconBtn")) {
      // Create the Disconnect button
      const disconBtn = document.createElement("button");
      disconBtn.innerText = "Leave Lobby";
      disconBtn.className = "disconBtn";
      lobbyDiv.appendChild(disconBtn);
      console.log("User is in the lobby, showing disconnect button.");

      // Event listener for the Disconnect button
      disconBtn.addEventListener("click", () => {
        console.log("Attempting to leave lobby:", lobbyID);
        lobbyDisconnect(lobbyID);
      });
    }


  });
}



/*******************************************************/
// ownerCheck
// Checks if the current user is the owner of the lobby and disables the join button if they are
// Called by lobbyBtn() when a lobby button is created
/*******************************************************/
async function ownerCheck(Btn, lobbyID) {
  try {
    const LOBBBYREF  = "GTN/lobbies/" + lobbyID + "/player1";
    const DATAREF = ref(FB_GAMEDB, LOBBBYREF);
    const LOBBYDIV = Btn.parentElement;


    const SNAPSHOT = await get(DATAREF);
    if (!SNAPSHOT.exists()) {
      console.warn("No player1 in the lobby");
      return false;
    }

    const PLAYERUID = SNAPSHOT.val();

    if (currentUser.uid === PLAYERUID) {
      console.log("User is the owner of this lobby. Indicating ownership.");

      LOBBYDIV.classList.add("owner");
      Btn.remove();

      const OWNERLABEL = document.createElement("div");
      OWNERLABEL.innerText = "Your Lobby";
      OWNERLABEL.style.fontWeight = "bold";
      OWNERLABEL.style.color = "#68b6ff";
      LOBBYDIV.appendChild(OWNERLABEL);

      return true;
    }
    return false;
  } catch (error) {
    console.error("Reading Error (owner)");
    return false;
  }

}

/*******************************************************/

/*******************************************************/
// lobbyJoin
// writes to firebase that the 2nd player has joined the lobby, allowing the game to start
// Called by lobbyBtn() when a user clicks the "Join Lobby" button on a lobby box
/*******************************************************/
async function lobbyJoin(lobbyID, Btn) {
  try {
    if (!currentUser) {
      console.warn("No user found, please log in.");
      window.location.href = "index.html";
      return false;
    }
    const LOBBBYREF  = "GTN/lobbies/" + lobbyID;
    const DATAREF = ref(FB_GAMEDB, LOBBBYREF);
    const SNAPSHOT = await get(DATAREF);
    if (!SNAPSHOT.exists()) {
      console.warn("Lobby does not exist:", lobbyID);
      return false;
    }
    const LOBBYDATA = SNAPSHOT.val();
    if (LOBBYDATA.players >= 2) {
      console.warn("Lobby is full:", lobbyID);
      return false;
    }


    await update(DATAREF, {
      player2: currentUser.uid,
      player2Name: currentUser.displayName || "Anon Player",
      players: 2,
      active: false,
      player2Pfp: currentUser.photoURL || null,
    });
    console.log("Joined lobby:", lobbyID);
    return true;


  } catch (error) {
    console.error("Error joining lobby:", error);
    return false;
  }
}

/*******************************************************/
// lobbyClear
// Clears any lobbies from the same user, to prevent duplicates when refreshing page or creating multiple lobbies
// Called by lobbyCreate() before creating a new lobby, and also on page load to clear any old lobbies
// Input: n/a
// Return: n/a
/*******************************************************/
function lobbyClear() {
  const LOBBYELM = document.getElementById("lobbyElm");
  const LOBBYNUM = LOBBYELM.getElementsByClassName("lobbyBox");


  for (let i = LOBBYNUM.length - 1; i >= 0; i--) {
    if (LOBBYNUM[i].user === currentUser.uid) {
      LOBBYELM.removeChild(LOBBYNUM[i]);
      console.log("%cRemoved lobby for user: " + currentUser.displayName, "color: red; font-weight: bold;");
      return;
    }
  }
}

/*******************************************************/
// lobbyEmpty
// Monitors firebase to check if a lobby has 0 players, and if so, deletes the lobby from firebase and page.
// Uses onvalue to for changes in the firebase
// Input: n/a
// Return: n/a
/*******************************************************/

function lobbyEmpty() {
  const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies");

  onValue(LOBBYREF, (snapshot) => {
    const LOBBIES = snapshot.val();

    if (!LOBBIES) {
      console.log("No lobbies found.");
      return;
    }

    Object.entries(LOBBIES).forEach(([lobbyID, lobbyData]) => {
      if (!lobbyData.players || lobbyData.players === 0 || !lobbyData.player1) {
        console.log("Deleting empty lobby:", lobbyID);

        const DELETEREF = ref(FB_GAMEDB, "GTN/lobbies/" + lobbyID);
        remove(DELETEREF)
          .then(() => {
            console.log("%cLobby deleted: " + lobbyID, "color: red; font-weight: bold;");
          })
          .catch((e) => {
            console.error("Error deleting lobby:", e);
          });
      }
    });
  });
}

/*******************************************************/
// lobbyDisconnect
// Called by a listener, waiting for "leave lobby" button to be pressed
// Updates and removes user data in firebase for the user that left
// Updates player count in html
// Input: n/a
// Return: n/a
/*******************************************************/
function lobbyDisconnect(lobbyID) {
  console.log("Disconnecting from lobby:", lobbyID);
  const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies/" + lobbyID);
  get(LOBBYREF).then((snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Lobby does not exist:", lobbyID);
      return;
    }
    const LOBBYDATA = snapshot.val();
    if (LOBBYDATA.player1 === currentUser.uid) {
      update(LOBBYREF, {
        player1: null,
        player1Name: null,
        player1Pfp: null,
        players: LOBBYDATA.players - 1
      });
    } else if (LOBBYDATA.player2 === currentUser.uid) {
      update(LOBBYREF, {
        player2: null,
        player2Name: null,
        player2Pfp: null,
        players: LOBBYDATA.players - 1,
        active: true,
      });

    }
    lobbyEmpty(); // Check if lobby is empty and delete if so
  });

}

/*******************************************************/
//lobbyDetect
//Checks for changes in the lobbies in firebase, allowing for lobbies to be displayed on html for both players
//Called on page load to start listening for lobby changes (setupGTN)
//Lobby functions like lobbyAdd and lobbyJoin also trigger changes in firebase that this function listens for
// watches for 2 players joining the same lobby, and changes the match status text to "Game starting..." with animation
// Loads pfp for players only in the lobby, so that other users can't see pfps of lobbies they aren't in (basic privacy measure)
/*******************************************************/

function lobbyDetect() {
  const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies");

  onValue(LOBBYREF, (snapshot) => {
    const LOBBIES = snapshot.val();

    lobbyGeneration(LOBBIES);
    lobbyStatus(LOBBIES);
    lobbyPfpHandler(LOBBIES);
    lobbyStartGameCheck(LOBBIES);
  });
}

/*******************************************************/
//lobbyGeneration
//Clears the lobby container and generates lobby elements for player 2 from firebase
//Called by lobbyDetect whenever firebase detects a change in lobby data
//Uses lobbyAdd to create each lobby
//Ensures the lobby list is always up to date for all users viewing the page
/*******************************************************/
function lobbyGeneration(LOBBIES) {
  
  const lobbyContainer = document.getElementById("lobbyElm");
  lobbyContainer.innerHTML = "";
  if (!LOBBIES) {
    lobbyContainer.innerHTML = "<p>No lobbies available</p>";
    return;
  }


  Object.entries(LOBBIES).forEach(([lobbyID, lobbyData]) => {
    lobbyAdd(lobbyID, lobbyData);
    console.log("Lobby generated:", lobbyID);
  });
}

/*******************************************************/
//lobbyStatus
//Updates the match status text on screen
//Checks if the user is in a lobby
//If 2 players are in, shows start button / wait message depending on if user is host or not
//If not full, shows waiting for players with animation
//Called by lobbyDetect when firebase changes
/*******************************************************/

function lobbyStatus(LOBBIES) {
  const STATUS = document.getElementById("matchStatus");

  if (!LOBBIES) return;

  let inLobby = false;

  Object.values(LOBBIES).forEach((lobbyData) => {
    if (lobbyData.player1 === currentUser.uid || lobbyData.player2 === currentUser.uid) {
      inLobby = true;

      if (lobbyData.players === 2) {
        STATUS.classList.remove("waveText");

        if (lobbyData.player2 === currentUser.uid) {
          STATUS.textContent = "Waiting for host to start the game...";
        } else {
          STATUS.textContent = "Start the game...";
        }

      } else {
        STATUS.textContent = "Waiting for players...";
        STATUS.classList.add("waveText");
      }
    }
  });

  if (!inLobby) {
    STATUS.textContent = "Join a lobby to start!";
  }
}

/*******************************************************/
//lobbyPfpHandler
//Shows pfps for your lobby
//Only shows pfps if you're in that lobby, otherwise uses default
//Stops other players from seeing pfps they shouldn’t
//Called by lobbyDetect when firebase changes
/*******************************************************/

function lobbyPfpHandler(LOBBIES) {
  const p1 = document.getElementById("player1Pfp");
  const p2 = document.getElementById("player2Pfp");

  if (!LOBBIES) return;

  let found = false;

  Object.values(LOBBIES).forEach((lobbyData) => {
    if (lobbyData.player1 === currentUser.uid || lobbyData.player2 === currentUser.uid) {
      found = true;

      if (p1) {
        p1.src = lobbyData.player1Pfp || "images/defaultpfp.png";
      }

      if (p2) {
        p2.src = lobbyData.player2Pfp || "images/defaultpfp.png";
      }
    }
  });

  if (!found) {
    if (p1) p1.src = "images/defaultpfp.png";
    if (p2) p2.src = "images/defaultpfp.png";
  }
}
/*******************************************************/
// lobbyStartGameCheck
// Checks all lobbies for a started game
// Verifies if the current user is in the lobby
// Redirects the user to the GTN game page if true
// Called by lobbyDetect when firebase changes, due to .gamestarted being updated
// Deletes lobby that was used to send players to game page
/*******************************************************/
function lobbyStartGameCheck(LOBBIES) {
  if (redirected || !LOBBIES || !currentUser) return;

  Object.entries(LOBBIES).forEach(([lobbyID, lobbyData]) => {
    if (
      lobbyData.gameStarted &&
      (lobbyData.player1 === currentUser.uid || lobbyData.player2 === currentUser.uid)
    ) {
      redirected = true;

      lobbyTransfer(lobbyID, lobbyData);

      const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies/" + lobbyID);
      remove(LOBBYREF);

      window.location.href = "GTNgame.html";
    }
  });
}

function lobbyTransfer(lobbyID, lobbyData) {
  if (!lobbyData.active){
    const TRANSFERREF = ref(FB_GAMEDB, "GTN/activeGames/" + lobbyID);
    set(TRANSFERREF, {
      player1: lobbyData.player1,
        player2: lobbyData.player2,
        player1Name: lobbyData.player1Name,
        player2Name: lobbyData.player2Name,
        player1Pfp: lobbyData.player1Pfp,
        player2Pfp: lobbyData.player2Pfp,
        gameActive: true,
      });
    }
}
/*******************************************************/
//sendToGame
//Starts the game by updating firebase
//Sets gameStarted to true for this lobby
//Called when host clicks Start Game button
/*******************************************************/

async function sendToGame(lobbyID) {
  const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies/" + lobbyID);

  await update(LOBBYREF, {
    gameStarted: true
  });

  console.log("Game started for lobby:", lobbyID);
}

/*******************************************************/
//menuBtn
// Called by GTNpage.html when menu button is clicked
// Asks user to confirm if they want to return to menu
// If confirmed, redirects to choosegame.html
/*******************************************************/

export function menuBtn() {
  const btn = document.getElementById("backBtn");
  if (!btn) return;

  let message = document.getElementById("menuMsg");
  if (!message) {
    message = document.createElement("p");
    message.id = "menuMsg";
    message.textContent = "⚠️ CLICK AGAIN TO CONFIRM ⚠️";
    message.style.color = "red";
    message.style.marginTop = "0.5rem";
    message.style.display = "none";
    btn.insertAdjacentElement("afterend", message);
    // Styling
    message.style.width = btn.offsetWidth + 200 + "px";
    message.style.fontSize = "18px";
    message.style.fontWeight = "bold";
    message.style.color = "#00ffff";
    message.style.background = "linear-gradient(90deg, #7092cf, #4b8ccd)"; // gradient background
    message.style.padding = "8px 0"; // vertical padding only
    message.style.borderRadius = "8px";
    message.style.marginTop = "0.5rem";
    message.style.display = "none";
    message.style.textAlign = "center";
    message.style.letterSpacing = "1.5px";
    message.style.textShadow = "0 0 6px #00ffff, 0 0 12px #00ccff";
    message.style.animation = "pulse 1s infinite alternate";

    btn.insertAdjacentElement("afterend", message);
  }

  if (!confirmState) {
    confirmState = true;
    message.style.display = "block";

    setTimeout(() => {
      confirmState = false;
      message.style.display = "none";
    }, 5000);
  } else {
    window.location.href = "choosegame.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("backBtn");
  if (btn) {
    btn.addEventListener("click", menuBtn);
  }
});


/*******************************************************/
// TEMPORARY FUNCTIONS FOR TESTING
/*******************************************************/

// TEMPORARY LOBBY REMOVER
const deleteLobbiesBtn = document.createElement("button");
deleteLobbiesBtn.innerText = "Delete All Lobbies (Temp)";
deleteLobbiesBtn.style.backgroundColor = "red";
deleteLobbiesBtn.style.color = "white";
deleteLobbiesBtn.style.margin = "10px";
deleteLobbiesBtn.style.padding = "8px 12px";
document.body.appendChild(deleteLobbiesBtn);

// Event listener for deleting all lobbies
deleteLobbiesBtn.addEventListener("click", async () => {
  if (!confirm("Are you SURE you want to delete ALL lobbies? This cannot be undone.")) {
    console.log("%cCancelled: no lobbies deleted.", "color: orange; font-weight: bold;");
    return;
  }

  try {
    const LOBBYREF = ref(FB_GAMEDB, "GTN/lobbies");
    await remove(LOBBYREF);
    console.log("%cSuccess: All lobbies deleted!",
      "color: red; font-weight: bold; font-size: 25px; background: black; padding: 10px; border: 3px solid red;");
    lobbyClear();
  } catch (error) {
    console.error("%cError deleting lobbies:", "color: red; font-weight: bold; font-size: 25px; background: black; padding: 10px; border: 3px solid red;", error);
  }
});
/*******************************************************/
//TO DO
//Make it so you can't create a lobby if you are already in one, or already have one created
//You must leave your current lobby to join someone else's
