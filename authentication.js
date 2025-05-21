// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBC7cl__uRdWHRha6vZcQY6ebA9G9h7bu0",
    authDomain: "tpf-pk-28c84.firebaseapp.com",
    projectId: "tpf-pk-28c84",
    storageBucket: "tpf-pk-28c84.firebasestorage.app",
    messagingSenderId: "708907313295",
    appId: "1:708907313295:web:70bccbfffa8c25f309e8fa",
    measurementId: "G-QSPGQT90PH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const firstNameInput = document.querySelector("#firstName");
const lastNameInput = document.querySelector("#lastName");
const emailInput = document.querySelector("#exampleInputEmail1");

const userSignIn = async () => {
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user;
        console.log(user);
        console.log(user.email);
        firstNameInput.value = user.displayName.split(" ")[0];
        lastNameInput.value = user.displayName.split(" ")[1];
        emailInput.value = user.email;
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    })
}

const userSignOut = async () => {
    signOut(auth).then(() => {
        alert("You have been signed out!")
        firstNameInput.value = "";
        lastNameInput.value = "";
        emailInput.value = "";
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    })
}
onAuthStateChanged(auth, (user) => {
    if (user) {
        alert("You are authenticated with Google");
        console.log(user);
    }
})

signInButton.addEventListener("click", userSignIn);
signOutButton.addEventListener("click", userSignOut);