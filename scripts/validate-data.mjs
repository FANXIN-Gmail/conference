import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(path.join(root,'data/conferences.json'),'utf8'));
const ids = new Set(data.conferences.map(c=>c.id));
assert.equal(ids.size,data.conferences.length,'Conference IDs must be unique');
assert.equal(data.schemaVersion,1);
assert.match(data.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
const seen=new Set();
for(const row of data.records){
  assert(ids.has(row.conference),`Unknown conference ${row.conference}`);
  const key=`${row.conference}-${row.year}`;
  assert(!seen.has(key),`Duplicate ${key}`);seen.add(key);
  assert(Number.isInteger(row.year)&&row.year>=data.window.start&&row.year<=data.window.end,key);
  assert(Number.isInteger(row.accepted)&&row.accepted>0,key);
  assert(Number.isInteger(row.submissions)&&row.submissions>=row.accepted,key);
  assert(row.reportedRate===null||(typeof row.reportedRate==='number'&&row.reportedRate>0&&row.reportedRate<=100),key);
  assert(row.note.length>20&&row.scope.length>0,`Missing provenance note ${key}`);
  assert.match(row.verifiedAt,/^\d{4}-\d{2}-\d{2}$/);
  assert(row.sources.length>0,key);
  for(const source of row.sources){
    assert(['official','institution','archive'].includes(source.kind),key);
    assert(source.title.length>0,key);
    assert.equal(new URL(source.url).protocol,'https:',key);
  }
}
for(const c of data.conferences){
  assert.match(c.color,/^#[0-9a-f]{6}$/i);
  const eventYears=c.eventYears??Array.from({length:data.window.end-data.window.start+1},(_,i)=>data.window.start+i);
  assert(eventYears.length>0&&new Set(eventYears).size===eventYears.length,`Invalid event years ${c.id}`);
  for(const y of eventYears){
    assert(Number.isInteger(y)&&y>=data.window.start&&y<=data.window.end,`Invalid event year ${c.id} ${y}`);
    assert(seen.has(`${c.id}-${y}`),`Missing ${c.id} ${y}`);
  }
  for(const row of data.records.filter(r=>r.conference===c.id))assert(eventYears.includes(row.year),`Conference not held: ${c.id} ${row.year}`);
  if(c.ranking){
    assert.equal(c.ranking.rank,'A*');
    assert.equal(new URL(c.ranking.url).hostname,'portal.core.edu.au');
  }
}
const csvPath=path.join(root,'data/conferences.csv');
const header=['conference','year','submissions','acceptance_rate_percent','scope','verified_at','sources'];
const rows=data.records.map(r=>[r.conference,r.year,r.submissions,(100*r.accepted/r.submissions).toFixed(4),r.scope,r.verifiedAt,r.sources.map(s=>s.url).join(' | ')]);
const csv='\uFEFF'+[header,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')+'\n';
if(process.argv.includes('--write-csv'))writeFileSync(csvPath,csv);
else assert(existsSync(csvPath)&&readFileSync(csvPath,'utf8')===csv,'CSV is stale. Run: node scripts/validate-data.mjs --write-csv');
for(const file of ['index.html','styles.css','app.js','timeline.mjs','favicon.svg','.nojekyll'])assert(existsSync(path.join(root,file)),`Missing site asset ${file}`);
console.log(`Validated ${data.records.length} records, ${ids.size} conferences, ${data.window.start}–${data.window.end}. CSV is consistent.`);

const deadlines=JSON.parse(readFileSync(path.join(root,'data/deadlines.json'),'utf8'));
assert.equal(deadlines.schemaVersion, 2);
assert(Number.isInteger(deadlines.edition), 'Expected a single conference edition');
assert.match(deadlines.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
const deadlineIds = new Set();
for (const row of deadlines.records) {
  const key = `${row.conference} ${deadlines.edition}`;
  assert.match(row.conference, /^[A-Za-z][A-Za-z0-9-]*$/, key);
  assert(!deadlineIds.has(row.conference), `Duplicate deadline for ${key}`);
  deadlineIds.add(row.conference);
  assert.equal(new URL(row.source).protocol, 'https:', key);
  assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
  assert([deadlines.edition - 1, deadlines.edition].includes(Number(row.date.slice(0, 4))), key);
  assert.match(row.deadlineAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  assert(Number.isFinite(Date.parse(row.deadlineAt)), `Invalid deadline ${key}`);
  assert(row.timeLabel.length > 0, key);
  const calendarDay = new Date(row.date + 'T00:00:00Z');
  assert.equal(calendarDay.toISOString().slice(0, 10), row.date, key);
  if (row.timeLabel.includes('日终')) {
    calendarDay.setUTCDate(calendarDay.getUTCDate() + 1);
    assert.equal(row.deadlineAt.slice(11, 19), '00:00:00', key);
  }
  assert.equal(row.deadlineAt.slice(0, 10), calendarDay.toISOString().slice(0, 10), key);
}
console.log(`Validated ${deadlineIds.size} full-paper deadlines for ${deadlines.edition}.`);
