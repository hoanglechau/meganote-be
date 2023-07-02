const { logEvents } = require("./logger");

/**
 * @description This file contains the error handler middleware
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Error handler middleware
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );
  // Log out many details of the error
  console.log(err.stack);

  const status = res.statusCode ? res.statusCode : 500; // server error

  res.status(status);

  // The 'isError' flag is used to determine whether the error message should be displayed to the user. This is included so that RTK Query can find it on the frontend. This is for handling errors in the apiSlice on the frontend code
  // This is for unexpected errors (no clear error status)
  res.json({ message: err.message, isError: true });
};

module.exports = errorHandler;
