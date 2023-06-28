const Note = require("../models/Note");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

// @desc Get all notes
// @route GET /notes/all
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

// @desc Get notes with search query, filter, and paginations
// @route GET /notes
// @query page, limit, ticket, title, status
// @access Private
const getNotes = async (req, res, next) => {
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // Not showing notes that have been soft deleted
  const filterConditions = [{ isDeleted: false }];
  // If there's a ticket number in the query, search for the ticket number
  if (filter.ticket) {
    filterConditions.push({
      ticket: filter.ticket,
    });
  }
  // Else, first search for the notes by the usernames of assignees
  if (filter.term) {
    const foundUsers = await User.find({
      username: { $regex: filter.term, $options: "i" },
    })
      .lean()
      .exec();

    const foundUsersIds = foundUsers.map(user => user._id);

    // If there are users found, search for the notes by the users' ids
    // Else, search for the notes by the title
    if (foundUsers?.length) {
      filterConditions.push({
        user: { $in: foundUsersIds },
      });
    } else {
      filterConditions.push({
        title: { $regex: filter.term, $options: "i" },
      });
    }
  }
  // If there's a status in the query, search for the note status
  if (filter.status) {
    filterConditions.push({
      status: { $ne: filter.status },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  // For table pagination
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

  // Add the user's username and role to each note before sending the response
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

// @desc Get a single note by its id
// @route GET /notes/:id
// @params id
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

// @desc Create a new note
// @route POST /notes
// @body user, title, text, status
// @access Private
const createNote = async (req, res) => {
  const { user, title, text, status } = req.body;

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

// @desc Update an existing note
// @route PATCH /notes/:id
// @body id, user, title, text, status
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

// @desc Soft delete an existing note
// @route DELETE /notes/:id
// @params id
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
