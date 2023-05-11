const express = require("express");
const app = express();
const path = require("path");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const PORT = process.env.PORT || 5000;

// Custom logger middleware
app.use(logger);

// 3rd party middleware to allow the app to receive requests from other origins (Cross-origin resource sharing) -> Make our server available to the public to access
app.use(cors(corsOptions));

// Built-in middleware to allow the app to receive and parse json data
app.use(express.json());

// 3rd party middleware to parse the cookies that the server receives
app.use(cookieParser());

// Set up path for static files
// Don't need to use '/' when using path.join
app.use("/", express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/index"));

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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
