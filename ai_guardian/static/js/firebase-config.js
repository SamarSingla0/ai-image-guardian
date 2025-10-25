// static/js/firebase-config.js

// Firebase config - YOUR KEYS ARE CORRECTLY PLACED HERE
const firebaseConfig = {
  apiKey: "AIzaSyAxyngO8MGMk2A7N16t58CGDgCEpoG7aFI", // IMPORTANT: Regenerate this key later
  authDomain: "ai-guardian-d5b32.firebaseapp.com",
  projectId: "ai-guardian-d5b32",
  storageBucket: "ai-guardian-d5b32.appspot.com",
  messagingSenderId: "192334003630",
  appId: "1:192334003630:web:a0cf9c87c8926f3e279c3f",
  measurementId: "G-CXB87VWDJC"
};

// --- DO NOT CHANGE ANYTHING BELOW THIS LINE ---

// Initialize Firebase using the global 'firebase' object from the 'compat' script
try {
  if (firebase) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully using the CORRECT compat syntax.");
  } else {
    console.error("CRITICAL: Firebase library not loaded. Check script tags in base.html.");
  }
} catch (e) {
  console.error("CRITICAL: Error initializing Firebase:", e);
}

// Get the auth service from the global 'firebase' object
const auth = firebase.auth();