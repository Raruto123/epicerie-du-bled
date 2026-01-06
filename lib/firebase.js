// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGA65l7YTEVmVP4J3OuQkmOIUNTOrnLwM",
  authDomain: "mon-epicerie-du-bled.firebaseapp.com",
  projectId: "mon-epicerie-du-bled",
  storageBucket: "mon-epicerie-du-bled.firebasestorage.app",
  messagingSenderId: "294869357872",
  appId: "1:294869357872:web:fecbb1484dfedcc7b5a4f5",
  measurementId: "G-XWLDSZ7L5S"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app)