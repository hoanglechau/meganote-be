require("dotenv").config(); // Prefer to put at the start
// Handle uncaught exceptions. Must be at the top of the file. This package automatically applies itself everywhere in our app to handle async errors
require("express-async-errors");
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConnect");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000;

// Connect to MongoDB database
connectDB();

// Custom logger middleware
app.use(logger);

// 3rd party middleware to allow the app to receive requests from other origins (Cross-origin resource sharing) -> Make our server available to the public to access
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Built-in middleware to allow the app to receive and parse json data
app.use(express.json());

// 3rd party middleware to parse the cookies that the server receives
app.use(cookieParser());

// Set up path for static files
// Don't need to use '/' when using path.join
app.use("/", express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/account", require("./routes/accountRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/notes", require("./routes/noteRoutes"));

// Handle 404 Not Found error
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// Custom middleware to handle errors
app.use(errorHandler);

// Connect to MongoDB and start the server
mongoose.connection.once("open", () => {
  console.log("⚡Connected to MongoDB");
  app.listen(PORT, () => console.log(`⚡Server is running on port ${PORT}`));
});

// Handle MongoDB connection errors
mongoose.connection.on("error", err => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
