const express = require("express");
const Hotel = require("../../models/hotel");
const CarRental = require("../../models/car");
const LocalTour = require("../../models/localTour");
const mongoose = require("mongoose");
const middleware = require("../../middleware/confirm");

const storage = require("../../middleware/storage");
const fs = require("fs");
const path = require("path");

const router = express.Router();


// View all car rentals with dropdowns for hotel and tourGuide
router.get(
  "/carRentals",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];
    try {
      // Fetch all car rentals with populated references
      const carRentals = await CarRental.find({})
        .populate("tourGuide")
        .populate("hotel");

      // Fetch all available tour guides and hotels for dropdowns
      const tourGuides = await LocalTour.find({});
      const hotels = await Hotel.find({});

      res.render("admin/carRentals/cars", {
        carRentals,
        successMsg,
        errorMsg,
        pageName: "Car Rental Lists",
        tourGuides,
        hotels,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch car rental data");
      res.redirect("/");
    }
  }
);


//GET create-car rentals form
router.get(
  "/create/car-rentals",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const hotels = await Hotel.find({});
      const tourGuides = await LocalTour.find({});

      res.render("admin/carRentals/createCars", {
        pageName: "Create Car",
        successMsg,
        errorMsg,
        hotels,
        tourGuides,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch data");
      res.redirect("/");
    }
  }
);


//POST Create car Rebtals
router.post(
  "/create/carRentals",
  storage({ single: "carImage" }),
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {

      const carData = req.body;

      if (!req.file) {
        throw new Error("Car image is missing");
      }

      // Extract the form data from the request body
      const {
        carCode,
        carName,
        carDescription,
        carPricePerDay,
        carModel,
        carLicensePlate,
        carTourGuide,
        carHotel,
        carAvailable,
      } = req.body;


      const carImage = req.file;
      const pictureExtension = path.extname(carImage.originalname);
      const pictureName = `${carName}${pictureExtension}`;

      const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "storage",
        "car"
      );

      const picturePath = path.join(directoryPath, pictureName);

      // Create the directory if it doesn't exist
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Move the renamed image to the desired directory
      fs.renameSync(carImage.path, picturePath);

      // Convert tour guide and hotel values to ObjectId
      const tourGuideObjectId = mongoose.Types.ObjectId(carTourGuide);
      const hotelObjectId = mongoose.Types.ObjectId(carHotel);

      const imagePath = `/storage/car/${pictureName}`;

      // Create a new Car instance
      const newCar = new CarRental({
        productCode: carCode,
        name: carName,
        description: carDescription,
        pricePerDay: carPricePerDay,
        model: carModel,
        licensePlate: carLicensePlate,
        tourGuide: tourGuideObjectId,
        hotel: hotelObjectId,
        available: carAvailable === "true", // Convert string to boolean
        imagePath: imagePath,
      });

      // Save the new car to the database
      await newCar.save();
      req.flash("success", "Car rental created successfully");
      res.json({
        success: true,
        message: "Car rental created successfully",
        redirectUrl: `/car/carRentals`,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to create car rental");
      res.json({
        success: false,
        message: "Error: Car rental cannot be created",
        redirectUrl: `/car/carRentals`,
      });
    }
  }
);


// Delete a food item by ID
router.post("/car/delete", async (req, res) => {
  try {
    const idsToDelete = req.body.ids;

    // Find the room by ID
    const carItem = await CarRental.findOneAndDelete({ _id: idsToDelete });


    //check of food exists
    if (!carItem) {
      req.flash("error", "Car not Found . . .");
      return res.redirect(`/car/carRentals`);
    }

    // Delete the associated image
    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      carItem.imagePath
    );


    try {
      await fs.promises.unlink(imagePath);
      console.log(`Image deleted successfully: ${imagePath}`);
    } catch (imageDeleteError) {
      console.error(`Failed to delete image: ${imagePath}`, imageDeleteError);
    }

    req.flash("success", "car item deleted successfully");
    res.status(200).json({
      message: "car item deleted successfully.",
      urlRedirect: `/car/carRentals`,
    });

  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete the car item");
    res.status(500).json({
      message: `Failed to delete the car item ${error}`,
      urlRedirect: `/car/carRentals`,
    });
  }
});




//GET:  Render the edit form
router.get('/edit/:carId', async (req, res) => {

  try {

    const carId = req.params.carId;

    // Find the market item by ID
    const carRental = await CarRental.findById(carId);
    const tourGuides = await LocalTour.find();
    const hotels = await Hotel.find();

    console.log(carRental);

    if (!carRental) {
      req.flash("error", "car item not found");
      return res.redirect("/car/carRentals/");
    }

    // Render the edit form with the market item data
    res.render("admin/carRentals/editCars", {
      carRental,
      hotels,
      tourGuides,
      pageName: "Edit Car List",
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to fetch food item');
    res.redirect("/car/carRentals/");
  }
});





// POST: Receive and update the Schema:
router.post('/edit/:carId', storage({ single: 'carImage' }), async (req, res) => {
  try {
    const carId = req.params.carId;
    const carData = req.body;

    // Find the car by ID
    const carItem = await CarRental.findById(carId);

    if (!carItem) {
      req.flash("error", "Car item not found");
      return res.redirect("/car/carRentals/");
    }


    carItem.productCode = carData.productCode;
    carItem.name = carData.name;
    carItem.description = carData.description;
    carItem.pricePerDay = carData.pricePerDay;
    carItem.model = carData.model;
    carItem.licensePlate = carData.licensePlate;

    carItem.tourGuide = mongoose.Types.ObjectId(carData.tourGuide);
    carItem.hotel = mongoose.Types.ObjectId(carData.hotel);

    carItem.available = carData.available;

    // Check if a new image is provided in the form
    if (req.file) {
      // Process and save the new image
      const pictureExtension = path.extname(req.file.originalname);
      const pictureName = `${carData.carName}${pictureExtension}`;
      const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "storage",
        "cars"
      );

      // Move the renamed image to the desired directory
      const picturePath = path.join(directoryPath, pictureName);
      fs.renameSync(req.file.path, picturePath);

      // Update the imagePath property
      carItem.imagePath = `/storage/car/${pictureName}`;
    }

    // Save the updated car item to the database
    await carItem.save();

    req.flash("success", "Car item updated successfully");
    res.json({
      success: true,
      message: "Car item updated successfully",
      redirectUrl: "/car/carRentals/",
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update Car item");
    res.json({
      success: false,
      message: "Error: Car item cannot be updated",
      redirectUrl: "/car/carRentals/",
    });
  }
});










module.exports = router;
