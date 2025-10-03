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
import { stringToColor } from "../../utils/colors"; // <-- import

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

  // -------------------- Search Users --------------------
  const inputHandler = async (e) => {
    try {
      const input = e.target.value?.trim();
      if (!input) {
        setShowSearch(false);
        setUser(null);
        return;
      }

      setShowSearch(true);
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", input.toLowerCase()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const foundUser = querySnap.docs[0].data();
        if (foundUser.id !== userData?.id) {
          const exists = chatData.some((c) => c.rId === foundUser.id);
          if (!exists) setUser(foundUser);
          else setUser(null);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // -------------------- Add Chat --------------------
  const addChat = async () => {
    if (!user?.id) {
      toast.error("No user selected.");
      return;
    }

    try {
      // Check if chat already exists
      const userChatRef = doc(db, "chats", userData.id);
      const userChatSnap = await getDoc(userChatRef);
      const existingChats = userChatSnap.exists()
        ? userChatSnap.data().chatsData || []
        : [];

      const alreadyExists = existingChats.some((c) => c.rId === user.id);
      if (alreadyExists) {
        toast.info("Chat already exists.");
        return;
      }

      // Create new message thread
      const newMessageRef = doc(collection(db, "messages"));
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Add chat to other user
      await updateDoc(doc(db, "chats", user.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData?.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      // Add chat to current user
      await updateDoc(userChatRef, {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true,
        }),
      });

      const uSnap = await getDoc(doc(db, "users", user.id));
      const uData = uSnap.exists() ? uSnap.data() : {};
      setChat({
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
        userData: uData,
      });

      setShowSearch(false);
      setChatVisible(true);
    } catch (err) {
      console.error("Failed to add chat:", err);
      toast.error(err.message);
    }
  };

  // -------------------- Set Chat --------------------
  const setChat = async (item) => {
    try {
      if (!item?.messageId) return;

      setMessagesId(item.messageId);
      setChatUser(item);

      if (!userData?.id) return;

      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshot.data();

      if (userChatsData?.chatsData) {
        const chatIndex = userChatsData.chatsData.findIndex(
          (c) => c.messageId === item.messageId
        );

        if (chatIndex >= 0) {
          userChatsData.chatsData[chatIndex].messageSeen = true;
          await updateDoc(userChatsRef, {
            chatsData: userChatsData.chatsData,
          });
        }
      }

      setChatVisible(true);
    } catch (err) {
      console.error("Failed to set chat:", err);
      toast.error(err.message);
    }
  };

  // -------------------- Update Chat User Data --------------------
  useEffect(() => {
    const updateChatUserData = async () => {
      try {
        if (chatUser?.userData?.id) {
          const userRef = doc(db, "users", chatUser.userData.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const updatedData = userSnap.data();
            setChatUser((prev) => ({
              ...prev,
              userData: updatedData || prev.userData,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to update chatUser data:", err);
      }
    };
    updateChatUserData();
  }, [chatData, chatUser, setChatUser]);

  // -------------------- Generate Chat Link --------------------
  const generateChatLink = async () => {
    try {
      if (!userData?.id) return;
      const linkId = crypto.randomUUID();
      await setDoc(doc(db, "chatLinks", linkId), {
        userId: userData.id,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const link = `${window.location.origin}/chat-link/${linkId}`;
      navigator.clipboard.writeText(link);
      toast.success("Chat link copied to clipboard!");
    } catch (err) {
      console.error("Failed to generate chat link:", err);
      toast.error("Failed to generate chat link.");
    }
  };

  // -------------------- Render --------------------
  return (
    <div className={`left-sidebar ${chatVisible ? "hidden" : ""}`}>
      <div className="left-sidebar-top">
        <div className="left-sidebar-nav">
          <img src={assets.logo} className="logo" alt="Logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="Menu" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile-update")}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="left-sidebar-search">
          <img src={assets.search_icon} alt="Search" />
          <input onChange={inputHandler} type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="left-sidebar-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <div
              className="avatar-circle"
              style={{ backgroundColor: stringToColor(user.id) }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <p>{user.name || "Unknown User"}</p>
          </div>
        ) : (
<<<<<<< HEAD
          (Array.isArray(chatData) ? chatData : []).map((item, index) => {
            if (!item.userData) return null;
            return (
=======
          chatData &&
          Object.values(
            chatData.reduce((acc, item) => {
              if (!item?.userData) return acc;
              acc[item.rId] = item; // keep last chat for each user
              return acc;
            }, {})
          ).map((item) => (
            <div
              onClick={() => setChat(item)}
              key={item.rId}
              className={`friends ${
                item.messageSeen || item.messageId === messagesId ? "" : "border"
              }`}
            >
>>>>>>> 6c4eaa04d0d84f3f16332aaf2c422e5cf5725c44
              <div
                className="avatar-circle"
                style={{
                  backgroundColor: stringToColor(item.userData.id),
                }}
              >
                {item.userData.name
                  ? item.userData.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div>
                <p>{item.userData.name || "Unknown User"}</p>
                <span>{item.lastMessage || ""}</span>
              </div>
            </div>
          ))
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
