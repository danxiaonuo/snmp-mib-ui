// 简单的测试服务器
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SNMP MIB Platform - Test Server</title>
    </head>
    <body>
      <h1>🌐 SNMP 网络监控平台</h1>
      <p>测试服务器正常运行</p>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Path: ${req.url}</p>
      <a href="/api/test">API测试</a>
    </body>
    </html>
  `);
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Test server running on http://0.0.0.0:3000');
});