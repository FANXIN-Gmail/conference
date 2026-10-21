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
assert.equal(deadlines.schemaVersion,1);
assert.match(deadlines.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Set(deadlines.editions).size,deadlines.editions.length);
assert(deadlines.editions.includes(deadlines.defaultEdition));
const deadlineKeys=new Set();
function validateMoment(moment,key){
  assert.match(moment.date,/^\d{4}-\d{2}-\d{2}$/);
  assert.match(moment.deadlineAt,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  assert(Number.isFinite(Date.parse(moment.deadlineAt)),`Invalid deadline ${key}`);
  assert(moment.timeLabel.length>0,key);
  const expectedDate=moment.timeLabel.includes('日终')?new Date(Date.parse(moment.date+'T00:00:00Z')+86400000).toISOString().slice(0,10):moment.date;
  assert.equal(moment.deadlineAt.slice(0,10),expectedDate,`Calendar date mismatch ${key}`);
}
for(const row of deadlines.records){
  const key=`${row.conference}-${row.year}`;
  assert(ids.has(row.conference)&&deadlines.editions.includes(row.year),key);
  assert(!deadlineKeys.has(key),`Duplicate deadline ${key}`);deadlineKeys.add(key);
  assert(['announced','unannounced','not-held'].includes(row.status),key);
  assert(row.note.length>15&&row.kind.length>0,key);
  assert.match(row.verifiedAt,/^\d{4}-\d{2}-\d{2}$/);
  assert(row.sources.length>0,key);
  for(const source of row.sources){assert.equal(source.kind,'official',key);assert.equal(new URL(source.url).protocol,'https:',key);}
  if(row.status==='announced'){
    validateMoment(row,key);
    assert([row.year-1,row.year].includes(Number(row.date.slice(0,4))),key);
    if(row.prerequisite){
      validateMoment(row.prerequisite,key);
      assert(row.prerequisite.label.length>0,key);
      assert(Date.parse(row.prerequisite.deadlineAt)<Date.parse(row.deadlineAt),`Prerequisite must precede paper deadline ${key}`);
    }
  }else{
    assert.equal(row.date,null,key);assert.equal(row.deadlineAt,null,key);
    if(row.status==='not-held')assert((row.conference==='ICCV'&&row.year%2===0)||(row.conference==='ECCV'&&row.year%2===1),key);
  }
}
for(const year of deadlines.editions)for(const id of ids)assert(deadlineKeys.has(`${id}-${year}`),`Missing deadline/status ${id} ${year}`);
console.log(`Validated ${deadlines.records.length} official deadline/status entries; default edition ${deadlines.defaultEdition}.`);
