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
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handlePost = async () => {
    if (!input.trim()) {
      toast.error("Please type something before posting!");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        text: input,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
      });

      toast.success("Post added!");
      setInput("");
    } catch (error) {
      console.error("Error posting:", error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (postId, postOwner) => {
    if (currentUser?.uid !== postOwner) {
      toast.error("You can only delete your own posts!");
      return;
    }

    try {
      await deleteDoc(doc(db, "posts", postId));
      toast.success("Post deleted!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  const handleChat = async (post) => {
    try {
      const user1 = currentUser?.uid;
      const user2 = post.userId;

      if (!user1 || !user2) {
        toast.error("Missing user info.");
        return;
      }

      const chatId =
        user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user1, user2],
          createdAt: serverTimestamp(),
          lastMessage: "Hey, let's talk about your post.",
        });

        await addDoc(collection(chatRef, "messages"), {
          text: "Hey, let's talk about your post.",
          sender: user1,
          createdAt: serverTimestamp(),
        });
      }

      navigate(`/chat/${chatId}`, {
        state: {
          userId: post.userId,
          userName: post.userName,
          messageId: chatId,
        },
      });
    } catch (error) {
      console.error("Error handling chat:", error);
      toast.error(error.message);
    }
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

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
            <strong>{post.userName}</strong>
            <p>{post.text}</p>
            <small>
              {post.createdAt?.toDate
                ? post.createdAt.toDate().toLocaleString()
                : ""}
            </small>
            <div style={{ marginTop: "8px" }}>
              <button
                onClick={() => handleChat(post)}
                className="chat-btn"
                style={{ marginRight: "10px" }}
              >
                Chat
              </button>
              {post.userId === currentUser?.uid && (
                <button
                  onClick={() => handleDelete(post.id, post.userId)}
                  className="delete-btn"
                  style={{ background: "red", color: "white" }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormCheck;
