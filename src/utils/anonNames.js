// Map to store per-chat anonymous names
// Structure: { chatId: { userId: anonName } }
const anonNameMap = {};

// List of possible prefixes
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

  // Pick a random prefix
  const prefix =
    anonNamesList[Math.floor(Math.random() * anonNamesList.length)] ||
    "Anonymous";

  // Generate random number between 1000–9999
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  const anonName = `${prefix}${randomNum}`;

  // Ensure uniqueness within the same chat
  const usedNames = Object.values(anonNameMap[chatId]);
  if (usedNames.includes(anonName)) {
    // If duplicate, retry
    return getOrCreateAnonymousName(currentUserId, otherUserId, chatId);
  }

  // Save and return
  anonNameMap[chatId][otherUserId] = anonName;
  return anonName;
}
