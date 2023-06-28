const allowedOrigins = require("./allowedOrigins");

// These options follow the rules of the CORS 3rd party middleware
const corsOptions = {
  // Configures the Access-Control-Allow-Origin CORS header
  origin: (origin, callback) => {
    // Allow testing apps like Postman to be able to access this API
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // null means no error
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // Set the Access-Control-Allow-Credentials header
  credentials: true,
  // The default status code is 204, but 200 can prevent problems on some devices
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
