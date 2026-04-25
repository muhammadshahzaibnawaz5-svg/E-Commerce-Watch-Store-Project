import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCjKGBnamzgta5qaiIiSs27LqVdqlV4FsY",
  authDomain: "bq-store-64664.firebaseapp.com",
  databaseURL: "https://bq-store-64664-default-rtdb.firebaseio.com",
  projectId: "bq-store-64664",
  storageBucket: "bq-store-64664.firebasestorage.app",
  messagingSenderId: "972737379547",
  appId: "1:972737379547:web:65f1de1474055e7b4560fe"
};

let app, auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

export { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };