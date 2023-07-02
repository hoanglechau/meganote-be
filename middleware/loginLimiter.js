const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

/**
 * @description This file contains the login limiter middleware
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

/**
 * @description Login limiter middleware to limit the number of login attempts
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per `window` per minute
  message: {
    message:
      "Too many login attempts from this IP, please try again after a 60 second pause",
  },
  // The handler will handle what will happen when the login limit is reached
  handler: (req, res, next, options) => {
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  // These headers are recommended in the official documentation
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
