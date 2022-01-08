const express = require('express')
const Router = express.Router()
const userController = require('../controller/userController')
const authController = require('../controller/authController')

Router.post('/login',authController.login)
Router.post('/signup',authController.signup)
Router.post('/verifyOtp',authController.verifyOtp)
Router.route('/')
        .get(userController.getAllUsers)

Router.get('/me/',userController.me)        
        
Router.route('/:id')
        .get(userController.getUser)
        .delete(userController.deleteUser)
        .patch(userController.updateUser)


module.exports = Router