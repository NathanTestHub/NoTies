// src/utils/colors.js
export const stringToColor = (str) => {
  if (!str) return "#777"; // fallback
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 60%, 50%)`; // HSL ensures bright colors
  return color;
};
