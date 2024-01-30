const express = require("express");
const Hotel = require("../../models/hotel");
const RoomType = require("../../models/roomType");
const Room = require("../../models/room");

const router = express.Router();

// POST route for accepting search form data
router.post("/availability", async (req, res) => {
  // Extract Search parameters from form data

  const { checkin, checkout, adults, children, roomNo = 1, price } = req.body;
  console.log(checkin, checkout, adults, children, roomNo, price);

  // Redirect to GET route for displaying search results with pagination
  res.redirect(
    `/search/availability/results?page=1&checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}&roomNo=${roomNo}&price=${price}`
  );
});

// GET route for displaying search results with pagination
router.get("/availability/",
searchController.getavailability);


module.exports = router;
