import { renderDeadlineTimeline } from './timeline.mjs?v=deadlines-20261021';

const $ = (id) => document.getElementById(id);
const number = (n) => n.toLocaleString('en-US');
const rate = (row) => 100 * row.accepted / row.submissions;
const percent = (row) => `${rate(row).toFixed(1)}%`;
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataset, deadlines, years, selected, focusYear;
const tooltip = $('tooltip');

function hideTooltip() { tooltip.hidden = true; }
function showTooltip(event, row) {
  tooltip.innerHTML = `<strong>${escape(row.conference)} · ${row.year}</strong><em>${percent(row)}</em><br><span>投稿数量：${number(row.submissions)} 篇</span>`;
  tooltip.hidden = false;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX || rect.left + rect.width / 2;
  const y = event.clientY || rect.top;
  tooltip.style.left = `${Math.max(8, Math.min(x + 13, innerWidth - tooltip.offsetWidth - 12))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(y + 13, innerHeight - tooltip.offsetHeight - 12))}px`;
}

function renderChart(id, metric) {
  const isRate = metric === 'rate';
  const compact = innerWidth <= 740;
  const W = compact ? 340 : 560, H = compact ? 300 : 320;
  const left = compact ? 38 : 43, right = compact ? 113 : 125, top = 20, bottom = 39;
  const plotW = W - left - right, plotH = H - top - bottom;
  const allValues = dataset.records.map(r => isRate ? rate(r) : r.submissions);
  const step = isRate ? 10 : (Math.max(...allValues) > 10000 ? 5000 : 1000);
  const max = Math.ceil(Math.max(...allValues) / step) * step;
  const x = year => left + years.indexOf(year) * plotW / Math.max(1, years.length - 1);
  const y = value => top + plotH - value / max * plotH;
  const parts = [`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${isRate ? '录取率' : '投稿数量'}趋势，${years[0]}至${years.at(-1)}年。各数据点可用 Tab 键浏览。">`];
  parts.push(`<rect x="${x(focusYear)-14}" y="${top}" width="28" height="${plotH}" rx="4" fill="#f1f4f7"/>`);
  for (let v = 0; v <= max; v += step) {
    parts.push(`<line x1="${left}" y1="${y(v)}" x2="${W-right}" y2="${y(v)}" stroke="#e7ecf1" stroke-dasharray="3 4"/><text class="axis-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${isRate ? `${v}%` : number(v)}</text>`);
  }
  years.forEach(year => parts.push(`<text class="axis-label" x="${x(year)}" y="${H-13}" text-anchor="middle" ${year === focusYear ? 'style="fill:#142537;font-weight:600"' : ''}>${year}</text>`));
  const labels = [];
  dataset.conferences.filter(c => selected.has(c.id)).forEach(c => {
    const rows = dataset.records.filter(r => r.conference === c.id).sort((a,b) => a.year-b.year);
    const points = rows.map(r => `${x(r.year)},${y(isRate ? rate(r) : r.submissions)}`).join(' ');
    parts.push(`<polyline points="${points}" fill="none" stroke="${c.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
    rows.forEach(r => {
      const label = `${r.conference} ${r.year}，录取率 ${percent(r)}，投稿 ${number(r.submissions)} 篇。按回车查看该年度。`;
      parts.push(`<circle class="chart-point" cx="${x(r.year)}" cy="${y(isRate ? rate(r) : r.submissions)}" r="${r.year===focusYear ? 4.8 : 3.6}" fill="white" stroke="${c.color}" stroke-width="2" tabindex="0" role="button" aria-label="${label}" data-conference="${c.id}" data-year="${r.year}"><title>${label}</title></circle>`);
    });
    const last = rows.at(-1);
    if (last) labels.push({c, row:last, actualX:x(last.year), actual:y(isRate ? rate(last) : last.submissions)});
  });
  // Label spacing avoids collisions even when several conference rates are close.
  labels.sort((a,b)=>a.actual-b.actual);
  labels.forEach((l,i)=>l.labelY=Math.max(l.actual,i ? labels[i-1].labelY+19 : top+3));
  if (labels.length && labels.at(-1).labelY > H-bottom) {
    labels.at(-1).labelY = H-bottom;
    for(let i=labels.length-2;i>=0;i--) labels[i].labelY=Math.min(labels[i].labelY,labels[i+1].labelY-19);
  }
  labels.forEach(l=>{
    const label = `${l.c.id}${l.row.year < years.at(-1) ? ` ’${String(l.row.year).slice(-2)}` : ''}`;
    parts.push(`<path d="M ${l.actualX+5} ${l.actual} L ${W-right+17} ${l.labelY} L ${W-right+21} ${l.labelY}" fill="none" stroke="${l.c.color}" stroke-width=".8" opacity=".6"/><text class="series-label" x="${W-right+25}" y="${l.labelY+3}" fill="${l.c.color}">${label} ${isRate ? percent(l.row) : number(l.row.submissions)}</text>`);
  });
  if (!selected.size) parts.push(`<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="13" fill="#697787">请选择至少一个会议</text>`);
  parts.push('</svg>');
  $(id).innerHTML=parts.join('');
  $(id).querySelectorAll('.chart-point').forEach(point=>{
    const row=dataset.records.find(r=>r.conference===point.dataset.conference && r.year===Number(point.dataset.year));
    point.addEventListener('pointerenter',event=>showTooltip(event,row));
    point.addEventListener('pointermove',event=>showTooltip(event,row));
    point.addEventListener('pointerleave',hideTooltip);
    point.addEventListener('focus',event=>showTooltip(event,row));
    point.addEventListener('blur',hideTooltip);
    point.addEventListener('click',event=>{selectYear(row.year);showTooltip(event,row);});
    point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectYear(row.year);$(id).querySelector(`[data-conference="${row.conference}"][data-year="${row.year}"]`)?.focus();hideTooltip();}});
  });
}

function renderFilters() {
  $('filters').innerHTML=dataset.conferences.map(c=>`<button class="filter" type="button" style="--series:${c.color}" aria-pressed="${selected.has(c.id)}" data-id="${c.id}"><span class="dot"></span>${c.id}</button>`).join('');
  $('filters').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.id;
    selected.has(id)?selected.delete(id):selected.add(id);
    button.setAttribute('aria-pressed',selected.has(id));
    renderCharts();
  }));
}
function renderCharts(){hideTooltip();renderChart('rate-chart','rate');renderChart('count-chart','submissions');renderDeadlines();}
function renderDeadlines(){
  if(deadlines)renderDeadlineTimeline(deadlines,selected,Number($('deadline-year').value));
}
async function initDeadlines(){
  try{
    const response=await fetch('./data/deadlines.json');
    if(!response.ok)throw new Error('无法读取截止日期');
    deadlines=await response.json();
    $('deadline-year').innerHTML=deadlines.editions.slice().sort((a,b)=>b-a).map(year=>`<option value="${year}">${year} 届</option>`).join('');
    $('deadline-year').value=String(deadlines.defaultEdition);
    $('deadline-year').addEventListener('change',renderDeadlines);
    renderDeadlines();
    setInterval(renderDeadlines,60000);
  }catch(error){$('deadline-timeline').innerHTML='<p class="deadline-empty">截止日期暂时无法载入，请稍后刷新。</p>';console.error(error);}
}
function selectYear(year){focusYear=year;renderCharts();}
function filteredRows(){return dataset.records.filter(r=>($('table-conference').value==='all'||r.conference===$('table-conference').value)&&($('table-year').value==='all'||r.year===Number($('table-year').value))).sort((a,b)=>b.year-a.year||dataset.conferences.findIndex(c=>c.id===a.conference)-dataset.conferences.findIndex(c=>c.id===b.conference));}
function renderTable(){
  const rows=filteredRows();
  $('table-count').textContent=`${rows.length} 条记录`;
  $('data-table').innerHTML=rows.map(r=>{
    const c=dataset.conferences.find(c=>c.id===r.conference),s=r.sources[0];
    const links=r.sources.slice(1).map(s=>`<a class="supplemental" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a>`).join('');
    const kindLabel={institution:'机构报道',archive:'主席邮件存档',official:'官方来源'}[s.kind];
    return `<tr><td style="--series:${c.color}"><span class="dot"></span><strong>${c.id}</strong><span class="year">${r.year}</span></td><td class="numeric">${number(r.submissions)}</td><td class="numeric">${percent(r)}</td><td><span class="source-kind ${s.kind==='institution'?'institution':''}">${kindLabel}</span><a class="source-link" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a><details class="row-notes"><summary>统计口径与备注</summary><p>${escape(r.scope)}。${escape(r.displayNote??'')}<br>核验日期：${r.verifiedAt}。</p>${links}</details></td></tr>`;
  }).join('');
}
function downloadCSV(){
  const header=['conference','year','submissions','acceptance_rate_percent','scope','verified_at','sources'];
  const rows=filteredRows().map(r=>[r.conference,r.year,r.submissions,rate(r).toFixed(4),r.scope,r.verifiedAt,r.sources.map(s=>s.url).join(' | ')]);
  const csv='\uFEFF'+[header,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');
  a.href=url;a.download='conference-statistics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init(){
  try{
    const response=await fetch('./data/conferences.json');
    if(!response.ok)throw new Error('无法读取数据文件');
    dataset=await response.json();
    years=[...new Set(dataset.records.map(r=>r.year))].sort((a,b)=>a-b);
    focusYear=years.at(-1);selected=new Set(dataset.conferences.map(c=>c.id));
    $('year-range').textContent=`${years[0]}–${years.at(-1)}`;
    $('updated').textContent=`核验于 ${dataset.updatedAt.replaceAll('-','.')}`;
    $('table-conference').insertAdjacentHTML('beforeend',dataset.conferences.map(c=>`<option value="${c.id}">${c.id}</option>`).join(''));
    $('table-year').insertAdjacentHTML('beforeend',years.slice().reverse().map(y=>`<option value="${y}">${y}</option>`).join(''));
    $('table-conference').addEventListener('change',renderTable);$('table-year').addEventListener('change',renderTable);
    $('select-all').addEventListener('click',()=>{selected=new Set(dataset.conferences.map(c=>c.id));renderFilters();renderCharts();});
    $('clear-all').addEventListener('click',()=>{selected.clear();renderFilters();renderCharts();});
    $('download-csv').addEventListener('click',downloadCSV);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')hideTooltip();});
    window.addEventListener('scroll',hideTooltip,{passive:true});
    window.addEventListener('resize',()=>requestAnimationFrame(renderCharts));
    renderFilters();renderCharts();renderTable();
    $('loading').hidden=true;$('dashboard').hidden=false;
    await initDeadlines();
  }catch(error){$('loading').innerHTML='数据暂时无法载入。请刷新页面，或前往 <a href="https://github.com/FANXIN-Gmail/conference/tree/main/data">GitHub 查看原始数据 ↗</a>。';console.error(error);}
}
init();
