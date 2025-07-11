"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ClipboardList,
  Plus,
  X,
  Check,
  Clock,
  Calendar,
  User,
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2,
  Star,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: 'general' | 'urgent' | 'maintenance' | 'feature'
  createdAt: string
  dueDate?: string
  assignedTo?: string
}

export default function TodoManagementPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTodo, setNewTodo] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [editingTodo, setEditingTodo] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/todos`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        // Convert the simple array to Todo objects
        const todoObjects = data.todos.map((todo: string, index: number) => ({
          id: index.toString(),
          text: todo,
          completed: false,
          priority: 'medium' as const,
          category: 'general' as const,
          createdAt: new Date().toISOString(),
        }))
        setTodos(todoObjects)
      }
    } catch (err: any) {
      setError("Failed to fetch todos")
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ todo: newTodo.trim() }),
        })

        if (response.ok) {
          const newTodoObj: Todo = {
            id: Date.now().toString(),
            text: newTodo.trim(),
            completed: false,
            priority: 'medium',
            category: 'general',
            createdAt: new Date().toISOString(),
          }
          setTodos([newTodoObj, ...todos])
          setNewTodo("")
        }
      } catch (err: any) {
        setError("Failed to add todo")
      }
    }
  }

  const removeTodo = async (index: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/todos/${index}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setTodos(todos.filter((_, i) => i !== index))
      }
    } catch (err: any) {
      setError("Failed to remove todo")
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const updateTodo = (id: string) => {
    if (editText.trim()) {
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, text: editText.trim() } : todo
      ))
      setEditingTodo(null)
      setEditText("")
    }
  }

  const filteredTodos = todos.filter((todo) => {
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "completed" && todo.completed) ||
      (filterStatus === "pending" && !todo.completed)
    
    const matchesPriority = filterPriority === "all" || todo.priority === filterPriority

    return matchesStatus && matchesPriority
  })

  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.completed).length
  const pendingTodos = todos.filter(todo => !todo.completed).length
  const highPriorityTodos = todos.filter(todo => todo.priority === 'high').length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />
      case 'maintenance': return <Target className="w-4 h-4" />
      case 'feature': return <Star className="w-4 h-4" />
      default: return <ClipboardList className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-500 dark:text-gray-400">
            Loading todos...
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">To-Do Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your tasks and priorities efficiently
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Tasks
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalTodos}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Completed
            </CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedTodos}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {pendingTodos}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              High Priority
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {highPriorityTodos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Todo */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              className="flex-1"
            />
            <Button onClick={addTodo} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex-1">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <Button variant="outline" onClick={fetchTodos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Todos List */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Tasks ({filteredTodos.length})</CardTitle>
          <CardDescription>
            Manage and track your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {filterStatus !== "all" || filterPriority !== "all" 
                    ? "No tasks match your current filters." 
                    : "No tasks yet. Add one above!"}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                    todo.completed 
                      ? 'bg-gray-50 dark:bg-gray-700/50' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTodo(todo.id)}
                      className={`h-6 w-6 p-0 rounded-full ${
                        todo.completed 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                    >
                      {todo.completed && <Check className="w-4 h-4" />}
                    </Button>
                    
                    <div className="flex-1">
                      {editingTodo === todo.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateTodo(todo.id)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => updateTodo(todo.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditingTodo(null)
                              setEditText("")
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {todo.text}
                          </span>
                          <Badge className={getPriorityColor(todo.priority)}>
                            {todo.priority}
                          </Badge>
                          <div className="text-gray-400">
                            {getCategoryIcon(todo.category)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTodo(todo.id)
                        setEditText(todo.text)
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTodo(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
