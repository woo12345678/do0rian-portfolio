'use strict';

const assert = require('assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = 43000 + Math.floor(Math.random() * 1000);
const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

function request(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathname }, response => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    req.on('error', reject);
  });
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if (await request('/') === 200) return;
    } catch (error) {
      if (error.code !== 'ECONNREFUSED') throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('local server did not become ready');
}

(async () => {
  try {
    await waitUntilReady();
    assert.strictEqual(await request('/games/vault-click/v1.0.0/'), 200, 'directory URL should serve index.html');
    assert.strictEqual(await request('/games/stitchkeeper/v1.0.0/'), 200, 'second directory URL should serve index.html');
    assert.strictEqual(await request('/missing-page.html'), 404, 'missing files should return 404');
    assert.strictEqual(await request('/%E0%A4%A'), 400, 'malformed URL encoding should return 400 without crashing');
    assert.strictEqual(await request('/..%5cdo0rian-portfolio-sibling%5csecret.txt'), 403, 'sibling-prefix traversal should be forbidden');
    assert.strictEqual(await request('/'), 200, 'server should remain healthy after error requests');
    console.log('PASS: local static server routing, containment, and error handling');
  } finally {
    server.kill();
  }
})().catch(error => {
  server.kill();
  console.error(error);
  process.exitCode = 1;
});
