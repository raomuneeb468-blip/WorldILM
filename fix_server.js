import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Remove firebase imports
content = content.replace(/import \{ initializeApp \} from "firebase\/app";\n/g, '');
content = content.replace(/import \{ getFirestore, collection, getDocs \} from "firebase\/firestore";\n/g, '');

// Remove firebase initialization block
content = content.replace(/\/\/ Initialize Firebase client in Server[\s\S]*?const db = getFirestore\(firebaseApp\);\n/g, '');

// Replace getKeysFromFirestore implementation
content = content.replace(/async function getKeysFromFirestore\(\): Promise<any\[\]> \{[\s\S]*?\}\n/g, 'async function getKeysFromFirestore(): Promise<any[]> {\n  return [];\n}\n');

fs.writeFileSync('server.ts', content);
