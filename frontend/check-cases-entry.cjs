const http = require('http');
function put(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 9333, path, method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const boot = `sessionStorage.setItem('dft-session', JSON.stringify({username:'1000000000102',role:'director',person:'นางสาวเบญจมาภรณ์ พรมเพิ่ม'}));`;
(async () => {
  const tab = await put('/json/new');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
    else events.push(msg);
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: boot });
  const loaded = new Promise((resolve) => {
    const t = setInterval(() => {
      if (events.some((m) => m.method === 'Page.loadEventFired')) { clearInterval(t); resolve(); }
    }, 40);
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:4200/cases' });
  await loaded;
  await sleep(900);
  await send('Runtime.evaluate', { expression: `(() => { const input=document.querySelector('input'); input.value='AC1002'; input.dispatchEvent(new Event('input',{bubbles:true})); })()` });
  await sleep(400);
  const clicked = (await send('Runtime.evaluate', { expression: `(() => { const row=[...document.querySelectorAll('tr')].find(el => el.textContent.includes('AC1002')); const button=[...(row?row.querySelectorAll('button'):[])].find(el => el.textContent.includes('เปิดแบบฟอร์ม')); if (!button) return 'no'; button.click(); return 'ok'; })()`, returnByValue: true })).result.result.value;
  await sleep(1200);
  const href = (await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })).result.result.value;
  const text = (await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true })).result.result.value || '';
  console.log(clicked, href);
  console.log(text.includes('REF256710210001') && text.includes('หลอดหรือท่อ') ? 'ok' : 'fail');
  await send('Target.closeTarget', { targetId: tab.id });
  ws.close();
})().catch((e) => { console.error(e); process.exit(1); });
