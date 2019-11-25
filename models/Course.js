mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"]
  },
  description: {
    type: String,
    required: [true, "Please add a description"]
  },
  weeks: {
    type: String,
    required: [true, "Please add course duration"]
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"]
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add minimum skill"],
    enum: ["beginner", "intermediate", "advanced"]
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    require: [true, "Please add a bootcamp"]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: [true, "Please add a publisher"]
  }
});

//Calculate average cost
CourseSchema.statics.getAverageCost = async function(bootcampId) {
  const resultArray = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" }
      }
    }
  ]);
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(resultArray[0].averageCost / 10) * 10
    });
  } catch (err) {
    console.error(err);
  }
};

//call getAverageCost after save
CourseSchema.post("save", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

//call getAverageCost before remove
CourseSchema.pre("remove", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
