import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const currentUser: any = \{ displayName: "User", email: "user@example.com" \};/, `const currentUser: any = { displayName: "Muneeb", email: "raomuneeb468@gmail.com", uid: "local" };`);

fs.writeFileSync('src/App.tsx', content);
