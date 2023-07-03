const User = require("../models/User");
const Note = require("../models/Note");
// Since we're using asyncHandler, we don't need to use try-catch blocks anymore. asyncHandler will catch any errors and pass them to the next middleware. We can then use our custom error handler to handle the errors
// However, since we're also using 'express-async-errors', actually 'express-async-handler' is not necessary anymore. I'm just trying it out in this controller. The other controllerls don't use this package
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const sendMail = require("../utils/sendMail");

/**
 * @description This file contains the routes for the user endpoints
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Get all users
 * @param {*} req
 * @param {*} res
 * @route GET /users/all
 * @access Admin
 */
const getAllUsers = async (req, res) => {
  // Not showing the password field
  // Enabling the lean option tells Mongoose to skip instantiating a full Mongoose document and just return a plain old JS object (POJOs)
  const users = await User.find({ isDeleted: false })
    .select("-password")
    .lean();
  if (!users?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "No users found!" });
  }
  // Not using "return" because we're at the end of the function here
  res.status(StatusCodes.OK).json(users);
};

/**
 * @description Get users with search query, filter, and paginations
 * @param {page, limit, ...filter} req
 * @param {*} res
 * @route GET /users
 * @access Admin
 */
const getUsers = async (req, res) => {
  let { page, limit, ...filter } = { ...req.query };

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const filterConditions = [{ isDeleted: false }];
  if (filter.fullname) {
    filterConditions.push({
      fullname: { $regex: filter.fullname, $options: "i" },
    });
  }
  if (filter.role) {
    filterConditions.push({
      role: { $regex: filter.role, $options: "i" },
    });
  }
  if (filter.active) {
    filterConditions.push({
      active: filter.active,
    });
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await User.countDocuments(filterCriteria);
  const totalPage = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  if (!users?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "No users found!" });
  }
  // Not using "return" because we're at the end of the function here
  res.status(StatusCodes.OK).json({ users, totalPage, count });
};

/**
 * @description Get a single user by their id
 * @param {id} req
 * @param {*} res
 * @route GET /users/:id
 * @access Admin
 */
const getSingleUser = async (req, res) => {
  const user = await User.findById(req.params.id).exec();
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: `No user with id: ${req.params.id}` });
  }
  res.status(StatusCodes.OK).json({ user });
};

/**
 * @description Create a new user
 * @param {username, fullname, email, password, role} req
 * @param {*} res
 * @route POST /users
 * @access Admin
 * @returns
 */
const createUser = async (req, res) => {
  const { username, fullname, email, password, role } = req.body;
  // Check for required data
  // 'Roles' is not required since it already has a default as 'Employee'
  if (!username || !fullname || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  // Check if the username already exists
  // Use exec() to get a fully-fledged promise
  // Use collation to make the search case-insensitive -> Check for both lowercase and uppercase characters ('Hoang' and 'hoang' are considered duplicate users)
  // The lean option tells Mongoose to skip hydrating the result documents. This makes queries faster and less memory intensive, but the result documents are plain old JavaScript objects (POJOs), not Mongoose documents
  // Using lean() is a good option when you don't need to use any of Mongoose's built-in methods
  const existingUser = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (existingUser) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This username already exists!" });
  }

  const existingEmail = await User.findOne({ email }).lean().exec();

  if (existingEmail) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This email has already been used!" });
  }

  // Hash the password, put it through 10 salt rounds to ensure that the password is safe. Even when looking at it in the database, we wouldn't know what the password is
  const hashedPassword = await bcrypt.hash(password, 10);

  // If role doesn't exist in the request body, don't include it in the user object
  const userObject = !role
    ? { username, fullname, email, password: hashedPassword }
    : { username, fullname, email, password: hashedPassword, role };

  // Create and store the new user in the database
  const user = await User.create(userObject);

  // Check if the user was created successfully
  if (user) {
    res
      .status(StatusCodes.CREATED)
      .json({ user, message: `New user "${username}" created successfully!` });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user data!" });
  }
};

/**
 * @description Update an existing user
 * @param {id, username, fullname, email, role, active} req
 * @param {*} res
 * @route PATCH /users/:id
 * @access Admin
 */
const updateUser = async (req, res) => {
  const { id, username, fullname, email, role, active } = req.body;

  // Check for required data
  if (
    !id ||
    !username ||
    !fullname ||
    !email ||
    !role ||
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
  user.fullname = fullname;
  user.email = email;
  user.role = role;
  user.active = active;

  // Save the updated user in the database
  const updatedUser = await user.save();

  // Send a notification email to the user
  const message = `Hi ${updatedUser.username}! Your Meganote account information has been updated!`;
  sendMail(updatedUser.email, "Meganote - Account Updated", message);

  res.status(StatusCodes.OK).json({
    updatedUser,
    message: `User "${updatedUser.fullname}" updated successfully!`,
  });
};

/**
 * @description Soft delete an existing user
 * @param {id} req
 * @param {*} res
 * @route DELETE /users/:id
 * @access Admin
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  // Check for required data
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ req: req.body, message: "Missing required data!" });
  }

  // Check if the user has assigned notes
  const notes = await Note.findOne({ user: id, isDeleted: false })
    .lean()
    .exec();

  if (notes || notes?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Cannot delete users with assigned notes!" });
  }

  const date = new Date();

  // If the user exists, soft delete them
  const user = await User.findOneAndUpdate(
    { _id: id },
    { isDeleted: true, deletedAt: date },
    { new: true }
  ).exec();

  // If the user doesn't exist, return an error
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User not found!" });
  }

  // Return a success message after deleting the user
  res.status(StatusCodes.OK).json({
    message: `User "${user.fullname}" has been deleted!`,
  });
};

module.exports = {
  getAllUsers,
  getUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
};
