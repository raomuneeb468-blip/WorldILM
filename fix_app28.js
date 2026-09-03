import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const idx1 = content.indexOf('bg-zinc-100 text-zinc-800');
console.log(content.substring(idx1 + 450, idx1 + 650));

const idx2 = content.indexOf('<RefreshCw size={12} />');
console.log(content.substring(idx2, idx2 + 150));
