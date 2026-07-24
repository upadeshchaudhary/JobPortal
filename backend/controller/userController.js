const User = require("../model/UserModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require("../services/sendEmail");

// Create a new user -> register user
const registerUser = async (req, res) => {
    // taking data from req body

    
    const { username, userEmail, userPassword } = req.body

    if (!username || !userEmail || !userPassword) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    // Check if user already exists
    const isExistingUser = await User.findOne({ where: { userEmail } }) // returns object or null

    if (isExistingUser) {
        return res.status(400).json({
            message: "User already exists"
        })
    }

    // Create user
    User.create({
        username,
        userEmail,
        userPassword: bcrypt.hashSync(userPassword, 10) // hashing password
    })
    return res.status(201).json({
        message: "User registered successfully"
    })
}

// Login User

const loginUser = async (req, res) => {
    const { userEmail, userPassword } = req.body
    if (!userEmail || !userPassword) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    // Check if user exists
    const isExistingUser = await User.findOne({ where: { userEmail } }) // returns object or null

    if (!isExistingUser) {
        return res.status(400).json({
            message: "User does not exist"
        })
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(userPassword, isExistingUser.userPassword)
    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid credentials"
        })
    }

    // Generate JWT Token
    const token = jwt.sign({userId: isExistingUser.id}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })

    return res.status(200).json({
        message: "User logged in successfully",
        token: token,
        user: {
            id: isExistingUser.id,
            username: isExistingUser.username,
            userEmail: isExistingUser.userEmail
        }
    })
}



 const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log("Forgot password request for email:", email);

    try {
      const user = await User.findOne({ where: { userEmail: email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("OTP generated:", otp);




      user.otp = otp;
      await user.save();

      await sendEmail({
        email,
        subject: "Password Reset OTP",
        message: `Your OTP for password reset is: ${otp}`,
      });

      return res.status(200).json({
        message: "OTP sent to email",
      });
    } catch (err) {
      console.error("Failed to process forgot password:", err.message);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  };



  // verify otp 
exports.verifyOtp = async(req,res)=>{
    const {email,otp} = req.body
    if(!email || !otp){
        return res.status(400).json({
            message : "Please provide email,otp"
        })
    }
    // check if that otp is correct or not of that email
   const userExists = await User.findOne({ where: { userEmail: email } });
   console.log(userExists)
   if(!userExists){
    return res.status(404).json({
        message : "Email is not registered"
    })
   }

   
   console.log(userExists[0].otp, otp)
   if(userExists[0].otp !== otp*1){

    res.status(400).json({
        message : "Invalid otp"
    })
   }else{
    // dispost the otp so cannot be used next time the same otp
    userExists[0].otp = undefined
    userExists[0].isOtpVerified = true
    await userExists[0].save()
    res.status(200).json({
        message : "Otp is correct"
    })
   }
}




exports.resetPassword = async (req,res)=>{
    const {email,newPassword,confirmPassword} = req.body
    if(!email || !newPassword || !confirmPassword){
        return res.status(400).json({
            message : "Please provide email,newPassword,confirmPassword"
        })
    }
    if(newPassword !== confirmPassword){
        return res.status(400).json({
            message : "newPassword and confirmPassword doesn't match"
        })
    }

    const userExists = await User.find({userEmail:email}).select("+isOtpVerified")
    if(userExists.length == 0){
        return res.status(404).json({
            message : "User email not registered"
        })
    }
    console.log(userExists)
    if(userExists[0].isOtpVerified != true){
        return res.status(403).json({
            message : "You cannot perform this action"
        })
    }

    userExists[0].userPassword = bcrypt.hashSync(newPassword,10)
    userExists[0].isOtpVerified = false;

    await userExists[0].save()

    res.status(200).json({
        message : "Password changed successfully"
    })
}



module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
}