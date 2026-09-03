import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const idx1 = content.lastIndexOf('referrerPolicy="no-referrer"');
console.log(content.substring(idx1, idx1 + 450));
