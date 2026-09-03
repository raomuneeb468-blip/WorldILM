import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const db: any = null;/, `const db: any = null;\nconst currentUser: any = null;`);

fs.writeFileSync('src/App.tsx', content);
