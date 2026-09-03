import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const currentUser: any = null;/, `const currentUser: any = null;
const handleSignIn: any = () => {};
const completeOnboarding: any = () => {};`);

fs.writeFileSync('src/App.tsx', content);
