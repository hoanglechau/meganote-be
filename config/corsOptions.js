const allowedOrigins = require("./allowedOrigins");

// These options follow the rules of the CORS 3rd party middleware
const corsOptions = {
  origin: allowedOrigins,
  // Set the Access-Control-Allow-Credentials header
  credentials: true,
  // The default status code is 204, but 200 can prevent problems on some devices
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
