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