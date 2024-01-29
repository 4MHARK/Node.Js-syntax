const express = require("express");
const Hotel = require("../../models/hotel");
const middleware = require("../../middleware/confirm");
const localTour = require("../../models/localTour");
const mongoose = require("mongoose");

//Declare your CRUD your Route
const router = express.Router();


// View all local tours
router.get("/api/localtours", middleware.isLoggedIn, middleware.isAdmin, async (req, res) => {
  try {
    // Fetch all local tours
    const localTours = await LocalTour.find({});
    res.json(localTours);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch local tour data" });
  }
});


// Create a new local tour
router.post("/api/localtours", async (req, res) => {
  try {
    // Extract the form data from the request body
    const { name, contact } = req.body;

    // Create a new LocalTour instance
    const newLocalTour = new LocalTour({
      name,
      contact,
    });

    // Save the new local tour to the database
    await newLocalTour.save();

    res.status(201).json(newLocalTour);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create local tour" });
  }
});

// Get a specific local tour by ID
router.get("/localtours/:id", async (req, res) => {
  try {
    const localTour = await LocalTour.findById(req.params.id);
    if (!localTour) {
      req.flash("error", "Local tour not found");
      return res.status(404).json({ error: "Local tour not found" });
    }
    res.json(localTour);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to fetch local tour data");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a local tour by ID
router.put("/localtours/:id", async (req, res) => {
  try {
    const updatedLocalTour = await LocalTour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedLocalTour) {
      req.flash("error", "Local tour not found");
      return res.status(404).json({ error: "Local tour not found" });
    }
    req.flash("success", "Local tour updated successfully");
    res.json(updatedLocalTour);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update local tour");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a local tour by ID
router.delete("/localtours/:id", async (req, res) => {
  try {
    const deletedLocalTour = await LocalTour.findByIdAndDelete(req.params.id);
    if (!deletedLocalTour) {
      req.flash("error", "Local tour not found");
      return res.status(404).json({ error: "Local tour not found" });
    }
    req.flash("success", "Local tour deleted successfully");
    res.json(deletedLocalTour);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete local tour");
    res.status(500).json({ error: "Internal Server Error" });
  }
});







module.exports = router;
