"use client"

// 禁用静态生成，因为需要客户端API
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Wifi, 
  Download, 
  TouchpadOff, 
  Zap, 
  Monitor,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

export default function MobileTestPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [pwaInfo, setPwaInfo] = useState<any>({})
  const [touchTest, setTouchTest] = useState(false)

  useEffect(() => {
    // 检测设备信息
    const detectDevice = () => {
      const userAgent = navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasNotifications = 'Notification' in window
      
      setDeviceInfo({
        userAgent: userAgent.substring(0, 100) + '...',
        isMobile,
        isIOS,
        isAndroid,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        isOnline: navigator.onLine,
        touchSupport: 'ontouchstart' in window
      })

      setPwaInfo({
        isStandalone,
        hasServiceWorker,
        hasNotifications,
        manifestSupport: 'serviceWorker' in navigator,
        installPromptSupported: 'beforeinstallprompt' in window
      })
    }

    detectDevice()

    // 监听在线状态变化
    const handleOnlineChange = () => {
      setDeviceInfo(prev => ({ ...prev, isOnline: navigator.onLine }))
    }

    window.addEventListener('online', handleOnlineChange)
    window.addEventListener('offline', handleOnlineChange)

    return () => {
      window.removeEventListener('online', handleOnlineChange)
      window.removeEventListener('offline', handleOnlineChange)
    }
  }, [])

  const testTouch = () => {
    setTouchTest(true)
    setTimeout(() => setTouchTest(false), 1000)
  }

  const testPWAInstall = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          alert('✅ Service Worker 已注册')
        } else {
          alert('❌ Service Worker 未注册')
        }
      } catch (error) {
        alert('❌ Service Worker 检查失败: ' + error)
      }
    } else {
      alert('❌ 浏览器不支持 Service Worker')
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">📱 移动端测试页面</h1>
        <p className="text-muted-foreground">检测移动端优化和 PWA 功能</p>
      </div>

      {/* 设备信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            设备信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>移动设备:</strong>
              <Badge variant={deviceInfo.isMobile ? "default" : "secondary"} className="ml-2">
                {deviceInfo.isMobile ? "是" : "否"}
              </Badge>
            </div>
            <div>
              <strong>操作系统:</strong>
              <Badge variant="outline" className="ml-2">
                {deviceInfo.isIOS ? "iOS" : deviceInfo.isAndroid ? "Android" : "其他"}
              </Badge>
            </div>
            <div>
              <strong>屏幕尺寸:</strong>
              <span className="ml-2">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</span>
            </div>
            <div>
              <strong>视口尺寸:</strong>
              <span className="ml-2">{deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}</span>
            </div>
            <div>
              <strong>像素比:</strong>
              <span className="ml-2">{deviceInfo.pixelRatio}x</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>网络状态:</strong>
              <StatusIcon status={deviceInfo.isOnline} />
              <span>{deviceInfo.isOnline ? "在线" : "离线"}</span>
            </div>
          </div>
          
          <div>
            <strong>User Agent:</strong>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {deviceInfo.userAgent}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PWA 功能测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            PWA 功能检测
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <span>独立模式 (PWA 已安装)</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={pwaInfo.isStandalone} />
                <Badge variant={pwaInfo.isStandalone ? "default" : "secondary"}>
                  {pwaInfo.isStandalone ? "是" : "否"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Service Worker 支持</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={pwaInfo.hasServiceWorker} />
                <Badge variant={pwaInfo.hasServiceWorker ? "default" : "secondary"}>
                  {pwaInfo.hasServiceWorker ? "支持" : "不支持"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>推送通知支持</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={pwaInfo.hasNotifications} />
                <Badge variant={pwaInfo.hasNotifications ? "default" : "secondary"}>
                  {pwaInfo.hasNotifications ? "支持" : "不支持"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>安装提示支持</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={pwaInfo.installPromptSupported} />
                <Badge variant={pwaInfo.installPromptSupported ? "default" : "secondary"}>
                  {pwaInfo.installPromptSupported ? "支持" : "不支持"}
                </Badge>
              </div>
            </div>
          </div>

          <Button onClick={testPWAInstall} className="w-full mt-4">
            <Zap className="w-4 h-4 mr-2" />
            测试 Service Worker
          </Button>
        </CardContent>
      </Card>

      {/* 触摸测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TouchpadOff className="w-5 h-5" />
            触摸交互测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>触摸支持</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={deviceInfo.touchSupport} />
              <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                {deviceInfo.touchSupport ? "支持" : "不支持"}
              </Badge>
            </div>
          </div>

          <Button 
            onClick={testTouch}
            className={`w-full h-12 transition-all ${touchTest ? 'bg-green-500 scale-95' : ''}`}
            disabled={touchTest}
          >
            {touchTest ? "✅ 触摸成功!" : "👆 点击测试触摸响应"}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>• 最小触摸目标: 48px (移动端)</p>
            <p>• 触摸反馈: 立即响应</p>
            <p>• 防误触: 已启用</p>
          </div>
        </CardContent>
      </Card>

      {/* 性能指标 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            性能指标
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>连接类型:</strong>
              <span className="ml-2">{(navigator as any).connection?.effectiveType || "未知"}</span>
            </div>
            <div>
              <strong>内存:</strong>
              <span className="ml-2">{(navigator as any).deviceMemory || "未知"} GB</span>
            </div>
            <div>
              <strong>CPU 核心:</strong>
              <span className="ml-2">{navigator.hardwareConcurrency || "未知"}</span>
            </div>
            <div>
              <strong>语言:</strong>
              <span className="ml-2">{navigator.language}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {!deviceInfo.isMobile && (
              <p className="text-amber-600">💡 建议在真实移动设备上测试</p>
            )}
            {!pwaInfo.isStandalone && (
              <p className="text-blue-600">📱 可以将此应用添加到主屏幕</p>
            )}
            {!deviceInfo.isOnline && (
              <p className="text-red-600">🔴 当前离线，某些功能可能受限</p>
            )}
            {deviceInfo.pixelRatio > 2 && (
              <p className="text-green-600">✨ 高分辨率显示，图标清晰</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}