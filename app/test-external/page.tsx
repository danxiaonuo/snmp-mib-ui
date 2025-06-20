export default function TestExternalPage() {
  const currentTime = new Date().toISOString();
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🌐 SNMP 网络监控平台 - 外网访问测试</h1>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ 前端服务状态</h2>
        <p><strong>状态:</strong> 正常运行</p>
        <p><strong>端口:</strong> 12300</p>
        <p><strong>当前时间:</strong> {currentTime}</p>
        <p><strong>容器化部署:</strong> ✅ 成功</p>
        
        <h3>📊 服务信息</h3>
        <ul>
          <li>前端: Next.js 15 + React 19</li>
          <li>后端: Go 1.23 + Gin</li>
          <li>数据库: PostgreSQL 15</li>
          <li>缓存: Redis 7</li>
        </ul>
        
        <h3>🔗 API 端点</h3>
        <ul>
          <li>前端健康检查: <code>/api/health</code></li>
          <li>后端API: <code>http://localhost:17880/api/v1</code></li>
        </ul>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8',
          borderRadius: '5px'
        }}>
          <strong>🎉 如果您能看到此页面，说明前端服务可以正常外网访问！</strong>
        </div>
      </div>
    </div>
  );
}