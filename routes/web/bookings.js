const express = require("express");
const Hotel = require("../../models/hotel");
const RoomType = require("../../models/roomType");
const Room = require("../../models/room");
const Cart = require("../../models/cart");
const Guest = require("../../models/guest");
const Order = require("../../models/order");

//add new models to booking
const Car = require("../../models/car");
const localTour = require("../../models/localTour");
const Food = require("../../models/food");
const Market = require("../../models/market");
const places = require("../../models/touristCentre");

const mongoose = require("mongoose");

const { ObjectId } = require("mongoose").Types;
const middleware = require("../../middleware/confirm");
const router = express.Router();
const generateReceipt = require("../../middleware/receipt");

const { sendOrderEmailInBackground } = require("../../worker/workers");


//Manage all the bookings and payments
router.get(
  "/new/:id/reservation",
  middleware.isLoggedIn,
  middleware.emailVerified,
 BookingController. getNewIdReservation) 
// POST: add a product to the shopping cart when "Add to cart" button is pressed
router.post("/reserve/:id", middleware.isLoggedIn,  bookingController.postreserveById);

// Route request to proceed to checkout
router.post("/proceed/:id", middleware.isLoggedIn,bookingController);



//Get cart view all items in cart
router.get("/cart", middleware.isLoggedIn,bookingController. getCart);



// POST: remove an item from the shopping cart
router.get("/remove/:id", middleware.isLoggedIn,bookingController. getremoveById);



// GET: remove all instances of a single product from the cart
router.get("/clear", middleware.isLoggedIn,bookingController. getClear);




//Get: Check render for rooms
router.get(
  "/checkin/:orderId/:itemId/room",
  middleware.isLoggedIn,
  middleware.emailVerified, bookingController.getcheckingByorderByIdByitemIdbyroom);

 

//checkin form will update the Guest data and alocate a Room under category booked
router.post("/checkin/rooms", middleware.isLoggedIn,bookingController. postcheckingByrooms);




// GET: this page shows checkin is successful
router.get(
  "/checkin/success/:orderId/:itemId",
  middleware.isLoggedIn,bookingController. getcheckingBysucessByorderIdByitemId);

//GET: checkin pdf generator
router.get("/checkin/success/:orderId/:itemId/pdf", 
bookingController. getcheckingBysucessByorderIdByitemIdBypdf);


/*
Developing modified code for adding more generic items e.g Room Booking, Market
Food, Car Rentals and Attraction
**/

// POST: add a product to the shopping cart when "Add to cart" button is pressed
//This is a new modified add-to-cart for button pressed
router.post("/reserve/:type/:id", middleware.isLoggedIn,
 bookingController.postreserveBytypeByid);



// Function to calculate total cost for RoomType
function calculateRoomTypeTotalCost(roomType, bookingData) {
  const days = bookingData["numberOfDays"];
  const noRooms = parseInt(bookingData["roomNumber"]);
  return roomType.price * days * noRooms;
}

// Function to calculate total cost for CarRental
function calculateCarRentalTotalCost(carRental, bookingData) {
  const days = bookingData["numberOfDays"];
  const duration = bookingData["duration"]; // Adjust this based on your CarRental model
  return carRental.price * days * duration;
}

// Function to calculate total cost for Food
function calculateFoodTotalCost(food, bookingData) {
  const quantity = bookingData["quantity"];
  return food.price * quantity; // For simplicity, assuming that food cost is fixed
}

// Function to calculate total cost for MarketItem
function calculateMarketItemTotalCost(marketItem, bookingData) {
  const quantity = bookingData["quantity"];
  return marketItem.price * quantity; // For simplicity, assuming that market item cost is fixed
}

// Function to calculate type-specific attributes based on item type
function calculateTypeSpecificAttributes(item, bookingData) {
  switch (item.type) {
    case "roomtype":
      return {
        checkIn: bookingData["checkIn"],
        checkOut: bookingData["checkOut"],
        num_guests: bookingData["adultNumber"],
        days: bookingData["numberOfDays"] || 1,
      };

    case "carrental":
      return {
        duration: bookingData["carRentalDuration"] || 1,
        model: bookingData["carModel"],
        licensePlate: bookingData["carLicensePlate"],
        pickUpLocation: bookingData["carPickUpLocation"],
        dropOffLocation: bookingData["carDropOffLocation"],
        driverInfo: {
          name: bookingData["driverName"],
          licenseNumber: bookingData["driverLicenseNumber"],
        },
      };

    case "food":
      return {
        category: bookingData["foodCategory"],
        description: bookingData["foodDescription"],
        ingredients: bookingData["foodIngredients"],
        allergens: bookingData["foodAllergens"],
        portionSize: bookingData["foodPortionSize"],
      };

    case "marketitem":
      return {
        itemType: bookingData["marketItemType"],
        description: bookingData["marketItemDescription"],
        manufacturer: bookingData["marketItemManufacturer"],
      };

    default:
      return {};
  }
}




module.exports = router;
