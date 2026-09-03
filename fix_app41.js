import fs from 'fs';
let content = fs.readFileSync('tmp2.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 1895; i <= 1905; i++) {
  console.log(`${i}: ${lines[i-1]}`);
}
