import React, { useEffect, useState, useContext } from "react";
import "./ProfileUpdate.css";
import assets from "../../assets/assets";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";
// import upload from "../../lib/upload"; // ❌ Not needed anymore

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [avatar, setAvatar] = useState("");
  const { setUserData } = useContext(AppContext);

  // ✅ Default avatar
  const defaultAvatar = assets.avatar_icon;

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      const docRef = doc(db, "users", uid);

      await updateDoc(docRef, {
        avatar: defaultAvatar, // ✅ Always keep default
        bio,
        name,
      });

      const snap = await getDoc(docRef);
      setUserData(snap.data());
      toast.success("Profile updated!");
      navigate("/chat");
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile: " + error.message);
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
          setName(data.name || "");
          setBio(data.bio || "");
          setAvatar(data.avatar || defaultAvatar);

          // ✅ Ensure Firestore always has a default avatar
          if (!data.avatar) {
            await updateDoc(docRef, { avatar: defaultAvatar });
          }
        } else {
          // ✅ Create new user doc with default avatar
          await setDoc(docRef, {
            name: "",
            bio: "",
            avatar: defaultAvatar,
            createdAt: Date.now(),
          });
          setAvatar(defaultAvatar);
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

          {/* ❌ Removed upload functionality
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={image ? URL.createObjectURL(image) : prevImage || defaultAvatar}
              alt="avatar preview"
            />
            Upload profile image
          </label>
          */}

          {/* ✅ Always show default avatar */}
          <div className="avatar-display">
            <img src={avatar || defaultAvatar} alt="Default Avatar" />
            <p className="note">Default profile picture assigned automatically</p>
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

        <img
          className="profile-pic"
          src={avatar || defaultAvatar}
          alt="profile"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
