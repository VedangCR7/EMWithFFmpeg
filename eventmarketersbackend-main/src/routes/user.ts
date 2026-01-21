
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('companyName').optional().isString(),
    body('phone').optional().isString(),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
];

// Register User
router.post('/register', registerValidation, async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        }

        const { email, password, name, companyName, phone } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                companyName,
                phone,
                role: 'USER',
                isVerified: false,
            },
        });

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            userType: 'USER',
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    companyName: user.companyName,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                },
                token,
            },
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// User Login
router.post('/login', loginValidation, async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        }

        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            userType: 'USER',
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    companyName: user.companyName,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified,
                },
                token,
            },
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get User Profile
router.get('/profile', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        if (decoded.userType !== 'USER') {
            return res.status(403).json({ success: false, error: 'Invalid token for user access' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                companyName: true,
                phone: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
});

// Update User Profile
router.put('/profile', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        if (decoded.userType !== 'USER') {
            return res.status(403).json({ success: false, error: 'Invalid token for user access' });
        }

        const { name, companyName, phone } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: decoded.id },
            data: {
                name,
                companyName,
                phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                companyName: true,
                phone: true,
                role: true,
                isVerified: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
