import React, { useEffect, useState, useContext } from "react";
import "./ProfileUpdate.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [color, setColor] = useState("");
  const { setUserData } = useContext(AppContext);

  // Generate random hex color
  const generateRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      const docRef = doc(db, "users", uid);

      // If no color assigned yet, generate one
      const userColor = color || generateRandomColor();
      setColor(userColor);

      await updateDoc(docRef, {
        avatar: userColor, // save the color as avatar
        bio: bio,
        name: name,
      });

      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate("/chat");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setName(data.name);
          if (data.bio) setBio(data.bio);
          if (data.avatar) setColor(data.avatar);
        }
      } else {
        navigate("/");
      }
    });
  }, []);

  return (
    <div className="profile-update">
      <div className="profile-update-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          <div
            className="avatar-circle"
            style={{
              backgroundColor: color || generateRandomColor(),
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              margin: "10px auto",
            }}
          >
            <span style={{ color: "#fff", textAlign: "center", lineHeight: "80px" }}>
              {name ? name[0].toUpperCase() : "U"}
            </span>
          </div>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your name"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Bio here"
            required
          />
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;
