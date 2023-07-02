const mongoose = require("mongoose");

/**
 * @description This file is used to create the User model
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      require: false,
      default: "https://i.redd.it/6qk9jq22ho541.jpg",
    },
    role: {
      type: String,
      default: "Employee",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Name the model "User", and pass in the user schema
module.exports = mongoose.model("User", userSchema);
