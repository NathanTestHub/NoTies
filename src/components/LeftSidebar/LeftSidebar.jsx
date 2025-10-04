import React, { useContext, useEffect, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const {
    userData,
    chatData,
    chatUser,
    setChatUser,
    setMessagesId,
    messagesId,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);

  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const chatList = Array.isArray(chatData)
    ? chatData
    : chatData
    ? Object.keys(chatData)
        .filter((key) => key !== "messages")
        .map((key) => chatData[key])
    : [];

  const inputHandler = async (e) => {
    try {
      const input = e.target.value;
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);

        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
          let userExist = false;

          chatList.forEach((user) => {
            if (user.rId === querySnap.docs[0].data().id) {
              userExist = true;
            }
          });

          if (!userExist) setUser(querySnap.docs[0].data());
          else setUser(null);
        } else {
          setUser(null);
        }
      } else {
        setShowSearch(false);
      }
    } catch (error) {
      console.error("Error in inputHandler:", error);
    }
  };

  const addChat = async () => {
    if (!user) return;
    const messageRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");
    try {
      const newMessageRef = doc(messageRef);

      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      await updateDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      const uSnap = await getDoc(doc(db, "users", user.id));
      const uData = uSnap.data();
      setChat({
        messagesId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
        userData: uData,
      });
      setShowSearch(false);
      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
      console.error("Error in addChat:", error);
    }
  };

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);

      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshot.data();

      const chatIndex = userChatsData.chatsData.findIndex(
        (c) => c.messageId === item.messageId
      );

      if (chatIndex >= 0) {
        userChatsData.chatsData[chatIndex].messageSeen = true;
        await updateDoc(userChatsRef, {
          chatsData: userChatsData.chatsData,
        });
      }

      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
      console.error("Error in setChat:", error);
    }
  };

  const deleteChat = async (messageId) => {
    if (!messageId) return;
    try {
      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnap = await getDoc(userChatsRef);
      if (!userChatsSnap.exists()) return;

      const userChatsData = userChatsSnap.data();
      const updatedChats = userChatsData.chatsData.filter(
        (c) => c.messageId !== messageId
      );

      await setDoc(userChatsRef, { chatsData: updatedChats }, { merge: true });
      toast.success("Chat deleted!");
      if (messagesId === messageId) setChatVisible(false);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat.");
    }
  };

  useEffect(() => {
    const updateChatUserData = async () => {
      if (chatUser?.userData?.id) {
        const userRef = doc(db, "users", chatUser.userData.id);
        const userSnap = await getDoc(userRef);
        const updatedUserData = userSnap.data();
        setChatUser((prev) => ({ ...prev, userData: updatedUserData }));
      }
    };
    updateChatUserData();
  }, [chatData]);

  const generateChatLink = async () => {
    try {
      const linkId = crypto.randomUUID();
      await setDoc(doc(db, "chatLinks", linkId), {
        userId: userData.id,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const link = `${window.location.origin}/chat-link/${linkId}`;
      navigator.clipboard.writeText(link);
      toast.success("Chat link copied to clipboard!");
    } catch (error) {
      console.error("Failed to generate chat link:", error);
      toast.error("Failed to generate chat link.");
    }
  };

  return (
    <div className={`left-sidebar ${chatVisible ? "hidden" : ""}`}>
      <div className="left-sidebar-top">
        <div className="left-sidebar-nav">
          <img src={assets.logo} className="logo" alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile-update")}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="left-sidebar-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="left-sidebar-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img
              src={user.avatar || assets.defaultAvatar}
              alt={user.name || "User"}
            />
            <p>{user.name || "Unknown User"}</p>
          </div>
        ) : (
          chatList.map((item, index) => {
            if (!item?.userData) return null;
            return (
              <div
                key={index}
                className={`friends ${
                  item.messageSeen || item.messageId === messagesId
                    ? ""
                    : "border"
                }`}
              >
                <div
                  className="friend-info-wrapper"
                  onClick={() => setChat(item)}
                >
                  <img
                    src={item.userData.avatar || assets.defaultAvatar}
                    alt={item.userData.name || "Unknown User"}
                  />
                  <div className="friend-info">
                    <p>{item.userData.name || "Unknown User"}</p>
                    <span>{item.lastMessage || ""}</span>
                  </div>
                </div>
                <button
                  className="delete-chat-btn"
                  onClick={() => deleteChat(item.messageId)}
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="left-sidebar-bottom">
        <button className="generate-link-btn" onClick={generateChatLink}>
          Generate Chat Link
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
