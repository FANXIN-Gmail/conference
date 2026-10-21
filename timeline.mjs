const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS = { closed:'#6f7882', upcoming:'#247cba' };

export function deadlineState(record, now = Date.now()) {
  if (record.status !== 'announced') return record.status;
  return Date.parse(record.deadlineAt) <= now ? 'closed' : 'upcoming';
}

export function renderDeadlineTimeline(data, selected, edition, now = Date.now()) {
  const container = document.getElementById('deadline-timeline');
  const pending = document.getElementById('deadline-pending');
  const rows = data.records.filter(r => r.year === edition && selected.has(r.conference));
  const announced = rows.filter(r => r.status === 'announced').sort((a,b) => a.date.localeCompare(b.date));
  const unknown = rows.filter(r => r.status === 'unannounced');
  const notHeld = rows.filter(r => r.status === 'not-held');
  const links = items => items.map(r => `<a href="${escape(r.sources[0].url)}" target="_blank" rel="noopener noreferrer">${escape(r.conference)} ↗</a>`).join('、');
  pending.innerHTML = [unknown.length ? `尚未公布：${links(unknown)}` : '', notHeld.length ? `${links(notHeld)} ${edition} 届不举办` : ''].filter(Boolean).join('　·　');
  pending.hidden = !pending.textContent;
  if (!announced.length) {
    container.innerHTML = `<p class="deadline-empty">${selected.size ? '所选会议暂无已公布的截止日期' : '请选择至少一个会议'}</p>`;
    return;
  }

  // Place dates on a calendar scale; label lanes keep nearby deadlines readable.
  const dateValue = date => Date.parse(`${date}T00:00:00Z`);
  const first = new Date(dateValue(announced[0].date));
  const last = new Date(dateValue(announced.at(-1).date));
  const start = Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),1);
  const end = Date.UTC(last.getUTCFullYear(),last.getUTCMonth()+1,1);
  const W=1100,left=28,right=28;
  const x = value => left+(value-start)/(end-start)*(W-left-right);
  const laneEnds=[];
  const points=announced.map(r=>{
    const actualX=x(dateValue(r.date));
    const labelX=Math.max(left+62,Math.min(W-right-62,actualX));
    let lane=laneEnds.findIndex(endX=>labelX-62>endX+10);
    if(lane<0)lane=laneEnds.length;
    laneEnds[lane]=labelX+62;
    return {r,actualX,labelX,lane};
  });
  const axisY=103+46*(laneEnds.length-1), H=axisY+49;
  const parts=[`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${edition} 届会议全文投稿截止日期，灰色表示已截止">`];
  parts.push(`<line x1="${left}" x2="${W-right}" y1="${axisY}" y2="${axisY}" stroke="#dce3ea" stroke-width="2"/>`);
  for(let month=new Date(start);month.getTime()<=end;month.setUTCMonth(month.getUTCMonth()+1)){
    const position=x(month.getTime());
    const label=month.getTime()===start||month.getUTCMonth()===0?`${month.getUTCFullYear()}.${String(month.getUTCMonth()+1).padStart(2,'0')}`:String(month.getUTCMonth()+1).padStart(2,'0');
    parts.push(`<line x1="${position}" x2="${position}" y1="${axisY+9}" y2="${axisY+14}" stroke="#dce3ea"/><text class="axis-label" x="${position}" y="${axisY+32}" text-anchor="middle">${label}</text>`);
  }
  const today=Date.UTC(new Date(now).getFullYear(),new Date(now).getMonth(),new Date(now).getDate());
  if(today>=start&&today<=end)parts.push(`<line x1="${x(today)}" x2="${x(today)}" y1="12" y2="${axisY+8}" stroke="#d46a48" stroke-dasharray="3 4" opacity=".65"/><text x="${x(today)}" y="10" text-anchor="middle" font-size="10" fill="#b46d54">今天</text>`);
  for(const {r,actualX,labelX,lane} of points){
    const state=deadlineState(r,now),color=COLORS[state];
    const labelY=axisY-57-lane*46;
    const prereqClosed=r.prerequisite&&Date.parse(r.prerequisite.deadlineAt)<=now;
    const caption=state==='upcoming'&&prereqClosed?`${r.prerequisite.label}已截止`:r.kind;
    const detail=[`${r.conference} ${r.year}`,`${r.date} ${r.timeLabel}`,r.kind,state==='closed'?'投稿已截止':'全文尚未截止',r.prerequisite?`${r.prerequisite.label}：${r.prerequisite.date} ${r.prerequisite.timeLabel}`:'',r.note].filter(Boolean).join('；');
    parts.push(`<a class="deadline-link ${state}" href="${escape(r.sources[0].url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(detail)}"><title>${escape(detail)}</title><path d="M ${actualX} ${axisY-6} L ${actualX} ${labelY+40} L ${labelX} ${labelY+40}" fill="none" stroke="${color}" stroke-width="1" opacity=".6"/><circle cx="${actualX}" cy="${axisY}" r="5" fill="white" stroke="${color}" stroke-width="2.5"/><text x="${labelX}" y="${labelY}" text-anchor="middle" fill="${color}" font-size="13" font-weight="600">${escape(r.conference)}</text><text x="${labelX}" y="${labelY+18}" text-anchor="middle" fill="${color}" font-size="12">${r.date.slice(5).replace('-','/')}</text><text x="${labelX}" y="${labelY+33}" text-anchor="middle" fill="${color}" font-size="10">${escape(caption)}</text></a>`);
  }
  parts.push('</svg>');
  container.innerHTML=parts.join('');
}
