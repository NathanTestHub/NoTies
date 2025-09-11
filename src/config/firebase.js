import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  addDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCCHmTStTV1gsM19DxP0VTagCVdp784rHI",
  authDomain: "noties-75152.firebaseapp.com",
  projectId: "noties-75152",
  storageBucket: "noties-75152.firebasestorage.app", // <-- fix here
  messagingSenderId: "330839645372",
  appId: "1:330839645372:web:862ccf1c8eb06d94d7c4b9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password) => {
  try {
    console.log("Starting signup with:", { username, email });

    // Create user with Firebase Auth
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log("Auth success:", user.uid);

    // Prepare user profile data with safe defaults
    const profileData = {
      id: user.uid,
      username: username ? username.toLowerCase() : "",
      email: email || "",
      name: "",
      avatar: "",
      bio: "Hey, There I am using chat app",
      lastSeen: Date.now(), // Include lastSeen to avoid issues
    };

    console.log("Writing user profile:", profileData);
    await setDoc(doc(db, "users", user.uid), profileData);
    console.log("User profile written to Firestore");

    // Create empty chat document
    console.log("Creating empty chat doc...");
    await setDoc(doc(db, "chats", user.uid), { chatData: [] });
    console.log("Chat doc created");
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

const login = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
  }
};

export { signup, login, logout, db, auth };
