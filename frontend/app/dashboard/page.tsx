"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// --- Added LogOut icon for the new button ---
import { BookOpen, Trophy, Target, Clock, TrendingUp, Play, CheckCircle, Brain, Calendar, Award, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuth } from "@/hooks/useAuth"

// --- Define an interface for the user data we expect from the backend ---
interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
}

// --- API client configured to communicate with the backend ---
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

export default function Dashboard() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
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

    function formatTime(mins: number) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }

    // --- This function handles the logout process ---
    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            router.push('/login'); // Redirect to login page on successful logout
        } catch (err) {
            console.error("Logout failed:", err);
            // Optionally, show an error toast to the user
        }
    };

    // --- All your hardcoded data remains exactly as it was ---
    const recentCourses = [
        { title: "Data Structures & Algorithms", progress: 75, nextLesson: "Binary Trees", timeSpent: "24h 30m", concepts: { completed: 34, total: 45 }, },
        { title: "System Design", progress: 45, nextLesson: "Load Balancing", timeSpent: "18h 15m", concepts: { completed: 14, total: 32 }, },
        { title: "Machine Learning", progress: 20, nextLesson: "Linear Regression", timeSpent: "8h 45m", concepts: { completed: 12, total: 58 }, },
    ];
    const achievements = [
        { title: "First Course Completed", icon: Trophy, color: "text-yellow-500" },
        { title: "7-Day Streak", icon: Target, color: "text-blue-500" },
        { title: "Quiz Master", icon: Brain, color: "text-purple-500" },
        { title: "Fast Learner", icon: TrendingUp, color: "text-green-500" },
    ];
    const upcomingTests = [
        { title: "DSA Mock Test #3", date: "Tomorrow", duration: "90 min" },
        { title: "System Design Interview", date: "Dec 28", duration: "60 min" },
        { title: "ML Fundamentals Quiz", date: "Dec 30", duration: "45 min" },
    ];

    // --- Display a simple loading message while fetching data ---
    if (loading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    // --- Fallback if user is not loaded after signup (to redirect to login or show a message) ---
    if ((!user && !authLoading) || error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">Unable to load user data. Please log in again.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        {/* --- DYNAMIC USER NAME --- */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.firstName}!</h1>
                        <p className="text-gray-600 dark:text-gray-300">Continue your learning journey</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            asChild
                            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Link href="/learning-paths">
                                <Brain className="w-4 h-4 mr-2" />
                                Create Learning Path
                            </Link>
                        </Button>
                                                <Link href="/profile">
                          <Avatar className="cursor-pointer hover:scale-105 transition-transform">
                            <AvatarImage src={user?.avatarUrl || ""} />
                            {/* --- DYNAMIC AVATAR FALLBACK --- */}
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                              {user?.avatarUrl ? (
                                `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        {/* --- FUNCTIONAL LOGOUT BUTTON --- */}
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>


            <div className="p-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 items-center">
                    {loading || authLoading ? (
                        <div className="col-span-4 text-center text-gray-600 dark:text-gray-300">Loading analytics...</div>
                    ) : error ? (
                        <div className="col-span-4 text-center text-red-500">{error}</div>
                    ) : analytics ? (
                        <>
                            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.coursesEnrolled || 0}</div>
                                    <p className="text-xs text-muted-foreground">+{analytics.coursesEnrolledChange || 0} this month</p>
                                </CardContent>
                            </Card>
                            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Concepts Mastered</CardTitle>
                                    <Trophy className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.conceptsMasteredTotal}</div>
                                    <p className="text-xs text-muted-foreground">+{analytics.conceptsMasteredThisWeek} this week</p>
                                </CardContent>
                            </Card>
                            {/*
                            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.studyStreak || 0} days</div>
                                    <p className="text-xs text-muted-foreground">Keep it up!</p>
                                </CardContent>
                            </Card>
                            */}
                            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatTime(analytics.totalStudyTime)}</div>
                                    <p className="text-xs text-muted-foreground">This month</p>
                                </CardContent>
                            </Card>
                            {/* Analytics Button */}
                            <Card className="dark:bg-gray-800/80 dark:border-gray-700 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200 border-blue-200 flex flex-col justify-center h-full min-h-[120px] min-w-0 md:min-w-[0] md:max-w-[260px] p-0">
                                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                                    <Link href="/progress" className="flex flex-col items-center gap-1 w-full group">
                                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-700 group-hover:scale-105 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
                                            </svg>
                                        </div>
                                        <span className="mt-1 text-sm font-semibold text-blue-900 dark:text-white text-center">View Detailed Learning Analytics</span>
                                        <span className="text-xs text-blue-700 dark:text-blue-300 text-center">Explore your progress, mastery, and trends</span>
                                    </Link>
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Continue Learning */}
                        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Play className="w-5 h-5 mr-2 text-blue-600" />
                                    Continue Learning
                                </CardTitle>
                                <CardDescription>Pick up where you left off</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analytics && Array.isArray(analytics.currentCourseProgress) && analytics.currentCourseProgress.length > 0 ? (
                                    analytics.currentCourseProgress.map((course: { courseName: string; progress: number; nextTopic: string; concepts: string }, index: number) => (
                                    <div
                                        key={course.courseName || index}
                                        className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{course.courseName}</h3>
                                            <Badge variant="secondary">{course.progress}% Complete</Badge>
                                        </div>

                                        <Progress value={course.progress} className="mb-3" />

                                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                                                <span>Next: {course.nextTopic}</span>
                                                {/* Optionally, you can add time spent if available in analytics */}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {course.concepts} concepts
                                            </span>
                                            <Button size="sm" asChild>
                                                    <Link href={`/courses/${course.courseName.toLowerCase().replace(/\s+/g, "-")}`}>Continue</Link>
                                            </Button>
                                        </div>
                                    </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">No courses in progress. Start a new learning path!</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Learning Path Recommendation */}
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-gray-800/90 dark:to-gray-700/90 dark:bg-gray-800/80 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                                    <Brain className="w-5 h-5 mr-2" />
                                    Recommended Learning Path
                                </CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-300">
                                    Based on your progress and goals
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analytics && analytics.recommendedLearningPath && analytics.recommendedLearningPath.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {analytics.recommendedLearningPath.map((concept: string, idx: number) => (
                                            <>
                                                <span
                                                    key={concept + idx}
                                                    className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                                                >
                                                    {concept}
                                                </span>
                                                {idx < analytics.recommendedLearningPath.length - 1 && (
                                                    <span
                                                        key={"arrow-" + idx}
                                                        className="text-blue-400 dark:text-blue-300 mx-1 text-lg"
                                                        aria-hidden="true"
                                                    >
                                                        &#8594;
                                                    </span>
                                                )}
                                            </>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">No recommended learning path found. Generate a new path to get started!</div>
                                )}
                                <Button className="w-full" asChild>
                                    <Link href="/learning-paths">View Full Path</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Achievements */}
                        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                                    Recent Achievements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(analytics && Array.isArray(analytics.recentAchievements) && analytics.recentAchievements.length > 0) ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {analytics.recentAchievements.map((a: { concept: string; achievement: string; date: string }, idx: number) => (
                                            <div
                                                key={a.achievement + a.date + idx}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border-l-4 border-yellow-400 dark:border-yellow-500 shadow-sm hover:shadow-md transition-shadow duration-200 group"
                                                style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
                                            >
                                                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-yellow-50 dark:bg-yellow-900 group-hover:scale-105 transition-transform">
                                                    <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{a.achievement}</div>
                                                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-0.5">{a.concept}</div>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">{a.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">No recent achievements yet.</div>
                                )}
                                <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                                    <Link href="/profile?tab=achievements">View All Achievements</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Upcoming Tests */}
                        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                    Upcoming Tests
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(analytics && Array.isArray(analytics.upcomingDSATests) && analytics.upcomingDSATests.length > 0) ? (
                                    analytics.upcomingDSATests.map((test: { title: string; date: string; duration: string }, index: number) => (
                                        <div key={test.title + test.date + index} className="border dark:border-gray-700 rounded-lg p-3">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">{test.title}</h4>
                                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                <span>{test.date}</span>
                                                <span>{test.duration}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming DSA tests scheduled.</div>
                                )}
                                <Button variant="outline" className="w-full" size="sm" asChild>
                                    <Link href="/mock-tests">View All Tests</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Performance Chart */}
                        {/*
                        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                                    Weekly Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Concepts Learned</span>
                                        <span className="font-medium">12</span>
                                    </div>
                                    <Progress value={80} />

                                    <div className="flex items-center justify-between text-sm">
                                        <span>Quizzes Completed</span>
                                        <span className="font-medium">8</span>
                                    </div>
                                    <Progress value={65} />

                                    <div className="flex items-center justify-between text-sm">
                                        <span>Study Time</span>
                                        <span className="font-medium">15h</span>
                                    </div>
                                    <Progress value={90} />
                                </div>
                            </CardContent>
                        </Card>
                        */}
                    </div>
                </div>
            </div>
        </div>
    )
}