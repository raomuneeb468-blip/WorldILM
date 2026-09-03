import fs from 'fs';
import ts from 'typescript';

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
// Just finding the error
// Actually, `npx tsc --noEmit` will show the error properly.
