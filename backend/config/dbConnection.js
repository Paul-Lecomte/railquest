const mongoose = require('mongoose')

//we try to connect to mangoDB
const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.DATABASE_URI)
    } catch (err){
        console.log(err)
    }
}

module.exports = connectDB