const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pages = ['boss-monster-arena.html','emberhaul.html','monstermate.html','moonloom.html','nightfall-exit-protocol.html','tiny-touchline.html'];
const viewports = [[1264,625],[1440,900],[390,844]];
const reviewDir = path.join(process.env.TEMP, 'do0rian-candidate-review');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(url) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function cdp(socketUrl) {
  const socket = new WebSocket(socketUrl);
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  };
  const ready = new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  return { ready, send(method, params = {}) { const id = ++nextId; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }, close() { socket.close(); } };
}

(async () => {
  const port = 4197;
  const debugPort = 9337;
  const server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${debugPort}`, '--no-first-run', '--disable-gpu', '--user-data-dir=' + path.join(process.env.TEMP, 'do0rian-geometry-chrome'), 'about:blank'], { stdio: 'ignore' });
  try {
    await waitFor(`http://127.0.0.1:${port}/`);
    await waitFor(`http://127.0.0.1:${debugPort}/json/version`);
    const target = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(item => item.type === 'page');
    const client = cdp(target.webSocketDebuggerUrl);
    await client.ready;
    await client.send('Page.enable');
    fs.mkdirSync(reviewDir, { recursive: true });
    for (const [width, height] of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
      for (const page of pages) {
        await client.send('Page.navigate', { url: `http://127.0.0.1:${port}/${page}` });
        await delay(180);
        const result = await client.send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
          const copy = document.querySelector('.rd-hero-copy').getBoundingClientRect();
          const media = document.querySelector('.rd-hero-media').getBoundingClientRect();
          const overflowingText = [...document.querySelectorAll('h1,h2,h3,p,a,span,strong,figcaption')]
            .filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1)
            .map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 60), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
          const overlap = copy.left < media.right && copy.right > media.left && copy.top < media.bottom && copy.bottom > media.top;
          return { overflowingText, overlap, documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth };
        })()` });
        const geometry = result.result.value;
        assert.deepStrictEqual(geometry.overflowingText, [], `${page} at ${width}x${height}: text overflow ${JSON.stringify(geometry.overflowingText)}`);
        assert.strictEqual(geometry.overlap, false, `${page} at ${width}x${height}: hero text overlaps media`);
        assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${page} at ${width}x${height}: horizontal overflow ${geometry.documentWidth}/${geometry.viewportWidth}`);
        if ((width === 1264 && height === 625) || (width === 390 && height === 844)) {
          const capture = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          fs.writeFileSync(path.join(reviewDir, page.replace('.html', `-${width}x${height}.png`)), Buffer.from(capture.data, 'base64'));
        }
      }
    }
    client.close();
    console.log(`candidate page geometry tests passed (${pages.length} pages × ${viewports.length} viewports)`);
  } finally {
    server.kill();
    chrome.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
