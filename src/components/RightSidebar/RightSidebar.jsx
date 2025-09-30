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

  // Extract only messages with images
  useEffect(() => {
    const tempVar =
      messages?.filter((message) => message?.image)?.map((m) => m.image) ||
      [];
    setMessageImages(tempVar);
  }, [messages]);

  const handleCreateForm = () => {
    navigate("/form-check");
  };

  // Safe rendering: check if chatUser and chatUser.userData exist
  const name = chatUser?.userData?.name || "Anonymous";
  const lastSeen = chatUser?.userData?.lastSeen || 0;
  const bio = chatUser?.userData?.bio || "";
  const color = chatUser?.userData?.color || "#4CAF50";

  return (
    <div className="right-sidebar">
      {chatUser?.userData ? (
        <>
          <div className="right-sidebar-profile">
            {/* Colored circle avatar */}
            <div
              className="avatar-circle-right"
              style={{ backgroundColor: color }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <h3>
              {Date.now() - lastSeen <= 70000 && (
                <img src={assets.green_dot} className="dot" alt="Online" />
              )}
              {name}
            </h3>
            <p>{bio}</p>
          </div>
          <hr />
          <div className="right-sidebar-media">
            <p>Media</p>
            <div>
              {messageImages.map((url, index) => (
                <img
                  key={index}
                  onClick={() => window.open(url)}
                  src={url || null}
                  alt={`Media ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="right-sidebar-buttons">
        <button onClick={handleCreateForm}>Post</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  );
};

export default RightSidebar;
