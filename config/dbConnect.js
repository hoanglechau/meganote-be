/**
 * @description This file is used to connect to the MongoDB database
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
