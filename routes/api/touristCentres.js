const express = require("express");
const Hotel = require("../../models/hotel");
const TourGuide = require("../../models/localTour");
const TouristCentre = require("../../models/touristCentre");
const middleware = require("../../middleware/confirm");
const mongoose = require("mongoose");

//Declare your CRUD your Route
const router = express.Router();



// View all tourist centres with dropdowns for tour guide and hotel
router.get(
  "/touristcentres",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      // Fetch all tourist centres with populated references
      const touristCentres = await TouristCentre.find({})
        .populate("tourGuide")
        .populate("hotel");

      // Fetch all available tour guides and hotels for dropdowns
      const tourGuides = await TourGuide.find({});
      const hotels = await Hotel.find({});

      res.render("admin/touristcentres", {
        touristCentres,
        successMsg,
        errorMsg,
        pageName: "Tourist Centre Lists",
        tourGuides,
        hotels,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch tourist centre data");
      res.redirect("/");
    }
  }
);

// Create a new tourist centre
router.post("/touristcentres", async (req, res) => {
  try {
    // Extract the form data from the request body
    const {
      name,
      description,
      location,
      admissionFee,
      requiresTourGuide,
      tourGuide,
      hotel,
    } = req.body;

    // Convert tourGuide and hotel values to ObjectId
    const tourGuideObjectId = mongoose.Types.ObjectId(tourGuide);
    const hotelObjectId = mongoose.Types.ObjectId(hotel);

    // Create a new TouristCentre instance
    const newTouristCentre = new TouristCentre({
      name,
      description,
      location,
      admissionFee,
      requiresTourGuide,
      tourGuide: tourGuideObjectId,
      hotel: hotelObjectId,
    });

    // Save the new tourist centre to the database
    await newTouristCentre.save();

    req.flash("success", "Tourist centre created successfully");
    res.status(201).json(newTouristCentre);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to create tourist centre");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a specific tourist centre by ID
router.get("/touristcentres/:id", async (req, res) => {
  try {
    const touristCentre = await TouristCentre.findById(req.params.id)
      .populate("tourGuide")
      .populate("hotel");
    if (!touristCentre) {
      req.flash("error", "Tourist centre not found");
      return res.status(404).json({ error: "Tourist centre not found" });
    }
    res.json(touristCentre);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to fetch tourist centre data");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a tourist centre by ID
router.put("/touristcentres/:id", async (req, res) => {
  try {
    const updatedTouristCentre = await TouristCentre.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("tourGuide")
      .populate("hotel");
    if (!updatedTouristCentre) {
      req.flash("error", "Tourist centre not found");
      return res.status(404).json({ error: "Tourist centre not found" });
    }
    req.flash("success", "Tourist centre updated successfully");
    res.json(updatedTouristCentre);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update tourist centre");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a tourist centre by ID
router.delete("/touristcentres/:id", async (req, res) => {
  try {
    const deletedTouristCentre = await TouristCentre.findByIdAndDelete(
      req.params.id
    );
    if (!deletedTouristCentre) {
      req.flash("error", "Tourist centre not found");
      return res.status(404).json({ error: "Tourist centre not found" });
    }
    req.flash("success", "Tourist centre deleted successfully");
    res.json(deletedTouristCentre);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete tourist centre");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;



