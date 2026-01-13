// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import * as firebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log("FIREBASE ENV:", {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
})

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Persist auth session on device (React Native / Expo)
let auth;
const reactNativePersistence = firebaseAuth.getReactNativePersistence;
try {
  auth = firebaseAuth.initializeAuth(app, {
    persistence : reactNativePersistence(AsyncStorage)
  })
} catch (e) {
  //Hot reload/fast refresh can initialize twice
  firebaseAuth.getAuth(app)
}



export const db = getFirestore(app);
export const storage = getStorage(app);
export {auth};