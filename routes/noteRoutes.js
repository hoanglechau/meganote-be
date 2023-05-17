const express = require("express");
const router = express.Router();
const {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
const verifyJWT = require("../middleware/verifyJWT");

// Use the verifyJWT middleware for all routes in this file
router.use(verifyJWT);

// Routing with controller methods for different HTTP methods coming into the notes route
router
  .route("/")
  .get(getAllNotes)
  .post(createNote)
  .patch(updateNote)
  .delete(deleteNote);

module.exports = router;
