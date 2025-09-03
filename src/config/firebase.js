import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getFirestore, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyCCHmTStTV1gsM19DxP0VTagCVdp784rHI",
  authDomain: "noties-75152.firebaseapp.com",
  projectId: "noties-75152",
  storageBucket: "noties-75152.firebasestorage.app",
  messagingSenderId: "330839645372",
  appId: "1:330839645372:web:862ccf1c8eb06d94d7c4b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)

const signup = async ( username, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password)
        const user = res.user;
        await setDoc(doc(db, "users", user.uid),{
            id:user.uid,
            username:username.toLowerCase,
            email,
            name:"",
            avatar:"",
            bio:"Hey, There i am using chat app",
            lastSeen: Date.now()
        })
        await setDoc(doc(db, "chats", user.uid),{
            chatData: []
        })
    } catch (error) {
        console.error(error)
        toast.error(error.code)
    }
}

export {signup}