import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

const ChatBox = () => {
  const { userData, messagesId, chatUser, messages, setMessages } =
    useContext(AppContext);

  const [Input, setInput] = useState("");

  useEffect(()=>{
    if (messagesId) {

      const unSub = onSnapshot(doc(db, 'messages', messagesId), (res)=>{
        setMessages(res.data().messages.reverse())
        console.log(res.data().messages.reverse());
      })
      return ()=> {
        unSub();
      }

    }
  },[messagesId])

  return chatUser ? (
    <div className="chat-box">
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>
          {chatUser.userData.name}
          <img className="dot" src={assets.green_dot} alt="" />
        </p>
        <img src={assets.help_icon} className="help" alt="" />
      </div>

      <div className="chat-messages">
        <div className="sent-message">
          <p className="message">I need help with my order.</p>
          <div>
            <img src={assets.profile_img} alt="" />
            <p>10:30 AM</p>
          </div>
        </div>

        <div className="sent-message">
          <img className="message-image" src={assets.pic1} alt="" />
          <div>
            <img src={assets.profile_img} alt="" />
            <p>10:30 AM</p>
          </div>
        </div>

        <div className="received-message">
          <p className="message">Hello! How can I assist you today?</p>
          <div>
            <img src={assets.profile_img} alt="" />
            <p>10:32 AM</p>
          </div>
        </div>
      </div>

      <div className="chat-input">
        <input type="text" placeholder="Type your message..." />
        <input type="file" id="image" accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img src={assets.send_button} alt="" />
      </div>
    </div>
  ) : (
    <div className="chat-welcome">
      <img src={assets.logo_icon} alt="" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
