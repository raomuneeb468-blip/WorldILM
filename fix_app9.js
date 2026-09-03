import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The manage keys button had an onClick, now the onClick is gone but maybe there is an empty button or something similar?
// In the search for "Manage API Keys", I can see there is `<button onClick={async () => {` ?
content = content.replace(/<button[\s\S]*?onClick=\{\(\) => \{\s*setIsKeyManagerOpen\(true\);\s*\}\}[\s\S]*?<\/button>/m, '');

// I'll just remove the whole FIREBASE API KEY VAULT MODAL
content = content.replace(/\{\/\* \-\-\- FIREBASE API KEY VAULT MODAL \-\-\- \*\/\}[\s\S]*?<\/AnimatePresence>/m, '');

fs.writeFileSync('src/App.tsx', content);
