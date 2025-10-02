import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // your Firebase config

const anonNamesList = [
  "RedPanda",
  "BlueFalcon",
  "GreenTurtle",
  "YellowTiger",
  "PurpleOwl",
  "SilverFox",
  "GoldenEagle",
  "CrimsonWolf",
  "AzureDolphin",
  "OrangeLion",
];

export async function getOrCreateAnonymousName(currentUserId, otherUserId, chatId) {
  if (!chatId) return "Anonymous";

  const chatDocRef = doc(db, "anonNames", chatId); // Collection: 'anonNames', Doc: chatId
  const chatSnap = await getDoc(chatDocRef);

  let chatData = chatSnap.exists() ? chatSnap.data() : {};

  // If name already exists, return it
  if (chatData[otherUserId]) return chatData[otherUserId];

  // Pick a random prefix
  const prefix =
    anonNamesList[Math.floor(Math.random() * anonNamesList.length)] || "Anonymous";

  // Generate random number between 1000–9999
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  let anonName = `${prefix}${randomNum}`;

  // Ensure uniqueness within the same chat
  const usedNames = Object.values(chatData);
  while (usedNames.includes(anonName)) {
    const retryNum = Math.floor(1000 + Math.random() * 9000);
    anonName = `${prefix}${retryNum}`;
  }

  // Save to Firestore
  chatData[otherUserId] = anonName;
  await setDoc(chatDocRef, chatData);

  return anonName;
}
