import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'console.error("[Server] All clients in the pool failed. Sending graceful fallback mock response.");',
  'console.error(">>> REACHED FALLBACK MOCK RESPONSE BLOCK");'
);

content = content.replace(
  '    console.error("[Server] Chat handler total error:", err);',
  '    console.error(">>> REACHED OUTER CATCH BLOCK. ERROR:", err);'
);

content = content.replace(
  'console.warn(`[Server] ${provider.name} failed or was busy:`, err.message || err);',
  'console.warn(`>>> INNER CATCH: ${provider.name} failed or was busy:`, err.message || err);'
);

fs.writeFileSync('server.ts', content);
