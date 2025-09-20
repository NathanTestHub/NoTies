import React, { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Login from "./pages/Login/Login.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase.js";
import { useContext } from "react";
import { AppContext } from "./context/AppContext.jsx";
import { ToastContainer } from "react-toastify";
import Filter from "./pages/Filter/Filter.jsx";

const App = () => {
  const navigate = useNavigate();
  const {loadUserData} = useContext(AppContext)

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        navigate("/chat");
        await loadUserData(user.uid)
      } else {
        navigate("/");
      }
    });
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile-update" element={<ProfileUpdate />} />
      </Routes>
    </>
  );
};

export default App;
