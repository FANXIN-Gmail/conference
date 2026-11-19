const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS = { closed:'#6f7882', upcoming:'#247cba' };

export function renderDeadlineTimeline(data, selected, now = Date.now()) {
  const container = document.getElementById('deadline-timeline');
  const records = data.records.filter(r => selected.has(r.conference))
    .sort((a, b) => Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt));
  if (!records.length) {
    container.innerHTML = `<p class="deadline-empty">${selected.size ? '暂无已公布的全文截止时间' : '请选择至少一个会议'}</p>`;
    return;
  }

  // Place each deadline on its official calendar date, even across time zones.
  const dateValue = date => Date.parse(`${date}T00:00:00Z`);
  const dates = records.map(record => dateValue(record.date));
  const first = new Date(Math.min(...dates));
  const last = new Date(Math.max(...dates));
  const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1);
  const width = 1100, margin = 32, labelHalfWidth = 98;
  const x = value => margin + (value - start) / (end - start) * (width - 2 * margin);
  const laneEnds = [];
  const points = records.map(record => {
    const actualX = x(dateValue(record.date));
    const labelX = Math.max(labelHalfWidth, Math.min(width - labelHalfWidth, actualX));
    let lane = laneEnds.findIndex(right => labelX - labelHalfWidth > right + 8);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = labelX + labelHalfWidth;
    return {record, actualX, labelX, lane};
  });

  const laneHeight = 51;
  const axisY = laneHeight * laneEnds.length + 12;
  const parts = [`<svg viewBox="0 0 ${width} ${axisY + 38}" role="group" aria-label="${data.edition} 届会议全文投稿截止时间">
    <line x1="${margin}" x2="${width - margin}" y1="${axisY}" y2="${axisY}" stroke="#dce3ea" stroke-width="2"/>`];
  for (let month = new Date(start); month.getTime() < end; month.setUTCMonth(month.getUTCMonth() + 1)) {
    const position = x(month.getTime());
    const label = month.getTime() === start || month.getUTCMonth() === 0
      ? `${month.getUTCFullYear()}.${String(month.getUTCMonth() + 1).padStart(2, '0')}`
      : String(month.getUTCMonth() + 1).padStart(2, '0');
    parts.push(`<line x1="${position}" x2="${position}" y1="${axisY + 7}" y2="${axisY + 12}" stroke="#dce3ea"/>
      <text class="axis-label" x="${position}" y="${axisY + 29}" text-anchor="middle">${label}</text>`);
  }
  const links = [];
  for (const {record, actualX, labelX, lane} of points) {
    const state = Date.parse(record.deadlineAt) <= now ? 'closed' : 'upcoming';
    const color = COLORS[state];
    const labelY = axisY - 42 - lane * laneHeight;
    const deadline = escape(`${record.date} ${record.timeLabel}`);
    parts.push(`<path d="M ${actualX} ${axisY - 5} V ${labelY + 27} H ${labelX}" fill="none" stroke="${color}" opacity=".5"/>`);
    links.push(`<a class="deadline-link ${state}" href="${escape(record.source)}" target="_blank" rel="noopener noreferrer"
        aria-label="${escape(record.conference)} ${data.edition}，${deadline}">
      <rect x="${labelX - labelHalfWidth}" y="${labelY - 16}" width="${2 * labelHalfWidth}" height="39" fill="white"/>
      <line class="deadline-marker" x1="${actualX}" x2="${actualX}" y1="${axisY - 5}" y2="${axisY + 5}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <text x="${labelX}" y="${labelY}" text-anchor="middle" fill="${color}" font-size="15" font-weight="600">${escape(record.conference)}</text>
      <text x="${labelX}" y="${labelY + 19}" text-anchor="middle" fill="${color}" font-size="13">${deadline}</text>
    </a>`);
  }
  parts.push(...links, '</svg>');
  container.innerHTML = parts.join('');
}
