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
        res.status(401).json({ message : "The email or password is incorrect." });
    }
})

// Desc     Create user in the DB
// Route    POST /api/user
// Access   Private
const register = asyncHandler(async (req, res) => {
    const { last_name, first_name, email, password } = req.body;

    if (!email || email === "" || !password || password === "") {
        return res.status(400).json({ message: "Please fill out all the fields." });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Create user with a default role of "user"
    const user = await User.create({
        first_name,
        last_name,
        email,
        password,
        role: "user",
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            last_name: user.last_name,
            first_name: user.first_name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400).json({ message: "An error occurred, please try again." });
    }
});