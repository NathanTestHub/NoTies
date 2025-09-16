import React, { useContext, useEffect, useState } from "react";
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";

const RightSidebar = () => {
  const { chatUser, messages } = useContext(AppContext);
  const [messageImages, setMessageImages] = useState([]);

  useEffect(() => {
    let tempVar = [];
    messages.map((message) => {
      if (message.image) [tempVar.push(message.image)];
    });
    setMessageImages(tempVar)
  }, [messages]);

  return chatUser ? (
    <div className="right-sidebar">
      <div className="right-sidebar-profile">
        <img src={chatUser.userData.avatar} alt="" />
        <h3>
          {chatUser.userData.name}
          <img src={assets.green_dot} className="dot" alt="" />
        </h3>
        <p>{chatUser.userData.bio}</p>
      </div>
      <hr />
      <div className="right-sidebar-media">
        <p>Media</p>
        <div>
          {messageImages.map((url, index)=>(<img onClick={()=>window.open(url)} key={index} src={url} alt=''/>))}
          {/* <img src={assets.pic1} alt="" />
          <img src={assets.pic2} alt="" />
          <img src={assets.pic3} alt="" />
          <img src={assets.pic4} alt="" />
          <img src={assets.pic1} alt="" />
          <img src={assets.pic2} alt="" /> */}
        </div>
      </div>
      <button onClick={() => logout()}>Logout</button>
    </div>
  ) : (
    <div className="right-sidebar">
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

export default RightSidebar;
