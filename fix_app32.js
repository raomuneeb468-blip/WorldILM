import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// For the user message:
// {m.content}
// </div></div>) : (
const regex1 = /\{m\.content\}\s*<\/div><\/div>\) : \(/g;
console.log(content.match(regex1));
content = content.replace(regex1, '{m.content}\n</div></div></div>) : (');

// For the image generation:
const regex2 = /<\/button>\s*<\/div>\s*<\/div><\/div><\/div>\) : \(/g;
console.log(content.match(regex2));
content = content.replace(regex2, '</button>\n</div></div></div></div>) : (');

fs.writeFileSync('src/App.tsx', content);
