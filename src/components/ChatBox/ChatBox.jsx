import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import upload from "../../lib/upload";
import { stringToColor } from "../../utils/colors";
import { getOrCreateAnonymousName } from "../../utils/anonNames";

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    chatVisible,
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [otherAnonName, setOtherAnonName] = useState("Anonymous");

  // --- Fetch anonymous name for the other user ---
  useEffect(() => {
    if (!messagesId || !chatUser?.rId) return;

    let isMounted = true;
    async function fetchAnonName() {
      try {
        const name = await getOrCreateAnonymousName(
          userData.uid,
          chatUser.rId,
          messagesId
        );
        if (isMounted) setOtherAnonName(name);
      } catch (err) {
        console.error("Failed to get anonymous name:", err);
      }
    }

    fetchAnonName();

    return () => {
      isMounted = false;
    };
  }, [userData.uid, chatUser?.rId, messagesId]);

  // --- Listen for messages in subcollection ---
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

  // --- Send a text message ---
  const sendMessage = async () => {
    if (!input.trim() || !userData?.id || !messagesId || !chatUser?.rId) return;

    try {
      const msgCol = collection(db, "messages", messagesId, "messages");

      await addDoc(msgCol, {
        sId: userData.id,
        text: input.trim(),
        createdAt: serverTimestamp(),
      });
      setInput("");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // --- Send image ---
  const sendImage = async (e) => {
    if (!e.target.files[0] || !userData?.id || !messagesId || !chatUser?.rId)
      return;

    try {
      const fileUrl = await upload(e.target.files[0]);
      if (!fileUrl) throw new Error("Upload failed");

      const msgCol = collection(db, "messages", messagesId, "messages");

      await addDoc(msgCol, {
        sId: userData.id,
        image: fileUrl,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const convertTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, "0");
    return hour >= 12
      ? `${hour > 12 ? hour - 12 : 12}:${minute} PM`
      : `${hour}:${minute} AM`;
  };

  if (!chatUser?.userData) {
    return (
      <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
        <img src={assets.logo_icon || null} alt="Logo" />
        <p>Chat anonymously anytime</p>
      </div>
    );
  }

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <div
          className="avatar-circle"
          style={{ backgroundColor: stringToColor(chatUser.rId) }}
        >
          {otherAnonName.charAt(0).toUpperCase()}
        </div>
        <p>{otherAnonName}</p>
      </div>

      <div className="chat-messages">
        {messages?.map((message) => {
          const isSelf = message.sId === userData.id;
          const displayName = isSelf ? "You" : otherAnonName;

          return (
            <div
              key={message.id}
              className={isSelf ? "sent-message" : "received-message"}
            >
              {message.image ? (
                <img className="message-image" src={message.image} alt="Message" />
              ) : (
                <p className="message">{message.text}</p>
              )}

              <div className="message-meta">
                <div
                  className="avatar-circle"
                  style={{
                    backgroundColor: stringToColor(isSelf ? userData.id : chatUser.rId),
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <p>{convertTimestamp(message.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <input
          type="file"
          id="image"
          accept="image/png, image/jpeg"
          hidden
          onChange={sendImage}
        />
        <label htmlFor="image">
          <img src={assets.gallery_icon || null} alt="Upload" />
        </label>
        <img src={assets.send_button || null} alt="Send" onClick={sendMessage} />
      </div>
    </div>
  );
};

export default ChatBox;
