
console.log(
    '%c fb_core.mjs ',
    'color: #00FFF7; background-color: #1B263B; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
);
//**************************************************************/
// Importing required functions
/**************************************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

import {getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {ref, get} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

import { sleep } from "./main.mjs";
import { loginHandler } from "../registration/registration.mjs";

//**************************************************************/
// Firebase Configuration
/**************************************************************/
const COL_C = "#6FE0E8"; // electric-blue
const COL_B = "#2A2A5A"; // space-cadet
var currentUser = null;
var userId = null;
const firebaseConfig = {
    apiKey: "AIzaSyA8viBZ-gKBknRREyTiDinnugjj6Rjrog0",
    authDomain: "comp-2025-dylan-f.firebaseapp.com",
    databaseURL: "https://comp-2025-dylan-f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "comp-2025-dylan-f",
    storageBucket: "comp-2025-dylan-f.firebasestorage.app",
    messagingSenderId: "133223974410",
    appId: "1:133223974410:web:d1cde3ac980749bde601f3",
    measurementId: "G-WHVZ7GW4CF"
};

// Initialize Firebase app globally

const FB_GAMEAPP = initializeApp(firebaseConfig);
const FB_GAMEDB = getDatabase(FB_GAMEAPP);
const FB_AUTH = getAuth(FB_GAMEAPP);
const analytics = getAnalytics(FB_GAMEAPP);
export { FB_GAMEAPP, FB_GAMEDB, FB_AUTH, analytics };



//****************************************************************/
//Export functions to /main.mjs
export {
    fb_initialise,
    fb_userLogin,
    fb_checkUser,
    fb_startup,
    fb_getPfp,
};
/***********************************************************/
/*****************************************************/
//Function Handler
//fb_startup
// Runs fb_initialise, fb_checkUser, and fb_userLogin
// Input: n/a
// Return: n/a
/***********************************************************/
function fb_startup() {
    fb_initialise();
    fb_checkUser();
    fb_userLogin();
}
/*******************************************************/
// fb_initialise
// initializes the firebase app and database connection
// Input: n/a
// Return: n/a
/***********************************************************/

function fb_initialise() {
    console.log('%c fb_initialise(): ', 'color: ' + COL_C + '; background-color: ' + COL_B + ';');
    console.info(FB_GAMEDB);
}

/******************************************************/
// fb_userlogin
// allows user to authenticate and login
// Login User
// Input: user chooses to login through google popup
// Return: n/a
/******************************************************/
async function fb_userLogin() {
    const AUTH = FB_AUTH;
    const user = AUTH.currentUser;
    if (currentUser) {
        try{
            const ISVALID = await fb_checkInfo(); //Runs fb_checkInfo and returns info if valid or if not.
        if (ISVALID) {
        console.log("User already logged in:", user.email);
        document.getElementById('userinfotext').innerText =
          "Already logged in as: " + (user.displayName || "Unknown User");
        window.location.href = "./choosegame/choosegame.html";
        console.log("Redirecting to choosegame.html...");
      } else {
        console.log("User data invalid or incomplete. Cannot redirect.");
      }
    } catch (err) {
      console.error("Error checking user info:", err);
    }
        

    } else {

        const PROVIDER = new GoogleAuthProvider();
        PROVIDER.setCustomParameters({
            prompt: 'select_account'
        });

        signInWithPopup(AUTH, PROVIDER)
            .then((result) => {
                currentUser = result.user;
                console.log("User signed in:", currentUser.displayName, currentUser.email, currentUser.uid, currentUser.photoURL);
            
                document.getElementById('userinfotext').innerText =
                currentUser.displayName || "Unknown User";
                console.info("Calling loginHandler with currentUser:", currentUser.uid);
                loginHandler(currentUser);

    })
            .catch ((error) => {
        console.error("Login error:", error);
        document.getElementById('userinfotext').innerText = "Login failed";
    });
}
}
/**********************************************************/
// fb_checkUser
// Checks if user is currently logged in and redirects to login page if not
// Called on startup by fb_startup
// Input: n/a
// Return: n/a
/*******************************************************/

function fb_checkUser() {
    console.log("Checking User");
    const auth = FB_AUTH;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is still logged in:", user.email);
            if (window.location.href.includes("index.html")) {  
                console.log("Redirecting to choosegame.html...");
                window.location.href = "./choosegame/choosegame.html";
            }
        } else {
            console.log("No user logged in, redirecting to login..."); // Redirect to login page
            if (!document.URL.includes("index.html")) {
               // window.location.href = "index.html";
            }
        }
    });
}


/**********************************************************/
// fb_checkInfo
// Checks if user has filled out required info in DB, and if so, redirects to choosegame.html
// Called after login by loginHandler in registration.mjs
// Called by loginHandler in registration.mjs
// Input: n/a
// Return: n/a
/*******************************************************/
export async function fb_checkInfo() {
  const currentUser = FB_AUTH.currentUser;

  if (!currentUser) {
    console.warn("No user logged in");
    return false; // return false if no user
  }
  const READPATH = "/userInfo/" + currentUser.uid + "/detailsFilled";
  const DATAREF = ref(FB_GAMEDB, READPATH);
  try {
    const snapshot = await get(DATAREF);
    const userData = snapshot.val();

    if (snapshot.exists() && userData === true) {
      console.log("Data successfully read:", userData);
      console.log(
        "%cRequired info filled out. Redirecting to choosegame.html...",
        "color: white; background: green; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
      );
      window.location.href = "./choosegame/choosegame.html";
      await sleep(1000); 

      return true; // valid
    } else {
      console.warn("No data found");
      const warningMsg = document.getElementById("warningtext");
      if (warningMsg) warningMsg.innerText = "Please fill out your details before proceeding.";
      console.log(
        "%cNo info filled out.",
        "color: white; background: orange; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
      );
      return false; // invalid
    }
  } catch (error) {
    console.error("Error reading data:", error);
    return false; // error = invalid
  }
}
/******************************************************/
// fb_getPfp
// retrieves the user's profile picture from their Google account and displays it on the page
// Called by initChooseGame on choosegame.html page load
// Input: n/a
// Return: n/a, but updates the src of the img element with id "pfp" to the user's profile picture URL
/******************************************************/
function fb_getPfp() {
    const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    
    if (user) {
        console.log("Retrieving profile picture for user:", user.email);
        const pfp = document.getElementById("pfp");
        pfp.src = user.photoURL;
    }else if (!user) {
        console.warn("No user found, cannot retrieve profile picture");
    }
 
    
});
}
/******************************************************/
//UNUSED CODE 
/******************************************************/