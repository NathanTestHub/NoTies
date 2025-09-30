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
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FormCheck = () => {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState(""); // <-- search state
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --- Add a post ---
  const handlePost = async () => {
    if (!input.trim()) {
      toast.error("Please type something before posting!");
      return;
    }

    try {
      const postsCollection = collection(db, "posts");

      // Get the highest existing postNumber
      const q = query(postsCollection, orderBy("postNumber", "desc"));
      const snapshot = await getDocs(q);
      let nextPostNumber = 1; // default for first post
      if (!snapshot.empty) {
        nextPostNumber = snapshot.docs[0].data().postNumber + 1;
      }

      await addDoc(postsCollection, {
        text: input.trim(),
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        postNumber: nextPostNumber,
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
    const q = query(collection(db, "posts"), orderBy("postNumber", "asc"));
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

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user1, user2],
          createdAt: serverTimestamp(),
          lastMessage: "Hey, let's chat!",
        });

        const initialMessage = collection(chatRef, "messages");
        await addDoc(initialMessage, {
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

  // --- Filtered posts based on search by number or text/username ---
  const filteredPosts = posts.filter((post) => {
    if (!search.trim()) return true; // show all if search is empty

    const searchLower = search.toLowerCase();
    const searchNumber = parseInt(search, 10);

    return (
      post.postNumber === searchNumber || // match post number
      post.text.toLowerCase().includes(searchLower) || // match text
      post.userName.toLowerCase().includes(searchLower) // match username
    );
  });

  return (
    <div className="form-check">
      {/* Search input */}
      <input
        type="text"
        placeholder="Search by post number, text, or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
        style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
      />

      {/* New post textarea */}
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
            <strong>
              Post #{post.postNumber} - {post.userName}
            </strong>
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
        {filteredPosts.length === 0 && <p>No posts found.</p>}
      </div>
    </div>
  );
};

export default FormCheck;
