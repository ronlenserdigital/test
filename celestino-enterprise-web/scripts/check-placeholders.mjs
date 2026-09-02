import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const patterns = [/lorem ipsum/i, /in today's rapidly evolving/i, /whether you're a small business or/i, /at celestino, we understand/i, /unlock the power/i, /your trusted partner/i, /seamless/i, /cutting-edge/i, /next-generation/i, /\bTODO\b/, /\bFIXME\b/];
const roots = ["src/content", "src/app", "src/components"];
let bad = 0;
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|md)$/.test(f)) {
      const text = readFileSync(p, "utf8");
      for (const re of patterns) {
        const m = text.match(re);
        if (m) {
          console.error(`${p}: ${m[0]}`);
          bad++;
        }
      }
    }
  }
}
roots.forEach(walk);
if (bad) {
  console.error(`${bad} placeholder/slop hits`);
  process.exit(1);
}
console.log("no placeholder or forbidden copy found");
