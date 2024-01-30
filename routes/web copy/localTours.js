const express = require("express");
const Hotel = require("../../models/hotel");
const middleware = require("../../middleware/confirm");
const LocalTour = require("../../models/localTour");

const mongoose = require("mongoose");
const storage = require("../../middleware/storage");
const fs = require("fs");
const path = require("path");


//Declare your CRUD your Route
const router = express.Router();

// View all local tours
router.get(
  "/localtours",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      // Fetch all local tours
      const localTours = await LocalTour.find({});

      res.render("admin/localTours/localTours", {
        localTours,
        successMsg,
        errorMsg,
        pageName: "Local Tour Lists",
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch local tour data");
      res.redirect("/");
    }
  }
);



//GET : Create Local Tours 
router.get(
  "/create/local-tour",
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

    try {
      const localtours = await LocalTour.find({});

      res.render("admin/localTours/createlocalTours", {
        pageName: "Create Local Tours",
        successMsg,
        errorMsg,
        localtours,
      });
    } catch (err) {
      console.error(err);
      req.flash("error", "Failed to fetch data");
      res.redirect("/");
    }
  }
);


// POST Create a new local tour
router.post(
  "/create/tours",
  storage({ single: "tourImage" }),
  middleware.isLoggedIn,
  middleware.isAdmin,
  async (req, res) => {
    try {
      const tourData = req.body;

      if (!req.file) {
        throw new Error("Tour image is missing");
      }

      // Extract the form data from the request body
      const {
        tourCode,
        tourName,
        tourAvailable,
        tourEmail,
        tourPhone,
        tourCar,
        tourLicenseNumber,
      } = req.body;

      const tourImage = req.file;
      const imageExtension = path.extname(tourImage.originalname);
      const imageName = `${tourName}${imageExtension}`;

      const directoryPath = path.join(
        __dirname,
        "..", 
        "..", 
        "public",
        "storage",
        "tours"
      );

      const imagePath = path.join(directoryPath, imageName);

      // Create the directory if it doesn't exist
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Move the renamed image to the desired directory
      fs.renameSync(tourImage.path, imagePath);

      // Create a new LocalTour instance
      const newLocalTour = new LocalTour({
        productCode: tourCode,
        imagePath: `/storage/tours/${imageName}`,
        available: tourAvailable === "true", 
        name: tourName,
        contact: {
          email: tourEmail,
          phone: tourPhone,
          car: tourCar,
          licenseNumber: tourLicenseNumber,
        },
      });

      // Save the new local tour to the database
      await newLocalTour.save();
      req.flash("success", "Local tour created successfully");
      res.json({
        success: true,
        message: "Local tours created successfully",
        redirectUrl: `/tour/localtours`,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to create local tour");
      res.json({
        success: true,
        message: "Error: Local tours cannot be created",
        redirectUrl: `/tour/localtours`,
      });
    }
  }
);


//POST: Delete a function Delete a local tour by ID
router.post("/tours/delete",
  async (req, res) => {
    try {
      const idsToDelete = req.body.ids;
      
      // Find the local tour by ID
      const localTour = await LocalTour.findById(idsToDelete);

      // Check if the local tour exists
      if (!localTour) {
        req.flash("error", "Local tour not found");
        return res.redirect("/tour/localtours");
      }

      // Delete the image file from the directory
      console.log(localTour.imagePath);
      const imagePath = path.join(__dirname, "..", "..", "public", localTour.imagePath);
      console.log(imagePath)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Delete the local tour
      await localTour.remove();
      req.flash("success", "Local tour deleted successfully");

      res.status(200).json({
        message: 'Local tour deleted successfully.',
        urlRedirect: `/tour/localtours`
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to delete the local tour");
      res.status(500).json({
        message: `Failed to delete the local tour: ${error}`,
        urlRedirect: `/tour/localtours`
      });
    }
  });





//GET:  Render the edit form
router.get('/edit/:tourId', async (req, res) => {
  
  try {
    
    const tourId = req.params.tourId;
    // Find the market item by ID
      const localTour = await LocalTour.findById(tourId);

    if (!localTour) {
      req.flash("error", "Local Tour item not found");
      return res.redirect("/tour/localtours");
    }

    // Render the edit form with the market item data
    res.render('admin/localTours/editlocalTours', {
      localTour,
      pageName: "Edit Tour List"
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to fetch food item');
    res.redirect('/tour/localtours');
  }
});




//POST: Receive and update the Schema:
router.post('/edit/:tourId', storage({ single: 'tourImage' }), async (req, res) => {
  try {
    const tourId = req.params.tourId;
    const tourData = req.body;

    // Find the market item by ID
    const tourItem = await LocalTour.findById(tourId);
    console.log(tourItem);

    if (!tourItem) {
      req.flash("error", "Local Tour item not found");
      return res.redirect("/tour/localtours/");
    }

    // Update food item data based on the form submission
    /**
     * productCode: tourCode,
        imagePath: `/tours/${imageName}`,
        available: tourAvailable === "true", 
        name: tourName,
        contact: {
          email: tourEmail,
          phone: tourPhone,
          car: tourCar,
          licenseNumber: tourLicenseNumber,
            formData.append('tourCode', document.getElementById('tourCode').value);
  formData.append('tourName', document.getElementById('tourName').value);
  formData.append('tourEmail', document.getElementById('tourEmail').value);
  formData.append('tourPhone', document.getElementById('tourPhone').value);
  formData.append('car', document.getElementById('car').value);
  formData.append('tourAvailability', document.getElementById('tourAvailability').value);
  formData.append('tourLicenseNumber', document.getElementById('tourLicenseNumber').value);
     * 
     * 
     */

    tourItem.productCode = tourData.tourCode;
    tourItem.name = tourData.tourName;
    tourItem.contact.email = tourData.tourEmail;
    tourItem.contact.phone = tourData.tourPhone;
    tourItem.contact.car = tourData.car;
    tourItem.available = tourData.tourAvailability;
    tourItem.licenseNumber = tourData.tourLicenseNumber;

    // Check if a new image is provided in the form
    if (req.file) {
      // Process and save the new image
      const pictureExtension = path.extname(req.file.originalname);
      const pictureName = `${tourData.tourName}${pictureExtension}`;
      const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "tours"
      );


      // Move the renamed image to the desired directory
      const picturePath = path.join(directoryPath, pictureName);
      fs.renameSync(req.file.path, picturePath);

      // Update the imagePath property
      tourItem.imagePath = `/tour/${pictureName}`;
    }

    // Save the updated food item to the database
    await tourItem.save();

    req.flash("success", "Local Tour item updated successfully");
    res.json({
      success: true,
      message: "Local Tour item updated successfully",
      redirectUrl: "/tour/localtours/",
    });
  } catch (error) {

    console.error(error);
    req.flash("error", "Failed to update Local Tour item");
    res.json({
      success: false,
      message: "Error: Local Tour item cannot be updated",
      redirectUrl: "/tour/localtours/",
    });
  }
});






module.exports = router;
