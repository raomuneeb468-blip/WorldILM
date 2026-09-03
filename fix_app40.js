import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will just download the file to tmp2.tsx and run tsc on it to see exactly.
fs.writeFileSync('tmp2.tsx', content);
