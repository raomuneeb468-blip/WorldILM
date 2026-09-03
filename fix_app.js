import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Define dummy functions and state
content = content.replace(/export default function App\(\) \{/, `export default function App() {
  const currentUser: any = null;
  const authLoading = false;
  const handleSignIn = async () => {};
  const completeOnboarding = async () => {};
`);

// 1. Remove the entire unsubscribeAuth block which has getDoc etc
const authEffectRegex = /const unsubscribeAuth = auth\.onAuthStateChanged\([\s\S]*?return \(\) => unsubscribeAuth\(\);\n    \}, \[\]\);/m;
content = content.replace(authEffectRegex, '');

// 2. Remove all `if (auth.currentUser) { ... setDoc ... }`
content = content.replace(/if \(auth\.currentUser\) \{[\s\S]*?await setDoc\(userDocRef, \{[\s\S]*?\} \);\n      \}/gm, '');

// 3. Remove api keys fetch/update
content = content.replace(/const keysCol = collection\(db, "api_keys"\);[\s\S]*?setApiKeys\(fetchedKeys\);/m, 'setApiKeys([]);');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      const payload = \{[\s\S]*?await setDoc\(keyDocRef, payload\);/m, '');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      await setDoc\(keyDocRef, \{ active: !currentActive \}, \{ merge: true \}\);/m, '');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      await deleteDoc\(keyDocRef\);/m, '');

// 4. Remove update session user doc logic
content = content.replace(/const userDocRef = doc\(db, "users", currentUser\.uid\);\n      await setDoc\(userDocRef, \{[\s\S]*?\}, \{ merge: true \} \);/gm, '');

// 5. Remove `auth.signOut()`
content = content.replace(/await auth\.signOut\(\);/g, '');

fs.writeFileSync('src/App.tsx', content);
