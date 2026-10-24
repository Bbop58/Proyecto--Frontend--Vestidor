const fs = require('fs');
const path = require('path');

const backendUrl = process.env.API_URL || process.env.BACKEND_URL;
if (backendUrl) {
  let cleanUrl = backendUrl.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (!cleanUrl.endsWith('/api/v1')) {
    cleanUrl = `${cleanUrl}/api/v1`;
  }
  const envProdPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
  const content = `export const environment = {\n  production: true,\n  apiUrl: '${cleanUrl}'\n};\n`;
  fs.writeFileSync(envProdPath, content, 'utf8');
  console.log(`[set-env] Successfully configured environment.prod.ts with apiUrl: ${cleanUrl}`);
} else {
  console.log('[set-env] No API_URL or BACKEND_URL env var found. Using existing environment.prod.ts');
}
