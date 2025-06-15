import { testDatabase, testRedis } from "@/lib/db-test"

export default async function TestPage() {
  const dbResult = await testDatabase()
  const redisResult = await testRedis()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">数据库连接测试</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">PostgreSQL:</h2>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(dbResult, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Redis:</h2>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(redisResult, null, 2)}</pre>
      </div>
    </div>
  )
}
