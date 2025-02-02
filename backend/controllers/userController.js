const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const {generateToken} = require("../utils/generateToken");

// Desc     login user and give a beautiful token
// Route    Post /api/user/auth
// Access   public
const login = asyncHandler(async(req, res) =>{
    const {email, password} = req.body
    const user = await User.findOne({email})
    if (user && await user.matchPassword(password)){
        generateToken(res, user._id)
        res.status(201).json({
            _id: user._id,
            last_name: user.last_name,
            first_name: user.first_name,
            email: user.email,
            role: user.roleco
        })

    } else {
        res.status(401)
        throw new Error("The email or password is incorrect.")
    }
})