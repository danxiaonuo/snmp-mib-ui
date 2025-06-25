import Database from 'better-sqlite3';
import { cache } from './memory-cache';

// 测试SQLite数据库连接
export async function testDatabase() {
  try {
    const db = new Database('./data/snmp_platform.db');
    const result = db.prepare('SELECT datetime("now") as current_time').get();
    db.close();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试内存缓存
export async function testRedis() {
  try {
    // 测试内存缓存功能
    cache.set("test", "hello", 60);
    const result = cache.get("test");
    cache.del("test");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
