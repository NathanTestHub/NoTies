import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import upload from "../../lib/upload";
import { useLocation } from "react-router-dom";

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
    setMessagesId
  } = useContext(AppContext);

  const [input, setInput] = useState("");

  // ✅ If coming from a link, set chatUser and messagesId automatically
  useEffect(() => {
    const setupChatFromNav = async () => {
      if (location.state?.userName || location.state?.userId) {
        const qSnap = await getDoc(doc(db, "users", location.state.userId));
        if (qSnap.exists()) {
          const uData = qSnap.data();
          setChatUser({
            rId: uData.id,
            messageId: location.state.messageId || null,
            userData: uData,
          });
          if (location.state.messageId) setMessagesId(location.state.messageId);
        }
      }
    };
    setupChatFromNav();
  }, [location.state, setChatUser, setMessagesId]);

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date(),
          }),
        });

        const userIDs = [chatUser.rId, userData.id];
        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapShot = await getDoc(userChatsRef);
          if (userChatsSnapShot.exists()) {
            const userChatData = userChatsSnapShot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (c) => c.messageId === messagesId
            );
            if (chatIndex >= 0) {
              userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
              userChatData.chatsData[chatIndex].updatedAt = Date.now();
              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }
              await updateDoc(userChatsRef, {
                chatsData: userChatData.chatsData,
              });
            }
          }
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
    setInput("");
  };

  const sendImage = async (e) => {
    try {
      const fileUrl = await upload(e.target.files[0]);
      if (fileUrl && messagesId) {
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: new Date(),
          }),
        });

        const userIDs = [chatUser.rId, userData.id];
        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapShot = await getDoc(userChatsRef);
          if (userChatsSnapShot.exists()) {
            const userChatData = userChatsSnapShot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (c) => c.messageId === messagesId
            );
            if (chatIndex >= 0) {
              userChatData.chatsData[chatIndex].lastMessage = "Image";
              userChatData.chatsData[chatIndex].updatedAt = Date.now();
              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }
              await updateDoc(userChatsRef, {
                chatsData: userChatData.chatsData,
              });
            }
          }
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const convertTimestamp = (timestamp) => {
    let date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, "0");
    return hour > 12 ? `${hour - 12}:${minute}PM` : `${hour}:${minute}AM`;
  };

  // Listen for messages
  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data()?.messages?.reverse() || []);
      });
      return () => unSub();
    }
  }, [messagesId, setMessages]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <img
          src={chatUser.userData.avatar || assets.defaultAvatar}
          alt={chatUser.userData.name || "Anonymous"}
        />
        <p>
          {chatUser.userData.name || "Anonymous"}{" "}
          {chatUser.userData.isAnonymous ? "(Anonymous)" : ""}
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

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.sId === userData.id
                ? "sent-message"
                : "received-message"
            }
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

      <div className="chat-input">
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Type your message..."
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
  ) : (
    <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo_icon} alt="" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
