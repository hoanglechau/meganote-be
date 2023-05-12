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
  if (!users) {
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
const updateUser = asyncHandler(async (req, res) => {});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
