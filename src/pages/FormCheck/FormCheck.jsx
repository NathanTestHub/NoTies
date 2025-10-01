import React, { useState, useEffect } from "react";
import "./FormCheck.css";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const anonNamesList = [
  "Red Panda",
  "Blue Falcon",
  "Green Turtle",
  "Yellow Tiger",
  "Purple Owl",
  "Silver Fox",
  "Golden Eagle",
  "Crimson Wolf",
  "Azure Dolphin",
  "Orange Lion",
];

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Fetch posts in real-time
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("postNumber", "asc"));
      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs
        .filter((doc) => !doc.data()?.deleted)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(newPosts);
    };
    fetchPosts();
  }, []);

  // --- Add a post ---
  const handlePost = async () => {
    if (!input.trim()) return toast.error("Type something before posting!");
    try {
      const postsCollection = collection(db, "posts");
      const snapshot = await getDocs(
        query(postsCollection, orderBy("postNumber", "desc"))
      );
      let nextPostNumber = 1;
      if (!snapshot.empty) {
        nextPostNumber = snapshot.docs[0].data().postNumber + 1;
      }

      await addDoc(postsCollection, {
        text: input.trim(),
        createdAt: new Date(),
        userId: currentUser.uid,
        postNumber: nextPostNumber,
      });

      setInput("");
      toast.success("Post added!");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // --- Initiate chat with anonymous names ---
  const handleChat = async (post) => {
    try {
      const user1 = currentUser.uid;
      const user2 = post.userId;
      if (!user1 || !user2) return toast.error("Missing user info");

      const chatId = user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
      const chatRef = doc(db, "messages", chatId);
      const chatSnap = await getDoc(chatRef);

      // Create chat if not exists
      if (!chatSnap.exists()) {
        // Assign anonymous names
        const usedNames = [];
        const getAnonName = () => {
          const available = anonNamesList.filter((n) => !usedNames.includes(n));
          const name =
            available[Math.floor(Math.random() * available.length)] ||
            `Anon-${Math.floor(Math.random() * 1000)}`;
          usedNames.push(name);
          return name;
        };

        const anonNames = {
          [user1]: getAnonName(),
          [user2]: getAnonName(),
        };

        // Save chat and names
        await setDoc(chatRef, {
          participants: [user1, user2],
          anonNames,
          createdAt: new Date(),
          lastMessage: "Hey, let's chat!",
        });

        const msgCol = collection(chatRef, "messages");
        await addDoc(msgCol, {
          sId: user1,
          text: "Hey, let's chat!",
          createdAt: new Date(),
        });

        // Update user chat lists
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
            const existing = userChatsSnap.data();
            await setDoc(
              userChatsRef,
              { chatsData: [...(existing.chatsData || []), chatData] },
              { merge: true }
            );
          } else {
            await setDoc(userChatsRef, { chatsData: [chatData] });
          }
        }
      }

      navigate(`/chat/${chatId}`, { state: { chatId, postUserId: post.userId } });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const n = parseInt(search, 10);
    return (
      post.postNumber === n ||
      post.text.toLowerCase().includes(s) ||
      (post.userName && post.userName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="form-check">
      <input
        type="text"
        placeholder="Search by post number, text, or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something to post..."
        className="post-input"
      />
      <button onClick={handlePost} className="post-btn">
        Post
      </button>

      <div className="posts-list">
        {filteredPosts.map((post) => (
          <div key={post.id} className="post-item">
            <strong>
              Post #{post.postNumber} - {post.userName || "Anonymous"}
            </strong>
            <p>{post.text}</p>
            <small>{post.createdAt?.toDate?.()?.toLocaleString() || ""}</small>
            <div style={{ marginTop: "8px" }}>
              <button
                onClick={() => handleChat(post)}
                className="chat-btn"
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormCheck;
