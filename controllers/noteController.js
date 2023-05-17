const Note = require("../models/Note");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = async (req, res) => {
  // Get all notes from MongoDB
  const notes = await Note.find().lean();

  // If no notes exists in the database
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found!" });
  }

  // Add username to each note before sending the response
  const notesWithUser = await Promise.all(
    notes.map(async note => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.status(StatusCodes.OK).json(notesWithUser);
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNote = async (req, res) => {
  const { user, title, text } = req.body;

  // Check for required data
  if (!user || !title || !text) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data" });
  }

  // Check for duplicate note title
  const duplicateNote = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicateNote) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This note title has already been used!" });
  }

  // Create and store the new note
  const note = await Note.create({ user, title, text });

  if (note) {
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "New note created successfully!" });
  } else {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Couldn't create new note!" });
  }
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
  const { id, user, title, text, completed } = req.body;

  // Check for required data
  if (!id || !user || !title || !text || typeof completed !== "boolean") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data" });
  }

  // Check if note exists
  const note = await Note.findById(id).exec();

  if (!note) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Note not found!" });
  }

  // Check for duplicate note title
  const duplicateNote = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original note
  if (duplicateNote && duplicateNote?._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This note title has already been used!" });
  }

  // Update the note with the new data
  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res
    .status(StatusCodes.OK)
    .json(`'${updatedNote.title}' updated successfully!`);
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.body;

  // Check for required data
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data" });
  }

  // Check if the note exists
  const note = await Note.findById(id).exec();

  if (!note) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Note not found!" });
  }

  // deletedNote contains the data of the deleted note
  const deletedNote = await note.deleteOne();

  res.status(StatusCodes.OK).json({
    message: `Note "${deletedNote.title}" with ID ${deletedNote._id} deleted successfully!`,
  });
};

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
};
