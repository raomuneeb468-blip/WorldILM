import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const currentUser: any = null;/, `const currentUser: any = { displayName: "User", email: "user@example.com" };`);

fs.writeFileSync('src/App.tsx', content);
