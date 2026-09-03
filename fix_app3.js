import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const stubs = `
const db: any = null;
const auth: any = { currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} };
const doc: any = () => ({});
const setDoc: any = async () => {};
const getDoc: any = async () => ({ exists: () => false });
const updateDoc: any = async () => {};
const deleteDoc: any = async () => {};
const collection: any = () => {};
const getDocs: any = async () => ({ docs: [] });
const setCurrentUser: any = () => {};
const setAuthLoading: any = () => {};

export default function App() {
`;

content = content.replace(/export default function App\(\) \{[\s\S]*?(?=  \/\/ \-\-\- States \-\-\-)/m, stubs);

fs.writeFileSync('src/App.tsx', content);
