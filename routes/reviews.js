const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../models/Review");
const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

//Get reviews and get reviews by Bootcamp
router.get("/", advancedResults(Review, { path: "bootcamp", select: "name description" }),
    async (req, res, next) => {
      try {
        if (req.params.bootcampId) {
          reviews = await Review.find({ bootcamp: req.params.bootcampId });
          res
            .status(200)
            .json({ success: true, count: reviews.length, data: reviews });
        } else {
          res.status(200).json(res.advancedResult);
        }
      } catch (err) {
        next(err);
      }
    }
  );

//Get reviews by ID
router.get("/:id", async (req, res, next) => {
  try {
    review = await Review.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description"
    });
    if (!review) {
      return next(
        new ErrorResponse(`Oops! No review with id ${req.params.id} found`, 404)
      );
    }
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

//Create review
router.post("/:bootcampId", protect, authorize("user", "admin"), async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  try {
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if (!bootcamp) {
      return next(new ErrorResponse(`Oops! No Bootcamp with id ${req.params.bootcampId} found`, 404));
    }
    //Check if user already sent review for this bootcamp, then prevent from sending another review
    const sentReview = await Review.find({ user: req.user.id });
    const sentReviewForBootcamp = sentReview.find(review => review.bootcamp.toString() === req.params.bootcampId)
    
    if (sentReviewForBootcamp) {
      return next(new ErrorResponse(`User already sent review for this bootcamp`, 400));
    }

    const review = await Review.create(req.body)
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err)
  }
   
});

//Update review
router.put("/:id", protect, authorize("user", "admin"), async (req, res, next) => {
    try {
      let review = await Review.findById(req.params.id);
      if (!review) {
        return next(new ErrorResponse(`Oops! No review with id ${req.params.id} found`, 404));
      }
      //Make sure the user is the owner of the review
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse("You are not authorized to update this review", 401));
      }

      review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })

      res.status(200).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  }
);

//Delete review
router.delete("/:id", protect, authorize("user", "admin"), async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return next(new ErrorResponse(`Oops! No review with id ${req.params.id} found`, 404))
    }
    //Make sure the user is the owner of the review
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse("You are not authorized to delete this review", 401));
    }

    await review.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err)
  }
   
});

module.exports = router;
