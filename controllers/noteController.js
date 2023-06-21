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

const getNotes = async (req, res, next) => {
  let { page, limit, ...filter } = { ...req.query };

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const filterConditions = [{ isDeleted: false }];
  if (filter.ticket) {
    filterConditions.push({
      ticket: filter.ticket,
    });
  }
  if (filter.title) {
    filterConditions.push({
      title: { $regex: filter.title, $options: "i" },
    });
  }
  if (filter.status) {
    filterConditions.push({
      status: { $ne: filter.status },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  const count = await Note.countDocuments(filterCriteria);
  const totalPage = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let notes = await Note.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  if (!notes?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "No notes found!" });
  }

  // Add username to each note before sending the response
  const notesWithUser = await Promise.all(
    notes.map(async note => {
      const user = await User.findById(note.user);
      if (user) {
        return {
          _id: note._id,
          title: note.title,
          text: note.text,
          username: user.username,
          role: user.role,
          user: note.user,
          status: note.status,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          ticket: note.ticket,
          __v: note.__v,
        };
      }
      return {
        _id: note._id,
        title: note.title,
        text: note.text,
        username: "Unassigned",
        role: "",
        user: note.user,
        status: note.status,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        ticket: note.ticket,
        __v: note.__v,
      };
    })
  );

  // Not using "return" because we're at the end of the function here
  return res
    .status(StatusCodes.OK)
    .json({ notes: notesWithUser, totalPage, count });
};

// @desc Get a single user by their username
// @route GET /users
// @access Private
const getSingleNote = async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: `No note with id: ${req.params.id}` });
  }

  // Add username and user's role to each note before sending the response
  const noteWithUser = async note => {
    const user = await User.findById(note.user);
    if (user) {
      return {
        _id: note._id,
        title: note.title,
        text: note.text,
        username: user.username,
        role: user.role,
        user: note.user,
        status: note.status,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        ticket: note.ticket,
        __v: note.__v,
      };
    }
    return {
      _id: note._id,
      title: note.title,
      text: note.text,
      username: "Unassigned",
      role: "",
      user: note.user,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      ticket: note.ticket,
      __v: note.__v,
    };
  };

  const noteResult = await noteWithUser(note);

  res.status(StatusCodes.OK).json({ note: noteResult });
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNote = async (req, res) => {
  const { user, title, text, status } = req.body;
  console.log("req body", req.body);

  // Check for required data
  if (!user || !title || !text || !status) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data" });
  }

  // Check if the note title has already been used
  // Collation is used to make the search case insensitive (Check for both uppercase and lowercase letters)
  const existingNote = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (existingNote) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This note title has already been used!" });
  }

  // Create and store the new note
  const note = await Note.create({ user, title, text, status });

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
  const { id, user, title, text, status } = req.body;

  // Check for required data
  if (!id || !user || !title || !text || !status) {
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

  // Check if the note title has already been used
  const existingNote = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original note
  if (existingNote && existingNote?._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "This note title has already been used!" });
  }

  // Update the note with the new data
  note.user = user;
  note.title = title;
  note.text = text;
  note.status = status;

  const updatedNote = await note.save();

  res
    .status(StatusCodes.OK)
    .json(`'Note #${updatedNote.ticket}' updated successfully!`);
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.params;

  // Check for required data
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required data" });
  }

  // Check if the user exists
  const note = await Note.findOneAndUpdate(
    { _id: id },
    { isDeleted: true },
    { new: true }
  ).exec();

  if (!note) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Note not found!" });
  }

  res.status(StatusCodes.OK).json({
    message: `Note #${note.ticket} deleted successfully!`,
  });
};

module.exports = {
  getAllNotes,
  getNotes,
  getSingleNote,
  createNote,
  updateNote,
  deleteNote,
};
