"use client"

import { useState, useEffect } from 'react'

/**
 * 本地存储Hook - 数据持久化
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : defaultValue
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error)
        return defaultValue
      }
    }
    return defaultValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    }
  }, [key, value])

  return [value, setValue] as const
}

/**
 * 会话存储Hook - 临时数据持久化
 */
export function useSessionStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(key)
        return saved ? JSON.parse(saved) : defaultValue
      } catch (error) {
        console.warn(`Error reading sessionStorage key "${key}":`, error)
        return defaultValue
      }
    }
    return defaultValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error)
      }
    }
  }, [key, value])

  return [value, setValue] as const
}

/**
 * 智能存储Hook - 自动选择存储方式
 */
export function useSmartStorage<T>(
  key: string, 
  defaultValue: T, 
  options: {
    storage?: 'local' | 'session'
    expiry?: number // 过期时间（毫秒）
  } = {}
) {
  const { storage = 'local', expiry } = options
  const storageKey = expiry ? `${key}_with_expiry` : key

  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storageObj = storage === 'local' ? localStorage : sessionStorage
        const saved = storageObj.getItem(storageKey)
        
        if (saved) {
          const parsed = JSON.parse(saved)
          
          // 检查是否有过期时间
          if (expiry && parsed.timestamp) {
            const now = Date.now()
            if (now - parsed.timestamp > expiry) {
              storageObj.removeItem(storageKey)
              return defaultValue
            }
            return parsed.value
          }
          
          return expiry ? parsed.value : parsed
        }
      } catch (error) {
        console.warn(`Error reading ${storage}Storage key "${storageKey}":`, error)
      }
    }
    return defaultValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storageObj = storage === 'local' ? localStorage : sessionStorage
        const dataToStore = expiry 
          ? { value, timestamp: Date.now() }
          : value
        
        storageObj.setItem(storageKey, JSON.stringify(dataToStore))
      } catch (error) {
        console.warn(`Error setting ${storage}Storage key "${storageKey}":`, error)
      }
    }
  }, [storageKey, value, storage, expiry])

  const clearValue = () => {
    if (typeof window !== 'undefined') {
      const storageObj = storage === 'local' ? localStorage : sessionStorage
      storageObj.removeItem(storageKey)
      setValue(defaultValue)
    }
  }

  return [value, setValue, clearValue] as const
}