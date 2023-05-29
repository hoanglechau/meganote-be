const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { username, password } = req.body;

  // Check for required data
  if (!username || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data!" });
  }

  // Check if user exists or is active
  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized!" });
  }

  // Compare the password that we receive and the password stored in the database
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized!" });

  // Create access token containing username and roles
  const accessToken = jwt.sign(
    {
      // Insert this information into the access token
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    // Pass in the environment variable that contains the secret token
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
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

  // Send accessToken containing username and roles
  res.json({ accessToken });
};

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
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    }
  );
};

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

module.exports = {
  login,
  refresh,
  logout,
};
