import React, { useContext, useEffect, useState } from "react";
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const RightSidebar = () => {
  const { userData, messages } = useContext(AppContext); // use userData instead of chatUser
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

  return userData ? (
    <div className="right-sidebar">
      <div className="right-sidebar-profile">
        <img src={userData.avatar || assets.defaultAvatar} alt="Profile" />
        <h3>
          {Date.now() - (userData.lastSeen || 0) <= 70000 ? (
            <img src={assets.green_dot} className="dot" alt="Online" />
          ) : null}
          {userData.name || "Your Name"}
        </h3>
        <p>{userData.bio || "No bio available"}</p>
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
              alt={`media-${index}`}
            />
          ))}
        </div>
      </div>

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
