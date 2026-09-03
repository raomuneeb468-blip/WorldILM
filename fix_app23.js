import fs from 'fs';
let content = fs.readFileSync('tmp.txt', 'utf8');
fs.writeFileSync('src/App.tsx', content);
