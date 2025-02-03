const {protect} = require("../middleware/authMiddleware")
const {admin} = require("../middleware/authMiddleware")
const userController = require("../controllers/userController")
const express = require('express')
const router = express.Router()

// Route login user
router.route('/login').post(userController.login)

// Route register user
router.route('/register').post(userController.register)

// Route to update user (user or admin)
router.route('/update').put(protect, userController.updateUserProfile)

// Route to delete a user
router.route('/delete').delete(protect, userController.deleteUser)