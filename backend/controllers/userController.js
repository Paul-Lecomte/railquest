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

// Desc     update the user profile
// Route    PUT /api/user/profiles
// Access   Private
const updateUserProfile = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id)
    if (!user){
        res.status(400)
        throw new Error("The user already exist.")
    }

    user.last_name = req.body.last_name || user.last_name
    user.first_name = req.body.first_name || user.first_name
    user.email = req.body.email || user.email
    user.role = req.body.role || user.role

    if(req.body.password){
        user.password = req.body.password
    }

    const updatedUser = await user.save()

    res.status(201).json({
        _id: updatedUser._id,
        last_name: updatedUser.last_name,
        first_name: updatedUser.first_name,
        email: updatedUser.email,
        role:updatedUser.role
    })
})

// Desc     Logout the user
// Route    POST /api/user/logout
// Access   Private
const logout = asyncHandler(async(req, res)=>{
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    })
    res.status(200).json({message: 'User disconnected with success.'})
})

// Desc     Delete a user
// Route    DELETE /api/user/:id
// Access   Private
const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.params._id;
    // Attempt to find and delete the user
    const result = await User.deleteOne({ _id: userId });
    // Check if the user was found and deleted
    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error("User not found.");
    }
    res.status(200).json({ message: "User has been successfully deleted." });
});