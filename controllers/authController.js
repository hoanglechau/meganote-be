const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const sendMail = require("../utils/sendMail");

/**
 * @description This file contains the controllers for the auth endpoints
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Register new user (for demo purposes only)
 * @param {username, fullname, email, password, role} req
 * @param {*} res
 * @route POST /auth/register
 * @access Public
 */
const register = async (req, res) => {
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
      .json({ message: `New user ${username} registered successfully!` });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user data!" });
  }
};

/**
 * @description Login
 * @param {username, password} req
 * @param {*} res
 * @route POST /auth
 * @access Public
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  // Check for required data
  if (!username || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing username or password!" });
  }

  // Check if user exists or is active
  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Username not found!" });
  }

  // Compare the password that we receive and the password stored in the database
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Incorrect password!" });

  // Create access token containing username and role
  const accessToken = jwt.sign(
    {
      // Insert this information into the access token
      UserInfo: {
        username: foundUser.username,
        role: foundUser.role,
        avatarUrl: foundUser.avatarUrl,
        _id: foundUser._id,
      },
    },
    // Pass in the environment variable that contains the secret token
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Send accessToken containing username and role
  res.json({
    user: foundUser,
    accessToken,
    message: "Logged in successfully!",
  });
};

/**
 * @description Send reset password email
 * @param {email} req
 * @param {*} res
 * @route POST /auth/forgotpassword
 * @access Public
 * @returns
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Check if the user with that email exists
  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        "There is no user with that email address. Please check your email again!",
    });
  }

  // Generate a random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set the password reset token and its expiration date
  const date = new Date();

  await User.findOneAndUpdate(
    { _id: user._id },
    { passwordResetToken, passwordResetAt: date },
    { email: true }
  ).exec();

  // Send the password reset email
  try {
    const baseURL =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.FRONTEND_URL;
    const resetURL = `${baseURL}/resetpassword/${passwordResetToken}`;

    const message = `Hi ${user.username}! Please click the following link to reset your Meganote password (The link will expire in 1 hour!): ${resetURL}`;

    sendMail(user.email, "Meganote - Password Reset", message);

    return res.status(StatusCodes.OK).json({
      message:
        "Password reset email sent! Please use the reset link within 1 hour!",
    });
  } catch (error) {
    await User.findOneAndUpdate(
      { _id: user._id },
      { passwordResetToken: null, passwordResetAt: null }
    ).exec();

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        "The server encounters an error when sending password reset email!",
    });
  }
};

/**
 * @description Update the user's password when they need to reset it
 * @param {passwordResetToken, password} req
 * @param {*} res
 * @route PATCH /auth/resetpassword/:passwordResetToken
 * @access Public
 */
const resetPassword = async (req, res) => {
  const { passwordResetToken } = req.params;
  const { password } = req.body;

  if (!passwordResetToken || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  let date = new Date();

  const user = await User.findOne({
    passwordResetToken,
    passwordResetAt: { $lt: date },
  }).exec();

  let resetDate = new Date(user.passwordResetAt);
  let isExpired = false;

  if (user) {
    resetDate.setMinutes(resetDate.getMinutes() + 60);
    if (date > resetDate) {
      isExpired = true;
    }
  }

  if (!user || isExpired) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid token or token has expired!" });
  }

  // Hash the new password with 10 salt rounds
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { _id: user._id },
    {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetAt: null,
    },
    { email: true }
  ).exec();

  res.status(StatusCodes.OK).json({ message: "Password reset successfully!" });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
