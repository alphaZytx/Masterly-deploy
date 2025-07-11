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
        const userProgress = await UserConceptProgress.findOne({ userId: user._id });
        const conceptsMastered = userProgress ? userProgress.concepts.filter((c: any) => c.mastered).length : 0;
        const coursesEnrolled = user.enrollments ? user.enrollments.length : 0;
        const totalStudyTime = user.stats?.totalStudyTime || 0;
        const currentStreak = user.stats?.currentStreak || 0;

        // Mock data for dashboard (in a real app, this would come from actual course/enrollment data)
        const dashboardData = {
            user: {
                name: user.profile?.firstName || user.firstName || "User",
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
          reqUser_id: req.user?._id,
          reqUserId: req.user?.id,
          paramUserId: userId,
          targetUserId
        });
        
        // Check if the requesting user is accessing their own progress or is an admin
        if ((req.user as any)?._id?.toString() !== targetUserId && (req.user as any)?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access this user\'s progress' });
        }

        const userProgress = await UserConceptProgress.findOne({ userId: targetUserId });
        if (!userProgress) {
            return res.status(200).json([]);
        }

        // Get unlocked concepts for this user
        const unlockedConcepts = new Set(await getUnlockedConcepts(targetUserId));

        // For each concept, return locked status
        const progressWithLock = userProgress.concepts.map((c: any) => ({
            conceptId: c.conceptId,
            score: c.score,
            attempts: c.attempts,
            lastUpdated: c.lastUpdated,
            mastered: c.mastered,
            masteredAt: c.masteredAt,
            achievements: c.achievements,
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
                firstName: updatedUser.profile?.firstName || updatedUser.firstName,
                lastName: updatedUser.profile?.lastName || updatedUser.lastName,
                displayName: updatedUser.profile?.displayName,
                fullName: `${updatedUser.profile?.firstName || updatedUser.firstName} ${updatedUser.profile?.lastName || updatedUser.lastName}`,
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
            role: updatedUser.role || 'student',
            emailVerified: updatedUser.emailVerified || false,
            isActive: updatedUser.isActive || true,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
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
        const userProgress = await UserConceptProgress.findOne({ userId });
        // --- Study Sessions ---
        const user = await User.findById(userId).select('studySessions');

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
            conceptsMasteredTotal = userProgress.concepts.filter(c => c.mastered).length;
            conceptsMasteredThisWeek = userProgress.concepts.filter(c => c.mastered && c.masteredAt && c.masteredAt >= weekStart).length;
            masteredConceptIds = userProgress.concepts.filter(c => c.mastered).map(c => c.conceptId.toString());
            masteredConceptIdsThisWeek = userProgress.concepts.filter(c => c.mastered && c.masteredAt && c.masteredAt >= weekStart).map(c => c.conceptId.toString());
            // Quizzes completed: concepts with attempts > 0
            quizzesCompletedTotal = userProgress.concepts.filter(c => c.attempts > 0).length;
            quizzesCompletedThisWeek = userProgress.concepts.filter(c => c.attempts > 0 && c.lastUpdated >= weekStart).length;
            // Average score: average of all scores for concepts with attempts > 0
            allScores = userProgress.concepts.filter(c => c.attempts > 0).map(c => c.score * 100); // convert to percent
            monthlyScores = userProgress.concepts.filter(c => c.attempts > 0 && c.lastUpdated >= monthStart).map(c => c.score * 100);
        }
        const avgScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2) : 0;
        const avgScoreMonth = monthlyScores.length > 0 ? (monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length).toFixed(2) : 0;

        // --- Study Time Calculation ---
        let totalStudyTime = 0;
        let studyTimeThisWeek = 0;
        if (user && user.studySessions) {
            totalStudyTime += user.studySessions.reduce((acc: number, session: any) => acc + session.durationMinutes, 0);
            studyTimeThisWeek += user.studySessions.filter((session: any) => session.date >= weekStart).reduce((acc: number, session: any) => acc + session.durationMinutes, 0);
        }
        // 2. Mastered concepts (estLearningTimeHours or Est_Learning_Time_Hours)
        let conceptTimes = 0;
        let conceptTimesThisWeek = 0;
        if (masteredConceptIds.length > 0) {
            const concepts = await Concept.find({ _id: { $in: masteredConceptIds } });
            conceptTimes = concepts.reduce((acc, c) => {
                // Use estLearningTimeHours or Est_Learning_Time_Hours (fallback to 0)
                const hours = c.estLearningTimeHours || c.Est_Learning_Time_Hours || 0;
                return acc + (typeof hours === 'number' ? hours * 60 : 0);
            }, 0);
        }
        if (masteredConceptIdsThisWeek.length > 0) {
            const conceptsThisWeek = await Concept.find({ _id: { $in: masteredConceptIdsThisWeek } });
            conceptTimesThisWeek = conceptsThisWeek.reduce((acc, c) => {
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
            quizAttempts = userProgress.concepts.reduce((acc, c) => acc + (c.attempts > 0 ? c.attempts : 0), 0);
            quizAttemptsThisWeek = userProgress.concepts.reduce((acc, c) => acc + (c.attempts > 0 && c.lastUpdated >= weekStart ? c.attempts : 0), 0);
        }
        const quizTime = quizAttempts * 1.25;
        const quizTimeThisWeek = quizAttemptsThisWeek * 1.25;
        totalStudyTime += quizTime;
        studyTimeThisWeek += quizTimeThisWeek;

        // --- Weekly Activity ---
        // Prepare array for Mon-Sun
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyActivity = daysOfWeek.map((day, idx) => {
            // Get the date for this day in the current week
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + idx);
            // Concepts mastered that day
            const concepts = userProgress ? userProgress.concepts.filter(c => c.masteredAt && new Date(c.masteredAt).toDateString() === d.toDateString()).length : 0;
            // Study time that day (in hours)
            const time = user && user.studySessions ? user.studySessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((acc, s) => acc + s.durationMinutes, 0) / 60 : 0;
            // Quizzes completed that day (attempts > 0 and lastUpdated on this day)
            const quizzes = userProgress ? userProgress.concepts.filter(c => c.attempts > 0 && new Date(c.lastUpdated).toDateString() === d.toDateString()).length : 0;
            return { day, concepts, time: Number(time.toFixed(2)), quizzes };
        });

        // --- Monthly Progress ---
        // Last 6 months including current
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const nowMonth = now.getMonth();
        const nowYear = now.getFullYear();
        const monthlyProgress = Array.from({ length: 6 }).map((_, i) => {
            // Go back i months
            const date = new Date(nowYear, nowMonth - (5 - i), 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            // Concepts mastered this month
            const concepts = userProgress ? userProgress.concepts.filter(c => c.masteredAt && new Date(c.masteredAt).getMonth() === date.getMonth() && new Date(c.masteredAt).getFullYear() === year).length : 0;
            // Average score for concepts updated this month
            const scores = userProgress ? userProgress.concepts.filter(c => c.lastUpdated && new Date(c.lastUpdated).getMonth() === date.getMonth() && new Date(c.lastUpdated).getFullYear() === year && c.attempts > 0).map(c => c.score * 100) : [];
            const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            return { month, score, concepts };
        });

        // --- Quiz Performance Trends ---
        let quizPerformanceTrends: { quiz: string, score: number, date: string, difficulty: string }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            // Get all attempts with attempts > 0, sort by lastUpdated desc
            const attemptedConcepts = userProgress.concepts.filter(c => c.attempts > 0).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            // Get up to 5 most recent
            const recentConcepts = attemptedConcepts.slice(0, 5);
            // Fetch concept details for titles/difficulty
            const conceptIds = recentConcepts.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            quizPerformanceTrends = recentConcepts.map(c => {
                const conceptDoc = conceptDocs.find(cd => (cd as any)._id.toString() === c.conceptId.toString());
                return {
                    quiz: conceptDoc ? (conceptDoc as any).title : 'Unknown',
                    score: Math.round((c.score || 0) * 100),
                    date: c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString() : '',
                    difficulty: conceptDoc && ((conceptDoc as any).level || (conceptDoc as any).Level) ? ((conceptDoc as any).level || (conceptDoc as any).Level) + '' : 'Unknown',
                };
            });
        }

        // --- Current Course Progress ---
        let currentCourseProgress: { courseName: string, progress: number, concepts: string, nextTopic: string }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            // Get all concept IDs
            const conceptIds = userProgress.concepts.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            // Group by category (course)
            const courseMap: Record<string, { total: number, completed: number, concepts: { title: string, mastered: boolean }[] }> = {};
            userProgress.concepts.forEach(c => {
                const doc = conceptDocs.find(cd => cd._id.toString() === c.conceptId.toString());
                const course = doc && (doc.category || doc.Category) ? (doc.category || doc.Category) : 'Uncategorized';
                if (!courseMap[course]) courseMap[course] = { total: 0, completed: 0, concepts: [] };
                courseMap[course].total += 1;
                if (c.mastered) courseMap[course].completed += 1;
                courseMap[course].concepts.push({ title: doc ? doc.title : 'Unknown', mastered: !!c.mastered });
            });
            currentCourseProgress = Object.entries(courseMap).map(([courseName, data]) => {
                const next = data.concepts.find(c => !c.mastered);
                return {
                    courseName,
                    progress: Math.round((data.completed / data.total) * 100),
                    concepts: `${data.completed}/${data.total}`,
                    nextTopic: next ? next.title : 'All mastered',
                };
            }).filter(course => course.progress > 0 && course.progress < 100);
        }

        // --- Performance Analysis (Radar Chart) ---
        // Example mapping: Problem Solving = avg score, Speed = inverse avg attempts, etc.
        let performanceAnalysis: { subject: string, value: number }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            const scores = userProgress.concepts.filter(c => c.attempts > 0).map(c => c.score * 100);
            const attempts = userProgress.concepts.filter(c => c.attempts > 0).map(c => c.attempts);
            const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const avgAttempts = attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : 0;
            // For demonstration, map to 6 skills
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
        if (userProgress && userProgress.concepts.length > 0) {
            const conceptIds = userProgress.concepts.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            // Group by conceptType or category
            const typeMap: Record<string, { scores: number[] }> = {};
            userProgress.concepts.forEach(c => {
                const doc = conceptDocs.find(cd => cd._id.toString() === c.conceptId.toString());
                const type = doc && (doc.conceptType || doc.category || doc.Category) ? (doc.conceptType || doc.category || doc.Category) : 'Other';
                if (!typeMap[type]) typeMap[type] = { scores: [] };
                if (c.attempts > 0) typeMap[type].scores.push((c.score || 0) * 100);
            });
            // Color palette
            const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1", "#f472b6", "#22d3ee", "#a3e635", "#facc15"];
            let colorIdx = 0;
            skillProficiency = Object.entries(typeMap).map(([name, data]) => {
                const value = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
                const color = palette[colorIdx % palette.length];
                colorIdx++;
                return { name, value, color };
            });
        }

        // --- Recommended Focus Areas ---
        let recommendedFocusAreas: { name: string, priority: string }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            const notMasteredZeroScore = userProgress.concepts.filter(c => !c.mastered && (!c.score || c.score === 0));
            const conceptIds = notMasteredZeroScore.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const priorities = ["High", "Medium", "Low"];
            recommendedFocusAreas = conceptDocs.slice(0, 3).map((c, idx) => ({ name: c.title, priority: priorities[idx] || "Low" }));
        }

        // --- Courses Enrolled ---
        let coursesEnrolled = 0;
        let coursesEnrolledChange = 0;
        const userFull = await User.findById(userId).select('learningPath');
        if (userFull && userFull.learningPath && Array.isArray(userFull.learningPath.generatedPath)) {
            coursesEnrolled = userFull.learningPath.generatedPath.length;
            // Calculate how many were added this month
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            coursesEnrolledChange = userFull.learningPath.generatedPath.filter((course: any) => {
                if (course && course.savedAt) {
                    const savedAtDate = new Date(course.savedAt);
                    return savedAtDate >= monthStart;
                }
                return false;
            }).length;
            // Fallback: if no savedAt in generatedPath, use learningPath.savedAt for the whole array
            if (coursesEnrolledChange === 0 && userFull.learningPath.savedAt && userFull.learningPath.generatedPath.length > 0) {
                const savedAtDate = new Date(userFull.learningPath.savedAt);
                if (savedAtDate >= monthStart) {
                    coursesEnrolledChange = userFull.learningPath.generatedPath.length;
                }
            }
        }

        // --- Recent Achievements ---
        let recentAchievements: { concept: string, achievement: string, date: string }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            // Flatten all achievements with concept and date
            const conceptIds = userProgress.concepts.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            let allAchievements: { concept: string, achievement: string, date: Date }[] = [];
            userProgress.concepts.forEach(c => {
                if (c.achievements && c.achievements.length > 0) {
                    const conceptDoc = conceptDocs.find(cd => (cd as any)._id.toString() === c.conceptId.toString());
                    c.achievements.forEach(a => {
                        allAchievements.push({
                            concept: conceptDoc ? (conceptDoc as any).title : 'Unknown',
                            achievement: a,
                            date: c.lastUpdated || new Date()
                        });
                    });
                }
            });
            // Sort by date descending and take up to 5
            recentAchievements = allAchievements.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5).map(a => ({
                concept: a.concept,
                achievement: a.achievement,
                date: a.date.toLocaleDateString()
            }));
        }

        // --- Upcoming DSA Tests (Demo logic) ---
        let upcomingDSATests: { title: string, date: string, duration: string }[] = [];
        if (userProgress && userProgress.concepts.length > 0) {
            // Find DSA-related concepts in progress (not mastered)
            const conceptIds = userProgress.concepts.map(c => c.conceptId);
            const conceptDocs = conceptIds.length > 0 ? await Concept.find({ _id: { $in: conceptIds } }) : [];
            const dsaConcepts = conceptDocs.filter(c => {
                const cat = (c.category || c.Category || '').toLowerCase();
                const title = (c.title || '').toLowerCase();
                return cat.includes('dsa') || title.includes('dsa') || title.includes('array') || title.includes('string') || title.includes('tree') || title.includes('graph') || title.includes('linked list');
            });
            if (dsaConcepts.length > 0) {
                // Demo: generate 1-2 upcoming DSA tests
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
        const userFullPath = await User.findById(userId).select('learningPath');
        if (userFullPath && userFullPath.learningPath && Array.isArray(userFullPath.learningPath.generatedPath) && userFullPath.learningPath.generatedPath.length > 0) {
            // If generatedPath contains concept IDs, fetch their titles
            const ids = userFullPath.learningPath.generatedPath.filter((c: any) => typeof c === 'string' || (c && c._id)).map((c: any) => typeof c === 'string' ? c : c._id);
            let titles: string[] = [];
            if (ids.length > 0) {
                const conceptDocs = await Concept.find({ _id: { $in: ids } });
                titles = conceptDocs.map(c => c.title);
            }
            // If generatedPath contains objects with title, use those
            const objectTitles = userFullPath.learningPath.generatedPath.filter((c: any) => c && c.title).map((c: any) => c.title);
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
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.studySessions = user.studySessions || [];
        user.studySessions.push({ date: new Date(date), durationMinutes });
        await user.save();
        res.status(200).json({ message: 'Study session recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
