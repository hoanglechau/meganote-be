const User = require("../models/User");
const Note = require("../models/Note");
// Since we're using asyncHandler, we don't need to use try-catch blocks anymore. asyncHandler will catch any errors and pass them to the next middleware. We can then use our custom error handler to handle the errors
// However, since we're also using 'express-async-errors', actually 'express-async-handler' is not necessary anymore. I'm just trying it out in this controller. The other controllerls don't use this package
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
  const { username, password, role } = req.body;

  // Check for required data
  // 'Roles' is not required since it already has a default as 'Employee'
  if (!username || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  // Check if the username already exists
  // Use exec() to get a fully-fledged promise
  // Use collation to make the search case-insensitive -> Check for both lowercase and uppercase characters ('Hoang' and 'hoang' are considered duplicate users)
  const existingUser = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (existingUser) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This username already exists!" });
  }

  // Hash the password, put it through 10 salt rounds to ensure that the password is safe. Even when looking at it in the database, we wouldn't know what the password is
  const hashedPassword = await bcrypt.hash(password, 10);

  // If role doesn't exist in the request body, don't include it in the user object
  const userObject = !role
    ? { username, password: hashedPassword }
    : { username, password: hashedPassword, role };

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
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, role, active, password } = req.body;

  // Check for required data
  if (!id || !username || !role || typeof active !== "boolean") {
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

  // Update the user with the new data
  // Can only do this if these properties exist in the Mongoose User model
  user.username = username;
  user.role = role;
  user.active = active;

  if (password) {
    // Hash the new password with 10 salt rounds
    user.password = await bcrypt.hash(password, 10);
  }

  // Save the updated user in the database
  const updatedUser = await user.save();

  res.status(StatusCodes.OK).json({
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
