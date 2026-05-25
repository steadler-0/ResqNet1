import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components');

const map = [
  [/border-cyan-500/g, 'border-secondary'],
  [/border-cyan-400/g, 'border-secondary'],
  [/text-cyan-400/g, 'text-secondary'],
  [/text-cyan-300/g, 'text-secondary'],
  [/text-cyan-200/g, 'text-primary'],
  [/bg-cyan-500/g, 'bg-secondary'],
  [/bg-cyan-400/g, 'bg-secondary'],
  [/bg-zinc-950\/50/g, 'bg-slate-surface'],
  [/bg-zinc-950\/40/g, 'bg-slate-muted'],
  [/bg-black\/50/g, 'bg-white'],
  [/bg-black\/40/g, 'bg-slate-muted'],
  [/bg-black\/30/g, 'bg-slate-muted'],
  [/border-zinc-800/g, 'border-primary/10'],
  [/text-zinc-200/g, 'text-primary'],
  [/text-zinc-400/g, 'text-secondary'],
  [/text-zinc-500/g, 'text-secondary'],
  [/text-zinc-600/g, 'text-secondary'],
  [/text-white/g, 'text-primary'],
  [/bg-black/g, 'bg-slate-muted'],
  [/from-cyan-/g, 'from-secondary-'],
  [/to-cyan-/g, 'to-secondary-'],
  [/ring-cyan-/g, 'ring-secondary/'],
  [/shadow-\[0_0_[^\]]+\]/g, 'shadow-soft'],
  [/backdrop-blur-xl/g, ''],
  [/animate-pulse-glow/g, 'ring-2 ring-secondary/20'],
  [/rgba\(34,\s*211,\s*238/g, 'rgba(84, 122, 149'],
  [/#22d3ee/g, '#547A95'],
];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      for (const [re, rep] of map) c = c.replace(re, rep);
      fs.writeFileSync(p, c);
      console.log('themed', p);
    }
  }
}

walk(root);
walk(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'sections'));
