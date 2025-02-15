require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const connectDB = require('./config/dbConnection');
const corsOptions = require('./config/corsOptions');
const { errorHandler } = require('./middleware/errorHandler');

const PORT = process.env.PORT || 3000;

// Connect to the database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/gtfs', require('./routes/gtfsRoutes'));

app.get('/', (req, res) => {
    res.send('Welcome to the RailQuest API!');
});

// Error handling middleware
app.use(errorHandler);

// Create an HTTP server for WebSockets
const server = http.createServer(app);

// Start the server after connecting to MongoDB
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.log(`MongoDB connection error: ${err}`);
});