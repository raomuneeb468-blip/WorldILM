import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const handleSendMessage = async \(customPrompt\?: string, customRatio\?: string\) => \{/,
  'const handleSendMessage = async (customPrompt?: string, customRatio?: string, overrideHistory?: Message[]) => {'
);

content = content.replace(
  /const nextHistory = \[\.\.\.messages, userMsg\];/,
  'const nextHistory = [...(overrideHistory || messages), userMsg];'
);

content = content.replace(
  /const response = await fetch\("\/api\/chat", \{[\s\S]*?body: JSON.stringify\(\{[\s\S]*?messages: messages\.map/,
  `const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: actualTier,
          messages: (overrideHistory || messages).map`
);

fs.writeFileSync('src/App.tsx', content);
