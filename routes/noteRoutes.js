const express = require("express");
const router = express.Router();
const {
  getAllNotes,
  getNotes,
  getSingleNote,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
const verifyJWT = require("../middleware/verifyJWT");

// Use the verifyJWT middleware for all routes in this file
router.use(verifyJWT);

// Routing with controller methods for different HTTP methods coming into the notes route
router.route("/").get(getNotes).post(createNote);

router.route("/all").get(getAllNotes);
router.route("/:id").get(getSingleNote).patch(updateNote).delete(deleteNote);

module.exports = router;
