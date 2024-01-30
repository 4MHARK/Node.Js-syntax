const express = require("express");
const storage = require("../../middleware/storage");

const middleware = require("../../middleware/confirm");
const foodController = require("../../controller/foodController");

const middleArray = [middleware.isLoggedIn,middleware.isAdmin];

const router = express.Router();

// View all food items with dropdown for hotel
router.get("/foods", ...middleArray, foodController.getAllFoods);


// GET Create a new food item
router.get("/create/food",  ...middleArray, foodController.getCreateFood);
// POST Create a new food item
router.post("/create/foods", storage({ single: "foodPicture" }),  ...middleArray, foodController.postCreateFood);
//GET:  Render the edit form
router.get("/edit/:foodId", ...middleArray,  foodController.getEditFoodById);
//POST: Receive and update the Schema:
router.post("/edit/:foodId",storage({ single: "foodPicture" }), ...middleArray, foodController.postEditFoodById);
// Delete a food item by ID
router.post("/food/delete",  ...middleArray, foodController.postDeleteFoodById);





module.exports = router;
