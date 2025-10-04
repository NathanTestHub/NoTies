import React, { useContext, useEffect, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

// --- Anonymous name system ---
const anonPrefixes = [
  "BlueFox",
  "RedPanda",
  "SilverWolf",
  "GoldenHawk",
  "GreenTurtle",
  "BlackJaguar",
  "PurpleOwl",
  "OrangeLion",
];
const anonNameMap = {};
const getOrCreateAnonName = async (messageId) => {
  if (!messageId) return "Anonymous";
  if (anonNameMap[messageId]) return anonNameMap[messageId];

  const anonRef = doc(db, "anonNames", messageId);
  const anonSnap = await getDoc(anonRef);

  if (anonSnap.exists()) {
    anonNameMap[messageId] = anonSnap.data().anonName;
    return anonNameMap[messageId];
  }

  const prefix = anonPrefixes[Math.floor(Math.random() * anonPrefixes.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const newAnon = `${prefix}${suffix}`;

  await setDoc(anonRef, { anonName: newAnon });
  anonNameMap[messageId] = newAnon;
  return newAnon;
};

const LeftSidebar = () => {
  const navigate = useNavigate();
  const {
    userData,
    chatUser,
    setChatUser,
    messagesId,
    setMessagesId,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);

  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [chatList, setChatList] = useState([]);

  // 🔎 Search handler
  const inputHandler = async (e) => {
    try {
      const input = e.target.value;
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);

        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
          const foundUser = querySnap.docs[0].data();
          const existsInChats = chatList.some((chat) => chat.rId === foundUser.id);
          if (!existsInChats) setUser(foundUser);
          else setUser(null);
        } else {
          setUser(null);
        }
      } else {
        setShowSearch(false);
      }
    } catch (err) {
      console.error("❌ Error in inputHandler:", err);
    }
  };

  // ➕ Add new chat
  const addChat = async () => {
    if (!user) return;
    try {
      const messagesRef = collection(db, "messages");
      const chatsRef = collection(db, "chats");
      const newMessageRef = doc(messagesRef);

      await setDoc(newMessageRef, { createdAt: serverTimestamp(), messages: [] });

      const updates = [
        { id: user.id, rId: userData.id },
        { id: userData.id, rId: user.id },
      ];

      for (const u of updates) {
        const userChatRef = doc(chatsRef, u.id);
        await updateDoc(userChatRef, {
          chatsData: arrayUnion({
            messageId: newMessageRef.id,
            lastMessage: "",
            rId: u.rId,
            updatedAt: Date.now(),
            messageSeen: true,
          }),
        });
      }

      setUser(null);
      setShowSearch(false);
      setChatVisible(true);
    } catch (err) {
      console.error("❌ Error in addChat:", err);
      toast.error(err.message);
    }
  };

  // 🗑️ Delete chat
  const deleteChat = async (messageId) => {
    if (!messageId) return;
    try {
      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnap = await getDoc(userChatsRef);
      if (!userChatsSnap.exists()) return;

      const updatedChats = userChatsSnap
        .data()
        .chatsData.filter((c) => c.messageId !== messageId);

      await setDoc(userChatsRef, { chatsData: updatedChats }, { merge: true });
      if (messagesId === messageId) setChatVisible(false);
      toast.success("Chat deleted!");
    } catch (err) {
      console.error("❌ Failed to delete chat:", err);
      toast.error("Failed to delete chat.");
    }
  };

  // 📥 Select a chat
  const setChat = async (item) => {
    setMessagesId(item.messageId);

    let name = item.userData?.name || (await getOrCreateAnonName(item.messageId));

    setChatUser({
      ...item,
      userData: {
        id: item.rId,
        name,
        avatar: item.userData?.avatar || null,
      },
    });

    try {
      const userChatsRef = doc(db, "chats", userData.id);
      const snap = await getDoc(userChatsRef);
      if (!snap.exists()) return;

      const chatsData = snap.data().chatsData || [];
      const index = chatsData.findIndex((c) => c.messageId === item.messageId);
      if (index >= 0) {
        chatsData[index].messageSeen = true;
        await updateDoc(userChatsRef, { chatsData });
      }

      setChatVisible(true);
    } catch (err) {
      console.error("❌ Failed to set chat:", err);
      toast.error(err.message);
    }
  };

  // 🔗 Generate chat link
  const generateChatLink = async () => {
    try {
      const linkId = crypto.randomUUID();
      await setDoc(doc(db, "chatLinks", linkId), {
        userId: userData.id,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const link = `${window.location.origin}/chat-link/${linkId}`;
      navigator.clipboard.writeText(link);
      toast.success("Chat link copied to clipboard!");
    } catch (err) {
      console.error("❌ Failed to generate chat link:", err);
      toast.error("Failed to generate chat link.");
    }
  };

  // 🔄 Real-time chat listener
  useEffect(() => {
    if (!userData?.id) return;

    const userChatsRef = doc(db, "chats", userData.id);
    const unSub = onSnapshot(userChatsRef, async (snap) => {
      if (!snap.exists()) {
        setChatList([]);
        return;
      }

      const chatsData = snap.data().chatsData || [];

      // Map chats and fetch user names if needed
      const enrichedChats = await Promise.all(
        chatsData.map(async (chat) => {
          const userSnap = await getDoc(doc(db, "users", chat.rId));
          const userInfo = userSnap.exists() ? userSnap.data() : {};
          const name = userInfo.name || (await getOrCreateAnonName(chat.messageId));
          return { ...chat, userData: { ...userInfo, name } };
        })
      );

      setChatList(enrichedChats);
    });

    return () => unSub();
  }, [userData?.id]);

  return (
    <div className={`left-sidebar ${chatVisible ? "hidden" : ""}`}>
      <div className="left-sidebar-top">
        <div className="left-sidebar-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile-update")}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>

        <div className="left-sidebar-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="left-sidebar-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar || assets.defaultAvatar} alt={user.name || "User"} />
            <p>{user.name || "Unknown User"}</p>
          </div>
        ) : (
          chatList.map(
            (item, index) =>
              item.userData && (
                <div
                  key={index}
                  className={`friends ${
                    item.messageSeen || item.messageId === messagesId ? "" : "border"
                  }`}
                >
                  <div className="friend-info-wrapper" onClick={() => setChat(item)}>
                    <img
                      src={item.userData.avatar || assets.defaultAvatar}
                      alt={item.userData.name || "Unknown User"}
                    />
                    <div className="friend-info">
                      <p>{item.userData.name || "Unknown User"}</p>
                      <span>{item.lastMessage || ""}</span>
                    </div>
                  </div>
                  <button
                    className="delete-chat-btn"
                    onClick={() => deleteChat(item.messageId)}
                  >
                    🗑️
                  </button>
                </div>
              )
          )
        )}
      </div>

      <div className="left-sidebar-bottom">
        <button className="generate-link-btn" onClick={generateChatLink}>
          Generate Chat Link
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
