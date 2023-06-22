const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUsers,
  getCurrentUser,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const verifyJWT = require("../middleware/verifyJWT");

// Use the verifyJWT middleware for all routes in this file
router.use(verifyJWT);

// Routing with controller methods for different HTTP methods coming into the users route
router.route("/").get(getUsers).post(createUser);

router.route("/all").get(getAllUsers);
router.route("/:id").get(getSingleUser).patch(updateUser).delete(deleteUser);

module.exports = router;
