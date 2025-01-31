const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId);
            next();
        } catch (e) {
            console.log(e);
            res.status(401);
            return res.redirect('/login');
        }
    } else {
        res.status(401);
        return res.redirect('/login');
    }
});

const admin = asyncHandler(async (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('role');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.role === 'superadmin' || user.role === 'admin') {
                req.user = user;
                next();
            } else {
                res.status(401);
                return res.redirect('/login');
            }
        } catch (e) {
            console.error(e);
            res.status(401);
            return res.redirect('/login');
        }
    } else {
        res.status(401);
        return res.redirect('/login');
    }
});

