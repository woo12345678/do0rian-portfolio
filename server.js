const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const port = Number(process.env.PORT || 4174);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.mjs':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.svg':'image/svg+xml' };
http.createServer((req,res)=>{
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const publicPath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const target = path.resolve(root, `.${publicPath}`);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(target,(error,data)=>{
    if(error){res.writeHead(error.code==='ENOENT'?404:500);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`DOORIAN portfolio: http://127.0.0.1:${port}`));
