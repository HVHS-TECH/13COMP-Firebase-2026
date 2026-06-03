// ************************************************************
// GAME 1 || GNOME DODGER
// ************************************************************
// P5.play: GnomeDodger
// By Dylan Figliola
// ************************************************************

console.log(
  "%c🐾 GNOME DODGER 🐾",
  `
  color: #00ff99;
  background: black;
  `
);


/*******************************************************/
//FIREBASE IMPORTS AND PAGE SETUP
/*******************************************************/
window.setup = setup;
window.draw = draw;
window.preload = preload;
window.keyPressed = keyPressed;

import { FB_GAMEDB, FB_AUTH, fb_getPfp } from '../firebase/fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue, get, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
export let currentUser = null; // will hold the authenticated user object
/**********************************************************/
//setupGame1
// Check if user is signed in and runs initialization functions for game1
// If not signed in, redirect to index.html
/*******************************************************/
export function setupGame1(){
const auth = FB_AUTH;
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("User signed in:", user.displayName || user.email);
  } else {
    console.warn("No user signed in.");
    window.location.href = "../registration/index.html";
  }
});
fb_getPfp();
preload();
}

// ************************************************************/
// Game Constants & Variables
// ************************************************************/
const GAMEHEIGHT = 500;
const GAMEWIDTH = 500;
const PLAYERSIZE = 25;
const PLAYERSPEED = 5;
const GNOMESIZE = 20;
const GNOME_Y = 10;
const GNOME_X = 10;
const GNOMESPEED = [1, 2, 3, 4, 5, 6, 5, 5, 6, 5, 5, 6, 5, 5, 6, 5, 5, 6, 5, 9, 10, 10];

let gnomex, gnomey, gameOver = false;
let score = 0, stickman, Lwall, Rwall, Twall, Bwall;
let startTime, timeLimit = 45, elapsedTime;
let gnomesH = [], gnomesV = [];
let imgPlayer, imgGnome, imgBG;
let gameState = "start";
let confirmState = false;


// ************************************************************
// Preload assets
function preload() {
  imgPlayer = loadImage('../images/stickmangame.png');
  imgGnome = loadImage('../images/gnome.png');
  imgBG = loadImage('../images/Grassbg.jpg');
}

function setup() {
  new Canvas(GAMEWIDTH, GAMEHEIGHT);
  gameSetup();
}

function draw() {
  if (gameState === 'start') {
    startScreen();
  } else if (gameState === 'playing') {
    runGame();
  }
}

function keyPressed() {
  checkKey(key);
}

function gameSetup() {
  stickman = new Sprite(GAMEWIDTH / 2, GAMEHEIGHT / 2, PLAYERSIZE, PLAYERSIZE, 'd');
  stickman.color = 'black';
  stickman.image = imgPlayer;
  imgPlayer.resize(PLAYERSIZE + 5, PLAYERSIZE + 5);

  Lwall = new Sprite(0, GAMEHEIGHT / 2, 5, GAMEHEIGHT, 'k');
  Rwall = new Sprite(500, GAMEHEIGHT / 2, 5, GAMEHEIGHT, 'k');
  Twall = new Sprite(GAMEWIDTH / 2, 0, GAMEWIDTH, 5, 'k');
  Bwall = new Sprite(GAMEWIDTH / 2, 500, GAMEWIDTH, 5, 'k');

  [Lwall, Rwall, Twall, Bwall].forEach(w => w.color = 'black');

  gameOver = false;
  score = 0;
  startTime = millis();
  gameState = "start";
}

function startScreen() {
  background('#A7C7E7');
  fill(0);
  textSize(30);
  textAlign(CENTER, CENTER);
  text("Gnome Dodger", width / 2, height / 3);

  textSize(20);
  textAlign(CENTER, TOP); // ensures top alignment so y is easier to manage
  text(
    "Instructions: Dodge gnomes for 15 seconds using arrow or WASD keys.\nPress Enter to Start.",
    width / 2 - 175,           // horizontal center
    height / 3 + 100,    // vertical position
    350                  // wrapping width
  );
}


function checkKey(k) {
  if ((k === " " || k === "Enter") && gameState === "start") startGame();
  if (k === 'r' || k === 'R') restartGame();
}

function startGame() {
  background("white");
  gameState = 'playing';
  startTime = millis();
}

function runGame() {
  image(imgBG, 0, 0, GAMEWIDTH, GAMEHEIGHT);
  gnomeMakerH();
  gnomeMakerV();
  movement();
  gnomeDetectH();
  gnomeDetectV();
  displayScore();
  displayTimer();
  gnomeTouch();
}

function movement() {
  if (kb.pressing('left')) stickman.vel.x = -PLAYERSPEED;
  else if (kb.pressing('right')) stickman.vel.x = PLAYERSPEED;
  else stickman.vel.x = 0;

  if (kb.pressing('up')) stickman.vel.y = -PLAYERSPEED;
  else if (kb.pressing('down')) stickman.vel.y = PLAYERSPEED;
  else stickman.vel.y = 0;
}

function gnomeTouch() {
  [...gnomesH, ...gnomesV].forEach(g => {
    if (stickman.collide(g)) endGame();
  });
}

function gnomeMakerH() {
  while (gnomesH.length < 10) {
    let g = new Sprite(GNOME_X, random(5, 495), GNOMESIZE, 'k');
    g.image = imgGnome; imgGnome.resize(GNOMESIZE, GNOMESIZE);
    g.color = 'red'; g.vel.x = random(GNOMESPEED) + random(-1, 1);
    gnomesH.push(g);
  }
}

function gnomeDetectH() {
  for (let i = gnomesH.length - 1; i >= 0; i--) {
    if (gnomesH[i].x > GAMEWIDTH) {
      gnomesH[i].remove();
      gnomesH.splice(i, 1);
      score += 1;
    }
  }
}

function gnomeMakerV() {
  while (gnomesV.length < 10) {
    let g = new Sprite(random(5, 495), GNOME_Y, GNOMESIZE, 'k');
    g.image = imgGnome; imgGnome.resize(GNOMESIZE, GNOMESIZE);
    g.color = 'blue'; g.vel.y = random(GNOMESPEED) + random(-1, 1);
    gnomesV.push(g);
  }
}

function gnomeDetectV() {
  for (let i = gnomesV.length - 1; i >= 0; i--) {
    if (gnomesV[i].y > GAMEHEIGHT) {
      gnomesV[i].remove();
      gnomesV.splice(i, 1);
      score += 1;
    }
  }
}

function displayScore() {
  fill(0);
  textSize(20);
  text("Score: " + score, GAMEWIDTH - 400, 30);
}

function displayTimer() {
  if (gameOver) return;
  elapsedTime = floor((millis() - startTime) / 1000);
  let remaining = max(timeLimit - elapsedTime, 0);
  fill(0);
  textSize(20);
  text("Time: " + remaining + "s left!", GAMEWIDTH - 400, 55);
  if (remaining === 0) winGame();
}

function winGame() {
  if (gameOver) return;
  gameOver = true;
  background("gold");
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(`YOU WIN!\nYou dodged ${score} gnomes\nover ${elapsedTime}s!`, GAMEWIDTH / 2, GAMEHEIGHT / 2);
  text("Press R to restart", GAMEWIDTH / 2, GAMEHEIGHT / 2 + 50);
  stickman.remove();
  [...gnomesH, ...gnomesV].forEach(g => g.remove());
  gnomesH = [];
  gnomesV = [];
  noLoop();
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  fb_saveScore();
  background("red");
  fill(0);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(`You died after ${elapsedTime}s, and dodged ${score} gnomes!`, GAMEWIDTH / 2, GAMEHEIGHT / 2);
  text("Press R to restart", GAMEWIDTH / 2, GAMEHEIGHT / 2 + 50);
  stickman.remove();
  [...gnomesH, ...gnomesV].forEach(g => g.remove());
  gnomesH = [];
  gnomesV = [];
  noLoop();
}

function restartGame() {
  background("white");
  gameOver = false;
  allSprites.remove();
  gameSetup();
  loop();
}

export function fb_saveScore() {
  if (score < 0 || score > 700) {
    console.warn(`Score (${score}) out of valid range (0 to 700). Not saved.`);
    return;
  }
  if (!currentUser) {
    console.warn("No authenticated user. Score not saved.");
    return;
  }

  const NAME = currentUser.displayName || currentUser.email; // use Firebase info
  const RECORDPATH = `userInfo/${NAME}/gnomescore`;
  const DATAREF = ref(FB_GAMEDB, RECORDPATH);

  get(DATAREF)
    .then((snapshot) => {
      const existingScore = snapshot.exists() ? snapshot.val() : 0;

      if (score > existingScore) {
        return set(DATAREF, score).then(() =>
          console.log(`New high score saved (${score}) at ${RECORDPATH}`)
        );
      } else {
        console.log(`Score not saved. Existing score (${existingScore}) is higher or equal.`);
      }
    })
    .catch((error) => {
      console.error("Error accessing or writing score:", error);
    });
}

// export function menuBtn() {
//   const btn = document.getElementById("backBtn");
//   if (!btn) return;

//   let message = document.getElementById("menuMsg");
//   if (!message) {
//     message = document.createElement("p");
//     message.id = "menuMsg";
//     message.textContent = "⚠️ CLICK AGAIN TO CONFIRM ⚠️";

//     // Styling
//     message.style.width = btn.offsetWidth + 200 + "px";
//     message.style.fontSize = "18px";
//     message.style.fontWeight = "bold";
//     message.style.color = "#00ffff";
//     message.style.background = "linear-gradient(90deg, #7092cf, #4b8ccd)"; // gradient background
//     message.style.padding = "8px 0"; // vertical padding only
//     message.style.borderRadius = "8px";
//     message.style.marginTop = "0.5rem";
//     message.style.display = "none";
//     message.style.textAlign = "center";
//     message.style.letterSpacing = "1.5px";
//     message.style.textShadow = "0 0 6px #00ffff, 0 0 12px #00ccff";
//     message.style.animation = "pulse 1s infinite alternate";

//     btn.insertAdjacentElement("afterend", message);
//   }

//   if (!confirmState) {
//     confirmState = true;
//     message.style.display = "block";

//     setTimeout(() => {
//       confirmState = false;
//       message.style.display = "none";
//     }, 5000);
//   } else {
//     // window.location.href = "../choosegame/choosegame.html";
//   }
// }
/******************************************************/
// button detections (remove this)
window.menuBtn = menuBtn;
window.fb_saveScore = fb_saveScore;
