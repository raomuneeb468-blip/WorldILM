import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const signInOutRegex = /<button[\s\S]*?onClick=\{\(\) => \{[\s\S]*?setIsProfileMenuOpen\(false\);[\s\S]*?Sign out[\s\S]*?<\/button>\s*:\s*<button[\s\S]*?Sign In \/ Google Login[\s\S]*?<\/button>/m;
content = content.replace(signInOutRegex, '');

// There is a ternary for currentUser in this block, we should remove the condition
content = content.replace(/\{currentUser \? \([\s\S]*?\) : \([\s\S]*?\}\s*<\/motion.div>/m, '</motion.div>');

// Let's just fix it manually using a reliable regex
// It's probably easier to just find the exact block and replace it
