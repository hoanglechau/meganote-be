const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Not showing the password field
  // Enabling the lean option tells Mongoose to skip instantiating a full Mongoose document and just return a plain old JS object (POJOs)
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "No users found!" });
  }
  // Not using "return" because we're at the end of the function here
  res.status(StatusCodes.OK).json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  // Check for required data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  // Check if the username already exists
  // Use exec() to get a fully-fledged promise
  const existingUser = await User.findOne({ username }).lean().exec();

  if (existingUser) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This username already exists!" });
  }

  // Hash the password, put it through 10 salt rounds to ensure that the password is safe. Even when looking at it in the database, we wouldn't know what the password is
  const hashedPassword = await bcrypt.hash(password, 10);

  const userObject = { username, password: hashedPassword, roles };

  // Create and store the new user in the database
  const user = await User.create(userObject);

  // Check if the user was created successfully
  if (user) {
    res
      .status(StatusCodes.CREATED)
      .json({ message: `New user ${username} created successfully!` });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user data!" });
  }
});

// @desc Update a user
// @route POST /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  // Check for required data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
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

  // Check if the entered new username is already taken by another user
  const duplicateUser = await User.findOne({ username }).lean().exec();
  if (duplicateUser && duplicateUser?._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This username already exists!" });
  }

  // Update the user with the new data
  // Can only do this if these properties exist in the Mongoose User model
  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash the new password with 10 salt rounds
    user.password = await bcrypt.hash(password, 10);
  }

  // Save the updated user in the database
  const updatedUser = await user.save();

  res
    .status(StatusCodes.OK)
    .json({
      message: `Username ${updatedUser.username} updated successfully!`,
    });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Check for required data
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  // Check if the user has assigned notes
  const notes = await Note.findOne({ user: id }).lean().exec();
  if (notes?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Cannot delete users with assigned notes" });
  }

  // Check if the user exists
  const user = await User.findById(id).exec();
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User not found!" });
  }

  // "deletedUser" will hold the deleted user's information
  const deletedUser = await user.deleteOne();

  res.status(StatusCodes.OK).json({
    message: `Username ${deletedUser.username} with ID ${deletedUser._id} deleted successfully!`,
  });
});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
