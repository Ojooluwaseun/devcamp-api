const colors = require("colors");
const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.log(err);

  if (err.name === "CastError") {
    const message = `Wrongly formatted id of ${err.value}`;
    error = new ErrorResponse(message, 400);
  }

  if (err.code === 11000) {
    const message = `Duplicate field value entered:${err.errmsg
      .split(":")
      .splice(-1)}`;
    error = new ErrorResponse(message, 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || "Server Error" });
};

module.exports = errorHandler;
