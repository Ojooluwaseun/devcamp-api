const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const { protect } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail")
const crypto = require('crypto')

//Register User
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
});

//Login user
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //validate email and password
    if (!email || !password) {
      return next(new ErrorResponse("Please provide email and password", 400));
    }
    //check user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorResponse("Invalid Credentials", 401));
    }
    //Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid Credentials", 401));
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
});


//Get User profile
router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

//Update user email and name
router.put("/updateProfile", protect, async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(req.user.id, 
        {name:req.body.name, email:req.body.email},
        {new: true, runValidators:true});
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  });


//Update user password
router.put("/updatePassword", protect, async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");
      //check current password
      if (!(await user.matchPassword(req.body.currentPassword))){
          return next(new ErrorResponse('Password is incorrect', 401))
      }
      user.password = req.body.newPassword
      await user.save()
      sendTokenResponse(user, 200, res);
    } catch (err) {
      next(err);
    }
  });

//Forgot Password
router.post("/forgotPassword", async (req, res, next) => {
    try {
      const user = await User.findOne({email:req.body.email});
      if(!user) {
        return next(new ErrorResponse("Invalid Email", 404));
      }
      //Get reset token
      const resetToken = user.getResetPasswordToken()
      await user.save({validateBeforeSave:false})
      //Create reset Url
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`

      const message = `You are receiving this email because you have requested for a password reset.\n\n 
                       If you did not make this request, please disregard this email.\n\n
                       Please make a put request to: ${resetUrl}`
        try {
            await sendEmail({
                email:user.email,
                subject: 'Password reset token',
                message
            })
            res.status(200).json({ success: true, token: resetToken ,data: 'Please check you email for the reset password link' })
        } catch (err) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined
            await user.save({validateBeforeSave:false})
            
            next(ErrorResponse("Error sending email", 500))
        }
      
    } catch (err) {
      next(err);
    }
  });
  
  //Reset password
  router.put('/resetpassword/:resetToken', async (req, res, next) => {
    try {
        const resetToken = req.params.resetToken
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        const user = await User.findOne({
            resetPasswordToken, resetPasswordExpire: {$gt: Date.now()}
        })
        if(!user) {
            next(new ErrorResponse("Invalid Token", 404))
        }
        //set new password
        user.password = req.body.password
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({validateBeforeSave:false})
        sendTokenResponse(user, 200, res);

        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/login`

        const message = `You are receiving this email because your password has been reset successfully.\n\n 
                        If you did not make this request, please disregard this email.\n\n
                        You can login at : ${resetUrl}`
          
        await sendEmail({
            email:user.email,
            subject: 'Password reset successful',
            message
        })
    
    }    
     catch (err) {
        next(err)
    }
  })

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedToken();
    const options = {
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 86400000),
      httpOnly: true
    };
    if (process.env.NODE_ENV === "production") {
      options.secure = true;
    }
    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({ success: true, token });
  };

module.exports = router;
