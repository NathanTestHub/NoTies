import React, { useContext, useEffect, useState } from "react";
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const RightSidebar = () => {
  const { chatUser, messages } = useContext(AppContext);
  const [messageImages, setMessageImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let tempVar = [];
    messages.map((message) => {
      if (message.image) tempVar.push(message.image);
    });
    setMessageImages(tempVar);
  }, [messages]);

  const handleCreateForm = () => {
    navigate("/form-check");
  };

  return chatUser ? (
    <div className="right-sidebar">
      <div className="right-sidebar-profile">
        <img src={chatUser.userData.avatar} alt="" />
        <h3>
          {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
            <img src={assets.green_dot} className="dot" alt="" />
          ) : null}
          {chatUser.userData.name}
        </h3>
        <p>{chatUser.userData.bio}</p>
      </div>
      <hr />
      <div className="right-sidebar-media">
        <p>Media</p>
        <div>
          {messageImages.map((url, index) => (
            <img
              onClick={() => window.open(url)}
              key={index}
              src={url}
              alt=""
            />
          ))}
        </div>
      </div>

      {/* Wrap the buttons in a container */}
      <div className="right-sidebar-buttons">
        <button onClick={handleCreateForm}>Post</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  ) : (
    <div className="right-sidebar">
      <div className="right-sidebar-buttons">
        <button onClick={handleCreateForm}>Post</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  );
};

export default RightSidebar;
