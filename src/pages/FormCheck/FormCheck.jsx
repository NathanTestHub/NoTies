import React, { useState, useEffect } from "react";
import "./FormCheck.css";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  const handlePost = async () => {
    if (!input.trim()) {
      toast.error("Please type something before posting!");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        text: input,
        createdAt: serverTimestamp(),
      });

      toast.success("Post added!");
      setInput("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  // Navigate to chat page with the post ID
  const handleChat = (postId) => {
    navigate(`/chat/${postId}`);
  };

  return (
    <div className="form-check">
      <textarea
        className="post-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something to post..."
      />
      <button onClick={handlePost} className="post-btn">
        Post
      </button>

      {/* Posts List */}
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
            <p>{post.text}</p>
            <small>
              {post.createdAt?.toDate
                ? post.createdAt.toDate().toLocaleString()
                : ""}
            </small>
            <button
              onClick={() => handleChat(post.id)}
              className="chat-btn"
            >
              Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormCheck;
