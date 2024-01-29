const express = require("express");
const Food = require("../../models/food");
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const foodController = require("../../controller/foodController");
const storage = require("../../middleware/storage");

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const router = express.Router();



// View all food items with dropdown for hotel
router.get(
  "/foods",
  middleware.isLoggedIn,
  middleware.isAdmin, foodController.getAllFoods);

// GET Create a new food item
router.get(
  "/create/food",
  middleware.isLoggedIn,
  middleware.isAdmin, foodController.getCreateFood);

// POST Create a new food item
router.post(
  "/create/foods",
  storage({ single: "foodPicture" }),
  middleware.isLoggedIn,
  middleware.isAdmin, foodController.postCreateFood);

//GET:  Render the edit form
router.get('/edit/:foodId', foodController.getEditFoodById)
//POST: Receive and update the Schema:
router.post('/edit/:foodId', storage({ single: 'foodPicture' }), foodController.postEditFoodById)
// Delete a food item by ID
router.post("/food/delete", foodController.postDeleteFoodById);








module.exports = router;
