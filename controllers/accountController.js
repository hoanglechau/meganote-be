const User = require("../models/User");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");

// @desc Get the currently logged-in user's account by their id
// @route GET /account/:id
// @params id
// @access Private
const getSingleAccount = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: `No user with id: ${req.params.id}` });
  }
  res.status(StatusCodes.OK).json({ user });
};

// @desc Update the currently logged-in user's account
// @route PATCH /account/:id
// @body id, username, password, avatarUrl
// @access Private
const updateAccount = async (req, res) => {
  const { id, username, password, avatarUrl } = req.body;

  // Check for required data
  if (!id || !username) {
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
  user.avatarUrl = avatarUrl;

  if (password) {
    // Hash the new password with 10 salt rounds
    user.password = await bcrypt.hash(password, 10);
  }

  // Save the updated user in the database
  const updatedUser = await user.save();

  res.status(StatusCodes.OK).json({
    updatedUser,
    message: `Username ${updatedUser.username} updated successfully!`,
  });
};

module.exports = {
  getSingleAccount,
  updateAccount,
};
