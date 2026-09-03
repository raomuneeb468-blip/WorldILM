import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/button>\n<\/div><\/div><\/div><\/div>\) : \(/g, '</button>\n</div>\n</div>\n</div>\n) : (');

fs.writeFileSync('src/App.tsx', content);
