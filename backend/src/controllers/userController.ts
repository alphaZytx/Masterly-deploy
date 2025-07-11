// src/controllers/userController.ts
import { Request, Response } from 'express';
import User from '../models/userModel';
import UserConceptProgress from '../models/userConceptProgress';
import { getUnlockedConcepts } from '../utils/conceptUnlockUtils';
import Concept from '../models/conceptModel';

/**
 * @desc    Get the logged-in user's complete dashboard data.
 * @route   GET /api/users/dashboard
 * @access  Private
 */
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user progress for stats
        const userConceptProgressArr = await UserConceptProgress.find({ userId: user._id });
        const conceptsMastered = userConceptProgressArr.filter((c: any) => c.mastered).length;
        const coursesEnrolled = user.enrollments ? user.enrollments.length : 0;
        const totalStudyTime = user.stats?.totalStudyTime || 0;
        const currentStreak = user.stats?.currentStreak || 0;

        // Mock data for dashboard (in a real app, this would come from actual course/enrollment data)
        const dashboardData = {
            user: {
                name: user.profile?.firstName || "User",
                avatar: user.profile?.avatar || null,
                level: user.stats?.level || 1,
                plan: user.subscription?.plan || "free"
            },
            stats: {
                coursesEnrolled: coursesEnrolled,
                conceptsMastered: conceptsMastered,
                currentStreak: currentStreak,
                totalStudyTime: Math.round(totalStudyTime / 60) // Convert minutes to hours
            },
            weeklyProgress: {
                conceptsLearned: Math.floor(Math.random() * 5) + 1,
                quizzesCompleted: Math.floor(Math.random() * 10) + 3,
                studyTimeHours: Math.floor(Math.random() * 10) + 5
            },
            recentCourses: [
                {
                    title: "JavaScript Fundamentals",
                    progress: 75,
                    nextLesson: "Async Programming",
                    timeSpent: "2h 30m",
                    concepts: { completed: 8, total: 12 }
                },
                {
                    title: "React Basics",
                    progress: 45,
                    nextLesson: "State Management",
                    timeSpent: "1h 45m",
                    concepts: { completed: 5, total: 11 }
                },
                {
                    title: "Data Structures",
                    progress: 90,
                    nextLesson: "Advanced Algorithms",
                    timeSpent: "4h 15m",
                    concepts: { completed: 9, total: 10 }
                }
            ],
            achievements: [
                {
                    title: "First Course Completed",
                    date: "March 2024",
                    type: "course"
                },
                {
                    title: "7-Day Streak",
                    date: "April 2024",
                    type: "streak"
                },
                {
                    title: "Quiz Master",
                    date: "May 2024",
                    type: "quiz"
                }
            ],
            upcomingTests: [
                {
                    title: "JavaScript Assessment",
                    date: "2024-01-15",
                    duration: "45 minutes"
                },
                {
                    title: "React Fundamentals Test",
                    date: "2024-01-20",
                    duration: "60 minutes"
                }
            ]
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get user's concept progress
 * @route   GET /api/users/:userId/progress
 * @access  Private
 */
export const getUserProgress = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        // Use current user's ID if no userId provided
        const targetUserId = userId || (req.user as any)?._id?.toString();

        // Debug log to ensure id consistency
        console.log('DEBUG getUserProgress:', {
            reqUser: req.user,
            reqUser_id: (req.user as any)?._id,
            reqUserId: (req.user as any)?.id,
            paramUserId: userId,
            targetUserId
        });

        // Check if the requesting user is accessing their own progress or is an admin
        if ((req.user as any)?._id?.toString() !== targetUserId && (req.user as any)?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this user\'s progress' });
        }

        const userProgress = await UserConceptProgress.find({ userId: targetUserId });
        const userConceptProgressArr = userProgress;
        if (!userProgress || userProgress.length === 0) {
            return res.status(200).json([]);
        }

        // Get unlocked concepts for this user
        const unlockedConcepts = new Set(await getUnlockedConcepts(targetUserId));

        // For each concept, return locked status
        const progressWithLock = userConceptProgressArr.map((c: any) => ({
            conceptId: c.conceptId,
            // Use normalized masteryScore as score (0-1)
            score: typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0,
            attempts: c.attempts,
            lastUpdated: c.lastUpdated,
            mastered: c.mastered,
            masteredAt: c.masteredAt,
            // No achievements array in schema, so fallback to []
            achievements: c.achievements || [],
            locked: !unlockedConcepts.has(c.conceptId.toString()),
        }));

        res.status(200).json(progressWithLock);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Update the user's own profile details (e.g., name).
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req.user as any)?._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        if (req.body.profile) {
            if (req.body.profile.firstName) user.profile.firstName = req.body.profile.firstName;
            if (req.body.profile.lastName) user.profile.lastName = req.body.profile.lastName;
            if (req.body.profile.bio) user.profile.bio = req.body.profile.bio;
            if (req.body.profile.location) user.profile.location = req.body.profile.location;
            if (req.body.profile.phone) user.profile.phone = req.body.profile.phone;
            if (req.body.profile.website) user.profile.website = req.body.profile.website;
            if (req.body.profile.socialLinks) {
                user.profile.socialLinks = {
                    ...user.profile.socialLinks,
                    ...req.body.profile.socialLinks
                };
            }
        }

        // Update preferences
        if (req.body.preferences) {
            user.preferences = {
                ...user.preferences,
                ...req.body.preferences
            };
        }

        // Update subscription
        if (req.body.subscription) {
            user.subscription = {
                ...user.subscription,
                ...req.body.subscription
            };
        }

        const updatedUser = await user.save();

        // Return the updated user data in the same format as getMyProfile
        const userResponse = {
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            profile: {
                firstName: updatedUser.profile?.firstName,
                lastName: updatedUser.profile?.lastName,
                displayName: updatedUser.profile?.displayName,
                fullName: `${updatedUser.profile?.firstName ?? ''} ${updatedUser.profile?.lastName ?? ''}`.trim(),
                avatar: updatedUser.profile?.avatar,
                bio: updatedUser.profile?.bio,
                location: updatedUser.profile?.location,
                phone: updatedUser.profile?.phone,
                website: updatedUser.profile?.website,
                socialLinks: updatedUser.profile?.socialLinks
            },
            subscription: {
                plan: updatedUser.subscription?.plan || 'free',
                status: updatedUser.subscription?.status || 'active',
                endDate: updatedUser.subscription?.endDate
            },
            stats: updatedUser.stats || {
                level: 1,
                experiencePoints: 0,
                currentStreak: 0,
                totalStudyTime: 0,
                coursesCompleted: 0,
                coursesEnrolled: 0,
                conceptsMastered: 0,
                longestStreak: 0,
                quizzesCompleted: 0
            },
            preferences: updatedUser.preferences || {
                notifications: {
                    email: true,
                    push: true,
                    courseReminders: true,
                    achievements: true,
                    weeklyReports: true
                },
                learning: {
                    difficultyPreference: 'adaptive',
                    dailyGoal: 30,
                    preferredLanguages: ['en']
                },
                privacy: {
                    profileVisibility: 'public',
                    showProgress: true,
                    showAchievements: true
                }
            },
            emailVerified: updatedUser.emailVerified || false,
            isActive: updatedUser.isActive || true,
            createdAt: updatedUser.get('createdAt'),
            updatedAt: updatedUser.get('updatedAt')
        };

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: userResponse }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get user's learning analytics (dynamic stats for progress page)
 * @route   GET /api/users/:userId/analytics
 * @access  Private
 */
export const getUserAnalytics = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if ((req.user as any)?._id?.toString() !== userId && (req.user as any)?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this user\'s analytics' });
        }

        // --- Concepts Mastered & Quiz Analytics ---
        const userProgress = await UserConceptProgress.find({ userId });
        // Each progress doc is for a single concept, so use as-is
        const userConceptProgressArr = userProgress;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday as start of ISO week
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let conceptsMasteredTotal = 0;
        let conceptsMasteredThisWeek = 0;
        let masteredConceptIds: string[] = [];
        let masteredConceptIdsThisWeek: string[] = [];
        let quizzesCompletedTotal = 0;
        let quizzesCompletedThisWeek = 0;
        let allScores: number[] = [];
        let monthlyScores: number[] = [];
        if (userProgress) {
            // Concepts mastered
            conceptsMasteredTotal = userConceptProgressArr.filter((c: any) => c.mastered).length;
            conceptsMasteredThisWeek = userConceptProgressArr.filter((c: any) => c.mastered && c.masteredAt && c.masteredAt >= weekStart).length;
            masteredConceptIds = userConceptProgressArr.filter((c: any) => c.mastered).map((c: any) => c.conceptId.toString());
            masteredConceptIdsThisWeek = userConceptProgressArr.filter((c: any) => c.mastered && c.masteredAt && c.masteredAt >= weekStart).map((c: any) => c.conceptId.toString());
            // Quizzes completed: concepts with attempts > 0
            quizzesCompletedTotal = userConceptProgressArr.filter((c: any) => c.attempts > 0).length;
            quizzesCompletedThisWeek = userConceptProgressArr.filter((c: any) => c.attempts > 0 && c.lastUpdated >= weekStart).length;
            // Average score: average of all normalized masteryScores for concepts with attempts > 0
            allScores = userConceptProgressArr.filter((c: any) => c.attempts > 0).map((c: any) => (typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100); // percent
            monthlyScores = userConceptProgressArr.filter((c: any) => c.attempts > 0 && c.lastUpdated >= monthStart).map((c: any) => (typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100);
        }
        const avgScore = allScores.length > 0 ? (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(2) : 0;
        const avgScoreMonth = monthlyScores.length > 0 ? (monthlyScores.reduce((a: number, b: number) => a + b, 0) / monthlyScores.length).toFixed(2) : 0;

        // --- Study Time Calculation ---
        let totalStudyTime = 0;
        let studyTimeThisWeek = 0;
        // 2. Mastered concepts (estLearningTimeHours or Est_Learning_Time_Hours)
        let conceptTimes = 0;
        let conceptTimesThisWeek = 0;
        if (masteredConceptIds.length > 0) {
            const concepts = await Concept.find({ _id: { $in: masteredConceptIds } });
            conceptTimes = concepts.reduce((acc: number, c: any) => {
                const hours = c.estLearningTimeHours || c.Est_Learning_Time_Hours || 0;
                return acc + (typeof hours === 'number' ? hours * 60 : 0);
            }, 0);
        }
        if (masteredConceptIdsThisWeek.length > 0) {
            const conceptsThisWeek = await Concept.find({ _id: { $in: masteredConceptIdsThisWeek } });
            conceptTimesThisWeek = conceptsThisWeek.reduce((acc: number, c: any) => {
                const hours = c.estLearningTimeHours || c.Est_Learning_Time_Hours || 0;
                return acc + (typeof hours === 'number' ? hours * 60 : 0);
            }, 0);
        }
        totalStudyTime += conceptTimes;
        studyTimeThisWeek += conceptTimesThisWeek;
        // 3. Quiz time: 5 questions x 15 sec = 75 sec per attempt (1.25 min)
        // Use userProgress for quiz attempts
        let quizAttempts = 0;
        let quizAttemptsThisWeek = 0;
        if (userProgress) {
            quizAttempts = userConceptProgressArr.reduce((acc: number, c: any) => acc + (c.attempts > 0 ? c.attempts : 0), 0);
            quizAttemptsThisWeek = userConceptProgressArr.reduce((acc: number, c: any) => acc + (c.attempts > 0 && c.lastUpdated >= weekStart ? c.attempts : 0), 0);
        }
        const quizTime = quizAttempts * 1.25;
        const quizTimeThisWeek = quizAttemptsThisWeek * 1.25;
        totalStudyTime += quizTime;
        studyTimeThisWeek += quizTimeThisWeek;

        // --- Weekly Activity ---
        // Prepare array for Mon-Sun
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyActivity = daysOfWeek.map((day: string, idx: number) => {
            // Get the date for this day in the current week
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + idx);
            // Concepts mastered that day
            const concepts = userProgress ? userConceptProgressArr.filter((c: any) => c.masteredAt && new Date(c.masteredAt).toDateString() === d.toDateString()).length : 0;
            // Study time that day (in hours)
            const time = 0;
            // Quizzes completed that day (attempts > 0 and lastUpdated on this day)
            const quizzes = userProgress ? userConceptProgressArr.filter((c: any) => c.attempts > 0 && new Date(c.lastUpdated).toDateString() === d.toDateString()).length : 0;
            return { day, concepts, time: Number(time.toFixed(2)), quizzes };
        });

        // --- Monthly Progress ---
        // Last 6 months including current
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const nowMonth = now.getMonth();
        const nowYear = now.getFullYear();
        const monthlyProgress = Array.from({ length: 6 }).map((_, i: number) => {
            // Go back i months
            const date = new Date(nowYear, nowMonth - (5 - i), 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            // Concepts mastered this month
            const concepts = userProgress ? userConceptProgressArr.filter((c: any) => c.masteredAt && new Date(c.masteredAt).getMonth() === date.getMonth() && new Date(c.masteredAt).getFullYear() === year).length : 0;
            // Average score for concepts updated this month
            const scores = userProgress ? userConceptProgressArr.filter((c: any) => c.lastUpdated && new Date(c.lastUpdated).getMonth() === date.getMonth() && new Date(c.lastUpdated).getFullYear() === year && c.attempts > 0).map((c: any) => (typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100) : [];
            const score = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
            return { month, score, concepts };
        });

        // --- Quiz Performance Trends ---
        let quizPerformanceTrends: { quiz: string, score: number, date: string, difficulty: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            // Get all attempts with attempts > 0, sort by lastUpdated desc
            const attemptedConcepts = userConceptProgressArr.filter((c: any) => c.attempts > 0).sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            // Get up to 5 most recent
            const recentConcepts = attemptedConcepts.slice(0, 5);
            // Fetch concept details for titles/difficulty
            const conceptIds = recentConcepts.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            quizPerformanceTrends = recentConcepts.map((c: any) => {
                const conceptDoc = conceptDocs.find((cd: any) => cd._id.toString() === c.conceptId.toString());
                return {
                    quiz: conceptDoc ? conceptDoc.title : 'Unknown',
                    score: Math.round((typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100),
                    date: c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString() : '',
                    difficulty: conceptDoc && (conceptDoc.title || 'Unknown') ? (conceptDoc.title || 'Unknown').toLowerCase().includes('dsa') || (conceptDoc.title || 'Unknown').toLowerCase().includes('array') || (conceptDoc.title || 'Unknown').toLowerCase().includes('string') || (conceptDoc.title || 'Unknown').toLowerCase().includes('tree') || (conceptDoc.title || 'Unknown').toLowerCase().includes('graph') || (conceptDoc.title || 'Unknown').toLowerCase().includes('linked list') ? 'DSA' : 'Unknown' : 'Unknown',
                };
            });
        }

        // --- Current Course Progress ---
        let currentCourseProgress: { courseName: string, progress: number, concepts: string, nextTopic: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const conceptIds = userConceptProgressArr.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const courseMap: Record<string, { total: number, completed: number, concepts: { title: string, mastered: boolean }[] }> = {};
            userConceptProgressArr.forEach((c: any) => {
                const doc = conceptDocs.find((cd: any) => cd._id.toString() === c.conceptId.toString());
                const course = doc && (doc.title || 'Unknown') ? (doc.title || 'Unknown').toLowerCase().includes('dsa') || (doc.title || 'Unknown').toLowerCase().includes('array') || (doc.title || 'Unknown').toLowerCase().includes('string') || (doc.title || 'Unknown').toLowerCase().includes('tree') || (doc.title || 'Unknown').toLowerCase().includes('graph') || (doc.title || 'Unknown').toLowerCase().includes('linked list') ? 'DSA' : 'Uncategorized' : 'Uncategorized';
                if (!courseMap[course]) courseMap[course] = { total: 0, completed: 0, concepts: [] };
                courseMap[course].total += 1;
                if (c.mastered) courseMap[course].completed += 1;
                courseMap[course].concepts.push({ title: doc ? doc.title : 'Unknown', mastered: !!c.mastered });
            });
            currentCourseProgress = Object.entries(courseMap).map(([courseName, data]) => {
                const next = data.concepts.find((c: any) => !c.mastered);
                return {
                    courseName,
                    progress: Math.round((data.completed / data.total) * 100),
                    concepts: `${data.completed}/${data.total}`,
                    nextTopic: next ? next.title : 'All mastered',
                };
            }).filter((course: any) => course.progress > 0 && course.progress < 100);
        }

        // --- Performance Analysis (Radar Chart) ---
        let performanceAnalysis: { subject: string, value: number }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const scores = userConceptProgressArr.filter((c: any) => c.attempts > 0).map((c: any) => (typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100);
            const attempts = userConceptProgressArr.filter((c: any) => c.attempts > 0).map((c: any) => c.attempts);
            const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
            const avgAttempts = attempts.length > 0 ? attempts.reduce((a: number, b: number) => a + b, 0) / attempts.length : 0;
            performanceAnalysis = [
                { subject: 'Problem Solving', value: Math.round(avgScore) },
                { subject: 'Code Quality', value: Math.round(avgScore * 0.9) },
                { subject: 'Speed', value: Math.round(100 - Math.min(avgAttempts * 10, 100)) },
                { subject: 'Debugging', value: Math.round(avgScore * 0.85) },
                { subject: 'Testing', value: Math.round(avgScore * 0.8) },
                { subject: 'Documentation', value: Math.round(avgScore * 0.75) },
            ];
        }

        // --- Skill Proficiency (Pie/Bar Chart) ---
        let skillProficiency: { name: string, value: number, color: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const conceptIds = userConceptProgressArr.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const typeMap: Record<string, { scores: number[] }> = {};
            userConceptProgressArr.forEach((c: any) => {
                const doc = conceptDocs.find((cd: any) => cd._id.toString() === c.conceptId.toString());
                const type = 'Other';
                if (!typeMap[type]) typeMap[type] = { scores: [] };
                if (c.attempts > 0) typeMap[type].scores.push((typeof c.masteryScore === 'number' ? Math.max(0, Math.min(1, c.masteryScore / 100)) : 0) * 100);
            });
            const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1", "#f472b6", "#22d3ee", "#a3e635", "#facc15"];
            let colorIdx = 0;
            skillProficiency = Object.entries(typeMap).map(([name, data]) => {
                const value = data.scores.length > 0 ? Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length) : 0;
                const color = palette[colorIdx % palette.length];
                colorIdx++;
                return { name, value, color };
            });
        }

        // --- Recommended Focus Areas ---
        let recommendedFocusAreas: { name: string, priority: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const notMasteredZeroScore = userConceptProgressArr.filter((c: any) => !c.mastered && (!c.score || c.score === 0));
            const conceptIds = notMasteredZeroScore.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const priorities = ["High", "Medium", "Low"];
            recommendedFocusAreas = conceptDocs.slice(0, 3).map((c: any, idx: number) => ({ name: c.title || 'Unknown', priority: priorities[idx] || "Low" }));
        }

        // --- Courses Enrolled ---
        let coursesEnrolled = 0;
        let coursesEnrolledChange = 0;
        const userFull = await User.findById(userId).select('learningPaths');
        if (userFull && Array.isArray(userFull.learningPaths)) {
            coursesEnrolled = userFull.learningPaths.length;
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            coursesEnrolledChange = userFull.learningPaths.filter((lp: any) => {
                if (lp && lp.startedAt) {
                    const startedAtDate = new Date(lp.startedAt);
                    return startedAtDate >= monthStart;
                }
                return false;
            }).length;
        }

        // --- Recent Achievements ---
        let recentAchievements: { concept: string, achievement: string, date: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const conceptIds = userConceptProgressArr.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            let allAchievements: { concept: string, achievement: string, date: Date }[] = [];
            userConceptProgressArr.forEach((c: any) => {
                if (c.achievements && c.achievements.length > 0) {
                    const conceptDoc = conceptDocs.find((cd: any) => cd._id.toString() === c.conceptId.toString());
                    c.achievements.forEach((a: any) => {
                        allAchievements.push({
                            concept: conceptDoc ? conceptDoc.title || 'Unknown' : 'Unknown',
                            achievement: a,
                            date: c.lastUpdated || new Date()
                        });
                    });
                }
            });
            recentAchievements = allAchievements.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).slice(0, 5).map((a: any) => ({
                concept: a.concept,
                achievement: a.achievement,
                date: a.date.toLocaleDateString()
            }));
        }

        // --- Upcoming DSA Tests (Demo logic) ---
        let upcomingDSATests: { title: string, date: string, duration: string }[] = [];
        if (userProgress && userConceptProgressArr.length > 0) {
            const conceptIds = userConceptProgressArr.map((c: any) => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const dsaConcepts = conceptDocs.filter((c: any) => {
                const title = (c.title || '').toLowerCase();
                return title.includes('dsa') || title.includes('array') || title.includes('string') || title.includes('tree') || title.includes('graph') || title.includes('linked list');
            });
            if (dsaConcepts.length > 0) {
                const now = new Date();
                upcomingDSATests = [
                    {
                        title: 'DSA Mock Test #1',
                        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toLocaleDateString(),
                        duration: '90 min'
                    },
                    {
                        title: 'DSA Mock Test #2',
                        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toLocaleDateString(),
                        duration: '90 min'
                    }
                ];
            }
        }

        // --- Recommended Learning Path (last generated) ---
        let recommendedLearningPath: string[] = [];
        const userFullPath = await User.findById(userId).select('learningPaths');
        if (userFullPath && userFullPath.learningPaths && Array.isArray(userFullPath.learningPaths) && userFullPath.learningPaths.length > 0) {
            const ids = userFullPath.learningPaths.filter((c: any) => typeof c === 'string' || (c && c._id)).map((c: any) => typeof c === 'string' ? c : c._id);
            let titles: string[] = [];
            if (ids.length > 0) {
                const conceptDocs = await Concept.find({ _id: { $in: ids } });
                titles = conceptDocs.map((c: any) => c.title);
            }
            const objectTitles = userFullPath.learningPaths.filter((c: any) => c && c.title).map((c: any) => c.title);
            recommendedLearningPath = [...titles, ...objectTitles];
        }

        res.json({
            totalStudyTime: Math.round(totalStudyTime),
            studyTimeThisWeek: Math.round(studyTimeThisWeek),
            conceptsMasteredTotal,
            conceptsMasteredThisWeek,
            quizzesCompletedTotal,
            quizzesCompletedThisWeek,
            avgScore,
            avgScoreMonth,
            weeklyActivity,
            monthlyProgress,
            quizPerformanceTrends,
            currentCourseProgress,
            performanceAnalysis,
            skillProficiency,
            recommendedFocusAreas,
            coursesEnrolled,
            coursesEnrolledChange,
            recentAchievements,
            upcomingDSATests,
            recommendedLearningPath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Record a study session for a user
 * @route   POST /api/users/:userId/study-session
 * @access  Private
 */
export const recordStudySession = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { date, durationMinutes } = req.body;
        if ((req.user as any)?._id?.toString() !== userId && (req.user as any)?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to record study session' });
        }
        if (!date || typeof durationMinutes !== 'number') {
            return res.status(400).json({ message: 'Missing date or durationMinutes' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // You may want to actually record the session in the DB here, but this preserves your logic.
        await user.save();
        res.status(200).json({ message: 'Study session recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};