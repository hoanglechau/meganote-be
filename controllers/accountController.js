const User = require("../models/User");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");

/**
 * @description This file contains the controllers for the account endpoints
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Get the currently logged-in user's account by their id
 * @param {id} req
 * @param {*} res
 * @route GET /account/:id
 * @access Private
 */
const getSingleAccount = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: `No user with id: ${req.params.id}` });
  }
  res.status(StatusCodes.OK).json({ user });
};

/**
 * @description Update the currently logged-in user's account
 * @param {id, username, email, password} req
 * @param {*} res
 * @route PATCH /account/:id
 * @access Private
 */
const updateAccount = async (req, res) => {
  const { id, username, email, password } = req.body;

  // Check for required data
  if (!id || !username || !email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data! Only password is optional!" });
  }

  const user = await User.findById(id).exec();

  // Check if user exists
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User not found!" });
  }

  // Check if the entered new username is already taken by another user
  // Use exec() to get a fully-fledged promise
  // Use collation to make the search case-insensitive -> Check for both lowercase and uppercase characters ('Hoang' and 'hoang' are considered duplicate users)
  const existingUser = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (existingUser && existingUser?._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This username already exists!" });
  }

  const existingEmail = await User.findOne({ email }).lean().exec();

  if (existingEmail && existingEmail?._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This email has already been used!" });
  }

  // Update the user with the new data
  // Can only do this if these properties exist in the Mongoose User model
  user.username = username;
  user.email = email;

  if (password) {
    // Hash the new password with 10 salt rounds
    user.password = await bcrypt.hash(password, 10);
  }

  // Save the updated user in the database
  const updatedUser = await user.save();

  res.status(StatusCodes.OK).json({
    updatedUser,
    message: `User ${updatedUser.username} updated successfully!`,
  });
};

/**
 * @description Update the currently logged-in user's profile
 * @param {id, fullname, avatarUrl} req
 * @param {*} res
 * @route PUT /account/:id
 * @access Private
 */
const updateProfile = async (req, res) => {
  const { id, fullname, avatarUrl } = req.body;

  // Check for required data
  if (!id || !fullname) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  const user = await User.findById(id).exec();

  // Check if user exists
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User not found!" });
  }

  // Update the user with the new data
  // Can only do this if these properties exist in the Mongoose User model
  user.fullname = fullname;
  user.avatarUrl = avatarUrl;

  // Save the updated user in the database
  const updatedUser = await user.save();

  res.status(StatusCodes.OK).json({
    updatedUser,
    message: `User ${updatedUser.username} updated successfully!`,
  });
};

module.exports = {
  getSingleAccount,
  updateAccount,
  updateProfile,
};
