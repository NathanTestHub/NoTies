import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { db } from "../config/firebase"; // fixed path
import { AppContext } from "../context/AppContext"; // fixed path


const ChatLink = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { setChatUser, setMessagesId } = useContext(AppContext);

  useEffect(() => {
    const initChat = async () => {
      const linkRef = doc(db, "chatLinks", linkId);
      const linkSnap = await getDoc(linkRef);

      if (!linkSnap.exists()) return navigate("/"); // invalid link

      const ownerId = linkSnap.data().userId;

      // Create anonymous guest user
      const guestId = `guest-${crypto.randomUUID()}`;
      const guestName = `Guest-${Math.floor(Math.random() * 10000)}`;
      const guestUser = { id: guestId, name: guestName, avatar: "" };

      // ✅ Create Firestore chat
      const messagesCol = collection(db, "messages");
      const newMessageRef = doc(messagesCol);
      await setDoc(newMessageRef, {
        createAt: new Date(),
        messages: [],
      });

      // Update chats for owner
      await setDoc(doc(db, "chats", ownerId), {
        chatsData: [
          {
            messageId: newMessageRef.id,
            lastMessage: "",
            rId: guestId,
            updatedAt: Date.now(),
            messageSeen: true,
          },
        ],
      }, { merge: true });

      // Update chats for guest
      await setDoc(doc(db, "chats", guestId), {
        chatsData: [
          {
            messageId: newMessageRef.id,
            lastMessage: "",
            rId: ownerId,
            updatedAt: Date.now(),
            messageSeen: true,
          },
        ],
      });

      setChatUser({
        rId: ownerId,
        messageId: newMessageRef.id,
        userData: guestUser,
      });
      setMessagesId(newMessageRef.id);

      navigate("/"); // redirect to main chat page
    };

    initChat();
  }, [linkId, navigate, setChatUser, setMessagesId]);

  return <div>Redirecting to chat...</div>;
};

export default ChatLink;
