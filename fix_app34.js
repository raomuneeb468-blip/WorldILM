import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /\{m\.content\}[\s\S]{0,100}\) : \(/g;
content = content.replace(regex1, '{m.content}\n</div>\n</div></div></div>) : (');

fs.writeFileSync('src/App.tsx', content);
