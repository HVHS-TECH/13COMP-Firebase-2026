
/**********************************************************/ 
//Leaderboards page
//Functions for leaderboard buttons and displaying scores
//Leaderboards for GTN and Gnome Dodger

console.log(
  '%c leaderboards.mjs ',
  'color: #00FFF7; background-color: #1B263B; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
);
/**************************************************************/
// Essential Firebase Imports
import {FB_GAMEAPP, FB_GAMEDB, FB_AUTH } from '../firebase/fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
let username = localStorage.getItem("username");
//****************************************************************/
/******************************************************/
//EXPORT FUNCTIONS
export {
    ldrBoard1,
    ldrBoard2,

};

/**************************************************************/
// Sets up the leaderboard page when the script loads.
//
// Waits for the DOM to finish loading, then checks the Firebase
// authentication state of the current user. If no user is logged in,
// the function redirects the user back to the home page. If a valid
// user is detected, the leaderboard page is initialized.
// Input: n/a
 // Calls initLdrBoardPage() {passes user}, once authentication has been verified.
/**************************************************************/
 export function setupLdrBoardPage() {
  console.log("setupLdrBoardPage called");
  document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(FB_AUTH, (user) => {
      if (!user) {
        console.warn("No user logged in. Redirecting...");
        window.location.href = "../registration/index.html";
        return;
      }

      initLdrBoardPage(user);
    });
  });
}

/**********************************************
  Function: initLdrBoardPage
  Initializes the leaderboard page for a logged-in user.
   Displays the user's profile picture in the element with id "pfp"
    if the user object contains a photoURL.

**********************************************/
 function initLdrBoardPage(user) { 
    console.log("leaderboards.mjs loaded", user);

    const pfpImg = document.getElementById("pfp");
    if (pfpImg && user && user.photoURL) {
        pfpImg.src = user.photoURL;
    }
}
/******************************************************/
// ldrBoard1 Gnome scores
// Called by choosegame.html on page load
// Goes to Gnome Top Scores leaderboard 
// Input: 'n/a'
// Return: n/a
/******************************************************/
function ldrBoard1() {
    console.log("Loading Gnome Dodger Leaderboard");
  const medals = ["🥇", "🥈", "🥉"];
  const auth = FB_AUTH;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const ldrMenu = document.getElementById("ldrMenu");
      const scoreList1 = document.getElementById("scoreList1");
        const currentUID = user.uid;

      if (ldrMenu.classList.contains("hidden")) {
        ldrMenu.classList.remove("hidden");

        const scoresRef = ref(FB_GAMEDB, 'userInfo');
        const topQuery = query(scoresRef, orderByChild('gnomescore'), limitToLast(5));

        onValue(topQuery, (snapshot) => {
          if (!snapshot.exists()) {
            scoreList1.textContent = "No scores available.";
            return;
          }
          const scores = [];
          const data = snapshot.val();
          console.log("All Gnome scores data:", data);
          snapshot.forEach(child => {
            scores.push(child.val());
          });
          scores.reverse(); //bc firebase scores are reversed
          scoreList1.innerHTML = "";
          scores.forEach((data, index) => {
            const li = document.createElement("li");
            const medal = medals[index] || "";
            li.textContent = `${medal} ${data.name}: ${data.gnomescore}`;
            if (data.uid === currentUID) {
              li.style.backgroundColor = "var(--antiflash-white)";
              li.style.fontWeight = "bold";
             }
             if (index === 0 && data.uid === currentUID ) {
              li.style.color = "var(--poison-purple)";
            }
            scoreList1.appendChild(li);
          });
        }, { onlyOnce: true });

      } else {
        ldrMenu.classList.add("hidden");
      }

    } else {
      alert("You must be logged in to view the leaderboard.");
    }
  });
}

/******************************************************/
// ldrBoard2 GTN Lowest Guesses
// Called by choosegame.html on page load
// Goes to GTN Lowest Guesses leaderboard 
// Input: 'n/a'
// Return: n/a
/******************************************************/
function ldrBoard2() {
  const medals = ["🥇", "🥈", "🥉"];
  const auth = FB_AUTH;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const ldrMenu2 = document.getElementById("ldrMenu2");
      const scoreList2 = document.getElementById("scoreList2");
      const currentUID = user.uid;

      if (ldrMenu2.classList.contains("hidden")) {
        ldrMenu2.classList.remove("hidden");

        const scoresRef = ref(FB_GAMEDB, 'userInfo/');
        const topQuery = query(scoresRef, orderByChild('GTNFewestGuesses'), limitToLast(10));

        onValue(topQuery, (snapshot) => {
          if (!snapshot.exists()) {
            scoreList2.textContent = "No scores available.";
            return;
          }
          const scores = [];
          const data = snapshot.val();
          snapshot.forEach(child => {
             console.log("All GTN Lowest Guesses scores data:", data);
             console.log("Child data:", child.val());
            scores.push(child.val());
          });

          scores.reverse(); 
          console.log("Reversed GTN Lowest Guesses scores:", scores);
          scoreList2.innerHTML = "";

          scores.forEach((data, index) => {
            console.log(`Processing score #${index + 1}:`, data);
            const li = document.createElement("li");
            const medal = medals[index] || "";
            li.textContent = `${medal} ${data.name}: ${data.GTNFewestGuesses}`;
            if (data.uid === currentUID) {
              li.style.backgroundColor = "var(--antiflash-white)";
              li.style.fontWeight = "bold";
             } 

            if (index === 0 && data.uid == currentUID) {
              li.style.color = "var(--poison-purple)";
            }
            scoreList2.appendChild(li);
          });
        }, { onlyOnce: true });
      } else {
        ldrMenu2.classList.add("hidden");
      }
    } else {
      alert("You must be logged in to view the leaderboard.");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const btn1 = document.getElementById("ldrBtn");
  const btn2 = document.getElementById("ldrBtn2");

  console.log('btn1:', btn1);  
  console.log('btn2:', btn2);  

  if (btn1) btn1.addEventListener("click", ldrBoard1);
  if (btn2) btn2.addEventListener("click", ldrBoard2);
});

/********************************************************************
 * TODO
 * - Win Leaderboard
 * - remove animations GTN leaderboard 
 **********************************************************************/