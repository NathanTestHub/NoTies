// Map to store per-chat anonymous names
// Structure: { chatId: { userId: anonName } }
const anonNameMap = {};

// List of possible anonymous names
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

// Utility function to get or create an anonymous name for a user in a chat
export function getOrCreateAnonymousName(currentUserId, otherUserId, chatId) {
  if (!chatId) return "Anonymous";

  // Initialize chat mapping if not exists
  if (!anonNameMap[chatId]) {
    anonNameMap[chatId] = {};
  }

  // If name already exists for this user, return it
  if (anonNameMap[chatId][otherUserId]) {
    return anonNameMap[chatId][otherUserId];
  }

  // Pick a random name that isn’t already taken in this chat
  const usedNames = Object.values(anonNameMap[chatId]);
  const availableNames = anonNamesList.filter((n) => !usedNames.includes(n));
  const randomName =
    availableNames[Math.floor(Math.random() * availableNames.length)] ||
    `Anonymous-${Math.floor(Math.random() * 1000)}`;

  // Save and return
  anonNameMap[chatId][otherUserId] = randomName;
  return randomName;
}
