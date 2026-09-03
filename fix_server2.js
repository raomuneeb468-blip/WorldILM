import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// I will just look for `async function getKeysFromFirestore` and then `async function buildActiveProviderPool`
const startIdx = content.indexOf('async function getKeysFromFirestore');
const endIdx = content.indexOf('async function buildActiveProviderPool');

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + 'async function getKeysFromFirestore(): Promise<any[]> {\n  return [];\n}\n\n' + content.substring(endIdx);
}

fs.writeFileSync('server.ts', content);
