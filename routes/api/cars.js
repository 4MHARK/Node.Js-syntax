
const express = require("express");
const Hotel = require("../../models/hotel");
const CarRental = require("../../models/car");
const mongoose = require("mongoose");
const middleware = require("../../middleware/confirm");

const router = express.Router();



// View all car rentals with dropdowns for hotel and tourGuide
router.get("/api/cars", middleware.isLoggedIn, middleware.isAdmin, async (req, res) => {
  try {
    // Fetch all car rentals with populated references
    const carRentals = await CarRental.find({})
      .populate("tourGuide")
      .populate("hotel");

    // Fetch all available tour guides and hotels for dropdowns
    const tourGuides = await LocalTour.find({});
    const hotels = await Hotel.find({});

    res.status(200).json({
      carRentals,
      tourGuides,
      hotels,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch car rental data" });
  }
});

// Create a new car rental
router.post("/api/cars", async (req, res) => {
  try {
    // Extract the form data from the request body
    const {
      name,
      description,
      pricePerDay,
      duration,
      model,
      licensePlate,
      pickUpLocation,
      dropOffLocation,
      tourGuide,
      hotel,
    } = req.body;

    // Convert tourGuide and hotel values to ObjectId
    const tourGuideObjectId = mongoose.Types.ObjectId(tourGuide);
    const hotelObjectId = mongoose.Types.ObjectId(hotel);

    // Create a new CarRental instance
    const newCarRental = new CarRental({
      name,
      description,
      pricePerDay,
      duration,
      model,
      licensePlate,
      pickUpLocation,
      dropOffLocation,
      tourGuide: tourGuideObjectId,
      hotel: hotelObjectId,
    });

    // Save the new car rental to the database
    await newCarRental.save();

    res.status(201).json({
      success: true,
      message: "Car rental created successfully",
      data: newCarRental,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create car rental" });
  }
});

/***
 * {
  "name": "Car Rental Name",
  "description": "Car Rental Description",
  "pricePerDay": 100,
  "duration": 7,
  "model": "Car Model",
  "licensePlate": "ABC123",
  "pickUpLocation": "Pickup Location",
  "dropOffLocation": "Drop-off Location",
  "tourGuide": "60c8f02e4795a80015631772", // ObjectId for a LocalTour
  "hotel": "60c8f02e4795a80015631773"     // ObjectId for a Hotel
}
<select name="tourGuide">
  <% for (const tourGuide of tourGuides) { %>
    <option value="<%= tourGuide._id %>"><%= tourGuide.name %></option>
  <% } %>
</select>

<select name="hotel">
  <% for (const hotel of hotels) { %>
    <option value="<%= hotel._id %>"><%= hotel.name %></option>
  <% } %>
</select>
 */


router.get("/api/cars/:id", async (req, res) => {
  try {
    const carRental = await CarRental.findById(req.params.id)
      .populate("tourGuide")
      .populate("hotel");
    if (!carRental) {
      return res.status(404).json({ error: "Car rental not found" });
    }
    res.status(200).json(carRental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Update a car rental by ID
router.put("/api/cars/:id", async (req, res) => {
  try {
    const updatedCarRental = await CarRental.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("tourGuide")
      .populate("hotel");
    if (!updatedCarRental) {
      return res.status(404).json({ error: "Car rental not found" });
    }
    res.status(200).json(updatedCarRental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Delete a car rental by ID
router.delete("/api/cars/:id", async (req, res) => {
  try {
    const deletedCarRental = await CarRental.findByIdAndDelete(req.params.id);
    if (!deletedCarRental) {
      return res.status(404).json({ error: "Car rental not found" });
    }
    res.status(200).json(deletedCarRental);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});







module.exports = router;
