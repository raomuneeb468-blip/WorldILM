import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// clean up Firebase-backed API Key Management States
content = content.replace(/\/\/ Firebase-backed API Key Management States[\s\S]*?const \[addingKey, setAddingKey\] = useState\(false\);/m, '');

// clean up Firebase-backed API Key Management Handlers
content = content.replace(/\/\/ --- Firebase-backed API Key Management Handlers ---[\s\S]*?\/\/ --- Checkout Handler ---/m, '// --- Checkout Handler ---');

fs.writeFileSync('src/App.tsx', content);
