"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell, LogOut, Settings, User,
  BookOpen, Users, BarChart2, Activity,
  Mail, Shield, Server, ArrowRight,
  ChevronDown, Check, Plus, X, Home,
  TrendingUp, Target, Calendar, Clock,
  AlertTriangle, CheckCircle, Database,
  ClipboardList, FileText, Eye,
  MessageSquare, Star, Award, Menu
} from "lucide-react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "./context/SidebarContext";

interface DashboardStats {
  totalUsers: number;
  activeCourses: number;
  pendingRequests: number;
  systemHealth: number;
  userGrowth: number;
  courseCompletion: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'course' | 'emergency' | 'system';
  action: string;
  user: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();

  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    const fetchAdminData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
          credentials: "include"
        });

        if (res.status === 401 || res.status === 403) {
          if (!ignore) {
            setAdmin(null);
            setLoading(false);
            if (window.location.pathname !== "/admin/login") {
              window.location.href = "/admin/login";
            }
          }
          return;
        }

        const data = await res.json();
        if (!ignore) {
          setAdmin(data);
          setTodos(Array.isArray(data.todos) ? data.todos : []);
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setAdmin(null);
          setLoading(false);
          if (window.location.pathname !== "/admin/login") {
            window.location.href = "/admin/login";
          }
        }
      }
    };

    fetchAdminData();

    // Fetch emergency contacts count
    const fetchCount = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/emergency-contacts`, { credentials: "include" });
        const data = await res.json();
        const pendingCount = data.filter((contact: any) => contact.status === 'pending').length;
        setEmergencyCount(pendingCount || 0);
      } catch {
        setEmergencyCount(0);
      }
    };
    fetchCount();

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-stats`, { 
          credentials: "include" 
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error("Failed to fetch stats:", res.status);
          setStats(null);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats(null);
      }
    };
    fetchStats();

    // Fetch recent activities
    const fetchRecentActivities = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/recent-activities`, { 
          credentials: "include" 
        });
        
        if (res.ok) {
          const data = await res.json();
          setRecentActivities(data);
        } else {
          console.error("Failed to fetch activities:", res.status);
          setRecentActivities([]);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        setRecentActivities([]);
      }
    };
    fetchRecentActivities();

    return () => { ignore = true; };
  }, [emergencyCount]);

  // Add todo and sync with backend
  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ todo: newTodo.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setTodos([newTodo.trim(), ...todos]);
          setNewTodo("");
        }
      } catch { }
    }
  };

  // Remove todo by index and sync with backend
  const removeTodo = async (index: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/todos/${index}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos);
      }
    } catch { }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
      document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setAdmin(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-500 dark:text-gray-400">Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation with Sidebar Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="ml-2">{sidebarOpen ? 'Hide' : 'Show'} Sidebar</span>
          </Button>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {admin?.firstName}!
            </h1>
            <p className="text-purple-100">
              Here's what's happening with your Masterly platform today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow group border-0 shadow-sm dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</CardTitle>
            <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{stats?.userGrowth || 0}% this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow group border-0 shadow-sm dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Courses</CardTitle>
            <BookOpen className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.activeCourses || 0}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
              <Target className="w-3 h-3 mr-1" />
              {stats?.courseCompletion || 0} published
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow group border-0 shadow-sm dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Requests</CardTitle>
            <AlertTriangle className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.pendingRequests || emergencyCount || 0}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow group border-0 shadow-sm dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">System Health</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.systemHealth || 0}%
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
              <Server className="w-3 h-3 mr-1" />
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  onClick={() => router.push("/admin/users")}
                >
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => router.push("/admin/courses")}
                >
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <span className="text-sm">Manage Courses</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => router.push("/admin/emergency-contacts")}
                >
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <span className="text-sm">Help Requests</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => router.push("/admin/logs")}
                >
                  <Database className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">System Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-100 text-green-600' :
                        activity.status === 'warning' ? 'bg-orange-100 text-orange-600' :
                        activity.status === 'info' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'user' && <User className="w-5 h-5" />}
                        {activity.type === 'course' && <BookOpen className="w-5 h-5" />}
                        {activity.type === 'emergency' && <AlertTriangle className="w-5 h-5" />}
                        {activity.type === 'system' && <Server className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Admin Profile */}
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Profile</CardTitle>
              <User className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={admin.avatarUrl || "/avatar-placeholder.png"} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                    {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {admin?.firstName} {admin?.lastName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{admin?.email}</div>
                  <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Administrator
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Contact</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {admin?.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* To-Do List */}
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" />
                Quick Tasks
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {todos.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  className="flex-1"
                />
                <Button onClick={addTodo} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {todos.slice(0, 2).map((todo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{todo}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTodo(index)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {todos.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No tasks yet. Add one above!
                  </p>
                )}
                {todos.length > 2 && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/admin/todos")}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      View all {todos.length} tasks →
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Database</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">API Server</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">File Storage</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Email Service</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}