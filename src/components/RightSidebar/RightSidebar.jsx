import React, { useContext, useEffect, useState } from "react";
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";

// --- Anonymous name system (same as ChatBox) ---
const anonPrefixes = [
  "BlueFox",
  "RedPanda",
  "SilverWolf",
  "GoldenHawk",
  "GreenTurtle",
  "BlackJaguar",
  "PurpleOwl",
  "OrangeLion",
];
const anonNameMap = {};
const getOrCreateAnonName = async (messageId, userId) => {
  if (!messageId || !userId) return "Anonymous";
  const key = `${messageId}_${userId}`;
  if (anonNameMap[key]) return anonNameMap[key];

  const anonRef = doc(db, "anonNames", key);
  const anonSnap = await getDoc(anonRef);

  if (anonSnap.exists()) {
    anonNameMap[key] = anonSnap.data().anonName;
    return anonNameMap[key];
  }

  const prefix = anonPrefixes[Math.floor(Math.random() * anonPrefixes.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const newAnon = `${prefix}${suffix}`;

  await setDoc(anonRef, { anonName: newAnon });
  anonNameMap[key] = newAnon;
  return newAnon;
};

const RightSidebar = () => {
  const { userData, messagesId, messages } = useContext(AppContext);
  const [messageImages, setMessageImages] = useState([]);
  const [anonName, setAnonName] = useState("Anonymous");
  const navigate = useNavigate();

  // --- Load message images ---
  useEffect(() => {
    const images = messages.filter((m) => m.image).map((m) => m.image);
    setMessageImages(images);
  }, [messages]);

  // --- Load anonName for current user ---
  useEffect(() => {
    if (!messagesId || !userData?.id) return;

    const loadAnon = async () => {
      const anon = await getOrCreateAnonName(messagesId, userData.id);
      setAnonName(anon);
    };

    loadAnon();
  }, [messagesId, userData?.id]);

  const handleCreateForm = () => {
    navigate("/form-check");
  };

  // --- Generate chat link ---
  const generateChatLink = async () => {
    try {
      const linkId = crypto.randomUUID();
      await setDoc(doc(db, "chatLinks", linkId), {
        userId: userData.id,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      const link = `${window.location.origin}/chat-link/${linkId}`;
      navigator.clipboard.writeText(link);
      toast.success("Chat link copied to clipboard!");
    } catch (err) {
      console.error("❌ Failed to generate chat link:", err);
      toast.error("Failed to generate chat link.");
    }
  };

  return userData ? (
    <div className="right-sidebar">
      <div className="right-sidebar-profile">
        <img src={userData.avatar || assets.defaultAvatar} alt="Profile" />
        <h3>
          {Date.now() - (userData.lastSeen || 0) <= 70000 && (
            <img src={assets.green_dot} className="dot" alt="Online" />
          )}
          {userData.name || "Your Name"}
        </h3>
        <p>{anonName}</p> {/* Display current user's anonName */}
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
        <button onClick={generateChatLink}>Invite</button>
        <button onClick={handleCreateForm}>Post</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  ) : (
    <div className="right-sidebar">
      <div className="right-sidebar-buttons">
        <button onClick={generateChatLink}>Generate Chat Link</button>
        <button onClick={handleCreateForm}>Post</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </div>
  );
};

export default RightSidebar;
