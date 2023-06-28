const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const verifyJWT = (req, res, next) => {
  // Look for both the lowercase and uppercase Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // Authorization Headers should always start with 'Bearer '
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized!" });
  }

  // We don't want the word 'Bearer' and the space in our token
  const token = authHeader.split(" ")[1];

  // Verify the token with jwt
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err)
      return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden!" });
    req.user = decoded.UserInfo.username;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
