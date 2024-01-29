const express = require("express");
const Hotel = require("../../models/hotel");
const Food = require("../../models/food");
const middleware = require("../../middleware/confirm");

const mongoose = require("mongoose");
const router = express.Router();



// View all food items with dropdown for hotel
router.get("/api/foods", async (req, res) => {
  try {
    // Fetch all food items with populated hotel reference
    const foods = await Food.find({}).populate("hotel");

    // Fetch all available hotels for dropdown
    const hotels = await Hotel.find({});

    res.status(200).json({ foods, hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch food data" });
  }
});


// Create a new food item
router.post("/api/foods", async (req, res) => {
  try {
    // Extract the form data from the request body
    const {
      name,
      category,
      description,
      ingredients,
      allergens,
      portionSize,
      price,
      hotel,
    } = req.body;

    // Convert hotel value to ObjectId
    const hotelObjectId = mongoose.Types.ObjectId(hotel);

    // Create a new Food instance
    const newFood = new Food({
      name,
      category,
      description,
      ingredients,
      allergens,
      portionSize,
      price,
      hotel: hotelObjectId,
    });

    // Save the new food item to the database
    await newFood.save();

    res.status(201).json(newFood);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create food item" });
  }
});



// Get a specific food item by ID
router.get("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate("hotel");
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.status(200).json(food);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Update a food item by ID
router.put("/api/foods/:id", async (req, res) => {
  try {
    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("hotel");
    if (!updatedFood) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.status(200).json(updatedFood);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Delete a food item by ID
router.delete("/api/foods/:id", async (req, res) => {
  try {
    const deletedFood = await Food.findByIdAndDelete(req.params.id);
    if (!deletedFood) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.status(200).json(deletedFood);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




module.exports = router;
