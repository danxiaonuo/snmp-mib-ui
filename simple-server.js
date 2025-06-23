const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SNMP 网络监控平台</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 600px;
            width: 90%;
            backdrop-filter: blur(10px);
        }
        
        .logo {
            font-size: 3em;
            margin-bottom: 20px;
            color: #667eea;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .status {
            background: #27ae60;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            margin: 20px 0;
            font-size: 1.2em;
            font-weight: 500;
        }
        
        .info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border-left: 5px solid #667eea;
        }
        
        .info h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        .info p {
            margin: 8px 0;
            font-size: 1.1em;
            line-height: 1.6;
        }
        
        .api-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 25px;
        }
        
        .api-link {
            background: #3498db;
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .api-link:hover {
            background: #2980b9;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
        }
        
        .footer {
            margin-top: 30px;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🌐</div>
        <h1>SNMP 网络监控平台</h1>
        <div class="status">✅ 服务运行正常</div>
        
        <div class="info">
            <h3>📊 服务信息</h3>
            <p><strong>服务端口:</strong> 12300</p>
            <p><strong>服务状态:</strong> 正常运行</p>
            <p><strong>启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="info">
            <h3>🔗 API 测试链接</h3>
            <div class="api-links">
                <a href="/api/health" class="api-link">健康检查</a>
                <a href="/api/devices" class="api-link">设备列表</a>
                <a href="/api/mibs" class="api-link">MIB 管理</a>
                <a href="/api/monitoring" class="api-link">监控数据</a>
            </div>
        </div>
        
        <div class="footer">
            <p>SNMP MIB 网络监控平台 v2.0.0</p>
            <p>© 2024 网络监控解决方案</p>
        </div>
    </div>
</body>
</html>
  `;
  
  res.end(html);
});

// 处理进程信号，防止意外中断
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  });
});

const PORT = 12300;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🌐 SNMP监控平台启动成功');
  console.log(`📍 访问地址: http://0.0.0.0:${PORT}`);
  console.log(`🕒 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('💡 使用 Ctrl+C 安全关闭服务器');
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请检查其他服务`);
  } else {
    console.error('❌ 服务器错误:', err.message);
  }
  process.exit(1);
});