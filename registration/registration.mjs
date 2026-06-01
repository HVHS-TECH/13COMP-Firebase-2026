console.log(
  '%c registration.mjs ',
  'color: #4FC3F7; background-color: #0B1E3F; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
);
/**************************************************************/
// Essential Firebase Imports
import {FB_GAMEAPP, FB_GAMEDB, FB_AUTH } from '../firebase/fb_core.mjs';
import { ref, query, orderByChild, limitToLast, onValue, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { fb_checkUser } from '../firebase/fb_core.mjs';
//****************************************************************/
//Export functions to /main.mjs
export {
  writeUserInfo,
  adminPage,
  // loginHandler,
};
/******************************************************/
// writeUserInfo
// Called by index.html on page load
// Write user data to firebase
// Input: user input through html boxes
// Return: n/a
/******************************************************/
function writeUserInfo() {
  console.log("running writefunction");

  const user = FB_AUTH.currentUser;

  if (!user) {
    alert("PLEASE LOG IN WITH GOOGLE");
    return;
  }

  const RAWNAME = document.getElementById("name").value.trim();
  const AGE = document.getElementById("age").value.trim();
  const PHONENUMBER = document.getElementById("phone").value.trim();
  const STREET = document.getElementById("street").value.trim();
  const SUBURB = document.getElementById("suburb").value.trim();
  const CITY = document.getElementById("city").value.trim();
  const COUNTRY = document.getElementById("country").value.trim();
  const SCHOOL = document.getElementById("school").value.trim();

  if (!validateInput(RAWNAME, AGE, PHONENUMBER)) {
    return;
  }

  const uid = user.uid;
  const RECORDPATH = "userInfo/" + uid;
  const DATAREF = ref(FB_GAMEDB, RECORDPATH);
  let NAME = RAWNAME.toLowerCase().replace(/\s+/g, "");
  get(DATAREF)
    .then((snapshot) => {
      if (snapshot.exists()) {
        update(DATAREF, {
          uid: uid,
          name: NAME,
          age: AGE,
          cell: PHONENUMBER,
          street: STREET,
          suburb: SUBURB,
          city: CITY,
          country: COUNTRY,
          "location of study": SCHOOL
        });
      } else {
        set(DATAREF, {
          uid: uid,
          name: NAME,
          age: AGE,
          gnomescore: 0,
          coinscore: 0,
          cell: PHONENUMBER,
          street: STREET,
          suburb: SUBURB,
          city: CITY,
          country: COUNTRY,
          "location of study": SCHOOL
        });
      }

      const INFOPATH = "userInfo/" + uid + "/detailsFilled";
      const INFOREF = ref(FB_GAMEDB, INFOPATH);

      return get(INFOREF);
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log("Details already filled out:", snapshot.val());
      } else {
        const INFOPATH = "userInfo/" + uid + "/detailsFilled";
        const INFOREF = ref(FB_GAMEDB, INFOPATH);
        set(INFOREF, true);
      }

      localStorage.setItem("username", NAME);
      document.getElementById("statusMessage").innerText =
        "Data written to " + RECORDPATH;

      window.location.href = "../choosegame/choosegame.html";
    })
    .catch((error) => {
      console.error("Error writing data:", error);
      document.getElementById("statusMessage").innerText =
        "Failed to write to " + RECORDPATH;
    });
}


/******************************************************/
// validateInput
// Called by writeUserInfo()
// Validates user input from form, and shows alerts if invalid.
// Input: user input through html boxes
// Return: n/a, but shows alerts if invalid input is detected, and stops function execution.
/******************************************************/

function validateInput(RAWNAME, AGE, PHONENUMBER) {
    let NAME = RAWNAME.toLowerCase().replace(/\s+/g, "");

  if (!NAME || !AGE || !PHONENUMBER) {
    alert("Please fill out all fields.");
    return false;
  } else if (!isNaN(NAME) || NAME.length < 2 || NAME.length >=15) {
    alert("Please enter a real name within 2-15 characters,");
    return false;
  } else if (isNaN(AGE) || AGE < 1 || AGE > 120) {
    alert("Age must be a REAL number between 1 and 120");
    return false;
  } else if (isNaN(PHONENUMBER) || PHONENUMBER.length < 7) {
    alert("Please enter a valid phone number longer than 6 digits");
    return false; 
  }
  return true; // input is valid
}

/******************************************************/
// adminPage
// Runs when click button to go to admin page
// Lets authenticated users through to admin page
// Input: user input through click
// Return: n/a
/******************************************************/
function adminPage() {
  const user = FB_AUTH.currentUser;

  if (!user) {
    alert("Please log in first.");
    return;
  }

  const uid = user.uid;
  const recordPath = "admins/" + uid;
  const DATAREF = ref(FB_GAMEDB, recordPath);

  get(DATAREF)
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log("Taking you to the Admin Page");
        window.location.href = "../admin/admin.html";
      } else {
        alert("You are not authorised to view this page");

        const button = document.getElementById("adminButton");
        if (button) button.style.backgroundColor = "red";
      }
    })
    .catch((error) => {
      console.error("Error checking admin access:", error);
    });
}
/******************************************************/
//loginHandler  
//Checks if user is new or returning, and writes data to DB if new. 
// Called by fb_core.mjs on login.
//Exported to main.mjs
//input: currentUser from firebase auth
//output: n/a, but writes user uid to firebase DB
/******************************************************/
export function loginHandler(currentUser) {
   if (!currentUser) {
    console.error("fb_checkInfo called with undefined user");
    return;
  }
const RECORDPATH = "userInfo/" + currentUser.uid;
  const data = {
    uid: currentUser.uid,
  };

  const DATAREF = ref(FB_GAMEDB, RECORDPATH);

  update(DATAREF, data)
    .then(() => {
      console.log("UID saved @", RECORDPATH);
      document.getElementById("statusMessage").innerText = "Data written to " + RECORDPATH;
      console.log("calling fb_checkInfo()");
      fb_checkInfo(); // Check if user has filled out details, and if so, redirect to choosegame.html
    })
    .catch((error) => {
      console.error("Error writing data:", error);
      document.getElementById("statusMessage").innerText = "Failed to write to " + RECORDPATH;
    });
}

/****************************************************/
//END
/****************************************************/
//Registration TO DO List:
// - Add error handling for writeUserInfo (e.g. empty fields, non-numeric age, etc.) 
// - Add comments to functions 
// - Add function to be called at bottom of loginhandler to check if user has existing data, 
// and if so, redirect to choosegame.html without overwriting data. 
