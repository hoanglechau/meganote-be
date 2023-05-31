// const allowedOrigins = require("./allowedOrigins");

// These options follow the rules of the CORS 3rd party middleware
const corsOptions = {
  // Configures the Access-Control-Allow-Origin CORS header
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  // Set the Access-Control-Allow-Credentials header
  credentials: true,
  // The default status code is 204, but 200 can prevent problems on some devices
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
