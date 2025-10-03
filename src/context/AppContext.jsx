import { doc, getDoc, updateDoc,onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);

  // --- Load user profile ---
  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
<<<<<<< HEAD
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        console.warn("User document does not exist in Firestore");
        return;
=======
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      setUserData(userData);
      if (!userData.avatar || !userData.name) {
      navigate("/profile-update");
>>>>>>> 6c4eaa04d0d84f3f16332aaf2c422e5cf5725c44
      }

      const data = snap.data();
      setUserData({ id: uid, ...data });

      if (data.avatar && data.name) navigate("/chat");
      else navigate("/profile-update");

      await updateDoc(userRef, { lastSeen: Date.now() });

      // Update lastSeen every 60 seconds
      setInterval(async () => {
        if (auth.currentUser) {
          await updateDoc(userRef, { lastSeen: Date.now() });
        }
      }, 60000);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  // --- Listen for sidebar chat list ---
  useEffect(() => {
    if (!userData?.id) return;

    const chatRef = doc(db, "chats", userData.id);
    const unSub = onSnapshot(chatRef, async (res) => {
      const data = res.data();
      const chatItems = data?.chatsData || [];
      const tempData = [];

      for (const item of chatItems) {
        if (!item?.rId) continue;
        const userRef = doc(db, "users", item.rId);
        const userSnap = await getDoc(userRef);
        const otherUserData = userSnap.exists() ? userSnap.data() : null;

        tempData.push({ ...item, userData: otherUserData });
      }

      setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
    });

    return () => unSub();
  }, [userData]);

  // --- Listen for messages of active chat ---
  useEffect(() => {
    if (!messagesId) {
      setChatData(null);
      setMessages([]);
      return;
    }

    const msgRef = collection(db, "messages", messagesId, "messages");
    const q = query(msgRef, orderBy("createdAt", "asc"));

    const unSub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setChatData((prev) => ({ ...prev, messages: msgs }));
    });

    return () => unSub();
  }, [messagesId]);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    loadUserData,
    messages,
    setMessages,
    messagesId,
    setMessagesId,
    chatUser,
    setChatUser,
    chatVisible,
    setChatVisible,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
