const express = require("express");
const Hotel = require("../../models/hotel");
const Category = require("../../models/category");
const Food = require("../../models/food");
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const router = express.Router();



// View all food items with dropdown for hotel
router.get(
  "/foods",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      // Fetch all food items with populated hotel reference
      const foods = await Food.find({}).populate("hotel").populate("category");

      // Fetch all available hotels for dropdown
      const hotels = await Hotel.find({});
      const categories = await Category.find({});

      res.render("admin/food/foods", {
        foods,
        successMsg,
        errorMsg,
        pageName: "Food Lists",
        hotels,
        categories,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch food data");
      res.redirect("/");
    }
  }
);

// GET Create a new food item
router.get(
  "/create/food",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const hotels = await Hotel.find({});
      const categories = await Category.find({});

      res.render("admin/food/createFood", {
        pageName: "Create Food",
        successMsg,
        errorMsg,
        hotels,
        categories,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch data");
      res.redirect("/");
    }
  }
);


// POST Create a new food item
router.post(
  "/create/foods",
  storage({ single: "foodPicture" }),
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const foodData = req.body;

      if (!req.file) {
        throw new Error("Food picture is missing");
      }

      //Extract the form data from the request body
      const {
        productCode,
        foodName,
        foodDescription,
        portionSize,
        price,
        allergens,
        category,
        hotel,
      } = req.body;

      const foodPicture = req.file;
      const pictureExtension = path.extname(foodPicture.originalname);
      const pictureName = `${foodName}${pictureExtension}`;

      const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "storage",
        "food"
      );

      const picturePath = path.join(directoryPath, pictureName);

      // Create the directory if it doesn't exist
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Move the renamed image to the desired directory
      fs.renameSync(foodPicture.path, picturePath);

      // Convert hotel value to ObjectId
      const categoryObjectId = mongoose.Types.ObjectId(category);
      const hotelObjectId = mongoose.Types.ObjectId(hotel);

      newimagePath = `/storage/food/${pictureName}`;

      // Create a new MarketItem instance
      const newFood = new Food({
        productCode,
        name: foodName,
        description: foodDescription,
        portionSize,
        price,
        allergens,
        imagePath: newimagePath,
        category: categoryObjectId,
        hotel: hotelObjectId,
        available: true,
      });

      // Save the new market item to the database
      await newFood.save();
      req.flash("success", "Food item created successfully");
      res.json({
        success: true,
        message: "foods created successfully",
        redirectUrl: `/food/foods`,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to create market item");
      res.json({
        success: true,
        message: "Error: foods cannot be created",
        redirectUrl: `/food/foods`,
      });
    }
  }
);


//GET:  Render the edit form
router.get('/edit/:foodId', async (req, res) => {
  try {
    const foodId = req.params.foodId;

    // Find the market item by ID
    const foodItem = await Food.findById(foodId).populate("hotel").populate("category");
    const hotels = await Hotel.find();
    const categories = await Category.find();

    if (!foodItem) {
      req.flash("error", "Food item not found");
      return res.redirect("/food/foods");
    }

    // Render the edit form with the market item data
    res.render('admin/food/editFood', {
      foodItem,
      hotels,
      categories,
      pageName: "Edit Product List"
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to fetch food item');
    res.redirect('/food/foods');
  }
});



//POST: Receive and update the Schema:
router.post('/edit/:foodId', storage({ single: 'foodPicture' }), async (req, res) => {
 try {
    const foodId = req.params.foodId;
    const foodData = req.body;

    // Find the market item by ID
    const foodItem = await Food.findById(foodId);
    //const food = await Food.findById(req.params.foodId);

    console.log(foodItem);


    if (!foodItem) {
      req.flash("error", "Food item not found");
      return res.redirect("/food/foods");
    }

    // Update food item data based on the form submission
    foodItem.productCode = foodData.productCode ;
    foodItem.name = foodData.foodName;
    foodItem.description = foodData.foodDescription;
    foodItem.portionSize = foodData.portionSize;
    foodItem.price = foodData.price;
    foodItem.allergens = foodData.allergens ;
    foodItem.category = mongoose.Types.ObjectId(foodData.category);
    foodItem.hotel = mongoose.Types.ObjectId(foodData.hotel);
    foodItem.available = true;

    // Check if a new image is provided in the form
    if (req.file) {
      // Process and save the new image
      const pictureExtension = path.extname(req.file.originalname);
      const pictureName = `${foodData.productName}${pictureExtension}`;
      const directoryPath = path.join(
      __dirname,
      "..", // Adjust the relative path here based on your project structure
      "..", // Go up one more level to the main project directory
      "public",
      "storage",
      "food"
        );

      // Move the renamed image to the desired directory
      const picturePath = path.join(directoryPath, pictureName);
      fs.renameSync(req.file.path, picturePath);

      // Update the imagePath property
      foodItem.imagePath = `/food/${pictureName}`;
      }

    // Save the updated food item to the database
    await foodItem.save();

    req.flash('success', 'Food item updated successfully');
    res.json({
      success: true,
      message: 'Food item updated successfully',
      redirectUrl: '/food/foods/',
    });

  } catch (error) {
 
    console.error(error);
    req.flash('error', 'Failed to update Food item');
    res.json({
      success: false,
      message: 'Error: Market item cannot be updated',
      redirectUrl: '/food/foods/',
    });
  }
});



// Delete a food item by ID
router.post("/food/delete", async (req, res) => {
  try {
    const idsToDelete = req.body.ids;

    // Find the room by ID
    const foodItem = await Food.findOneAndDelete({ _id: idsToDelete });

    //check of food exists
    if (!foodItem) {
      req.flash("error", "Product not Found . . .");
      return res.redirect(`/food/foods/`);
    }

    // Delete the associated image
    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      foodItem.imagePath
    );


    try {
      await fs.promises.unlink(imagePath);
      console.log(`Image deleted successfully: ${imagePath}`);
    } catch (imageDeleteError) {
      console.error(`Failed to delete image: ${imagePath}`, imageDeleteError);
    }

    req.flash("success", "Food item deleted successfully");
    res.status(200).json({
      message: "Food item deleted successfully.",
      urlRedirect: `/food/foods/`,
    });

  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete the food item");
    res.status(500).json({
      message: `Failed to delete the food item ${error}`,
      urlRedirect: `/food/foods/`,
    });
  }
});






module.exports = router;
