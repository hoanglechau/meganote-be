const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

// @desc Register new user (for demo purposes only)
// @route POST /auth/register
// @body username, password, role, avatarUrl
// @access Public
const register = async (req, res) => {
  const { username, password, role, avatarUrl } = req.body;

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
    ? { username, password: hashedPassword, avatarUrl }
    : { username, password: hashedPassword, role, avatarUrl };

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

// @desc Login
// @route POST /auth
// @body username, password
// @access Public
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

module.exports = {
  register,
  login,
};

/*
// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired. The only way to get a new token is to send a request to this endpoint
const refresh = (req, res) => {
  // Check if the cookies exist
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized!" });

  // Set the refreshToken variable to the cookies if the cookies exist
  const refreshToken = cookies.jwt;

  // Use jwt to verify the token
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    // Catch any async errors that we didn't expect
    async (err, decoded) => {
      if (err)
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Forbidden!" });

      // Check if the user exists
      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Unauthorized!" });

      // Create a new access token
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            role: foundUser.role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user: foundUser, accessToken, message: "Refreshed!" });
    }
  );
};
*/

/*
// @desc Login
// @route POST /auth
// @access Public
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

  // Create refresh token containing username
  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    // Using cross-site cookie since we may have our frontend and backend on different domains
    // sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and role
  res.json({
    user: foundUser,
    accessToken,
    message: "Logged in successfully!",
  });
};
*/

/*
// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  // Check if the cookies exist
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(StatusCodes.NO_CONTENT); //No content -> The request was successful but there's no content
  // Remove the cookies if the user decides to manually log out
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.status(StatusCodes.OK).json({ message: "Cookies cleared!" });
};
*/
