import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hashes = new Set(); let pages = 0;
async function scan(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await scan(path);
    else if (entry.name.endsWith('.html')) {
      pages++;
      const html = await readFile(path,'utf8');
      for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (!/\bsrc\s*=/i.test(match[1]) && match[2]) hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
      }
    }
  }
}
await scan('out');
if (!pages || !hashes.size) throw Error('Missing static export: refusing to generate an empty CSP');
await writeFile('services/site/generated-csp.ts',`// Generated from static HTML; regenerate for every deployment.\nexport const scriptHashes: string[] = ${JSON.stringify([...hashes].sort())};\n`);
console.log(`CSP generated for ${pages} HTML pages (${hashes.size} hashes)`);
