import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Improve error handling
content = content.replace(
  /if \(\!response\.ok\) \{\n\s*throw new Error\("Chat request failed"\);\n\s*\}/,
  'if (!response.ok) { const txt = await response.text(); throw new Error(txt || "Chat request failed"); }'
);

content = content.replace(
  'content: "⚠️ **Connection issue.** Please check your connection and try again in a moment. 😊",',
  'content: err.message.includes("429") || err.message.includes("quota") ? "⚠️ **Rate Limit Exceeded:** You have reached your Gemini API limit. Please wait a moment." : "⚠️ **Connection issue.** " + (err.message || "Please check your connection and try again in a moment. 😊"),'
);

fs.writeFileSync('src/App.tsx', content);
