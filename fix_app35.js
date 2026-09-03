import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\{m\.content\}<\/div><\/div><\/div><\/div>\) : \(/g, '{m.content}\n</div>\n</div>\n) : (');

fs.writeFileSync('src/App.tsx', content);
