const express = require("express");
const Hotel = require("../../models/hotel");
const MarketItem = require("../../models/market");
const middleware = require("../../middleware/confirm");
const Category = require("../../models/category"); 
const mongoose = require("mongoose");
const router = express.Router();




// View all market items with dropdown for category
router.get(
  "/marketitems",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      // Fetch all market items with populated category reference
      const marketItems = await MarketItem.find({}).populate("category");

      // Fetch all available categories for dropdown
      const categories = await Category.find({});
      const hotel= await Hotel.find({});

      res.render("admin/marketitems", {
        marketItems,
        successMsg,
        errorMsg,
        pageName: "Market Item Lists",
        categories,
        hotel,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch market item data");
      res.redirect("/");
    }
  }
);

// Create a new market item
router.post("/marketitems", async (req, res) => {
  try {
    // Extract the form data from the request body
    const {
      productCode,
      name,
      imagePath,
      description,
      price,
      category,
      manufacturer,
      available,
      hotel,
    } = req.body;

    // Convert category value to ObjectId
    const categoryObjectId = mongoose.Types.ObjectId(category);
    // Convert hotel value to ObjectId
    const hotelObjectId = mongoose.Types.ObjectId(hotel);

    // Create a new MarketItem instance
    const newMarketItem = new MarketItem({
      productCode,
      name,
      imagePath,
      description,
      price,
      category: categoryObjectId,
      manufacturer,
      available,
      hotel: hotelObjectId
    });


    // Save the new market item to the database
    await newMarketItem.save();

    req.flash("success", "Market item created successfully");
    res.status(201).json(newMarketItem);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to create market item");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a specific market item by ID
router.get("/marketitems/:id", async (req, res) => {
  try {
    const marketItem = await MarketItem.findById(req.params.id).populate(
      "category"
    );
    if (!marketItem) {
      req.flash("error", "Market item not found");
      return res.status(404).json({ error: "Market item not found" });
    }
    res.json(marketItem);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to fetch market item data");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a market item by ID
router.put("/marketitems/:id", async (req, res) => {
  try {
    const updatedMarketItem = await MarketItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("category");
    if (!updatedMarketItem) {
      req.flash("error", "Market item not found");
      return res.status(404).json({ error: "Market item not found" });
    }
    req.flash("success", "Market item updated successfully");
    res.json(updatedMarketItem);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update market item");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a market item by ID
router.delete("/marketitems/:id", async (req, res) => {
  try {
    const deletedMarketItem = await MarketItem.findByIdAndDelete(req.params.id);
    if (!deletedMarketItem) {
      req.flash("error", "Market item not found");
      return res.status(404).json({ error: "Market item not found" });
    }
    req.flash("success", "Market item deleted successfully");
    res.json(deletedMarketItem);
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete market item");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;












module.exports = router;
