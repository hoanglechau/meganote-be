const express = require("express");
const router = express.Router();
const path = require("path");

/**
 * @description This file contains the routes for the root of the application
 * @author [Hoang Le Chau](https://github.com/hoanglechau)
 */

router.get("^/$|/index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

module.exports = router;
