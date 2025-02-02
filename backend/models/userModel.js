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

//compare the password with the one in the DB
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}

//encrypt the password
userSchema.pre('save', async function(next){
    if (!this.isModified('password')){
        next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

module.exports = mongoose.model('User', userSchema)