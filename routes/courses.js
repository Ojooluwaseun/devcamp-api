const express = require("express");
const router = express.Router({ mergeParams: true });
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

//Get courses and get courses by Bootcamp
router.get("/", advancedResults(Course, { path: "bootcamp", select: "name description" }),
    async (req, res, next) => {
      try {
        if (req.params.bootcampId) {
          courses = await Course.find({ bootcamp: req.params.bootcampId });
          res
            .status(200)
            .json({ success: true, count: courses.length, data: courses });
        } else {
          res.status(200).json(res.advancedResult);
        }
      } catch (err) {
        next(err);
      }
    }
  );

//Get courses by ID
router.get("/:id", async (req, res, next) => {
  try {
    course = await Course.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description"
    });
    if (!course) {
      return next(
        new ErrorResponse(`Oops! No course with id ${req.params.id} found`, 404)
      );
    }
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

//Create course
router.post("/", protect, authorize("publisher", "admin"), async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  try {
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if (!bootcamp) {
      return next(new ErrorResponse(`Oops! No Bootcmap with id ${req.params.bootcampId} found`, 404));
    }
    //Make sure the user is the owner of the bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse("You are not authorized to add a course this bootcamp", 401));
    }

    const course = await Course.create(req.body)
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err)
  }
   
});

//Update course
router.put("/:id", protect, authorize("publisher", "admin"), async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id)
      if (!course) {
          return next(new ErrorResponse(`Oops! No course with id ${req.params.id} found`, 404))
      }
      //Make sure the user is the owner of the course
      if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse("You are not authorized to update this course", 401));
      }
      course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
      res.status(200).json({ success: true, data: course });
  }
  catch (err) {
    next(err)
  }

});

//Delete course
router.delete("/:id", protect, authorize("publisher", "admin"), async(req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
        if (!course) {
          return next(new ErrorResponse(`Oops! No bootcamp with id ${req.params.id} found`, 404));
        }
        //Make sure the user is the owner of the course
        if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
          return next(new ErrorResponse("You are not authorized to delete this course", 401));
        }

        await course.remove();
        res.status(200).json({ success: true, data: {} });
  }
  catch (err) {
    next(err)
  }
})
    

module.exports = router;
