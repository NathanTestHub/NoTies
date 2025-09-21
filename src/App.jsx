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
import FormCheck from "./pages/FormCheck/FormCheck.jsx";

const App = () => {
  const navigate = useNavigate();
  const { loadUserData } = useContext(AppContext);

    useEffect(() => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await loadUserData(user.uid);

          // Only redirect if they're currently on "/" (login page)
          if (window.location.pathname === "/") {
            navigate("/chat");
          }
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
        <Route path="/chat" element={<Chat />} /> {/* General chat */}
        <Route path="/chat/:postId" element={<Chat />} /> {/* Chat for a post */}
        <Route path="/profile-update" element={<ProfileUpdate />} />
        <Route path="/form-check" element={<FormCheck />} />
      </Routes>
    </>
  );
};

export default App;
