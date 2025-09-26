import React, { useContext, useEffect, useState } from "react";
import "./Chat.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import ChatBox from "../../components/ChatBox/ChatBox";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import { AppContext } from "../../context/AppContext";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const Chat = () => {
  const location = useLocation();
  const {
    chatData,
    userData,
    setChatUser,
    setMessagesId,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupChatFromNav = async () => {
      if (location.state?.userId) {
        const uSnap = await getDoc(doc(db, "users", location.state.userId));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          setChatUser({
            rId: uData.id,
            messageId: location.state.messageId,
            userData: uData,
          });
          setMessagesId(location.state.messageId);
        }
      }
    };
    setupChatFromNav();
  }, [location.state, setChatUser, setMessagesId]);

  useEffect(() => {
    if (chatData && userData) setLoading(false);
  }, [chatData, userData]);

  return (
    <div className="chat">
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="chat-container">
          <LeftSidebar />
          <ChatBox />
          <RightSidebar />
        </div>
      )}
    </div>
  );
};

export default Chat;
