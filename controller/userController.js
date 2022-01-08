const User = require('../model/user')
const util = require('util');
const jwt = require('jsonwebtoken')

exports.getAllUsers = async(req,res)=>{
    try {
        
        let users = await User.find().select('-otp -role -password');

        res.status(200).json({
            stauts:'success',
            result:users.length,
            data:users
        })

    } catch (err) {
        res.status(400).json({
            status:'fail',
            message:err.message
        })
    }
}

exports.getUser = async(req,res)=>{
    try {
        let user = await User.findById(req.params.id)
        res.status(200).json({
            status:'success',
            data:user
        })
    } catch (err) {
        res.status(400).json({
            status:'fail',
            message:err.message
        })
    }
}

exports.deleteUser = async(req,res)=>{
    try {
        
        await User.findByIdAndDelete(req.params.id)

        res.status(200).json({
            status:'success'
        })

    } catch (err) {
        res.status(400).json({
            status:'fail',
            message:err.message
        })
    }
}

exports.updateUser = async(req,res)=>{
    try {
        
        let user =await User.findByIdAndUpdate(req.params.id,req.body,{new:true})   

            res.status(200).json({
                status:'success',
                data:user
            })
            

    } catch (err) {
        res.status(400).json({
            status:'fail',
            message:err.message
        })
    }
}

exports.me  = async(req,res)=>{

try {
let token = req.params.token

const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
let user = await User.findById(decoded.id).select('name email phone role -_id')
 if(user)  
res.status(200).json({
        status:'success',
        data:user
    })
    
else{
    res.status(404).json({
        status:'fail',
        message:'No user found!😢'
    })
}

} catch (err) {
    res.status(400).json({
        status:'fail',
        message:err.message
    })
}

}