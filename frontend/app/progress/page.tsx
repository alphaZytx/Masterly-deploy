"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { TrendingUp, Clock, Brain, Calendar, Star, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth"

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    setLoading(true);
    setError(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API_BASE}/users/${user._id}/analytics`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user, authLoading]);

  // Use dynamic weekly activity from analytics if available
  const weeklyProgress = analytics && analytics.weeklyActivity ? analytics.weeklyActivity : [
    { day: "Mon", concepts: 0, time: 0, quizzes: 0 },
    { day: "Tue", concepts: 0, time: 0, quizzes: 0 },
    { day: "Wed", concepts: 0, time: 0, quizzes: 0 },
    { day: "Thu", concepts: 0, time: 0, quizzes: 0 },
    { day: "Fri", concepts: 0, time: 0, quizzes: 0 },
    { day: "Sat", concepts: 0, time: 0, quizzes: 0 },
    { day: "Sun", concepts: 0, time: 0, quizzes: 0 },
  ];

  // Use dynamic monthly progress from analytics if available
  const monthlyProgress = analytics && analytics.monthlyProgress ? analytics.monthlyProgress : [
    { month: "Aug", score: 0, concepts: 0 },
    { month: "Sep", score: 0, concepts: 0 },
    { month: "Oct", score: 0, concepts: 0 },
    { month: "Nov", score: 0, concepts: 0 },
    { month: "Dec", score: 0, concepts: 0 },
  ];

  // Use dynamic skill proficiency from analytics if available, filter out 0% skills
  const skillDistribution = analytics && analytics.skillProficiency ? analytics.skillProficiency.filter((s: { value: number }) => s.value > 0) : [];

  // Use dynamic performance analysis from analytics if available
  const radarData = analytics && analytics.performanceAnalysis
    ? analytics.performanceAnalysis.map((item: { subject: string; value: number }) => ({ subject: item.subject, A: item.value, fullMark: 100 }))
    : [
      { subject: "Problem Solving", A: 85, fullMark: 100 },
      { subject: "Code Quality", A: 78, fullMark: 100 },
      { subject: "Speed", A: 65, fullMark: 100 },
      { subject: "Debugging", A: 82, fullMark: 100 },
      { subject: "Testing", A: 70, fullMark: 100 },
      { subject: "Documentation", A: 75, fullMark: 100 },
    ];

  // Use dynamic quiz performance trends from analytics if available
  const quizPerformanceTrends = analytics && analytics.quizPerformanceTrends ? analytics.quizPerformanceTrends : [
    { quiz: "Arrays & Strings", score: 0, date: "-", difficulty: "Unknown" },
    { quiz: "Linked Lists", score: 0, date: "-", difficulty: "Unknown" },
    { quiz: "Trees & Graphs", score: 0, date: "-", difficulty: "Unknown" },
    { quiz: "Dynamic Programming", score: 0, date: "-", difficulty: "Unknown" },
    { quiz: "Sorting Algorithms", score: 0, date: "-", difficulty: "Unknown" },
  ];

  // Use dynamic current course progress from analytics if available
  const currentCourseProgress = analytics && analytics.currentCourseProgress ? analytics.currentCourseProgress : [
    { courseName: "Data Structures & Algorithms", progress: 0, concepts: "0/0", nextTopic: "-" },
    { courseName: "System Design", progress: 0, concepts: "0/0", nextTopic: "-" },
    { courseName: "Machine Learning", progress: 0, concepts: "0/0", nextTopic: "-" },
  ];

  // Use dynamic recommended focus areas from analytics if available
  const recommendedFocusAreas = analytics && analytics.recommendedFocusAreas ? analytics.recommendedFocusAreas : [];

  function formatTime(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Learning Analytics</h1>
          <p className="text-muted-foreground text-gray-600 dark:text-gray-300">
            Track your progress and identify areas for improvement
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loading || authLoading ? (
            <div className="col-span-4 text-center text-gray-600 dark:text-gray-300">Loading analytics...</div>
          ) : error ? (
            <div className="col-span-4 text-center text-red-500">{error}</div>
          ) : analytics ? (
            <>
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(analytics.totalStudyTime)}</div>
                  <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">
                    +{formatTime(analytics.studyTimeThisWeek)} this week
                  </p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Concepts Mastered</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.conceptsMasteredTotal}</div>
                  <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">
                    +{analytics.conceptsMasteredThisWeek} this week
                  </p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Quizzes Completed</CardTitle>
                  <Brain className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.quizzesCompletedTotal}</div>
                  <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">
                    +{analytics.quizzesCompletedThisWeek} this week
                  </p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Average Score</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgScoreMonth}%</div>
                  <p className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">
                    Updated this month
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Calendar className="w-5 h-5 mr-2" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your learning activity over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ChartContainer
                    config={{
                      concepts: { label: "Concepts", color: "hsl(var(--chart-1))" },
                      time: { label: "Hours", color: "hsl(var(--chart-2))" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="concepts" fill="var(--color-concepts)" name="Concepts" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Monthly Progress */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Monthly Progress
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your improvement over the past 5 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ChartContainer
                    config={{
                      score: { label: "Average Score", color: "hsl(var(--chart-1))" },
                      concepts: { label: "Concepts Learned", color: "hsl(var(--chart-2))" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          name="Average Score %"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Current Courses Progress */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Current Courses Progress</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Your progress in enrolled courses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentCourseProgress.map((course: { courseName: string; progress: number; concepts: string; nextTopic: string }, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">{course.courseName}</h4>
                      <Badge variant="outline">{course.progress}%</Badge>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground text-gray-600 dark:text-gray-300">
                      <span>{course.concepts} concepts</span>
                      <span>Next: {course.nextTopic}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Performance Radar */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Performance Analysis</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your strengths and areas for improvement
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ChartContainer
                    config={{
                      performance: { label: "Performance", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[400px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Quiz Performance */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Quiz Performance Trends</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your quiz scores over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizPerformanceTrends.map((quiz: { quiz: string; score: number; date: string; difficulty: string }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{quiz.quiz}</h4>
                          <p className="text-sm text-muted-foreground text-gray-600 dark:text-gray-300">{quiz.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            className={
                              quiz.difficulty.toLowerCase() === "basic"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : quiz.difficulty.toLowerCase() === "intermediate"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : quiz.difficulty.toLowerCase() === "advanced"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-gray-100 text-gray-800 border-gray-300"
                            }
                          >
                            {quiz.difficulty}
                          </Badge>
                          <div
                            className={`text-lg font-bold ${quiz.score >= 90 ? "text-green-600" : quiz.score >= 75 ? "text-blue-600" : "text-yellow-600"}`}
                          >
                            {quiz.score}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Skill Distribution */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Skill Proficiency</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Your current skill levels across different domains
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ChartContainer
                    config={{
                      skills: { label: "Skills", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={skillDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {skillDistribution.map((skill: { name: string; value: number; color: string }, index: number) => (
                            <Cell key={`cell-${index}`} fill={skill.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Skill Progress */}
              <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Detailed Skill Breakdown</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Progress in each skill area
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {skillDistribution.map((skill: { name: string; value: number; color: string }, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.value}%</span>
                      </div>
                      <Progress value={skill.value} className="h-2" />
                      <div className="text-xs text-muted-foreground text-gray-600 dark:text-gray-300">
                        {skill.value >= 80 ? "Expert" : skill.value >= 60 ? "Intermediate" : "Beginner"}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recommended Focus Areas */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recommended Focus Areas</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Based on your current progress and goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendedFocusAreas.map((area: { name: string; priority: string }, index: number) => (
                    <div key={index} className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white flex items-center">
                        {area.name}
                        <Badge
                          className={
                            area.priority === "High"
                              ? "ml-2 bg-red-100 text-red-800 border-red-300"
                              : area.priority === "Medium"
                              ? "ml-2 bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "ml-2 bg-blue-100 text-blue-800 border-blue-300"
                          }
                        >
                          {`${area.priority} Priority`}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground text-gray-600 dark:text-gray-300 mb-3">
                        Not yet started
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
