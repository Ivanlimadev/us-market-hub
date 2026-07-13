#!/usr/bin/env node
// Link the first mention of each ticker to its /stocks/ page in a Markdown post.
// Pure text transform — no DB, no network.
//
//   node scripts/link-tickers.mjs AAPL XOM CVX MU < post.md > linked.md
//   pbpaste | node scripts/link-tickers.mjs AAPL XOM CVX | pbcopy   # macOS clipboard
//
// For each SYMBOL it links the FIRST "Optional Company Name (SYMBOL)" occurrence
// that isn't already inside a Markdown link and isn't on a heading line. Pass
// exactly the tickers you want linked (the post's `tickers` array) — this avoids
// false positives like (CPI), (CEO), (AI).

import { readFileSync } from 'node:fs'

const symbols = process.argv.slice(2).map((s) => s.toUpperCase()).filter(Boolean)
if (symbols.length === 0) {
  console.error('Usage: node scripts/link-tickers.mjs SYM1 SYM2 ... < post.md > linked.md')
  process.exit(1)
}

let md = readFileSync(0, 'utf8') // stdin

for (const sym of symbols) {
  // Optional company name: up to 4 Capitalized words (allowing & . ' -) right
  // before "(SYM)". Case-sensitive so "(C)" ≠ "(c)".
  const namePart = String.raw`(?:[A-Z][A-Za-z0-9.&'’-]*(?:\s+[A-Z][A-Za-z0-9.&'’-]*){0,3}\s+)?`
  const re = new RegExp(`${namePart}\\(${sym}\\)`, 'g')

  let m
  while ((m = re.exec(md)) !== null) {
    const start = m.index
    const end = start + m[0].length

    // Skip if we're inside an existing Markdown link (text or URL part).
    const before = md.slice(Math.max(0, start - 80), start)
    if (/\][([][^)\]]*$/.test(before) || /\/stocks\/$/.test(before)) continue

    // Skip heading lines.
    const lineStart = md.lastIndexOf('\n', start - 1) + 1
    if (md[lineStart] === '#') continue

    // Wrap it, preserving any leading whitespace captured by namePart.
    const text = m[0]
    const lead = text.match(/^\s*/)[0]
    const core = text.slice(lead.length)
    md = md.slice(0, start) + `${lead}[${core}](/stocks/${sym})` + md.slice(end)
    break // first occurrence only
  }
}

process.stdout.write(md)
