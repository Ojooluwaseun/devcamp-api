const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const colors = require("colors");
const path = require("path");
const errorHandler = require("./middleware/error");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean")
const rateLimit = require('express-rate-limit')
const hpp = require("hpp")
const cors = require("cors")

//load env variables
dotenv.config({ path: "./config/config.env" });

//connect database
connectDB();

const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

const app = express();
//Body Parser
app.use(express.json({ limit: '10kb' })); //Body limit is 10

//Cookie Parser
app.use(cookieParser());

//dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//File uploading
app.use(fileupload());

//Sanitize data to prevent noSQL Injection Attack
app.use(mongoSanitize())

//Set security headers to prevent XSS Attack
app.use(helmet())

//Sanitize date to prevent XSS Attack
app.use(xss())

// Rate Limiting (max of 100 request per 10min) to prevent DoS attack
const limiter = rateLimit({
  max: 100, 
  windowMs: 10 * 60 * 1000,
});
app.use(limiter)

//Prevent http param polution
app.use(hpp())

//Allow CORS
app.use(cors())

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//Mount Routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews)

//Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(
    `server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// //handle unhandled promise rejections
// process.on("unhandledRejection", err => {
//   console.log(`Error: ${err.message}`);
//   server.close(() => process.exit(1));
// });
