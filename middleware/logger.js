const { format } = require("date-fns");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

// Helper function
const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  // uuid creates a unique id for each log item
  // Each log item has its own line in the log file
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    // Create the logs folder if it hasn't been created yet
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }
    // Append the log item to the log file or create the new log file if it hasn't been created yet
    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", logFileName),
      logItem
    );
  } catch (err) {
    console.log(err);
  }
};

// The logger middleware logs the request method, url, and origin
const logger = (req, res, next) => {
  // Log every request that comes into the server
  // Can also include if clauses to log only certain requests
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
  console.log(`${req.method} ${req.path}`);
  // Move onto the next piece of middleware
  next();
};

module.exports = { logEvents, logger };
