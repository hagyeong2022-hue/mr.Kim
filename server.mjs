import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'dashboard.html' : req.url);

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  if (extname === '.json') contentType = 'application/json';
  else if (extname === '.js') contentType = 'text/javascript';
  else if (extname === '.css') contentType = 'text/css';

  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('파일을 찾을 수 없습니다');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`✅ 대시보드 서버 실행 중`);
  console.log(`📍 URL: http://${HOST}:${PORT}/dashboard.html`);
  console.log(`⏹️  종료: Ctrl+C`);
});
