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
router.get("/availability/", async (req, res) => {
  // Extract search parameters and pagination parameters from query string or default to page 1
  const { checkin, checkout, adults, children, roomNo = 1, price } = req.query;
  let search;
  console.log(checkin); // "2023-01-01"
  console.log(checkout); // "2023-01-05"
  console.log(adults); // 2
  console.log(children); // 1
  console.log(roomNo); // 1 (default value)
  console.log(price); // 100
  try {
    const allRoomTypes = await RoomType.find();
    const availableRoomCounts = await Room.getAvailableRoomCountsByType();

    // Extract specific fields from each RoomType object and retrieve hotel name
    const roomTypeDetails = await Promise.all(
      allRoomTypes.map(async (roomType) => {
        const hotel = await Hotel.findById(roomType.hotel);
        const availableRoomCount =
          availableRoomCounts.find(
            (count) => count._id.toString() === roomType._id.toString()
          )?.count || 0;

        return {
          name: roomType.name,
          price: roomType.price,
          features: roomType.features,
          bedTypes: roomType.roomType,
          children: roomType.maxNumberChildren,
          adult: roomType.maxNumberAdult,
          hotelName: hotel ? hotel.name : "Unknown Hotel",
          availableRooms: availableRoomCount,
          image: roomType.image,
          image1: roomType.detailedImage[0],
          image2: roomType.detailedImage[1],
          _id: roomType._id,
        };
      })
    );

    // Filter roomTypeDetails based on search criteria
    search = true;
    let filteredRoomTypes = roomTypeDetails.filter((roomType) => {
      // Include filtering based on adults, children, and roomNo
      return (
        roomType.adult >= parseInt(adults) &&
        roomType.children >= parseInt(children) &&
        roomType.availableRooms >= parseInt(roomNo)
      );
    });
    console.log("rooms we got", filteredRoomTypes);

    if (filteredRoomTypes.length === 0) {
      filteredRoomTypes = roomTypeDetails;
      search = false;
      console.log("filtered return zero search");
      console.log("rooms we dont have", filteredRoomTypes);
    }

    // Pagination logic for filtered Room
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of items per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalResults = filteredRoomTypes.length;

    const paginatedRoomTypes = filteredRoomTypes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalResults / limit);

    /*
    // Unfiltered roomTypeDetails
    const unfilteredRoomTypes = roomTypeDetails;

    // Pagination logic for unfiltered results
    const unfilteredPage = parseInt(req.query.page) || 1;
    const unfilteredLimit = 5; // Number of items per page for unfiltered results
    const unfilteredstartIndex = (page - 1) * unfilteredLimit;
    const unfilteredendIndex = page * unfilteredLimit;
    const unfilteredtotalResults = unfilteredRoomTypes.length;

    const unfilteredpaginatedRoomTypes = unfilteredRoomTypes.slice(
      unfilteredstartIndex,
      unfilteredendIndex
    );
    const unfilteredtotalPages = Math.ceil(
      unfilteredtotalResults / unfilteredLimit
    );

**/

    // Render search results in the search.ejs template with pagination metadata
    res.render("pages/mySearch", {
      roomTypes: paginatedRoomTypes,
      totalPages,
      currentPage: page,
      search,
      checkin,
      checkout,
      adults,
      children,
      roomNo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
