const express = require("express");
const slugify = require("slugify");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const User = require("../../models/user");
const Hotel = require("../../models/hotel");
const RoomType = require("../../models/roomType");
const Order = require("../../models/order");
const Guest = require("../../models/guest");
const Category = require("../../models/category");
const Room = require("../../models/room");
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const Review = require("../../models/review");

const fs = require("fs");
const mongoose = require("mongoose");


// function to generate Token
function generateToken() {
  return require("crypto").randomBytes(20).toString("hex");
}

const { ObjectId } = require("mongoose").Types;
const { Types } = require("mongoose");
const { sendVerificationEmailInBackground } = require("../../worker/workers");
const { sendOrderEmailInBackground } = require("../../worker/workers");



//send a verification email
async function sendVerificationEmail(email) {
  // Check if the user exists in the database
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User does not exist");
  }

  // Generate a new token and save it to the user's record in the database
  const token = generateToken();
  user.emailVerificationToken = token;
  user.emailVerificationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ); // Token expires in 24 hours
  await user.save();

  // Send the verification email to the user
  await sendVerificationEmailInBackground(token, email, user.username);
}

//Capitalized each Words
const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
};


// Function to delete a directory and its contents recursively
function deleteDirectoryRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const currentPath = path.join(directoryPath, file);

      if (fs.lstatSync(currentPath).isDirectory()) {
        // Recursive call for directories
        deleteDirectoryRecursive(currentPath);
        console.log(`Deleted directory: ${currentPath}`);
      } else {
        // Delete the file
        fs.unlinkSync(currentPath);
        console.log(`Deleted file: ${currentPath}`);
      }
    });

    // Remove the directory itself
    fs.rmdirSync(directoryPath);
    console.log(`Deleted directory: ${directoryPath}`);
  } else {
    console.log(`Directory does not exist: ${directoryPath}`);
  }
}






//POST create new customers, Guest wit Option create new Users.
//create- new user, send verification email and welcome
//create new guest with empty  reservations array[]
// Create new cart or display cartings for every items - Invoices
//create a checkout from cart for every item with uptions



//GET: Show all the hotels
router.get(
  "/hotels",
  middleware.isLoggedIn,
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];
      let hotels = [];

      // Check if filtered hotels are available in the request object
      if (req.filteredHotels) {
        hotels = req.filteredHotels;
      } else {
        // If filtered hotels are not available, retrieve all hotels
        hotels = await Hotel.find({}).populate("reviews").populate("rooms");
      }

      const hotelRoomsCounts = hotels.map((hotel) => {
        const availableRooms = hotel.rooms.filter((room) => room.available);
        const unavailableRooms = hotel.rooms.filter((room) => !room.available);
        return {
          hotelName: hotel.name,
          availableRoomsCount: availableRooms.length,
          unavailableRoomsCount: unavailableRooms.length,
        };
      });

      //count cummulative Total
      const availableRoomsCount = hotels.reduce((total, hotel) => {
        const availableRooms = hotel.rooms.filter(
          (room) => room.available && !room.lock
        );
        return total + availableRooms.length;
      }, 0);

      const unavailableRoomsCount = hotels.reduce((total, hotel) => {
        const unavailableRooms = hotel.rooms.filter(
          (room) => !room.available && !room.lock
        );
        return total + unavailableRooms.length;
      }, 0);

      const lockedRoomsCount = hotels.reduce((total, hotel) => {
        const lockedRooms = hotel.rooms.filter((room) => room.lock);
        return total + lockedRooms.length;
      }, 0);

      const total =
        availableRoomsCount + unavailableRoomsCount + lockedRoomsCount;

      res.render("admin/hotels/hotels", {
        hotels,
        hotelRoomsCounts,
        totalRoomsCounts: total,
        availableRoomsCount,
        unavailableRoomsCount,
        lockedRoomsCount,
        successMsg,
        errorMsg,
        pageName: "Hotel Lists",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch user data");
      res.redirect("/");
    }
  }
);



// GET Create a new hotel
router.get( "/hotels/new",
  middleware.isLoggedIn,
  middleware.isAdmin,
  (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];
    res.render("admin/hotels/createHotels", {
      pageName: "Create Hotel",
      successMsg,
      errorMsg,
      url: process.env.FETCH_HOST,
    });
  }
);



//POST:Create Hotel with post
router.post("/create-hotel",
  storage({single:'hotelPicture'}),
  async (req, res) => {
    try {

      // const newHotel = await Hotel.create(req.body);
      const hotelData = req.body;

      // Check if the hotel picture file exists in the request
      if (!req.file) {
        throw new Error("Hotel picture is missing");
      }

      const hotelPicture = req.file;
      const hotelName = hotelData.name.replace(/\s+/g, "_"); // Convert spaces to underscores

      const pictureExtension = path.extname(hotelPicture.originalname);
      const pictureName = `${hotelName}_FRONTCOVER${pictureExtension}`;

      const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "roomImages",
        hotelName
      );
      const picturePath = path.join(directoryPath, pictureName);

      // Create the directory if it doesn't exist
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Move the renamed image to the desired directory
      fs.renameSync(hotelPicture.path, picturePath);

      const hotelCapName = capitalizeWords(hotelData.name);

      hotelData.picture = `/roomImages/${hotelName}/${pictureName}`;
      hotelData.name = hotelCapName;

      
      // Create a new hotel object with updated picture path
      const newHotel = await Hotel.create(hotelData);

      req.flash("success", "New hotel created successfully");
      // Redirect or send a success response

      res.json({
        success: true,
        message: "Hotels created successfully",
        redirectUrl: `/admin/hotels`,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to create new hotel");
      res.redirect("/admin/hotels/new");
    }
  }
);



// GET Edit an existing hotel
router.get("/hotels/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const hotelId = req.params.id;
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        // Handle the case where the hotel does not exist
        req.flash("error", "Hotel not found");
        res.redirect("/admin/hotels");
      } else {
        res.render("admin/hotels/editHotels", {
          pageName: "Edit Hotel",
          hotel,
          successMsg,
          errorMsg,
          url: process.env.FETCH_HOST,
        });
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load hotel data for editing");
      res.redirect("/admin/hotels");
    }
  }
);


// POST: Function to update existing Hotel
router.post(
  "/edit/hotels/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  storage({ single: "hotelPicture" }),
  async (req, res) => {
   try {

    const hotelId = req.params.id;
    const hotelData = req.body;

    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      req.flash("error", "Hotel not found");
      return res.redirect("/admin/hotels");
    }

    // Extract the existing hotel name from the database
    const existingHotelName = hotel.picture.replace(/^\/roomImages\//, "");
    console.log(existingHotelName);

    // Update hotel data based on the form submission
    hotel.name = capitalizeWords(hotelData.name);
    hotel.description = hotelData.description;
    hotel.address = hotelData.address;
    hotel.city = hotelData.city;
    hotel.state = hotelData.state;
    hotel.zip = hotelData.zip;
    hotel.phone = hotelData.phone;
    hotel.email = hotelData.email;
    hotel.website = hotelData.website;

     // Check if a new image is provided in the form
     if (req.files && req.files.length) {
       const hotelPicture = req.files[0];
       const hotelName = hotelData.name.replace(/\s+/g, "_");
       const pictureExtension = path.extname(hotelPicture.originalname);
       const pictureName = `${hotelName}_FRONTCOVER${pictureExtension}`;

       // Construct the new picture path
       const newPicturePath = `/roomImages/${existingHotelName}/${pictureName}`;

       // Move the renamed image to the desired directory
       fs.renameSync(
         hotelPicture.path,
         path.join(__dirname, "..", "public", newPicturePath)
       );

       // Update the hotelData with the new path and picture
       hotel.picture = newPicturePath;
     }

     // Save the updated hotel to the database
     await hotel.save();

     req.flash("success", "Hotel data updated successfully");
     res.json({
       success: true,
       message: "Hotel data updated successfully",
       redirectUrl: "/admin/hotels",
     });
   } catch (error) {
     console.error(error);
     req.flash("error", "Failed to update hotel data");
     res.redirect(`/admin/hotels`);
   }
  }
);


//POST: Deletion of hotel by requesr parameter id:
router.get(
  "/hotels/del/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const hotelId = req.params.id;

      // Retrieve hotel information
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        req.flash("error", "Hotel not found");
        return res.redirect("/admin/hotels");
      }

      // Delete associated rooms
      await Room.deleteMany({ hotel: hotelId });

      // Delete associated room types
      await RoomType.deleteMany({ hotel: hotelId });

      // Construct the existing directory path
     const existingDirectoryPath = path.dirname(
       path.join(
         __dirname,
         "..",
         "..",
         "public",
         "roomImages",
         hotel.picture.replace(/^\/roomImages\//, "")
       )
     );

     
     // Delete the associated directory and its contents recursively
      await deleteDirectoryRecursive(existingDirectoryPath);
     //deleteDirectoryRecursive(existingDirectoryPath);

     // Delete the hotel itself
      await Hotel.findByIdAndDelete(hotelId);

      req.flash(
        "success",
        "Hotel deleted with its associated rooms and room types successfully"
      );
      res.redirect("/admin/hotels");
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to delete hotel");
      res.redirect("/admin/hotels");
    }
  }
);


//1. view all rooms on clicking hotels
router.get(
  "/hotels/:hotelId/rooms",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const { hotelId } = req.params;
      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];

      // Find the hotel by ID and populate its rooms and roomtypes
      const hotel = await Hotel.findById(hotelId)
        .populate({
          path: "rooms",
          populate: {
            path: "roomType",
          },
        })
        .populate("roomtypes");

      if (!hotel) {
        return res.status(404).send("Hotel not found");
      }

      // Pagination logic
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of items per page
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const totalResults = hotel.rooms.length;

      const rooms = hotel.rooms.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalResults / limit);

      // Render the rooms view with the hotel and its rooms and roomtypes
      res.render("admin/hotels/hotelRooms", {
        hotel,
        rooms,
        roomtypes: hotel.roomtypes,
        pageName: "Rooms",
        successMsg,
        errorMsg,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch room data");
      res.redirect("/");
    }
  }
);

// Route: GET /admin/walkin/:hotelId
router.get("/walkin/:hotelId/bookings/", async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Fetch the selected hotel and populate the "rooms" and "roomtypes" fields
    const hotels = await Hotel.findById(hotelId)
      .populate({
        path: "rooms",
        populate: {
          path: "roomType",
          model: "RoomType",
        },
      })
      .populate("roomtypes");

    if (!hotels) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Prepare an array to hold the room type information
    const roomTypeData = [];

    // Iterate over each room type in the hotel
    for (const roomType of hotels.roomtypes) {
      const { name, price } = roomType;
      const totalRooms = hotels.rooms.filter((room) =>
        room.roomType._id.equals(roomType._id)
      ).length;
      const availableRooms = hotels.rooms.filter(
        (room) => room.roomType._id.equals(roomType._id) && room.available
      ).length;
      const unavailableRooms = totalRooms - availableRooms;

      // Add the room type information to the array
      roomTypeData.push({
        name,
        price,
        totalRooms,
        availableRooms,
        unavailableRooms,
      });
    }

    // Log the room type data
    res.render("admin/hotels/walkin", {
      hotels,
      roomTypeData,
      pageName: "Bookings Page",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//3. display rooms based on roomtypes
router.get(
  "/roomtypes/:hotelId/rooms/:roomType",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];

      const hotel = await Hotel.findById(req.params.hotelId).populate({
        path: "rooms",
        populate: {
          path: "roomType",
          model: "RoomType",
        },
      });

      // console.log("All Hotels " + hotel);
      const roomTypeId = req.params.roomType;
      const filteredRooms = hotel.rooms.filter(
        (room) => room.roomType._id.toString() === roomTypeId
      );

      // Pagination logic
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of items per page
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const totalResults = filteredRooms.length;

      const rooms = filteredRooms.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalResults / limit);

      const roomTypeName =
        filteredRooms.length > 0 ? filteredRooms[0].roomType.name : "Page Name";

      res.render("admin/hotels/hotelRooms2", {
        rooms,
        pageName: roomTypeName,
        hotelName: hotel.name,
        currentPage: page,
        totalPages,
        successMsg,
        errorMsg,
        hotelId: req.params.hotelId,
        roomType: req.params.roomType,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch room data");
      res.redirect(`/roomtypes/${req.params.hotelId}`);
    }
  }
);


// Get all available rooms based on selected room type
router.get("/rooms/:roomTypeId", async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const availableRooms = await Room.find({
      roomType: roomTypeId,
      available: true,
    });
    res.json(availableRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


//functions Lock rooms, deleterooms TODO edit rooms available rooms
router.get(
  "/:hotelId/:roomTypeId/:roomId/lock",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const roomId = req.params.roomId;
      // Find the room by ID
      const room = await Room.findById(roomId);

      if (!room) {
        req.flash("error", "Room not found");
        return res.redirect(
          `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
        );
      }

      if (!room.lock) {
        // Set the room.lock property to true
        room.lock = true;
        room.available = false;
        // Save the changes to the room
        await room.save();
        // Redirect or render appropriate success response
        req.flash("success", "Room locked successfully");
      } else {
        // Set the room.lock property to true
        room.lock = false;
        room.available = true;
        // Save the changes to the room
        await room.save();
        // Redirect or render appropriate success response
        req.flash("success", "Room unlocked successfully");
      }

      res.redirect(
        `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
      ); // Redirect to the admin dashboard or appropriate page

      // Redirect or render appropriate response
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to lock the room");
      res.redirect(
        `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
      ); // Redirect to the admin dashboard or appropriate page
    }
  }
);

//2. delete a room by Id
router.get(
  "/:hotelId/:roomTypeId/:roomId/delete",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const roomId = req.params.roomId;
      // Find the room by ID
      const room = await Room.findById(roomId);

      if (!room) {
        req.flash("error", "Room not found");
        return res.redirect(
          `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
        );
      }

      // 2. Delete the room
      await room.remove();
      req.flash("success", "Room deleted successfully");
      res.redirect(
        `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
      ); // Redirect to the admin dashboard or appropriate page
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to delete the room");
      res.redirect(
        `/admin/roomtypes/${req.params.hotelId}/rooms/${req.params.roomTypeId}`
      ); // Redirect to the admin dashboard or appropriate page
    }
  }
);


// Create a new room GET
router.get(
  "/:hotelId/:roomTypeId/new-room",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const hotel = await Hotel.findById(req.params.hotelId);
      const roomType = await RoomType.findById(req.params.roomTypeId);

      res.render("admin/hotels/addRooms", {
        pageName: "Create Rooms",
        hotelId: req.params.hotelId,
        roomTypeId: req.params.roomTypeId,
        successMsg,
        errorMsg,
        hotel,
        roomType,
      });
    } catch (err) {
      console.log(err);
    }
  }
);


//Create a new room POST WORK
router.post(
  "/:hotelId/:roomTypeId/new-room",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const roomTypeId = Types.ObjectId(req.params.roomTypeId);
      const hotelId = Types.ObjectId(req.params.hotelId);

      const roomsData = req.body.roomsData;

      // Retrieve the corresponding hotel and room type
      const hotel = await Hotel.findById(req.params.hotelId);
      const roomType = await RoomType.findById(req.params.roomTypeId);

      // Iterate over the roomsData array and create the rooms
      for (const roomData of roomsData) {
        const room = new Room({
          roomID: roomData.roomId,
          roomType: roomTypeId,
          hotel: hotelId,
          available: true,
          checkIn: Date.now(),
          checkOut: Date.now(),
          // Set any other relevant properties of the room
        });

        // Save the room to the database
        await room.save();

        // Initialize hotel.rooms if it's undefined
        if (!hotel.rooms) {
          hotel.rooms = [];
        }

        hotel.rooms.push(room._id);
        await hotel.save();

        // Update the roomType's rooms array
        if (!roomType.rooms) {
          roomType.rooms = []; // Initialize the rooms array if it's undefined
        }
        // Update the roomType's rooms array
        roomType.rooms.push(room._id);
        await roomType.save();
      }

      req.flash("success", "New rooms created successfully");

      // Redirect or send a success response
      res.json({
        success: true,
        message: "Rooms created successfully",
        redirect: `/admin/roomtypes/${hotelId}/rooms/${roomTypeId}`,
      });
    } catch (err) {
      console.error(err);
      // Handle any errors that occur during room creation
      res
        .status(500)
        .json({ success: false, message: "Failed to create rooms" });
    }
  }
);




// Delete an existing Roomtype under the hotel :GET
router.get(
  "/roomtypes/:id/:hotelId",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const roomTypeId = req.params.id;

      // Find the room type by ID
      const roomType = await RoomType.findById(roomTypeId);
      const hotelId = roomType.hotel;
      const hotel = await Hotel.findById(hotelId);


      if (!roomType) {
        req.flash("error", "Room type not found");
        res.redirect(`/admin/roomtypes/${hotelId}`);
        return;
      }

      // Delete associated rooms
      await Room.deleteMany({ roomType: roomTypeId });

      // Construct the existing directory path
      const existingDirectoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        path.dirname(hotel.picture),
        roomType.image.split("-")[0],
      );

      // Delete the associated directory and its contents recursively
      try {
        fs.rmdirSync(existingDirectoryPath, { recursive: true });
        console.log("Directory and its contents deleted successfully");
      } catch (error) {
        console.error("Error deleting directory:", error);
      }

      // Delete the room type
      await RoomType.findByIdAndDelete(roomTypeId);

      // Retrieve the hotel and update its room types by removing the deleted room type
      const updatedRoomTypes = hotel.roomtypes.filter(
        (id) => id.toString() !== roomTypeId
      );
      hotel.roomtypes = updatedRoomTypes;
      await hotel.save();

      req.flash(
        "success",
        "Room type and associated rooms deleted successfully"
      );

      res.redirect(`/admin/roomtypes/${hotelId}`);
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to delete room type");
      res.redirect(`/admin/roomtypes/${hotelId}`);
    }
  }
);



// Show roomtypes based on selected Hotels :GET
router.get(
  "/roomtypes/:hotelId",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];

      const roomTypes = await RoomType.find({ hotel: req.params.hotelId });
      const hotel = await Hotel.findById(req.params.hotelId);

      let totalRooms = 0;
      let totalRoomsAvailable = 0;
      let totalRoomsOccupied = 0;
      let totalRoomsUnderLock = 0;

      const roomTypesMap = new Map(); // Map to store room types as keys and room count as values

      for (const roomType of roomTypes) {
        const roomsCount = await Room.countDocuments({
          hotel: req.params.hotelId,
          roomType: roomType._id,
        });

        roomTypesMap.set(roomType._id.toString(), roomsCount);

        totalRooms += roomsCount;

        const availableRoomsCount = await Room.countDocuments({
          hotel: req.params.hotelId,
          roomType: roomType._id,
          available: true,
        });
        const occupiedRoomsCount = roomsCount - availableRoomsCount;
        const underLockRoomsCount = await Room.countDocuments({
          hotel: req.params.hotelId,
          roomType: roomType._id,
          lock: true,
        });

        totalRoomsAvailable += availableRoomsCount;
        totalRoomsOccupied += occupiedRoomsCount;
        totalRoomsUnderLock += underLockRoomsCount;
      }

      const roomTypesData = [];

      for (const [roomTypeId, count] of roomTypesMap.entries()) {
        const roomType = await RoomType.findById(roomTypeId);

        if (roomType) {
          const roomTypeData = {
            name: roomType.name,
            price: roomType.price,
            id: roomTypeId,
            count,
            available: 0,
            unavailable: 0,
          };

          const availableRoomsCount = await Room.countDocuments({
            hotel: req.params.hotelId,
            roomType: roomTypeId,
            available: true,
          });
          const unavailableRoomsCount = count - availableRoomsCount;

          roomTypeData.available = availableRoomsCount;
          roomTypeData.unavailable = unavailableRoomsCount;

          roomTypesData.push(roomTypeData);
        }
      }

      res.render("admin/hotels/walkin", {
        hotelId: req.params.hotelId,
        roomTypes: roomTypesData,
        successMsg,
        errorMsg,
        hotel,
        pageName: "Hotel Details",
        totalRooms,
        totalRoomsAvailable,
        totalRoomsUnderLock,
        totalRoomsOccupied: totalRoomsOccupied - totalRoomsUnderLock,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch hotel data");
      res.redirect("/hotels");
    }
  }
);


//2. create a new Roomtype :GET
router.get(
  "/:hotelId/roomType/new",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const hotel = await Hotel.findById(req.params.hotelId);

      res.render("admin/hotels/addRoomType", {
        pageName: "Create Rooms",
        hotelId: req.params.hotelId,
        url: process.env.FETCH_HOST,
        // csrfToken: req.csrfToken(),
        successMsg,
        errorMsg,
        hotel,
      });
    } catch (err) {
      console.log(err);
    }
  }
);



//3. post a RoomType with :POST
router.post("/add/roomtypes/:hotelId", 
 storage(), async (req, res) => {
   const hotelId = req.params.hotelId;

   // Find the corresponding hotel based on the hotelId
   const hotel = await Hotel.findById(hotelId);
   const formDataItems = Array.isArray(req.body) ? req.body : [req.body]; // Check if multiple form submissions or a single form submission

   console.log(formDataItems)

   try {
     // Create an array to store the unique directory paths
     const directoryPaths = [];

     // Iterate through the formDataItems
     for (let i = 0; i < formDataItems.length; i++) {
       const formDataItem = formDataItems[i];
       const {
         name,
         description,
         price,
         maxNumberAdult,
         maxNumberChildren,
         roomtypeSelect,
         hotelName,
         features,
         noOfBeds,
       } = formDataItem;

       const names = Array.isArray(name) ? name : [name];
       const descriptions = Array.isArray(description)
         ? description
         : [description];
       const prices = Array.isArray(price) ? price : [price];
       const noOfBed = Array.isArray(noOfBeds) ? noOfBeds : [noOfBeds];
       const maxNumberAdults = Array.isArray(maxNumberAdult)
         ? maxNumberAdult
         : [maxNumberAdult];
       const roomtypeSelects = Array.isArray(roomtypeSelect)
         ? roomtypeSelect
         : [roomtypeSelect];
       const maxNumberChildrens = Array.isArray(maxNumberChildren)
         ? maxNumberChildren
         : [maxNumberChildren];
       const hotelNames = Array.isArray(hotelName) ? hotelName : [hotelName];

       // Handle features input
       let featuresList;
       let oneSubmission;
       if (typeof features === "string") {
         // String input for a single form submission
         oneSubmission = 0;
         featuresList = features
           .split(",")
           .map((name) => ({ name, value: "0" }));
       } else if (Array.isArray(features)) {
         // Array input for multiple form submissions
         featuresList = features.map((featureString) => {
           const featureNames = featureString.split(",");
           return featureNames.map((name) => ({ name, value: "0" }));
         });
       } else {
         console.log("Invalid features input format");
         continue; // Skip to the next iteration if features input is invalid
       }

       // Iterate through the values of the current item
       for (let j = 0; j < names.length; j++) {
         const currentName = names[j];
         const currentDescription = descriptions[j];
         const currentPrice = prices[j];
         const currentMaxNumberAdult = maxNumberAdults[j];
         const currentMaxNumberChildren = maxNumberChildrens[j];
         const currentRoomTypeSelect = roomtypeSelects[j];
         const currentHotelName = hotelNames[j];
         const currentNofBeds = noOfBed[j];
         const currentFeatures =
           oneSubmission === 0 ? featuresList : featuresList[j];

         const directoryPath = path.join(
           __dirname,
           "..", // Adjust the relative path here based on your project structure
           "..", // Go up one more level to the main project directory
           "public",
           "roomImages",
          hotel.picture.replace(/^\/roomImages\//, "").split('/')[0],
           currentName.replace(/\s+/g, "_")
         );

         // Create the directory if it doesn't exist
         if (!fs.existsSync(directoryPath)) {
           fs.mkdirSync(directoryPath, { recursive: true });
         }

         const imagesToMove = req.files.splice(0, 3);

         // Move the images to the corresponding directory
         for (let k = 0; k < imagesToMove.length; k++) {
           const image = imagesToMove[k];
           const imageName = `${currentName}-image${k + 1}.png`;
           try {
             // fs.renameSync(image.path, imagePath);
             fs.renameSync(
               image.path,
               path.join(directoryPath, imageName.replace(/\s+/g, "_"))
             );
           } catch (error) {
             console.error("Error saving file:", error);
           }
         }

         directoryPaths.push(directoryPath);

         console.log("Directory path added to array:", directoryPath);

         // Create a new RoomType instance with the extracted data
         const roomType = new RoomType({
           name: currentName,
           image: `${currentName}-image1.png`.replace(/\s+/g, "_"),
           description: currentDescription,
           price: currentPrice,
           noOfBeds: currentNofBeds,
           maxNumberChildren: currentMaxNumberChildren,
           detailedImage: [
             `${currentName}-image2.png`.replace(/\s+/g, "_"),
             `${currentName}-image3.png`.replace(/\s+/g, "_"),
           ],
           maxNumberAdult: currentMaxNumberAdult,
           roomType: currentRoomTypeSelect,
           features: currentFeatures,
           hotel: hotelId,
         });

         // Save the roomType instance to the database
         const savedRoomType = await roomType.save();

         if (!hotel) {
           throw new Error("Hotel not found");
         }
         // Add the roomType to the hotel's roomtypes array
         hotel.roomtypes.push(savedRoomType);
         // Save the updated hotel to the database
         await hotel.save();
       }
     }

     req.flash("success", "Room types created successfully");
     res.json({
       message: "Data and files received and processed successfully.",
       redirectUrl: `/admin/roomtypes/${hotelId}`,
     });
   } catch (error) {
     console.error("Error saving data:", error);
     req.flash("error", "An error occurred.");
     res.status(500).json({
       error: "An error occurred.",
       redirectUrl: `/admin/roomtypes/${hotelId}`,
     });
   }
 });



// 4.GET: Edit a new RoomType : GET
router.get( "/edit/roomtypes/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {

      const roomTypeId = req.params.id;
      const roomType = await RoomType.findById(roomTypeId);
      const hotel = await Hotel.findById(roomType.hotel);

      console.log(roomType);
      console.log(hotel);

      if (!roomType) {
        // Handle the case where the hotel does not exist
        req.flash("error", "Room Type not found");
        res.redirect("/admin/hotels"); // Redirect to a suitable location
      } else {
        res.render("admin/hotels/editRoomtype", {
          pageName: "Edit Roomtype",
          roomType,
          hotelId: roomType.hotel,
          hotel,
          successMsg,
          errorMsg,
          url: process.env.FETCH_HOST,
        });
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to load hotel data for editing");
      res.redirect("/admin/hotels"); // Redirect to a suitable location
    }
  }
);


// 4.POST: Edit roomType and store
router.post("/edit/roomtypes/:roomId/:hotelId", storage(), async (req, res) => {
  const roomId = req.params.roomId;
  const hotelId = req.params.hotelId;
  try {
    // Find the corresponding hotel based on the hotelId
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      throw new Error("Hotel not found");
    }

    // Find the room type by ID
    const roomType = await RoomType.findById(roomId);

    if (!roomType) {
      throw new Error("Room type not found");
    }
    // Check if the name has changed
    const oldName = roomType.name;
    const newName = req.body.name;

    // Old Directory
    const oldDirectoryPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "roomImages",
      hotel.picture.replace(/^\/roomImages\//, "").split("/")[0],
      oldName.replace(/\s+/g, "_")
    );

    //New Directory
    const newDirectoryPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "roomImages",
      hotel.picture.replace(/^\/roomImages\//, "").split("/")[0],
      newName.replace(/\s+/g, "_")
    );


    if (oldName !== newName) {
      // Rename the directory
      fs.renameSync(oldDirectoryPath, newDirectoryPath);
    }

    //Delete images in the newly renamed Directory


    // Update room type data based on the form submission
    roomType.name = req.body.name;
    roomType.description = req.body.description;
    roomType.price = req.body.price;
    roomType.maxNumberAdult = req.body.maxNumberAdult;
    roomType.maxNumberChildren = req.body.maxNumberChildren;
    roomType.roomType = req.body.selectRoomtype;
    roomType.noOfBeds = req.body.noOfBeds;

    roomType.features = req.body.roomFeatures
      .split(",")
      .map((name) => ({ name, value: "0" }));

    // Check if a new image is provided in the form
    if (req.files && req.files.length ) {
      const imagesToMove = req.files.splice(0, 3);

      if(oldName !== newName){
      fs.unlinkSync(
        path.join(
          newDirectoryPath,
          `${roomType.name}-image1.png`.replace(/\s+/g, "_")
        )
      );
      fs.unlinkSync(
        path.join(
          newDirectoryPath,
          `${roomType.name}-image2.png`.replace(/\s+/g, "_")
        )
      );
      fs.unlinkSync(
        path.join(
          newDirectoryPath,
          `${roomType.name}-image3.png`.replace(/\s+/g, "_")
        )
      );
      }else{
 fs.unlinkSync(
   path.join(
     oldDirectoryPath,
     `${roomType.name}-image1.png`.replace(/\s+/g, "_")
   )
 );
 fs.unlinkSync(
   path.join(
     oldDirectoryPath,
     `${roomType.name}-image2.png`.replace(/\s+/g, "_")
   )
 );
 fs.unlinkSync(
   path.join(
     oldDirectoryPath,
     `${roomType.name}-image3.png`.replace(/\s+/g, "_")
   )
 );

      }
 

      const directoryPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "roomImages",
        hotel.picture.replace(/^\/roomImages\//, "").split("/")[0],
        newName.replace(/\s+/g, "_")
      );

      console.log(directoryPath);
      // Delete old images before moving the new ones

      // Move the images to the corresponding directory
      for (let k = 0; k < imagesToMove.length; k++) {
        const image = imagesToMove[k];
        const imageName = `${roomType.name}-image${k + 1}.png`;
        try {
          fs.renameSync(
            image.path,
            path.join(directoryPath, imageName.replace(/\s+/g, "_"))
          );
        } catch (error) {
          console.error("Error saving file:", error);
        }
      }

      // Update the roomType data with the new image paths
      roomType.image = `${roomType.name}-image1.png`.replace(/\s+/g, "_");
      roomType.detailedImage = [
        `${roomType.name}-image2.png`.replace(/\s+/g, "_"),
        `${roomType.name}-image3.png`.replace(/\s+/g, "_"),
      ];
    }

    // Save the updated room type to the database
    const updatedRoomType = await roomType.save();
    // Update the room type in the hotel's roomtypes array
    const updatedRoomTypes = hotel.roomtypes.map((rt) =>
      rt._id.equals(updatedRoomType._id) ? updatedRoomType : rt
    );

    hotel.roomtypes = updatedRoomTypes;

    // Save the updated hotel to the database
    await hotel.save();

    req.flash("success", "Room type updated successfully");
    res.json({
      success: true,
      message: "Room type updated successfully",
      redirectUrl: `/admin/roomtypes/${hotelId}`,
    });
  } catch (error) {
    console.error("Error updating room type:", error);
    req.flash("error", "Failed to update room type");
    res.redirect(`/admin/roomtypes/${hotelId}`);
  }
});



// 2. create a new Roomtype POST
// 2. 1,2,3 functions Lock rooms, deleterooms TODO edit rooms available rooms
// 3. view all rooms that expires today
// 4. View job report of crons
// 5. crud for new Roomtype
// 6. add rooms to hotel room type
// 7. view all users
// 8. view alll Guests

//Get customers use fetch and return all data
router.get(
  "/customers",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const user = req.user; // Assuming you have access to the authenticated user object
      const hotelIds = user.hotels; // Array of hotel IDs

      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];

      let query = {};
      // let guests
      if (user.role === "superUser") {
        // If the user role is "superUser," query all guests
        query = {};
        // guests = await Guest.find({query});
      } else {
        // Fetch guests based on user
        query = {
          "reservations.hotel": {
            $in: await Hotel.find({ _id: { $in: hotelIds } }).distinct("name"),
          },
        };
      }

      // Fetch guests based on the query
      const guests = await Guest.find(query);

      // Convert guests to an array of JSON objects
      const guestData = guests.map((guest) => guest.toObject());

      // Fetch hotels based on hotelIds
      const hotels = await Hotel.find({ _id: { $in: hotelIds } });

      // Convert hotels to an array of JSON objects
      const hotelData = hotels.map((hotel) => hotel.toObject());

      res.render("admin/customers/customers", {
        guests: guestData, // Pass the guestData to the view template
        pageName: "customers",
        hotels: hotelData, // Pass the list of hotel names to the view template
        successMsg,
        errorMsg,
        // csrfToken: req.csrfToken(),
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      var errorMsg = "An error occurred while fetching guests.";
      req.flash("error", errorMsg);
      res.redirect("/admin/customers/");
    }
  }
);

//GET: view Customers details and resevations
router.get(
  "/customers/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const guestId = req.params.id;

      // Fetch guests based on the query
      const guest = await Guest.findById(guestId).populate(
        "reservations.room_id reservations.room_type"
      );

      res.render("admin/customers/viewCustomer", {
        guest, // Pass the guestData to the view template
        pageName: "customers",
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      var errorMsg = "An error occurred while fetching guests.";
      req.flash("error", errorMsg);
      res.redirect("/admin/customers");
    }
  }
);

//GET add new Customer
router.get(
  "/add/customers",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    res.render("admin/customers/createCustomer", {
      successMsg,
      errorMsg,
      pageName: "Create New Customer",
      // csrfToken: req.csrfToken(),
    });
  }
);

router.post(
  "/create/customer",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        title,
        city,
        residential,
        country,
        states,
        nationality,
        identification,
        occupation,
        organization,
        orgState,
        orgCountry,
        nokName,
        nokAddress,
        nokContact,
        nokRelationship,
        orgCity,
      } = req.body;

      // Check if email or phone number already exist
      const existingUserWithEmail = await User.findOne({ email });
      const existingUserWithPhone = await User.findOne({ phone });

      let user; // Declare the user variable to store the existing or newly created user

      if (existingUserWithEmail || existingUserWithPhone) {
        // User already exists, use existing user data
        user = existingUserWithEmail || existingUserWithPhone;
      } else {
        // User does not exist, create a new user
        const defaultPassword = "hotellar2023";
        const passwordHash = bcrypt.hashSync(
          defaultPassword,
          bcrypt.genSaltSync(5)
        );

        // Create a new User
        const newUser = new User({
          title,
          firstname: firstName,
          lastname: lastName,
          email,
          phone,
          password: passwordHash,
          emailVerified: true,
          created: Date.now(),
          emailVerifiedAt: Date.now(),
        });

        await newUser.save();
        await sendVerificationEmail(email);

        user = newUser; // Store the newly created user
      }

      // Find an existing guest with the same email address
      let existingGuest = await Guest.findOne({ email: email });

      if (existingGuest) {
        // Check if any guest fields have changed
        let guestDataChanged = false;
        const guestDataToUpdate = {
          title,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          residential,
          city,
          state: states,
          country,
          nationality,
          identification,
          cityOrg: orgCity,
          nokOccupation: occupation,
          organization,
          stateOrg: orgState,
          countryOrg: orgCountry,
          nextOfKin: nokName,
          nokAddress,
          nokTel: nokContact,
          relationship: nokRelationship,
        };

        for (const key in guestDataToUpdate) {
          if (existingGuest[key] !== guestDataToUpdate[key]) {
            existingGuest[key] = guestDataToUpdate[key];
            guestDataChanged = true;
          }
        }

        // Save the updated guest data
        if (guestDataChanged) {
          await existingGuest.save();
          return res.status(200).json({
            message: "Existing guest data updated successfully",
            url: "/admin/customers",
          });
        } else {
          return res.status(200).json({
            message: "New guest created successfully",
            url: "/admin/customers",
          });
        }
      } else {
        // Create a new Guest using the existing user data or the newly created user data

        const newGuest = new Guest({
          user: user._id,
          title,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          residential,
          city,
          state: states,
          country,
          paymentRef: "",
          nationality,
          identification,
          cityOrg: orgCity,
          nokOccupation: occupation,
          organization,
          stateOrg: orgState,
          countryOrg: orgCountry,
          nextOfKin: nokName,
          nokAddress,
          nokTel: nokContact,
          relationship: nokRelationship,
        });

        // Save the new guest
        await newGuest.save();
      }

      // Redirect or respond with a success message
      req.flash("success", "New guest created successfully...");
      return res.status(200).json({
        message: "New guest created successfully",
        url: "/admin/customers",
      });
    } catch (error) {
      console.log(error);
      // Handle error and show an appropriate message
      res
        .status(500)
        .json({ error: "An error occurred while creating the customer." });
    }
  }
);

router.post(
  "/search/guests",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const user = req.user;
    const hotelIds = user.hotels;

    const { hotel, parameter, searchInput } = req.body;

    try {
      let searchQuery = {};
      // Check if other parameters (name, email, or phone) are selected, and add them to the search query

      if (parameter === "name") {
        const regexSearchInput = new RegExp(searchInput, "i"); // "i" flag makes the search case-insensitive
        searchQuery.$or = [
          { first_name: regexSearchInput },
          { last_name: regexSearchInput },
        ];
      } else if (parameter === "email") {
        const regexSearchInput = new RegExp(searchInput, "i"); // "i" flag makes the search case-insensitive
        searchQuery.email = regexSearchInput;
      } else if (parameter === "phone") {
        const regexSearchInput = new RegExp(searchInput); // Without the "i" flag for phone number, it's case-sensitive
        searchQuery.phone_number = regexSearchInput;
      }

      if (hotel) {
        searchQuery["reservations.hotel"] = hotel;
      }
      // Perform the search using the constructed query
      const searchResults = await Guest.find(searchQuery);

      // Return the search results to the client
      res.status(200).json(searchResults);
    } catch (error) {
      // Handle any errors that occur during the search
      console.error("An error occurred while performing the search:", error);
      res
        .status(500)
        .json({ error: "An error occurred while performing the search." });
    }
  }
);

//POST create new customers, Guest wit Option create new Users.
//create- new user, send verification email and welcome
//create new guest with empty  reservations array[]
// Create new cart or display cartings for every items - Invoices
//create a checkout from cart for every item with uptions

//Get DashBoards
router.get(
  "/dashboard",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    var errorMsg = req.flash("error")[0];
    res.render("admin/frontpage/dashboard", {
      errorMsg,
      includeScript: true,
      pageName: "Dashboard",
    });
  }
);

//Get DashBoards
router.get(
  "/setup",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    var errorMsg = req.flash("error")[0];
    res.render("admin/users/setup", {
      errorMsg,
      pageName: "Dashboard",
    });
  }
);

//GET view Bookings
router.get(
  "/bookings",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const user = req.user; // Assuming you have access to the authenticated user object
      const hotelIds = user.hotels; // Array of hotel IDs

      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];

      let query = {};
      // let orders
      if (user.role === "superUser") {
        // If the user role is "superUser," query all orders
        query = {};
        // orders = await Order.find({query});
      } else {
        // Fetch hotel names based on hotelIds
        const hotels = await Hotel.find({ _id: { $in: hotelIds } });

        const hotelNames = hotels.map((hotel) => hotel.name);

        // Fetch orders based on user's hotels
        query = {
          "cart.items.hotel": {
            $in: hotelNames,
          },
        };
      }

      // Fetch orders based on the query
      const orders = await Order.find(query).populate("user");

      // Convert orders to an array of JSON objects
      const orderData = orders.map((order) => order.toObject());

      // Fetch hotels based on hotelIds
      const hotels = await Hotel.find({ _id: { $in: hotelIds } });

      // Convert hotels to an array of JSON objects
      const hotelData = hotels.map((hotel) => hotel.toObject());

      res.render("admin/hotels/bookings", {
        orders: orderData, // Pass the orderData to the view template
        hotels: hotelData,
        pageName: "orders",
        successMsg,
        errorMsg,
        // csrfToken: req.csrfToken(),
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      var errorMsg = "An error occurred while fetching orders.";
      req.flash("error", errorMsg);
      res.redirect("/admin/bookings");
    }
  }
);

router.post(
  "/search/orders",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const user = req.user;
    const hotelIds = user.hotels;

    const { hotel, parameter, searchInput } = req.body;

    try {
      let searchQuery = {};

      if (parameter === "amount") {
        const amount = parseInt(searchInput); // Convert search input to a number
        if (!isNaN(amount)) {
          searchQuery["cart.totalCost"] = amount;
        } else {
          throw new Error(
            "Invalid amount value. Please provide a valid number."
          );
        }
      } else if (parameter === "orderID") {
        const regexSearchInput = new RegExp(searchInput); // Without the "i" flag for phone number, it's case-sensitive
        searchQuery.paymentId = regexSearchInput;
      }

      if (hotel) {
        searchQuery["cart.items.hotel"] = hotel;
      }

      // Perform the search using the constructed query
      const searchResults = await Order.find(searchQuery).populate("user");

      // Return the search results to the client
      res.status(200).json(searchResults);
    } catch (error) {
      // Handle any errors that occur during the search
      console.error("An error occurred while performing the search:", error);
      res
        .status(500)
        .json({ error: "An error occurred while performing the search." });
    }
  }
);

router.get(
  "/bookings/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const orderId = req.params.id;
      // Fetch guests based on the query
      const order = await Order.findById(orderId).populate("user");
      const guest = await Guest.findOne({ user: order.user._id });

      res.render("admin/payments/viewInvoice", {
        pageName: "customers",
        order: order,
        guest: guest,
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      var errorMsg = "An error occurred while fetching orders.";
      req.flash("error", errorMsg);
      res.redirect("/admin/bookings");
    }
  }
);

//GET add payment for customer
router.get(
  "/add/bookings",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    var errorMsg = req.flash("error")[0];
    var successMsg = req.flash("success")[0];
    const pay = process.env.PAYSTACK_KEY;

    // Assuming this code is inside an async function or you can use async/await here
    try {
      const guests = await Guest.find({});
      //  console.log(users)
      res.render("admin/payments/addInvoice", {
        successMsg,
        errorMsg,
        pageName: "Users Invoice",
        pay: pay,
        guests,
      });
    } catch (error) {
      console.error("An error occurred while searching for users:", error);
    }
  }
);

//POST: To get all data and process payment on different categories of request
router.post(
  "/create-invoice",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const formData = req.body;
      const userRef = Types.ObjectId(formData.userData);

      // Find the guest based on userData value
      const guest = await Guest.findOne({ _id: userRef });

      if (!guest) {
        return res
          .status(404)
          .json({ success: false, message: "Guest not found" });
      }

      let totalQty = 0;
      let totalCost = 0;
      const reservationsData = []; // Store reservation data for order

      for (const formEntryKey in formData) {
        if (formEntryKey.startsWith("formEntry_")) {
          const formEntry = formData[formEntryKey];
          const numRooms = parseInt(formEntry.rooms);
          const checkInDate = new Date(formEntry.checkIn);
          const checkOutDate = new Date(formEntry.checkOut);
          const daysStayed = Math.ceil(
            (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
          );

          // Find the room type in the database using the roomCategory value
          const roomType = await RoomType.findById(formEntry.roomCategory);

          if (!roomType) {
            // Handle the case when the room type is not found in the database
            console.log(
              `Room type with ID ${formEntry.roomCategory} not found`
            );
            continue; // Move to the next form entry if room type is not found
          }

          // Get the price from the room type
          const roomCategoryPrice = parseFloat(roomType.price);
          const totalAmount = roomCategoryPrice * numRooms * daysStayed;

          totalQty += numRooms;
          totalCost += totalAmount;

          // Create a new reservation object and add it to the guest's reservations array
          const newReservation = {
            itemId: guest._id,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            room_type: formEntry.roomCategory,
            hotel: formEntry.hotel,
          };

          //guest reservation
          guest.reservations.push(newReservation);

          // Store reservation data for the order
          reservationsData.push({
            roomTypeId: formEntry.roomCategory, // Use formEntry.roomCategory instead of reservation.room_type
            confirmed: false,
            noRooms: numRooms, // Use the numRooms from the outer scope for the order item
            days: daysStayed,
            idNo: 1,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            price: roomCategoryPrice, // Use the roomCategoryPrice from the outer scope for the order item
            priceTotal: totalAmount, // Use the totalAmount from the outer scope for the order item
            name: roomType.name,
            hotel: formEntry.hotel,
            roomCode: roomType.roomCode,
          });
        }
      }

      // Save the updated guest with the new reservations
      await guest.save();

      // Create an order with the cart data
      const order = new Order({
        user: guest.user,
        cart: {
          totalQty: totalQty,
          totalCost: totalCost,
          items: reservationsData,
        },
        paymentId: formData.paymentId,
        paymentMode: formData.paymentMode,
      });

      // Save the order to the database
      await order.save();

      // send a mail to confirm the current order
      sendOrderEmailInBackground(order);

      // Respond with a success message (you can customize the response as needed)
      res.status(200).json({
        success: true,
        message: "Form data received successfully",
        url: "/admin/bookings",
      });
    } catch (err) {
      console.log("Error creating invoice:", err);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the invoice",
        url: "/admin/add/bookings",
      });
    }
  }
);

//GET: To select rooms that is available
router.get(
  "/select/:orderId/:itemId/room",
  middleware.isLoggedIn,
  middleware.emailVerified,
  async (req, res) => {
    try {
      const errorMsg = req.flash("error")[0];
      const successMsg = req.flash("success")[0];

      const orderId = req.params.orderId; // Access the order ID
      const itemId = req.params.itemId; // Access the item reference

      const order = await Order.findById(orderId)
        .populate("cart.items")
        .populate("roomType");
      const item = order.cart.items.find((item) => String(item._id) === itemId);

      //search for all rooms by the roomType that is available
      const rooms = await Room.find({
        roomType: ObjectId(item.roomTypeId),
      }).populate("roomType");

      // Total number of rooms
      const totalRooms = rooms.length;
      // Count of available rooms
      const availableRooms = rooms.filter((room) => room.available).length;

      // Count of not available rooms
      const notAvailableRooms = rooms.filter((room) => !room.available).length;

      res.render("admin/hotels/selectRoom", {
        // csrfToken: req.csrfToken(),
        rooms,
        //to be used for checkout
        roomType: item.roomTypeId,
        roomTypeName: item.name,
        price: item.price,
        hotel: item.hotel,
        noRooms: item.noRooms,
        checkin: item.checkIn,
        itemId: itemId,
        orderId: orderId,
        userId: order.user,
        errorMsg,
        successMsg,
        pageName: "Checkin Room",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  }
);

//POST: To post rooms ans save to Database , and Update rooms everywhere possible
//checkin form will update the Guest data and alocate a Room under category booked
router.post("/checkin/rooms", middleware.isLoggedIn, async (req, res) => {
  const { selectedRooms, roomType, itemId, orderId, user } = req.body;

  try {
    // Find the guest and update other data TODO BUG
    const guest = await Guest.findOne({ user: ObjectId(user) });

    // Task 1: Search for Rooms matching roomType and selectedRooms
    const rooms = await Room.find({
      roomType,
      roomID: { $in: selectedRooms },
    });

    // Task 2: Update the availability of the matched rooms
    const updatePromises = rooms.map((room) => {
      room.available = false;
      return room.save();
    });
    await Promise.all(updatePromises);

    // Task 3: Update guest.reservations.room_id with the ObjectIDs of the selected rooms
    const roomIds = rooms.map((room) => mongoose.Types.ObjectId(room._id)); // Convert room IDs to ObjectIds
    let itemFound = false; // Flag to track if the itemId is found

    guest.reservations.forEach((reservation, index) => {
      if (reservation.itemId.toString() === itemId) {
        //console.log("Item found at index " + index);
        const roomIndex =
          index < roomIds.length ? index : index % roomIds.length;
        reservation.room_id = roomIds[roomIndex];
        //console.log("index iteration " + roomIndex);
        //console.log("updated with room obj " + roomIds[roomIndex]);
        itemFound = true; // Set the flag to true since the itemId is found
      }
    });

    if (!itemFound) {
      ///console.log("Item with itemId " + itemId + " not found in reservations.");
      // Handle the scenario where the itemId is not found
    }

    // Task 4: Save the updated guest
    await guest.save();

    // Update the confirmation status of the item
    await Order.updateOne(
      {
        _id: ObjectId(orderId),
        "cart.items._id": ObjectId(itemId),
      },
      { $set: { "cart.items.$.confirmed": true } }
    );

    res.json({
      success: "Guest successfully check-in into rooms.",
      redirectUrl: "/bookings/checkin/success/",
      code: orderId + "/" + itemId + "/",
    });
  } catch (error) {
    console.log("An error occurred:", error);
    res.redirect("/"); // Redirect to an error page or handle the error accordingly
  }
});

// GET: display the all paymanent Tables
router.get(
  "/payments",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    var errorMsg = req.flash("error")[0];

    res.render("admin/payments/payment", {
      errorMsg,
      pageName: "Users Payment",
    });
  }
);

//GET add payment for customer
router.get(
  "/add/payments",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    var errorMsg = req.flash("error")[0];
    res.render("admin/payments/makePayment", {
      errorMsg,
      pageName: "Users Payment",
    });
  }
);

//GET view payment in PDF
router.get(
  "/payments/:id",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const payment = req.params.id;
      // Fetch guests based on the query
      // const guest = await Guest.findById(guestId).populate("reservations.room_id reservations.room_type");

      res.render("admin/payments/viewPayment", {
        guest, // Pass the guestData to the view template
        pageName: "customers",
      });
    } catch (error) {
      // Handle any errors
      console.error(error);
      var errorMsg = "An error occurred while fetching guests.";
      req.flash("error", errorMsg);
      res.redirect("/admin/payments");
    }
  }
);

// Route to fetch user hotels
router.get("/user-hotels", async (req, res) => {
  try {
    const user = req.user;
    const hotels = user.hotels;
    const filteredHotels = hotels.filter((hotel) => hotel !== null);

    res.status(200).json(filteredHotels);
  } catch (error) {
    console.error("Error fetching user hotels:", error);
    res.status(500).json({ error: "Failed to fetch user hotels" });
  }
});


// Route to fetch room types for a specific hotel
router.get("/room-types/:hotelId", async (req, res) => {
  try {
    const hotelId = req.params.hotelId;

    // Fetch the room types for the specified hotel
    const roomTypes = await RoomType.find({ hotel: hotelId });

    res.status(200).json(roomTypes);
  } catch (error) {
    console.error("Error fetching room types:", error);
    res.status(500).json({ error: "Failed to fetch room types" });
  }
});


// Route to fetch details of a specific room type
router.get("/room-types/details/:roomTypeId", async (req, res) => {
  try {
    const roomTypeId = req.params.roomTypeId;

    // Fetch the details of the specified room type
    const roomType = await RoomType.findById(roomTypeId);

    res.status(200).json(roomType);
  } catch (error) {
    console.error("Error fetching room type details:", error);
    res.status(500).json({ error: "Failed to fetch room type details" });
  }
});



// Route to fetch hotel details based on object ID
router.get("/hotels/details/:id", async (req, res) => {
  try {
    const hotelId = req.params.id;

    // Fetch the hotel details from the database using the object ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    res.status(200).json(hotel);
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//view all users as an Admin
router.get(
  "/users",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const users = await User.find({}).populate("hotels");
      const hotels = await Hotel.find({});

      res.render("admin/users/users", {
        users,
        hotels,
        successMsg,
        errorMsg,
        // csrfToken: req.csrfToken(),
        pageName: "User Lists",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch user data");
      res.redirect("/");
    }
  }
);



//create  users as an Admin
router.get(
  "/create/users",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      res.render("admin/users/createUser", {
        successMsg,
        errorMsg,
        pageName: "Create User",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch user data");
      res.redirect("/");
    }
  }
);



//POST: Create Users
router.post("/createUser", (req, res) => {
  // Extract the form data from the request body
  const { title, firstname, lastname, email, phone, role } = req.body;

  const defaultPassword = "hotellar2023";
  // Hash the password
  const passwordHash = bcrypt.hashSync(
    defaultPassword,
    bcrypt.genSaltSync(5),
    null
  );

  // Create a new User instance
  const newUser = new User({
    title,
    firstname,
    lastname,
    email,
    phone,
    role,
    password: passwordHash,
    emailVerified: true,
    created: Date.now(),
    emailVerifiedAt: Date.now(),
  });

  // Save the new user to the database
  newUser.save((err) => {
    if (err) {
      // Handle any errors that occur during the saving process
      console.error(err);

      // Redirect or send an error response if necessary
    } else {
      sendVerificationEmail(newUser.email);
      res.redirect("/admin/users");
      // Redirect or send a success response if necessary
    }
  });
});

// Route to DELETE a user and its associated guest details
router.post(
  "/users/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const { userId } = req.params;

    try {
      // Find the user in the database
      const user = await User.findById(userId);

      if (!user) {
        // If the user doesn't exist, return a 404 Not Found error
        return res.status(404).json({ error: "User not found." });
      }

      // Check if the user has associated guest details
      const guest = await Guest.findOne({ user: userId });

      if (guest) {
        // If guest details exist, delete the guest details
        await guest.remove();
      }

      // Delete the user from the database
      await user.remove();

      // Return a success message
      req.flash("User deleted successfully");
      res.redirect("/admin/users/");
    } catch (error) {
      console.error(err);
      req.flash("Server error " + err);
      res.redirect("/admin/users/");
    }
  }
);

// PUT /users/:userId
router.post("/users/edit/:userId", async (req, res) => {
  const { userId } = req.params;
  const { hotels } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user fields
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.role = req.body.role;

    console.log(req.body.role);

    await user.save();

    req.flash("User deleted successfully");
    res.redirect("/admin/users/");
  } catch (err) {
    console.error(err);
    req.flash("Server error " + err);
    res.redirect("/admin/users/");
  }
});

// Assign hotels to a user
router.post(
  "/users/assign-hotels/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const { userId } = req.params;
    const { hotels } = req.body;
    try {
      // Find the user by ID
      const user = await User.findById(userId).populate("hotels");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Convert hotels to an array if it's not already
      const hotelsArray = Array.isArray(hotels) ? hotels : [hotels];

      // Get the current hotels for the user
      const currentHotels = user.hotels
        ? user.hotels
            .filter((hotelId) => hotelId !== null)
            .map((hotelId) => hotelId.toString())
        : [];

      // Find the hotels that are newly checked and not previously checked
      const newlyCheckedHotels = hotelsArray.filter(
        (hotelId) => !currentHotels.includes(hotelId)
      );

      // Find the hotels that were previously checked but now unchecked
      const uncheckedHotels = currentHotels.filter(
        (hotelId) => !hotelsArray.includes(hotelId)
      );

      // Remove unchecked hotels from the user's hotels array
      if (user.hotels) {
        user.hotels = user.hotels.filter(
          (hotelId) => !uncheckedHotels.includes(hotelId)
        );
      }

      // Add newly checked hotels to the user's hotels array
      user.hotels = user.hotels
        ? [...user.hotels, ...newlyCheckedHotels]
        : newlyCheckedHotels;

      // Save the updated user
      await user.save();

      req.flash("success", "Hotels assigned successfully");
      res.redirect("/admin/users");
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to assign hotels to the user");
      res.redirect("/admin/users");
    }
  }
);

//Admin cam manually verify users in case of server issues
router.post(
  "/users/verify/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const userToVerify = await User.findById(req.params.userId);

      if (!userToVerify) {
        req.flash("error", "User not found for manual verification.");
        return res.redirect("/admin/users/");
      }

      if (userToVerify.emailVerified) {
        req.flash("success", "User is already verified. Thank you!");
        return res.redirect("/admin/users/");
      }

      // Set the user's email as verified
      userToVerify.emailVerified = true;
      userToVerify.emailVerifiedAt = Date.now();
      await userToVerify.save();

      req.flash("success", "Manual verification successful!");
      res.redirect("/admin/users/");
    } catch (error) {
      console.error("Error during manual verification:", error);
      req.flash(
        "error",
        "Unable to manually verify user. Please try again later."
      );
      res.redirect("/admin/user/");
    }
  }
);

/****
 * Category CRUD for Market and Products
 *
 */
// View all categories as an Admin




router.get(
  "/categories",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];
    
    try {
      const categories = await Category.find({});

      res.render("admin/category/categories", {
        categories,
        successMsg,
        errorMsg,
        pageName: "Category Lists",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch category data");
      res.redirect("/");
    }
  }
);


//GET: form to create 
router.get(
  "/create/categories",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];
    
    try {
      const categories = await Category.find({});

      res.render("admin/category/createCategory", {
        categories,
        successMsg,
        errorMsg,
        pageName: "Category Lists",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch category data");
      res.redirect("/");
    }
  }
);




// Create a new category
router.post("/create/categories", async (req, res) => {
  try {
    // Extract the array of categories from the request body
    const { categoriesData }= req.body;

    // Create an array to store the created categories
    const createdCategories = [];



    // Iterate through the array and create new Category instances
    for (const categoryData of categoriesData) {
      const { name, type, desc } = categoryData;
       // Generate a unique slug for the name
      const slug = slugify(name, { lower: true, strict: true });

      // Create a new Category instance
      const newCategory = new Category({
        name: name,
        description: desc,
        productType: type,
        slug: slug, // Set the slug field

      });

      // Save the new category to the database
      await newCategory.save();
      // Push the created category to the array
      createdCategories.push(newCategory);
    }

    req.flash("success", "Categories created successfully");
     // Redirect or send a success response
      res.json({
        success: true,
        message: "Rooms created successfully",
        redirect: `/admin/categories`,
      });

  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to create categories");
    res.status(500).json({ error: "Internal Server Error" });
  }
});





// Delete a category by ID
router.post("/categories/delete",
  async (req, res) => {
    try {
      //const catId = req.params.roomId;
      const idsToDelete = req.body.ids;
      // Find the room by ID
      const category = await Category.findById(idsToDelete);

      //check of category exists
      if (!category) {
        req.flash("error", "Categories not Found . . .");
        return res.redirect(
          `/admin/categories/`
        );
      }

    // 2. Delete the category
      await category.remove();
      req.flash("success", "Category deleted successfully");

      res.status(200).json({
        message: 'Categories deleted successfully.',
        urlRedirect: `/admin/categories/`
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to delete the category");
      res.status(500).json({
        message: `Failed to delete the Category ${error}`,
        urlRedirect: `/admin/categories/`
      });
    }
  });








module.exports = router;
