/**************************************************************/
// main.mjs
// Main entry for index.html
// Written by Dylan Figliola, Term 2 2025
/**************************************************************/

console.log(
  '%c main.mjs ',
  'color: #FF6F61; background-color: #0D0D0D; font-weight: bold; font-size: 16px; padding: 6px 12px; border-radius: 2px; border: 2px solid #ff0000;'
);
/**************************************************************/
/****************************************************************/
//Functions from registration.mjs
//Functions for user registration, and admin verification
/**************************************************************/
import { writeUserInfo, adminPage, loginHandler } from '../registration/registration.mjs';

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submitBtn");
  if (btn) {
    btn.addEventListener("click", writeUserInfo);
  } else {
    console.warn("submitBtn not found in DOM.");
  }
});

window.adminPage = adminPage;
window.loginHandler = loginHandler;
/****************************************************************/
//Functions from choosegame.mjs
//Functions for game selection buttons on choosegame.html
/**************************************************************/
import { initChooseGame, gnomeButton, GTNpageBtn } from '../choosegame/choosegame.mjs';
window.initChooseGame = initChooseGame;
window.gnomeButton = gnomeButton;
window.GTNpageBtn = GTNpageBtn;

/****************************************************************/
//Functions from admin.mjs
//Functions for admin page buttons and database management
/**************************************************************/
import { fb_WriteRec, fb_ReadAll, fb_deleteAll, fb_logoutUser } from '../admin/admin.mjs';
  //write button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("writeBtn");
  if (btn) {
    btn.addEventListener("click", fb_WriteRec);
  }
});
//read all button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("readBtn");
  if (btn) {
    btn.addEventListener("click", fb_ReadAll);
  }
});
//delete all button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("deleteBtn");
  if (btn) {
    btn.addEventListener("click", fb_deleteAll);
  }
});
//logout button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (btn) {
    btn.addEventListener("click", fb_logoutUser);
  }
});

/****************************************************************/
//Functions from leaderboards.mjs
//Functions for leaderboard buttons and displaying scores
//Leaderboards for GTN and Gnome Dodger
/**************************************************************/
import { ldrBoard1, ldrBoard2 } from '../leaderboards/leaderboards.mjs';
window.ldrBoard1 = ldrBoard1;
window.ldrBoard2 = ldrBoard2;

/****************************************************************/
//Functions from fb_core.mjs
//Common functions for firebase database connection, user login and authentication
/**************************************************************/
import { fb_initialise, fb_userLogin, fb_checkUser,  fb_startup,  fb_checkInfo, fb_getPfp, } from './fb_core.mjs';
window.fb_initialise = fb_initialise;
window.fb_checkUser = fb_checkUser;
window.fb_startup = fb_startup;
window.fb_checkInfo = fb_checkInfo;
window.fb_getPfp = fb_getPfp;
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) {
    btn.addEventListener("click", fb_userLogin);
  }
});

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
window.sleep = sleep; // Export sleep function to global scope for use in other modules   

/****************************************************************/
//Functions from GTNpage.mjs
//Listeners for creating a lobby and navigating back to menu
/**************************************************************/
import { lobbyCreate,  } from '../pleasework/GTNpage.mjs'; ///menuBtn
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("createBtn");
  if (btn) {
    btn.addEventListener("click", lobbyCreate);
  }
});
// window.menuBtn = menuBtn;

/****************************************************/
/****************************************************************/
//Functions from GTNgame.mjs
//Listeners for creating a lobby and navigating back to menu
/**************************************************************/
// import { leaveActiveGame} from './GTNgame.mjs';
// document.addEventListener("DOMContentLoaded", () => {
//   const btn = document.getElementById("createBtn");
//   if (btn) {
//     btn.addEventListener("click", lobbyCreate);
//   }
// });
// window.menuBtn = menuBtn;


/****************************************************/
//TO DO LIST
// - add a username restriction field, where if a user is creating an account, they cannot enter a username that already exists in the database.
//  This is to prevent overwriting other users data, and also to make sure users can only access their own data. 
// Make sure all functions and modules have comments and are well documented.
//Functions should only do one action.
//File management
//Function names convention
// NextJS Google Address Autocomplete API

/****************************************************/