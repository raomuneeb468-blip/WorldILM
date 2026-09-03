import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace the state variables that were not removed
content = content.replace(/const \[currentUser, setCurrentUser\] = useState[^;]+;/g, '');
content = content.replace(/const \[authLoading, setAuthLoading\] = useState[^;]+;/g, '');

// remove onAuthStateChanged block again
const authStateStart = content.indexOf('const unsubscribeAuth = auth.onAuthStateChanged');
if (authStateStart !== -1) {
    const authStateEnd = content.indexOf('return () => unsubscribeAuth();', authStateStart);
    if (authStateEnd !== -1) {
        content = content.substring(0, authStateStart) + content.substring(authStateEnd + 'return () => unsubscribeAuth();\n    }, []);'.length);
    }
}

// remove references to auth.currentUser saving
content = content.replace(/if \(auth\.currentUser\)\s*\{\s*const userDocRef = doc\(db, "users", auth\.currentUser\.uid\);\s*await setDoc\(userDocRef, \{[\s\S]*?\} \);\s*\}/g, '');

// replace the api key fetch and db functions
content = content.replace(/const keysCol = collection\(db, "api_keys"\);[\s\S]*?setApiKeys\(fetchedKeys\);/m, 'setApiKeys([]);');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      const payload = \{[\s\S]*?await setDoc\(keyDocRef, payload\);/m, '');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      await setDoc\(keyDocRef, \{ active: !currentActive \}, \{ merge: true \}\);/m, '');
content = content.replace(/const keyDocRef = doc\(db, "api_keys", keyId\);\n      await deleteDoc\(keyDocRef\);/m, '');

// remove unused completeOnboarding arguments
content = content.replace(/onClick=\{\(\) => completeOnboarding\(true\)\}/g, 'onClick={() => completeOnboarding()}');
content = content.replace(/onClick=\{\(\) => completeOnboarding\(false\)\}/g, 'onClick={() => completeOnboarding()}');


fs.writeFileSync('src/App.tsx', content);
