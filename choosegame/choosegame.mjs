console.log(
  '%c choosegame.mjs ',
  'color: #00FF00; background-color: #001100; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
);



/**************************************************************/
// Essential Firebase Imports
import { FB_AUTH } from '../firebase/fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
var username = localStorage.getItem("username");
//**************************************************************/
//****************************************************************/
//Export functions to /main.mjs
export {
  initChooseGame,
  gnomeButton,
  GTNpageBtn,
};
/******************************************************/

// setupChooseGame
// Called by choosegame.html on page load
// runs page load functions
// Input: 'n/a'
// Return: n/a
/******************************************************/
export function setupChooseGame() {
  console.log("setupChooseGame called");
  document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(FB_AUTH, (user) => {
      if (!user) {
        console.warn("No user logged in. Redirecting...");
        if (!document.URL.includes("index.html")) {
        window.location.href = "index.html";
        }
        return;
      }

      initChooseGame(user);
    });
  });
}


/******************************************************/
// initchoosegame
// Called by choosegame.html on page load
// Logs user info and page load status to console.
// Input: 'n/a'
// Return: n/a
/******************************************************/
 function initChooseGame(user) {
    console.log("choosegame.mjs loaded", user);
    const pfpImg = document.getElementById("pfp");
    if (pfpImg && user && user.photoURL) {
        pfpImg.src = user.photoURL;
    }
}


/******************************************************/
// gnomeButton
// Called by choosegame.html on page load
// Starts Gnome game
// Input: 'n/a'
// Return: n/a
/******************************************************/
function gnomeButton() {
  const auth = FB_AUTH;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Transporting to the Gnome game");
      window.location.href = "../gnome/game1.html";
    } else if (!user) {
      alert("No user found, taking you back to login page");
      window.location.href = "index.html";
    }else {
      console.error("Unexpected error state in gnomeButton");
    }
  })
}
/******************************************************/
// game2button (coingame)
// Called by choosegame.html on page load
// Starts Gnome game
// Input: 'n/a'
// Return: n/a
/******************************************************/
function GTNpageBtn() {
  const auth = FB_AUTH;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Transporting to the GTN game");
      window.location.href = "../GTN/GTNpage.html";
    } else if (!user) {
      alert("No user found, taking you back to login page");
      window.location.href = "../registration/index.html";
    }else {
      console.error("Unexpected error state in GTNpageBtn");
    }
  })
}