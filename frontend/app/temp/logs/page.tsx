"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  LogIn,
  LogOut,
  UserPlus,
  BookOpen,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Trash2,
  Activity,
  TrendingUp,
  Shield,
  Mail,
} from "lucide-react"

interface SystemLog {
  _id: string
  userId?: string
  userEmail?: string
  action: string
  category: 'auth' | 'course' | 'user' | 'system' | 'admin'
  details: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  severity: 'info' | 'warning' | 'error' | 'success'
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    authEvents: 0
  })



  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        
        // Update stats if available
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setError("Failed to fetch system logs")
      }
    } catch (err: any) {
      setError("Failed to fetch system logs")
      console.error("Error fetching logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/export`, {
        credentials: "include",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError("Failed to export logs")
      }
    } catch (err: any) {
      setError("Failed to export logs")
      console.error("Error exporting logs:", err)
    }
  }

  const clearOldLogs = async () => {
    if (!confirm('Are you sure you want to clear old logs? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/clear`, {
        method: 'DELETE',
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully cleared ${data.deletedCount} old logs`)
        fetchLogs() // Refresh the logs
      } else {
        setError("Failed to clear old logs")
      }
    } catch (err: any) {
      setError("Failed to clear old logs")
      console.error("Error clearing logs:", err)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || log.category === filterCategory
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity

    return matchesSearch && matchesCategory && matchesSeverity
  })

  const totalLogs = stats.total || logs.length
  const errorLogs = stats.errors || logs.filter(log => log.severity === 'error').length
  const warningLogs = stats.warnings || logs.filter(log => log.severity === 'warning').length
  const authLogs = stats.authEvents || logs.filter(log => log.category === 'auth').length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <LogIn className="w-4 h-4" />
      case 'course': return <BookOpen className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'system': return <Database className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth': return 'text-blue-600'
      case 'course': return 'text-green-600'
      case 'user': return 'text-purple-600'
      case 'system': return 'text-orange-600'
      case 'admin': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-500 dark:text-gray-400">
            Loading system logs...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor system activities, user actions, and security events
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={clearOldLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Old Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Logs
            </CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalLogs}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {errorLogs}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Warnings
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {warningLogs}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Auth Events
            </CardTitle>
            <LogIn className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {authLogs}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs by action, details, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="auth">Authentication</option>
                <option value="course">Course</option>
                <option value="user">User</option>
                <option value="system">System</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Severities</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </select>
              <Button variant="outline" onClick={fetchLogs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logs Table */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <CardTitle>System Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Real-time system activity and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No logs found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm ? "No logs match your search criteria." : "No system logs available. Try running the test script to generate sample logs."}
                </p>
                {!searchTerm && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open('/admin/logs', '_blank')}
                  >
                    Refresh Page
                  </Button>
                )}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLog(log)
                    setShowLogModal(true)
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getSeverityColor(log.severity)}`}>
                      {getCategoryIcon(log.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {log.action}
                        </h3>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <Badge className={`${getCategoryColor(log.category)} bg-gray-100 dark:bg-gray-700`}>
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {log.details}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(log.timestamp)}
                        </span>
                        {log.userEmail && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {log.userEmail}
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="flex items-center">
                            <Activity className="w-3 h-3 mr-1" />
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Log Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLogModal(false)
                    setSelectedLog(null)
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Log Header */}
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getSeverityColor(selectedLog.severity)}`}>
                    {getCategoryIcon(selectedLog.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedLog.action}
                    </h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getSeverityColor(selectedLog.severity)}>
                        {selectedLog.severity}
                      </Badge>
                      <Badge className={`${getCategoryColor(selectedLog.category)} bg-gray-100 dark:bg-gray-700`}>
                        {selectedLog.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Log Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                    <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {selectedLog.details}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timestamp</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatDate(selectedLog.timestamp)}
                      </p>
                    </div>
                    {selectedLog.userEmail && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">User</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedLog.userEmail}
                        </p>
                      </div>
                    )}
                    {selectedLog.ipAddress && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">IP Address</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedLog.ipAddress}
                        </p>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div className="col-span-2">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Agent</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {selectedLog.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 