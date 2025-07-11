"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, BookOpen, DollarSign, Eye, Clock, Target, Award } from "lucide-react"

export default function AdminAnalytics() {
  const metrics = [
    {
      title: "Total Revenue",
      value: "$45,231",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "+8.2%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Course Completions",
      value: "1,234",
      change: "+15.3%",
      trend: "up",
      icon: Award,
    },
    {
      title: "Avg. Study Time",
      value: "4.2h",
      change: "-2.1%",
      trend: "down",
      icon: Clock,
    },
  ]

  const topCourses = [
    { name: "Data Structures & Algorithms", students: 1247, revenue: "$12,470", completion: 78 },
    { name: "System Design", students: 892, revenue: "$8,920", completion: 65 },
    { name: "Machine Learning", students: 2156, revenue: "$21,560", completion: 82 },
    { name: "React Advanced", students: 634, revenue: "$6,340", completion: 71 },
  ]

  const userGrowth = [
    { month: "Jan", users: 1200 },
    { month: "Feb", users: 1450 },
    { month: "Mar", users: 1680 },
    { month: "Apr", users: 1920 },
    { month: "May", users: 2150 },
    { month: "Jun", users: 2400 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Monitor platform performance and user engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {metric.change} from last month
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Top Performing Courses
            </CardTitle>
            <CardDescription>Courses with highest engagement and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{course.name}</h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {course.students}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {course.revenue}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Completion Rate</span>
                        <span>{course.completion}%</span>
                      </div>
                      <Progress value={course.completion} className="h-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              User Growth
            </CardTitle>
            <CardDescription>Monthly user registration trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userGrowth.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.month}</span>
                  <div className="flex items-center space-x-2 flex-1 ml-4">
                    <Progress value={(data.users / 2400) * 100} className="flex-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                      {data.users.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Content Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Video Lectures</span>
                <Badge className="bg-green-100 text-green-800">92% Engagement</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Interactive Quizzes</span>
                <Badge className="bg-blue-100 text-blue-800">87% Completion</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Coding Problems</span>
                <Badge className="bg-purple-100 text-purple-800">74% Success</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Articles</span>
                <Badge className="bg-yellow-100 text-yellow-800">68% Read Time</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Active Users</span>
                  <span>2,400 / 3,000</span>
                </div>
                <Progress value={80} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Course Completion Rate</span>
                  <span>73% / 80%</span>
                </div>
                <Progress value={91} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>User Retention</span>
                  <span>65% / 70%</span>
                </div>
                <Progress value={93} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Session Duration</span>
                <span className="font-medium">24 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</span>
                <span className="font-medium">12.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mobile Users</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Support Tickets</span>
                <span className="font-medium">23</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
