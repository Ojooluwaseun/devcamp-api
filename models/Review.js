mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a review title"],
    maxlength: [100, "Name cannot be more than 100 characters"]
  },
  text: {
    type: String,
    required: [true, "Please add some text"]
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10"]
  },
  
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    require: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: true
  }
});
//Prevent user from sending more than one reveiw for a bootcamp
ReviewSchema.index({bootcamp: 1, user: 1}, {unique: true})

//Calculate average rating
ReviewSchema.statics.getAverageRating = async function(bootcampId) {
    const resultArray = await this.aggregate([
      {
        $match: { bootcamp: bootcampId }
      },
      {
        $group: {
          _id: "$bootcamp",
          averageRating: { $avg: "$rating" }
        }
      }
    ]);
    try {
      await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
        averageRating: resultArray[0].averageRating
      });
    } catch (err) {
      console.error(err);
    }
  };
  
  //call getAverageRating after save
  ReviewSchema.post("save", function() {
    this.constructor.getAverageRating(this.bootcamp);
  });
  
  //call getAverageRating before remove
  ReviewSchema.pre("remove", function() {
    this.constructor.getAverageRating(this.bootcamp);
  });
  

module.exports = mongoose.model("Review", ReviewSchema);
