import React, { useContext, useEffect, useState } from "react";
import "./Chat.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import ChatBox from "../../components/ChatBox/ChatBox";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import { AppContext } from "../../context/AppContext";
import { useLocation } from "react-router-dom";

const Chat = () => {
  const location = useLocation();
  const {
    chatData,
    setChatUser,
    setMessagesId,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.userId && location.state?.alias) {
      setChatUser({
        rId: location.state.userId,
        messageId: location.state.messageId,
        alias: location.state.alias, // anonymous alias only
      });
      setMessagesId(location.state.messageId);
    }
  }, [location.state, setChatUser, setMessagesId]);

  useEffect(() => {
    if (chatData) setLoading(false);
  }, [chatData]);

  return (
    <div className="chat">
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="chat-container">
          <LeftSidebar />
          <ChatBox /> {/* Make sure ChatBox uses chatData.alias */}
          <RightSidebar />
        </div>
      )}
    </div>
  );
};

export default Chat;
