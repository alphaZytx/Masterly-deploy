"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Trophy,
  Target,
  BookOpen,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Camera,
  Edit,
  Save,
  Github,
  Linkedin,
  Globe,
  CheckCircle,
} from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import apiClient from "@/lib/api"

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [profileData, setProfileData] = useState({
    profile: {
      firstName: "",
      lastName: "",
      bio: "",
      location: "",
      phone: "",
      website: "",
      socialLinks: {
        github: "",
        linkedin: "",
        twitter: "",
      },
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        courseReminders: true,
        achievements: true,
        weeklyReports: true,
      },
      learning: {
        difficultyPreference: "adaptive",
        dailyGoal: 30,
        preferredLanguages: ["English"],
      },
      privacy: {
        profileVisibility: "public",
        showProgress: true,
        showAchievements: true,
      },
    },
  })
  
  console.log("🔍 Profile User Data:", {
    user,
    profile: user?.profile,
    firstName: user?.profile?.firstName,
    lastName: user?.profile?.lastName,
    fullName: user?.profile?.fullName,
    email: user?.email
  })
  
  console.log("📋 Current Profile Data State:", profileData)
  
  // Force refresh user data when component mounts
  useEffect(() => {
    if (user) {
      refreshUser()
    }
  }, [])

  // Initialize profile data from user
  useEffect(() => {
    console.log("🔄 Profile useEffect triggered with user:", user)
    if (user) {
      console.log("📝 Setting profile data with user:", {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        bio: user.profile?.bio,
        location: user.profile?.location,
        phone: user.profile?.phone,
        website: user.profile?.website,
        socialLinks: user.profile?.socialLinks
      })
      
      setProfileData({
        profile: {
          firstName: user.profile?.firstName || "",
          lastName: user.profile?.lastName || "",
          bio: user.profile?.bio || "",
          location: user.profile?.location || "",
          phone: user.profile?.phone || "",
          website: user.profile?.website || "",
          socialLinks: {
            github: user.profile?.socialLinks?.github || "",
            linkedin: user.profile?.socialLinks?.linkedin || "",
            twitter: user.profile?.socialLinks?.twitter || "",
          },
        },
        preferences: user.preferences || {
          notifications: {
            email: true,
            push: true,
            courseReminders: true,
            achievements: true,
            weeklyReports: true,
          },
          learning: {
            difficultyPreference: "adaptive",
            dailyGoal: 30,
            preferredLanguages: ["English"],
          },
          privacy: {
            profileVisibility: "public",
            showProgress: true,
            showAchievements: true,
          },
        },
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Update profile
      const updatedUser = await apiClient.updateUserProfile(profileData.profile)

      // Update preferences
      await apiClient.updateUserPreferences(profileData.preferences)

      // Update the user state with the new data
      updateUser(updatedUser)

      setSuccess("Profile updated successfully!")
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const achievements = [
    { title: "First Course Completed", date: "March 2024", icon: Trophy, color: "text-yellow-500" },
    { title: "7-Day Streak", date: "April 2024", icon: Target, color: "text-blue-500" },
    { title: "Quiz Master", date: "May 2024", icon: BookOpen, color: "text-purple-500" },
    { title: "Speed Demon", date: "June 2024", icon: Trophy, color: "text-green-500" },
  ]

  const learningStats = [
    { label: "Courses Completed", value: user?.stats?.coursesCompleted || 0, icon: BookOpen },
    { label: "Total Study Hours", value: Math.round((user?.stats?.totalStudyTime || 0) / 60), icon: Calendar },
    { label: "Concepts Mastered", value: user?.stats?.conceptsMastered || 0, icon: Target },
    { label: "Current Streak", value: `${user?.stats?.currentStreak || 0} days`, icon: Trophy },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Personal Information</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300">
                        Manage your personal details and public profile
                      </CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={isEditing ? handleSave : () => setIsEditing(true)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    {/* Avatar Section */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={user.profile.avatar || "/placeholder.svg?height=80&width=80"} />
                          <AvatarFallback className="text-lg">
                            {user.profile.firstName?.[0]}
                            {user.profile.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-transparent"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.profile?.fullName || user.profile?.displayName || user.email?.split('@')[0] || 'User'}
                        </h3>
                        <p className="text-muted-foreground">
                          {user.subscription?.plan === "premium" ? "Premium Member" : "Free Member"}
                        </p>
                        <Badge className="mt-1 bg-gradient-to-r from-blue-500 to-purple-500">
                          Level {user.stats?.level || 1} Learner
                        </Badge>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.profile.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              profile: { ...profileData.profile, firstName: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.profile.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              profile: { ...profileData.profile, lastName: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.profile.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              profile: { ...profileData.profile, phone: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.profile.location}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              profile: { ...profileData.profile, location: e.target.value },
                            })
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.profile.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            profile: { ...profileData.profile, bio: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Social Links</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website" className="flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </Label>
                          <Input
                            id="website"
                            value={profileData.profile.website}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: { ...profileData.profile, website: e.target.value },
                              })
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github" className="flex items-center">
                            <Github className="w-4 h-4 mr-2" />
                            GitHub
                          </Label>
                          <Input
                            id="github"
                            value={profileData.profile.socialLinks.github}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: {
                                  ...profileData.profile,
                                  socialLinks: { ...profileData.profile.socialLinks, github: e.target.value },
                                },
                              })
                            }
                            disabled={!isEditing}
                            placeholder="username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin" className="flex items-center">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </Label>
                          <Input
                            id="linkedin"
                            value={profileData.profile.socialLinks.linkedin}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                profile: {
                                  ...profileData.profile,
                                  socialLinks: { ...profileData.profile.socialLinks, linkedin: e.target.value },
                                },
                              })
                            }
                            disabled={!isEditing}
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Learning Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {learningStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <stat.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-gray-900 dark:text-white">{stat.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Member since</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <Badge variant={user.subscription?.plan === "premium" ? "default" : "outline"}>
                        {user.subscription?.plan || "free"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {user.subscription?.status || "active"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Current Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-900 dark:text-white">Complete DSA Course</span>
                        <span className="text-gray-900 dark:text-white">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-900 dark:text-white">30-Day Streak</span>
                        <span className="text-gray-900 dark:text-white">
                          {Math.round(((user.stats?.currentStreak || 0) / 30) * 100)}%
                        </span>
                      </div>
                      <Progress value={Math.round(((user.stats?.currentStreak || 0) / 30) * 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-900 dark:text-white">System Design Mastery</span>
                        <span className="text-gray-900 dark:text-white">30%</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Your Achievements</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Celebrate your learning milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                    >
                      <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                        <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(profileData.preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {key === "email" && "Receive updates via email"}
                          {key === "push" && "Get notified on your device"}
                          {key === "courseReminders" && "Reminders for scheduled learning"}
                          {key === "achievements" && "Celebrate your milestones"}
                          {key === "weeklyReports" && "Summary of your learning"}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setProfileData({
                            ...profileData,
                            preferences: {
                              ...profileData.preferences,
                              notifications: {
                                ...profileData.preferences.notifications,
                                [key]: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Settings className="w-5 h-5 mr-2" />
                    Preferences
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Customize your learning experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Difficulty Preference</Label>
                    <Select
                      value={profileData.preferences.learning.difficultyPreference}
                      onValueChange={(value) =>
                        setProfileData({
                          ...profileData,
                          preferences: {
                            ...profileData.preferences,
                            learning: {
                              ...profileData.preferences.learning,
                              difficultyPreference: value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Goal (minutes)</Label>
                    <Input
                      type="number"
                      value={profileData.preferences.learning.dailyGoal}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          preferences: {
                            ...profileData.preferences,
                            learning: {
                              ...profileData.preferences.learning,
                              dailyGoal: Number.parseInt(e.target.value) || 30,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select
                      value={profileData.preferences.privacy.profileVisibility}
                      onValueChange={(value) =>
                        setProfileData({
                          ...profileData,
                          preferences: {
                            ...profileData.preferences,
                            privacy: {
                              ...profileData.preferences.privacy,
                              profileVisibility: value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Download My Data
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Current Plan
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Manage your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {user.subscription.plan === "premium" ? "Premium Plan" : "Free Plan"}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.subscription.plan === "premium" ? "$29.99/month" : "$0/month"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.subscription.plan === "premium" ? "Billed monthly" : "Free forever"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Plan Features:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {user.subscription.plan === "premium" ? (
                        <>
                          <li>• Unlimited course access</li>
                          <li>• Personalized learning paths</li>
                          <li>• Advanced analytics</li>
                          <li>• Priority support</li>
                          <li>• Offline content download</li>
                        </>
                      ) : (
                        <>
                          <li>• Limited course access</li>
                          <li>• Basic learning paths</li>
                          <li>• Community support</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      {user.subscription.plan === "premium" ? "Change Plan" : "Upgrade"}
                    </Button>
                    {user.subscription.plan === "premium" && (
                      <Button variant="destructive" className="flex-1">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Billing History</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your recent transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.subscription.plan === "premium" ? (
                      [
                        { date: "Dec 1, 2024", amount: "$29.99", status: "Paid" },
                        { date: "Nov 1, 2024", amount: "$29.99", status: "Paid" },
                        { date: "Oct 1, 2024", amount: "$29.99", status: "Paid" },
                        { date: "Sep 1, 2024", amount: "$29.99", status: "Paid" },
                      ].map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{transaction.date}</p>
                            <p className="text-sm text-muted-foreground">Premium Plan</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{transaction.amount}</p>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No billing history available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Upgrade to premium to see your billing history
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
