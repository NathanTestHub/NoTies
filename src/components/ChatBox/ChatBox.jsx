import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  doc,
  collection,
  addDoc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import upload from "../../lib/upload";
import { useLocation } from "react-router-dom";

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

const ChatBox = () => {
  const location = useLocation();
  const {
    userData,
    messagesId,
    chatUser,
    setChatUser,
    messages,
    setMessages,
    chatVisible,
    setMessagesId,
    setChatVisible,
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [anonName, setAnonName] = useState("Anonymous");

  // --- Setup chat from navigation state ---
  useEffect(() => {
    const setupChatFromNav = async () => {
      try {
        if (location.state?.userName && location.state?.userId) {
          const userSnap = await getDoc(doc(db, "users", location.state.userId));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setChatUser({
              rId: uData.id,
              messageId: location.state.messageId || null,
              userData: uData,
            });
            if (location.state.messageId) setMessagesId(location.state.messageId);
          }
        }
      } catch (err) {
        console.error("Failed to setup chat from nav:", err);
      }
    };
    setupChatFromNav();
  }, [location.state, setChatUser, setMessagesId]);

  // --- Load anonymous name for current chat ---
  useEffect(() => {
    if (!messagesId) return;
    const loadAnon = async () => {
      const anon = await getOrCreateAnonName(messagesId);
      setAnonName(anon);
    };
    loadAnon();
  }, [messagesId]);

  // --- Listen for messages ---
  useEffect(() => {
    if (!messagesId) return;

    const q = query(
      collection(db, "messages", messagesId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unSub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unSub();
  }, [messagesId, setMessages]);

  // --- Send text message ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!userData?.id || !messagesId || !chatUser?.rId) {
      toast.error("Missing chat or user info.");
      return;
    }

    try {
      const msgCol = collection(db, "messages", messagesId, "messages");

      await addDoc(msgCol, {
        sId: userData.id,
        text: input.trim(),
        createdAt: serverTimestamp(),
      });

      // Update lastMessage for both users
      const userIDs = [chatUser.rId, userData.id];
      for (const id of userIDs) {
        const userChatsRef = doc(db, "chats", id);
        const userChatsSnap = await getDoc(userChatsRef);
        if (userChatsSnap.exists()) {
          const userChatData = userChatsSnap.data();
          const chatIndex = userChatData.chatsData?.findIndex(
            (c) => c.messageId === messagesId
          );
          if (chatIndex >= 0) {
            userChatData.chatsData[chatIndex].lastMessage = input.trim().slice(0, 30);
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await setDoc(userChatsRef, { chatsData: userChatData.chatsData }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(err.message);
    }

    setInput("");
  };

  // --- Send image ---
  const sendImage = async (e) => {
    if (!e.target.files[0]) return;
    if (!userData?.id || !messagesId || !chatUser?.rId) {
      toast.error("Missing chat or user info.");
      return;
    }

    try {
      const fileUrl = await upload(e.target.files[0]);
      if (!fileUrl) throw new Error("Upload failed");

      const msgCol = collection(db, "messages", messagesId, "messages");

      await addDoc(msgCol, {
        sId: userData.id,
        image: fileUrl,
        createdAt: serverTimestamp(),
      });

      // Update lastMessage as 'Image'
      const userIDs = [chatUser.rId, userData.id];
      for (const id of userIDs) {
        const userChatsRef = doc(db, "chats", id);
        const userChatsSnap = await getDoc(userChatsRef);
        if (userChatsSnap.exists()) {
          const userChatData = userChatsSnap.data();
          const chatIndex = userChatData.chatsData?.findIndex(
            (c) => c.messageId === messagesId
          );
          if (chatIndex >= 0) {
            userChatData.chatsData[chatIndex].lastMessage = "Image";
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await setDoc(userChatsRef, { chatsData: userChatData.chatsData }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.error("Failed to send image:", err);
      toast.error(err.message);
    }
  };

  // --- Convert timestamp ---
  const convertTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, "0");
    return hour >= 12
      ? `${hour > 12 ? hour - 12 : 12}:${minute} PM`
      : `${hour}:${minute} AM`;
  };

  if (!chatUser) {
    return (
      <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
        <img src={assets.logo_icon} alt="" />
        <p>Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      {/* Chat Header */}
      <div className="chat-user">
        <img
          src={chatUser.userData.avatar || assets.defaultAvatar}
          alt={chatUser.userData.name || "Anonymous"}
        />
        <p>
          {anonName || chatUser.userData.name || "Anonymous"}{" "}
          {Date.now() - (chatUser.userData.lastSeen || 0) <= 70000 && (
            <img className="dot" src={assets.green_dot} alt="" />
          )}
        </p>
        <img src={assets.help_icon} className="help" alt="" />
        <img
          onClick={() => setChatVisible(false)}
          src={assets.arrow_icon}
          className="arrow"
          alt=""
        />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.sId === userData.id ? "sent-message" : "received-message"}
          >
            {message.image ? (
              <img className="message-image" src={message.image} alt="" />
            ) : (
              <p className="message">{message.text}</p>
            )}
            <div>
              <img
                src={
                  message.sId === userData.id
                    ? userData.avatar || assets.defaultAvatar
                    : chatUser.userData.avatar || assets.defaultAvatar
                }
                alt={chatUser.userData.name || "Anonymous"}
              />
              <p>{convertTimestamp(message.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <input
          onChange={sendImage}
          type="file"
          id="image"
          accept="image/png, image/jpeg"
          hidden
        />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  );
};

export default ChatBox;
