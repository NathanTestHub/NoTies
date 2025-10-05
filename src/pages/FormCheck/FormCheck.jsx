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
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --- Add a new post ---
  const handlePost = async () => {
    if (!input.trim()) {
      toast.error("Please type something before posting!");
      return;
    }

    try {
      const counterRef = doc(db, "meta", "postCounter");
      const counterSnap = await getDoc(counterRef);
      let nextNumber = 1;

      if (counterSnap.exists()) {
        nextNumber = (counterSnap.data().lastPostNumber || 0) + 1;
        await updateDoc(counterRef, { lastPostNumber: nextNumber });
      } else {
        await setDoc(counterRef, { lastPostNumber: 1 });
      }

      await addDoc(collection(db, "posts"), {
        text: input.trim(),
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        deleted: false,
        postNumber: nextNumber,
      });

      toast.success("Post added!");
      setInput("");
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error(error.message);
    }
  };

  // --- Delete a post ---
  const handleDelete = async (postId, postOwner) => {
    if (currentUser.uid !== postOwner) {
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

  // --- Real-time fetch posts ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs
        .filter((doc) => !doc.data()?.deleted)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(fetchedPosts);
    });
    return () => unsubscribe();
  }, []);

  // --- Initiate chat ---
  const handleChat = async (post) => {
    try {
      const user1 = currentUser.uid;
      const user2 = post.userId;
      if (!user1 || !user2) throw new Error("Missing user info.");

      const chatId = user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
      const chatRef = doc(db, "messages", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user1, user2],
          createdAt: serverTimestamp(),
          lastMessage: "Hey, let's chat!",
        });

        const messagesCol = collection(chatRef, "messages");
        await addDoc(messagesCol, {
          sId: user1,
          text: "Hey, let's chat!",
          createdAt: serverTimestamp(),
        });

        for (const uid of [user1, user2]) {
          const userChatsRef = doc(db, "chats", uid);
          const userChatsSnap = await getDoc(userChatsRef);
          const chatData = {
            messageId: chatId,
            rId: uid === user1 ? user2 : user1,
            lastMessage: "Hey, let's chat!",
            updatedAt: Date.now(),
            messageSeen: uid === user1,
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

      navigate(`/chat/${chatId}`, {
        state: { userId: post.userId, userName: post.userName, messageId: chatId },
      });
    } catch (error) {
      console.error("Error initiating chat:", error);
      toast.error(error.message);
    }
  };

  // --- Filter posts by search ---
  const filteredPosts = posts.filter((post) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const numberMatch = post.postNumber?.toString().includes(q);
    const textMatch = post.text?.toLowerCase().includes(q) || post.userName?.toLowerCase().includes(q);
    return numberMatch || textMatch;
  });

  return (
    <div className="form-check">
      {/* Top Bar: Back + Search */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate("/chat")}>
          &larr;
        </button>
        <input
          type="text"
          placeholder="Search by post number or text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
      </div>

      {/* Post input */}
      <textarea
        className="post-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something to post..."
      />
      <button onClick={handlePost} className="post-btn">
        Post
      </button>

      {/* Posts list */}
      <div className="posts-list">
        {filteredPosts.map((post) => (
          <div key={post.id} className="post-item">
            <strong>#{post.postNumber} • {post.userName}</strong>
            <p>{post.text}</p>
            <small>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}</small>
            <div className="post-actions">
              {post.userId !== currentUser.uid && (
                <button className="chat-btn" onClick={() => handleChat(post)}>
                  Chat
                </button>
              )}
              {post.userId === currentUser.uid && (
                <button className="delete-btn" onClick={() => handleDelete(post.id, post.userId)}>
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
