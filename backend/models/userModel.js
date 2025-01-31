const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//create the user model
const userSchema = mongoose.Schema({
    last_name : {
        type: String,
        trim: true,
        required: true,
    },
    first_name : {
        type: String,
        trim: true,
        required: true,
    },
    email : {
        type: String,
        trim: true,
        required: true,
    },
    password : {
        type: String,
        required: true,
    },
    role : {
        type: String,
        required: true,
    }

}, {timestamps: true});