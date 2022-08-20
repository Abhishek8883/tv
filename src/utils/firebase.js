// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtYDjzGPDYGH9SsROS33B5L9U9yvAmYqg",
  authDomain: "the-tv-talk-36f8b.firebaseapp.com",
  projectId: "the-tv-talk-36f8b",
  storageBucket: "the-tv-talk-36f8b.appspot.com",
  messagingSenderId: "747272700647",
  appId: "1:747272700647:web:829d05215cb8ea207dd842",
  measurementId: "G-RW2S83LTY4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);