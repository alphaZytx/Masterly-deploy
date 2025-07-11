import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';
import Admin from '../models/adminModel';

// Extend Request interface to include user without conflicting with Passport
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

/**
 * Verifies the JWT token from the cookie, finds the associated user,
 * and attaches the user's data to the request object.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    // Only check for token in cookies
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        req.user = user as IUser;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Verifies the admin JWT token from the cookie or authorization header,
 * finds the associated admin, and attaches the admin's data to the request object.
 */
export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.cookies && req.cookies.admin_token) {
        token = req.cookies.admin_token;
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({ message: 'Not authorized, admin not found' });
        }
        req.user = admin as any;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Middleware to authenticate token from Authorization header
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user as IUser;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return next(); // Continue without authentication
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
            req.user = user as IUser;
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};