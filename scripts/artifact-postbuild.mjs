// Turns dist-artifact/index.html (a full HTML document) into dist-artifact/lakou.html,
// a page body ready to publish as a claude.ai artifact: the host adds its own
// doctype, <head> and <body>, so those wrappers and the duplicate charset/viewport
// tags are removed here. Everything else keeps its order: title first, then styles,
// the CDN React scripts, the app script and the root element.
import { readFileSync, writeFileSync } from 'node:fs'

const src = new URL('../dist-artifact/index.html', import.meta.url)
const out = new URL('../dist-artifact/lakou.html', import.meta.url)

let html = readFileSync(src, 'utf8')
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>/i, '')
  .replace(/<head>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body>/i, '')
  .replace(/<\/body>/i, '')
  .replace(/<meta charset="UTF-8"\s*\/?>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .trim()

// Load the CDN React scripts before the app's own inline script.
const cdn = html.match(/<script src="https:\/\/cdn\.jsdelivr\.net\/[^"]+"><\/script>/g) || []
for (const tag of cdn) html = html.replace(tag, '')
html = html.replace('<script type="module"', `${cdn.join('\n')}\n<script type="module"`)

if (!html.startsWith('<title>')) {
  throw new Error('Expected the page to start with its <title>.')
}
writeFileSync(out, html + '\n')
console.log(`Wrote ${out.pathname} (${(html.length / 1024).toFixed(1)} KB)`)
