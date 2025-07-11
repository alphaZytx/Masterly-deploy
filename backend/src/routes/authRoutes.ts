import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
    registerUser,
    loginUser,
    getMyProfile,
    updateUserProfile,
    changePassword,
    logoutUser,
    forgotPassword, 
    resetPassword,
    generateTokenAndSetCookie
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import {
    registerRules,
    loginRules,
    changePasswordRules,
    validate,
    forgotPasswordRules, 
    resetPasswordRules  
} from '../validators/authValidator';
import { IUser } from '../types';
import { verify } from 'crypto';

const router = Router();

// --- Standard Email/Password & Profile Routes ---
router.post('/register', registerRules(), validate, registerUser);
router.post('/login', loginRules(), validate, loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMyProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/changepassword', protect, changePasswordRules(), validate, changePassword);

// --- NEW PASSWORD RESET ROUTES ---
router.post('/forgot-password', forgotPasswordRules(), validate, forgotPassword);
router.put('/reset-password/:resetToken', resetPasswordRules(), validate, resetPassword);

// Common logout route for both user and admin
router.post('/logout-all', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0),
        path: '/',
    });
    res.cookie('admin_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0),
        path: '/',
    });
    res.status(200).json({ message: 'Logged out from all sessions' });
});

// --- Existing OAuth Routes ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed`,
        session: false
    }),
    (req, res) => {
        // Successful authentication, req.user is populated by Passport.
        const user = req.user as any;
        if (!user || !user._id) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=google-auth-failed`);
        }
        generateTokenAndSetCookie(res, user._id.toString());
        // Do NOT expose token in URL, just redirect to frontend
        res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
    }
);

export default router;