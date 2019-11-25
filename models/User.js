mongoose = require("mongoose");
bcrypt = require("bcryptjs");
jwt = require("jsonwebtoken");
crypto = require('crypto')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"]
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please add an email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email"
    ]
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
      "'Password needs to have at least one lower case, one uppercase, one number, one special character, and must be at least 8 characters but no more than 35."
    ],
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

//Encrypt password
UserSchema.pre("save", async function(next) {
  if (!this.isModified('password')){
    next()
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Sign JWT and return
UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRE
  });
};

//Compare user password with hashed password in database
UserSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

//Generate and hash reset password token
UserSchema.methods.getResetPasswordToken = function() {
  //Generate token
  const resetToken = crypto.randomBytes(20).toString('hex')

  //Hash token and set to resetPassordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.resetPasswordExpire = Date.now() + 600000

  return resetToken
}

module.exports = mongoose.model("User", UserSchema);
