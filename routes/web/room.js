



// routes/roomRoutes.js

const express = require("express");
const router = express.Router();
const roomController = require('../../models/room');

// GET: display all rooms
router.get("/", roomController.getAllRooms);

module.exports = router;


