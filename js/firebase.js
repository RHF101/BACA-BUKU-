// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCs7Vnysf25BwhN2-fPTODd48xwzbPkbzI",
    authDomain: "rhf-shop-mafia-8d2e5.firebaseapp.com",
    databaseURL: "https://rhf-shop-mafia-8d2e5-default-rtdb.firebaseio.com",
    projectId: "rhf-shop-mafia-8d2e5",
    storageBucket: "rhf-shop-mafia-8d2e5.firebasestorage.app",
    messagingSenderId: "158711184948",
    appId: "1:158711184948:web:9223f07fa6658601189461",
    measurementId: "G-R6KN1EYMB3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
