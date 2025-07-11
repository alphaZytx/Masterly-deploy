"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  UserCog,
  Mail,
  Calendar,
  Shield,
  Activity,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  ArrowLeft,
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  Save,
  X,
} from "lucide-react"
import Link from "next/link"

interface User {
  _id: string
  email: string
  profile: {
    firstName?: string
    lastName?: string
    displayName?: string
    avatar?: string
    fullName?: string
  }
  role: 'student' | 'instructor' | 'admin'
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
  stats?: {
    coursesEnrolled: number
    coursesCompleted: number
    totalStudyTime: number
    currentStreak: number
  }
  subscription?: {
    plan: 'free' | 'premium' | 'enterprise'
    status: 'active' | 'cancelled' | 'expired' | 'trial'
  }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student" as string,
    isActive: true
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.data || [])
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ isActive }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update user status")
      }

      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isActive }
          : user
      ))

      if (showUserModal) {
        setShowUserModal(false)
        setSelectedUser(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update user status")
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ role }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, role: role as any }
          : user
      ))

      if (showUserModal) {
        setShowUserModal(false)
        setSelectedUser(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to update user role")
    }
  }

  const handleEditUser = (user: User) => {
    setEditForm({
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      email: user.email,
      role: user.role,
      isActive: user.isActive
    })
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: editForm.email,
            role: editForm.role,
            isActive: editForm.isActive,
            profile: {
              firstName: editForm.firstName,
              lastName: editForm.lastName
            }
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user._id === selectedUser._id 
          ? {
              ...user,
              email: editForm.email,
              role: editForm.role as any,
              isActive: editForm.isActive,
              profile: {
                ...user.profile,
                firstName: editForm.firstName,
                lastName: editForm.lastName
              }
            }
          : user
      ))

      setShowEditModal(false)
      setSelectedUser(null)
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to update user")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalUsers = users.length
  const activeUsers = users.filter(user => user.isActive).length
  const premiumUsers = users.filter(user => user.subscription?.plan === 'premium').length
  const newUsersThisMonth = users.filter(user => {
    const userDate = new Date(user.createdAt)
    const now = new Date()
    return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
  }).length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'instructor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage user accounts, roles, and permissions
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Active Users
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Premium Users
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {premiumUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              New This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {newUsersThisMonth}
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" onClick={fetchUsers}>
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

      {/* Users List */}
      <Card className="dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm || filterRole !== "all" || filterStatus !== "all" 
                    ? "No users match your current filters." 
                    : "No users have been registered yet."}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile?.avatar} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user.profile?.fullName || user.profile?.displayName || user.email}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.subscription?.plan === 'premium' && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                      <p>Joined: {formatDate(user.createdAt)}</p>
                      {user.stats && (
                        <p>{user.stats.coursesEnrolled} courses enrolled</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setShowUserModal(true)
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateUserStatus(user._id, !user.isActive)}>
                          {user.isActive ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend User
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user._id, user.role === 'student' ? 'instructor' : 'student')}>
                          <UserCog className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  User Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUserModal(false)
                    setSelectedUser(null)
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.profile?.avatar} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                      {selectedUser.profile?.firstName?.[0]}{selectedUser.profile?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedUser.profile?.fullName || selectedUser.profile?.displayName || selectedUser.email}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                      <Badge className={getStatusColor(selectedUser.isActive)}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {selectedUser.stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Courses Enrolled</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.stats.coursesEnrolled}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Current Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.stats.currentStreak} days
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => updateUserStatus(selectedUser._id, !selectedUser.isActive)}
                    className="flex-1"
                  >
                    {selectedUser.isActive ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Suspend User
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate User
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateUserRole(selectedUser._id, selectedUser.role === 'student' ? 'instructor' : 'student')}
                    className="flex-1"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Change Role
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit User
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedUser(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
