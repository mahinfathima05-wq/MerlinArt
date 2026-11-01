
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6V5CGPRzLMBfJdo-ruZna7j8GnQamZO8",
  authDomain: "merlinartntexture-enterprises.firebaseapp.com",
  projectId: "merlinartntexture-enterprises",
  storageBucket: "merlinartntexture-enterprises.firebasestorage.app",
  messagingSenderId: "209062530561",
  appId: "1:209062530561:web:11e122a7543757b2c67a00",
  measurementId: "G-BX01654NJ6"
};

// Connect your website to Firebase
const app = initializeApp(firebaseConfig);

// Connect to Cloud Firestore
const db = getFirestore(app);

export { app, db };
