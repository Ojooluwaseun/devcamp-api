const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = () => {
  mongoose
    .connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    })
    .then(conn =>
      console.log(
        `MongoDB connected: ${conn.connection.host}`.cyan.underline.bold
      )
    )
    .catch(err => console.log(err.message.red));
};

module.exports = connectDB;
