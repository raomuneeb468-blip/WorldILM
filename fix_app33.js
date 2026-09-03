import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /\{m\.content\}[\s\S]{0,100}\) : \(/g;
console.log(content.match(regex1));
