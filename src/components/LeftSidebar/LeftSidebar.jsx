import React from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const LeftSidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="left-sidebar">
      <div className="left-sidebar-top">
        <div className="left-sidebar-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={()=>navigate('/profile-update')}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="left-sidebar-search">
          <img src={assets.search_icon} alt="" />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="left-sidebar-list">
        {Array(12)
          .fill("")
          .map((item, index) => (
            <div key={index} className="friends">
              <img src={assets.profile_img} alt="" />
              <div>
                <p>John Doe</p>
                <span>Hey! How are you?</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default LeftSidebar;
