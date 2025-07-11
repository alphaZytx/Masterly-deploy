// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel';
import Admin from '../models/adminModel'; // <-- Make sure this import is present
import logger from '../utils/logger';
import { sendEmail } from '../utils/sendEmail'; // <-- THIS IS THE MISSING IMPORT

const generateTokenAndSetCookie = (res: Response, userId: string) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Always true for cross-site
        sameSite: 'none', // Required for cross-site
        maxAge: 24 * 60 * 60 * 1000,
    });
};

export { generateTokenAndSetCookie };

export const registerUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        // Check if user exists with email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // If user exists but has no password (Google user), allow them to set password
            if (!(existingUser as any).password) {
                (existingUser as any).password = password;
                (existingUser as any).firstName = firstName;
                (existingUser as any).lastName = lastName;
                await existingUser.save();
                generateTokenAndSetCookie(res, (existingUser as any)._id.toString());
                res.status(200).json({
                    success: true,
                    data: {
                        user: {
                            _id: (existingUser as any)._id,
                            email: (existingUser as any).email,
                            profile: {
                                firstName: (existingUser as any).profile?.firstName || (existingUser as any).firstName || "",
                                lastName: (existingUser as any).profile?.lastName || (existingUser as any).lastName || "",
                                displayName: (existingUser as any).profile?.displayName || "",
                                fullName: `${(existingUser as any).profile?.firstName || (existingUser as any).firstName || ""} ${(existingUser as any).profile?.lastName || (existingUser as any).lastName || ""}`.trim(),
                                avatar: (existingUser as any).profile?.avatar || "",
                                bio: (existingUser as any).profile?.bio || "",
                                location: (existingUser as any).profile?.location || "",
                                phone: (existingUser as any).profile?.phone || "",
                                website: (existingUser as any).profile?.website || "",
                                socialLinks: (existingUser as any).profile?.socialLinks || {
                                    github: "",
                                    linkedin: "",
                                    twitter: "",
                                }
                            },
                            subscription: {
                                plan: (existingUser as any).subscription?.plan || 'free',
                                status: (existingUser as any).subscription?.status || 'active',
                                endDate: (existingUser as any).subscription?.endDate
                            },
                            stats: (existingUser as any).stats || {
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
                            preferences: (existingUser as any).preferences || {
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
                            role: (existingUser as any).role || 'student',
                            emailVerified: (existingUser as any).emailVerified || false,
                            isActive: (existingUser as any).isActive || true,
                            createdAt: (existingUser as any).createdAt,
                            updatedAt: (existingUser as any).updatedAt
                        }
                    }
                });
                return;
            }
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = await User.create({ firstName, lastName, email, password });
        generateTokenAndSetCookie(res, (user as any)._id.toString());
        res.status(201).json({
            success: true,
            data: {
                user: {
                    _id: (user as any)._id,
                    email: (user as any).email,
                    profile: {
                        firstName: (user as any).profile?.firstName || (user as any).firstName || "",
                        lastName: (user as any).profile?.lastName || (user as any).lastName || "",
                        displayName: (user as any).profile?.displayName || "",
                        fullName: `${(user as any).profile?.firstName || (user as any).firstName || ""} ${(user as any).profile?.lastName || (user as any).lastName || ""}`.trim(),
                        avatar: (user as any).profile?.avatar || "",
                        bio: (user as any).profile?.bio || "",
                        location: (user as any).profile?.location || "",
                        phone: (user as any).profile?.phone || "",
                        website: (user as any).profile?.website || "",
                        socialLinks: (user as any).profile?.socialLinks || {
                            github: "",
                            linkedin: "",
                            twitter: "",
                        }
                    },
                    subscription: {
                        plan: (user as any).subscription?.plan || 'free',
                        status: (user as any).subscription?.status || 'active',
                        endDate: (user as any).subscription?.endDate
                    },
                    stats: (user as any).stats || {
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
                    preferences: (user as any).preferences || {
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
                    role: (user as any).role || 'student',
                    emailVerified: (user as any).emailVerified || false,
                    isActive: (user as any).isActive || true,
                    createdAt: (user as any).createdAt,
                    updatedAt: (user as any).updatedAt
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        await logger.auth('Login Attempt', `Login attempt for email: ${email}`, req);
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            await logger.warning('Login Failed', `User not found for email: ${email}`, 'auth', req);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.password) {
            return res.status(401).json({
                message: 'This account was created with Google. Please use "Continue with Google" to sign in.',
                googleUser: true
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await logger.warning('Login Failed', `Invalid password for email: ${email}`, 'auth', req);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        await logger.success('Login Successful', `User logged in successfully: ${email}`, 'auth', req);
        generateTokenAndSetCookie(res, (user as any)._id.toString());
        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: (user as any)._id,
                    email: (user as any).email,
                    profile: {
                        firstName: (user as any).profile?.firstName || (user as any).firstName || "",
                        lastName: (user as any).profile?.lastName || (user as any).lastName || "",
                        displayName: (user as any).profile?.displayName || "",
                        fullName: `${(user as any).profile?.firstName || (user as any).firstName || ""} ${(user as any).profile?.lastName || (user as any).lastName || ""}`.trim(),
                        avatar: (user as any).profile?.avatar || "",
                        bio: (user as any).profile?.bio || "",
                        location: (user as any).profile?.location || "",
                        phone: (user as any).profile?.phone || "",
                        website: (user as any).profile?.website || "",
                        socialLinks: (user as any).profile?.socialLinks || {
                            github: "",
                            linkedin: "",
                            twitter: "",
                        }
                    },
                    subscription: {
                        plan: (user as any).subscription?.plan || 'free',
                        status: (user as any).subscription?.status || 'active',
                        endDate: (user as any).subscription?.endDate
                    },
                    stats: (user as any).stats || {
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
                    preferences: (user as any).preferences || {
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
                    role: (user as any).role || 'student',
                    emailVerified: (user as any).emailVerified || false,
                    isActive: (user as any).isActive || true,
                    createdAt: (user as any).createdAt,
                    updatedAt: (user as any).updatedAt
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const logoutUser = (req: Request, res: Response) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0),
        path: '/',
    });
    res.status(200).json({ message: 'Logout successful' });
};

export const getMyProfile = (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    const userResponse = {
        _id: user._id,
        email: user.email,
        profile: {
            firstName: user.profile?.firstName || user.firstName || "",
            lastName: user.profile?.lastName || user.lastName || "",
            displayName: user.profile?.displayName || "",
            fullName: `${user.profile?.firstName || user.firstName || ""} ${user.profile?.lastName || user.lastName || ""}`.trim(),
            avatar: user.profile?.avatar || "",
            bio: user.profile?.bio || "",
            location: user.profile?.location || "",
            phone: user.profile?.phone || "",
            website: user.profile?.website || "",
            socialLinks: user.profile?.socialLinks || {
                github: "",
                linkedin: "",
                twitter: "",
            }
        },
        subscription: {
            plan: user.subscription?.plan || 'free',
            status: user.subscription?.status || 'active',
            endDate: user.subscription?.endDate
        },
        stats: user.stats || {
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
        preferences: user.preferences || {
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
        role: user.role || 'student',
        emailVerified: user.emailVerified || false,
        isActive: user.isActive || true,
        createdAt:    (user as any).createdAt,
        updatedAt:  (user as any).updatedAt
    };

    res.status(200).json({ success: true, data: { user: userResponse } });
};

export const changePassword = async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user?.id).select('+password');
        if (!user || !user.password || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ message: 'Incorrect old password' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }
        const resetToken = (user as any).getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const emailMessage = `You are receiving this email because you (or someone else) has requested a password reset. Please click the link below to reset your password. This link will expire in 15 minutes.\n\n${resetUrl}`;
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            text: emailMessage,
            html: `<p>Please click the link to reset your password: <a href="${resetUrl}" target="_blank">${resetUrl}</a></p>`
        });
        res.status(200).json({ message: 'Email sent.' });
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server error while processing request.' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');
        const user = await User.findOne({
            passwordResetToken: resetPasswordToken,
            passwordResetExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        generateTokenAndSetCookie(res, (user._id as string));
        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Server error while resetting password.' });
    }
};

// Admin Registration
export const registerAdmin = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
    }
    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }
        // Let the Admin model handle password hashing via pre-save hook
        const admin = await Admin.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: 'admin'
        });
        console.log("Admin registered:", admin.email);
        res.status(201).json({ message: 'Registration successful', adminId: admin._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Login
export const loginAdmin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Compare hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        });
        console.log("Admin logged in:", admin.email);
        res.status(200).json({
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
            avatarUrl: admin.avatarUrl,
            permissions: admin.permissions,
            redirectUrl: '/admin',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAdminProfile = (req: Request, res: Response) => {
    res.status(200).json(req.user);
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        const updateData: any = {};

        // Handle profile fields
        if (req.body.firstName !== undefined) {
            updateData['profile.firstName'] = req.body.firstName;
        }
        if (req.body.lastName !== undefined) {
            updateData['profile.lastName'] = req.body.lastName;
        }
        if (req.body.displayName !== undefined) {
            updateData['profile.displayName'] = req.body.displayName;
        }
        if (req.body.bio !== undefined) {
            updateData['profile.bio'] = req.body.bio;
        }
        if (req.body.location !== undefined) {
            updateData['profile.location'] = req.body.location;
        }
        if (req.body.phone !== undefined) {
            updateData['profile.phone'] = req.body.phone;
        }
        if (req.body.website !== undefined) {
            updateData['profile.website'] = req.body.website;
        }
        if (req.body.avatar !== undefined) {
            updateData['profile.avatar'] = req.body.avatar;
        }
        if (req.body.socialLinks !== undefined) {
            updateData['profile.socialLinks'] = req.body.socialLinks;
        }
        if (req.body.emergencyContact !== undefined) {
            updateData['profile.emergencyContact'] = req.body.emergencyContact;
        }

        // Handle preferences
        if (req.body.preferences !== undefined) {
            updateData['preferences'] = req.body.preferences;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the updated user in the same format as getMyProfile
        const userResponse = {
            _id: updatedUser._id,
            email: updatedUser.email,
            profile: {
                firstName: updatedUser.profile?.firstName || "",
                lastName: updatedUser.profile?.lastName || "",
                displayName: updatedUser.profile?.displayName || "",
                fullName: `${updatedUser.profile?.firstName || ""} ${updatedUser.profile?.lastName || ""}`.trim(),
                avatar: updatedUser.profile?.avatar || "",
                bio: updatedUser.profile?.bio || "",
                location: updatedUser.profile?.location || "",
                phone: updatedUser.profile?.phone || "",
                website: updatedUser.profile?.website || "",
                socialLinks: updatedUser.profile?.socialLinks || {
                    github: "",
                    linkedin: "",
                    twitter: "",
                },
                emergencyContact: updatedUser.profile?.emergencyContact || null,
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
            createdAt: (updatedUser as any).createdAt,
            updatedAt: (updatedUser as any).updatedAt
        };

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: userResponse }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};