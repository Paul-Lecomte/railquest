const mongoose = require('mongoose')

//we try to connect to mangoDB
const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.DATABASE_URI, {
            serverSelectionTimeoutMS: 60000, // 30 seconds timeout for server selection
            socketTimeoutMS: 60000, // 45 seconds timeout for socket
        });
    } catch (err){
        console.log(err)
    }
}

module.exports = connectDB