const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const verifyJWT = require("../middleware/verifyJWT");

// Use the verifyJWT middleware for all routes in this file
router.use(verifyJWT);

// Routing with controller methods for different HTTP methods coming into the users route
router
  .route("/")
  .get(getAllUsers)
  .post(createUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
