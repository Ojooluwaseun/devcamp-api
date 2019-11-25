const express = require("express");
const router = express.Router();
const path = require("path");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

//include other resource routers
courseRouter = require("./courses");
reviewRouter = require("./reviews");

router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

//Get all bootcamps
router.get("/", advancedResults(Bootcamp, 
  {path: "user courses reviews", select:"name email title text rating user description weeks tuition minimumSkill scholarshipAvailable"}), 
  async (req, res, next) => {
    try {
      res.status(200).json(res.advancedResult);
    } catch (err) {
      next(err);
    }
  }
);

//Get a single bootcamp
router.get("/:id", async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id).populate({
      path: "user courses reviews",
      select: "name email title text rating user description weeks tuition minimumSkill scholarshipAvailable"
    })
    if (!bootcamp) {
      return next(new ErrorResponse(`Oops! No bootcamp with id ${req.params.id} found`, 404));
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    next(err);
  }
  
});

//Create bootcamp
router.post("/", protect, authorize("publisher", "admin"), async (req, res, next) => {
    try {
      //add user to body
      req.body.user = req.user.id;

      //Check if user already published a bootcamp and not an admin, then prevent from creating another bootcamp
      const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
      if (publishedBootcamp && req.user.role !== "admin") {
        return next(new ErrorResponse(`User already published a bootcamp`, 400));
      }

      const bootcamp = await Bootcamp.create(req.body);
      res.status(201).json({ success: true, data: bootcamp });
    } catch (err) {
      next(err);
    }
  }
);

//Update bootcamp
router.put("/:id", protect, authorize("publisher", "admin"), async (req, res, next) => {
    try {
      let bootcamp = await Bootcamp.findById(req.params.id);
      if (!bootcamp) {
        return next(new ErrorResponse(`Oops! No bootcamp with id ${req.params.id} found`, 404));
      }
      //Make sure the user is the owner of the bootcamp
      if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse("You are not authorized to update this bootcamp", 401));
      }

      bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })

      res.status(200).json({ success: true, data: bootcamp });
    } catch (err) {
      next(err);
    }
  }
);

//Delete bootcamp
router.delete("/:id", protect, authorize("publisher", "admin"), async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
      return next(new ErrorResponse(`Oops! No bootcamp with id ${req.params.id} found`, 404))
    }
    //Make sure the user is the owner of the bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse("You are not authorized to delete this bootcamp", 401));
    }

    await bootcamp.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err)
  }
   
});

//Get Bootcamps within a radius
router.get("/radius/:zipcode/:distance", async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;
    const loc = await geocoder.geocode(zipcode);
    const long = loc[0].longitude;
    const lat = loc[0].latitude;

    //calculate radius
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[long, lat], radius] } }
    });
    res
      .status(200)
      .json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (err) {
    next(err);
  }
});

//Upload bootcamp photo
router.put("/:id/upload", protect, authorize("publisher", "admin"), async (req, res, next) => {
    try {
      bootcamp = await Bootcamp.findById(req.params.id);
      if (!bootcamp) {
        return next(new ErrorResponse(`Oops! No bootcamp with id ${req.params.id} found`, 404));
      }
      //Make sure the user is the owner of the bootcamp
      if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse("You are not authorized to update this bootcamp", 401));
      }

      if (!req.files) {
        return next(new ErrorResponse("Please upload a file", 400));
      }
      const file = req.files.file;
      //make sure file is a photo
      if (!file.mimetype.startsWith("image")) {
        return next(new ErrorResponse("Please upload an image file", 400));
      }

      //Check file size
      if (file.size > process.env.MAX_UPLOAD_SIZE) {
        return next(new ErrorResponse(`File cannot be more than ${process.env.MAX_UPLOAD_SIZE}B`, 400));
      }
      //Create custom file name
      file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

      file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
          console.error(err);
          return next(new ErrorResponse("Problem with photo upload", 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
      });
      res.status(200).json({ success: true, data: file.name });
    } catch (error) {
      next(err);
    }
  }
);

module.exports = router;
