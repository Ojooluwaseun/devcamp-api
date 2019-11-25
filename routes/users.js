const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router.use(protect)
router.use(authorize('admin'))

//Get all users
router.get("/", advancedResults(User),
    async (req, res, next) => {
      try{
        res.status(200).json(res.advancedResult);  
      } catch (err) {
        next(err);
      }
    }
  );

//Get user by ID
router.get("/:id", async (req, res, next) => {
  try {
    user = await User.findById(req.params.id)
    if (!user) {
      return next(
        new ErrorResponse(`Oops! No user with id ${req.params.id} found`, 404)
      );
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

//Create user
router.post("/", async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err)
  }
   
});

//Update user
router.put("/:id", async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id)
      if (!user) {
          return next(new ErrorResponse(`Oops! No user with id ${req.params.id} found`, 404))
      }
      //Make sure the user is the owner of the course
      user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
      res.status(200).json({ success: true, data: user });
  }
  catch (err) {
    next(err)
  }

});

//Delete user
router.delete("/:id", async(req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
        if (!user) {
          return next(new ErrorResponse(`Oops! No user with id ${req.params.id} found`, 404));
        }

        await user.remove();
        res.status(200).json({ success: true, data: {} });
  }
  catch (err) {
    next(err)
  }
})
    

module.exports = router;
