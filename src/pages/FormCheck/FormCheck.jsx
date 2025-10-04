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
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --- Add a post ---
  const handlePost = async () => {
    if (!input.trim()) {
      toast.error("Please type something before posting!");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        text: input.trim(),
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

  // --- Delete post ---
  const handleDelete = async (postId, postOwner) => {
    if (currentUser?.uid !== postOwner) {
      toast.error("You can only delete your own posts!");
      return;
    }

    try {
      await setDoc(doc(db, "posts", postId), { deleted: true }, { merge: true });
      toast.success("Post deleted!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.message);
    }
  };

  // --- Fetch posts in real-time ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs
        .filter((doc) => !doc.data()?.deleted)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  // --- Handle chat initiation ---
  const handleChat = async (post) => {
    try {
      const user1 = currentUser?.uid;
      const user2 = post.userId;
      if (!user1 || !user2) {
        toast.error("Missing user info.");
        return;
      }

      const chatId = user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
      const chatRef = doc(db, "messages", chatId);
      const chatSnap = await getDoc(chatRef);

      // Create the messages document if it doesn't exist
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user1, user2],
          createdAt: serverTimestamp(),
          lastMessage: "Hey, let's chat!",
        });

        // Initialize empty subcollection
        const initialMessage = collection(chatRef, "messages");
        await addDoc(initialMessage, {
          sId: user1,
          text: "Hey, let's chat!",
          createdAt: serverTimestamp(),
        });

        // Add this chat to both users' chat lists
        for (const uid of [user1, user2]) {
          const userChatsRef = doc(db, "chats", uid);
          const userChatsSnap = await getDoc(userChatsRef);
          const chatData = {
            messageId: chatId,
            rId: uid === user1 ? user2 : user1,
            lastMessage: "Hey, let's chat!",
            updatedAt: Date.now(),
            messageSeen: uid === user1 ? true : false,
          };

          if (userChatsSnap.exists()) {
            const userChatData = userChatsSnap.data();
            const exists = userChatData.chatsData?.some((c) => c.messageId === chatId);
            if (!exists) {
              await setDoc(
                userChatsRef,
                { chatsData: [...(userChatData.chatsData || []), chatData] },
                { merge: true }
              );
            }
          } else {
            await setDoc(userChatsRef, { chatsData: [chatData] }, { merge: true });
          }
        }
      }

      // Navigate to chat box
      navigate(`/chat/${chatId}`, {
        state: {
          userId: post.userId,
          userName: post.userName,
          messageId: chatId,
        },
      });
    } catch (error) {
      console.error("Error initiating chat:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="form-check">
      {/* ← Back arrow button */}
      <button
        className="back-btn"
        onClick={() => navigate("/chat")}
        style={{
          position: "absolute",
          left: "10px",
          top: "10px",
          background: "transparent",
          border: "none",
          fontSize: "1.5rem",
          cursor: "pointer",
        }}
      >
        &rarr;
      </button>

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
              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
            </small>
            <div style={{ marginTop: "8px" }}>
              {post.userId !== currentUser?.uid && (
                <button
                  onClick={() => handleChat(post)}
                  className="chat-btn"
                  style={{ marginRight: "10px" }}
                >
                  Chat
                </button>
              )}
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
