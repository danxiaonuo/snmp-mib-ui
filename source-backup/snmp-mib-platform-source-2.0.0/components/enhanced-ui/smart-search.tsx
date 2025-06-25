"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, X, Clock, TrendingUp, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description?: string
  category: string
  url?: string
  icon?: React.ReactNode
  metadata?: Record<string, any>
}

interface SmartSearchProps {
  placeholder?: string
  onSearch?: (query: string, filters?: string[]) => void
  onResultSelect?: (result: SearchResult) => void
  searchFunction?: (query: string) => Promise<SearchResult[]>
  categories?: string[]
  showRecentSearches?: boolean
  showTrendingSearches?: boolean
  className?: string
}

export function SmartSearch({
  placeholder = "搜索...",
  onSearch,
  onResultSelect,
  searchFunction,
  categories = [],
  showRecentSearches = true,
  showTrendingSearches = true,
  className
}: SmartSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingSearches] = useState<string[]>([
    "设备监控", "告警规则", "网络拓扑", "性能分析", "MIB 管理"
  ])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 从 localStorage 加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent searches:', error)
      }
    }
  }, [])

  // 保存最近搜索到 localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }

  // 搜索防抖
  const debouncedSearch = useMemo(() => {
    const debounce = (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout
      return (...args: any[]) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(null, args), delay)
      }
    }
    
    return debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || !searchFunction) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await searchFunction(searchQuery)
        setResults(searchResults)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [searchFunction])

  // 处理搜索输入
  useEffect(() => {
    if (query) {
      debouncedSearch(query)
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query, debouncedSearch])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return

    const totalItems = results.length + (showRecentSearches ? recentSearches.length : 0) + (showTrendingSearches ? trendingSearches.length : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleResultSelect(results[highlightedIndex])
        } else if (query.trim()) {
          handleSearch()
        }
        break
      case 'Escape':
        setShowResults(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // 处理搜索提交
  const handleSearch = () => {
    if (!query.trim()) return
    
    saveRecentSearch(query)
    onSearch?.(query, selectedFilters)
    setShowResults(false)
  }

  // 处理结果选择
  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(result.title)
    onResultSelect?.(result)
    setQuery("")
    setShowResults(false)
    setHighlightedIndex(-1)
  }

  // 处理最近搜索点击
  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
    onSearch?.(searchTerm, selectedFilters)
    setShowResults(false)
  }

  // 清除最近搜索
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }

  // 切换过滤器
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {categories.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Filter className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">过滤器</h4>
                  <div className="flex flex-wrap gap-1">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedFilters.includes(category) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleFilter(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setQuery("")
                setShowResults(false)
                inputRef.current?.focus()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 选中的过滤器 */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => toggleFilter(filter)}
            >
              {filter}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* 搜索结果 */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        >
          <Command>
            <CommandList>
              {isLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  搜索中...
                </div>
              )}

              {/* 搜索结果 */}
              {results.length > 0 && (
                <CommandGroup heading="搜索结果">
                  {results.map((result, index) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultSelect(result)}
                      className={cn(
                        "cursor-pointer",
                        highlightedIndex === index && "bg-accent"
                      )}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        {result.icon && (
                          <div className="flex-shrink-0">
                            {result.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {result.title}
                          </div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* 最近搜索 */}
              {showRecentSearches && recentSearches.length > 0 && !query && (
                <CommandGroup heading="最近搜索">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <CommandItem
                      key={search}
                      onSelect={() => handleRecentSearchClick(search)}
                      className="cursor-pointer"
                    >
                      <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </CommandItem>
                  ))}
                  <div className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="w-full text-xs text-muted-foreground"
                    >
                      清除最近搜索
                    </Button>
                  </div>
                </CommandGroup>
              )}

              {/* 热门搜索 */}
              {showTrendingSearches && !query && (
                <CommandGroup heading="热门搜索">
                  {trendingSearches.map((search) => (
                    <CommandItem
                      key={search}
                      onSelect={() => handleRecentSearchClick(search)}
                      className="cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* 无结果 */}
              {query && !isLoading && results.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      未找到 "{query}" 的相关结果
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSearch}
                    >
                      搜索 "{query}"
                    </Button>
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}