const express = require("express");
const router = express.Router();
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const adminController = require("../../controller/adminController");




//POST:Create Hotel with post
router.get("/hotels", middleware.isLoggedIn, middleware.isLoggedIn,middleware.isAdmin, adminController.getHotels);
router.get( "/hotels/new", middleware.isLoggedIn, middleware.isAdmin, adminController.getNewHotel);
router.post("/create-hotel",storage({single:'hotelPicture'}),adminController.postCreateNewHotel);
router.get("/hotels/:id",middleware.isLoggedIn,middleware.isAdmin,adminController.getHotelById);

// POST: Function to update existing Hotel
router.post("/edit/hotels/:id",middleware.isLoggedIn,middleware.isAdmin,storage({ single: "hotelPicture" }),adminController.postEditHotelById);
router.get("/hotels/del/:id",middleware.isLoggedIn,middleware.isAdmin,adminController.getDeleteHotelById);
router.get("/hotels/:hotelId/rooms",middleware.isLoggedIn, middleware.isAdmin, adminController.getRoomsByHotelId);
router.get("/walkin/:hotelId/bookings/", adminController.getWalkingBooking);
router.get("/roomtypes/:hotelId/rooms/:roomType", middleware.isLoggedIn, middleware.isAdmin, adminController.getRoomsByRoomTypeId);
router.get("/rooms/:roomTypeId", adminController.getRoomsOnRoomtypeID);
router.get("/:hotelId/:roomTypeId/:roomId/lock", middleware.isLoggedIn, middleware.isAdmin, adminController.getRoomOnLock);
router.get("/:hotelId/:roomTypeId/:roomId/delete",middleware.isLoggedIn, middleware.isAdmin,adminController.getDeleteRoomById);



//3. post a RoomType with :POST
//2. create a new Roomtype :GET
router.post("/add/roomtypes/:hotelId", storage(), adminController.postAddRoomTypeByHotelID);
router.get("/:hotelId/roomType/new", middleware.isLoggedIn, middleware.isAdmin, adminController.getCreateRoomTypeByHotelID);
router.get("/:hotelId/:roomTypeId/new-room", middleware.isLoggedIn, middleware.isAdmin, adminController.getCreateRoomByRoomTyeID);
router.post("/:hotelId/:roomTypeId/new-room",middleware.isLoggedIn,middleware.isAdmin, adminController.postCreateRoomByRoomTypeID);
router.get("/roomtypes/:id/:hotelId", middleware.isLoggedIn,middleware.isAdmin,adminController.getDeleteRoomTypeByHotelID);
router.get("/roomtypes/:hotelId", middleware.isLoggedIn, middleware.isAdmin, adminController.getShowRoomTypeByHotelID);


// 4.GET: Edit a new RoomType : GET
router.get( "/edit/roomtypes/:id",
  middleware.isLoggedIn, middleware.isAdmin, adminController.getEditRoomTypeByID);
router.post("/edit/roomtypes/:roomId/:hotelId", storage(), adminController.postEditRoomTypeByID);
router.get(
  "/customers", middleware.isLoggedIn, middleware.isAdmin, adminController.getCustomers);

router.get("/customers/:id",middleware.isLoggedIn,middleware.isAdmin, 
adminController.getSearchCustomerByID);

  //GET add new Customer
router.get("/add/customers", middleware.isLoggedIn, middleware.isAdmin, 
adminController.getAddCustomer);

router.post("/create/customer", middleware.isLoggedIn, middleware.isAdmin,
adminController.postCreateCustomer);

router.post("/search/guests",middleware.isLoggedIn, middleware.isAdmin, adminController.postSearchGuest);

  //Get DashBoards
router.get(
  "/dashboard",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getDashboard);

//Get DashBoards
router.get(
  "/setup",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getUserSetup);


  //GET view Bookings
router.get(
  "/bookings",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getShowBookings);


router.post(
  "/search/orders",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.postSearchOrders);

router.get(
  "/bookings/:id",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getBookingsByID);


//GET add payment for customer
router.get(
  "/add/bookings",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getAddBookings);


//POST: To get all data and process payment on different categories of request
router.post(
  "/create-invoice",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.postCreateInvoice);


//GET: To select rooms that is available
router.get(
  "/select/:orderId/:itemId/room",
  middleware.isLoggedIn,
  middleware.emailVerified, adminController.getSelectRoomsAvailable);

//POST: To post rooms ans save to Database , and Update rooms everywhere possible
//checkin form will update the Guest data and alocate a Room under category booked
router.post("/checkin/rooms", middleware.isLoggedIn, adminController.postCheckinAavailableRooms);

// GET: display the all paymanent Tables
router.get(
  "/payments",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getPayments);

//GET add payment for customer
router.get(
  "/add/payments",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getAddPayments);

//GET view payment in PDF
router.get(
  "/payments/:id",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getPaymentsByID);

// Route to fetch user hotels
router.get("/user-hotels", adminController.getHotelUsers);

// Route to fetch room types for a specific hotel
router.get("/room-types/:hotelId", adminController.getRoomTypeByhotelID);

// Route to fetch details of a specific room type
router.get("/room-types/details/:roomTypeId", adminController.getRoomTypeByID);

// Route to fetch hotel details based on object ID
router.get("/hotels/details/:id", adminController.getHotelDetailsByID);

//view all users as an Admin
router.get("/users",middleware.isLoggedIn, middleware.isAdmin, adminController.getUserLists);


// Route to DELETE a user and its associated guest details
router.post(
  "/users/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.postDeleteUserByID);


//POST: Create Users
router.post("/createUser", adminController.postCreateUsers);

//create  users as an Admin
router.get(
  "/create/users",
  middleware.isLoggedIn,
  middleware.isAdmin, adminController.getCreateUsers);

// PUT /users/:userId
router.post("/users/edit/:userId", adminController.postEditUserByID);

// Assign hotels to a user
router.post(
  "/users/assign-hotels/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin,adminController.postAssignUserHotelById);

//Admin cam manually verify users in case of server issues
router.post(
  "/users/verify/:userId",
  middleware.isLoggedIn,
  middleware.isAdmin,adminController.postVerifyUserByID);


router.get("/categories", middleware.isLoggedIn,middleware.isAdmin, adminController.getCategories);

//GET: form to create 
router.get("/create/categories", middleware.isLoggedIn, middleware.isAdmin, adminController.getCreateCategory );


// Create a new category
router.post("/create/categories", adminController.postCreateCategory);


// Delete a category by ID
router.post("/categories/delete", adminController.postDeleteCategory);
  







module.exports = router;
