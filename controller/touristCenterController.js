const express = require("express");
const Hotel = require("../../models/hotel");
const TourGuide = require("../../models/localTour");
const TouristCentre = require("../../models/touristCentre");
const middleware = require("../../middleware/confirm");
const mongoose = require("mongoose");

const storage = require("../../middleware/storage");
const fs = require("fs");
const path = require("path");


//Declare your CRUD your Route
const router = express.Router();

const touristCenterController = {
    gettouristcenteres :  async (req, res) => {
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
    
          res.render("admin/touristCentres/touristCentres", {
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
      },
      getcreatecentres :  async (req, res) => {

        const successMsg = req.flash("success")[0];
        const errorMsg = req.flash("error")[0];
    
        try {
          const touristcentres = await TouristCentre.find({});
          const hotels = await Hotel.find({});
          const tourGuides = await TourGuide.find({});
    
          res.render("admin/touristCentres/createtouristCentres", {
            pageName: "Create Tours Centres",
            successMsg,
            errorMsg,
            touristcentres,
            hotels,
            tourGuides,
          });
        } catch (err) {
          console.error(err);
          req.flash("error", "Failed to fetch data");
          res.redirect("/");
        }
      },
      
      postcreatecentres:  async (req, res) => {
        try {
    
          //const centreData = req.body;
    
          if (!req.file) {
            throw new Error("Centre picture is missing");
          }
    
          // Extract the form data from the request body
          const {
            centreCode,
            centreName,
            centreDescription,
            centreLocation,
            centreAdmissionFee,
            requiresTourGuide,
            centreTourGuide,
            centreHotel,
            centreAvailable,
          } = req.body;
    
          const centrePicture = req.file;
          const pictureExtension = path.extname(centrePicture.originalname);
          const pictureName = `${centreName}${pictureExtension}`;
    
          const directoryPath = path.join(
            __dirname,
            "..", // Adjust the relative path here based on your project structure
            "..", // Go up one more level to the main project directory
            "public",
            "storage",
            "centres"
          );
    
          const picturePath = path.join(directoryPath, pictureName);
    
          // Create the directory if it doesn't exist
          if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
          }
    
          // Move the renamed image to the desired directory
          fs.renameSync(centrePicture.path, picturePath);
    
          // Convert tour guide and hotel values to ObjectId
          const tourGuideObjectId = mongoose.Types.ObjectId(centreTourGuide);
          const hotelObjectId = mongoose.Types.ObjectId(centreHotel);
    
          const imagePath = `/storage/centres/${pictureName}`;
    
          // Create a new TouristCentre instance
          const newTouristCentre = new TouristCentre({
            productCode: centreCode,
            name: centreName,
            description: centreDescription,
            location: centreLocation,
            admissionFee: centreAdmissionFee,
            requiresTourGuide: requiresTourGuide === "true", // Convert string to boolean
            tourGuide: tourGuideObjectId,
            available: centreAvailable === "true", // Convert string to boolean
            hotel: hotelObjectId,
            imagePath: imagePath,
          });
    
          // Save the new tourist centre to the database
          await newTouristCentre.save();
          req.flash("success", "Tourist centre created successfully");
          res.json({
            success: true,
            message: "Tourist centre created successfully",
            redirectUrl: `/places/touristCentres`,
          });
        } catch (error) {
          console.error(error);
          req.flash("error", "Failed to create tourist centre");
          res.json({
            success: false,
            message: "Error: Tourist centre cannot be created",
            redirectUrl: `/places/touristCentres`,
          });
        }
      },
      posttourplacedelete: async (req, res) => {
        try {
          const idsToDelete = req.body.ids;
      
          // Find the room by ID
          const centreItem = await TouristCentre.findOneAndDelete({ _id: idsToDelete });
      
          //check of food exists
          if (!centreItem) {
            req.flash("error", "Car Items not Found . . .");
            return res.redirect(`/places/touristcentres/`);
          }
      
          // Delete the associated image
          const imagePath = path.join(
            __dirname,
            "..",
            "..",
            "public",
            centreItem.imagePath
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
            urlRedirect: `/places/touristcentres/`,
          });
      
        } catch (error) {
          console.error(error);
          req.flash("error", "Failed to delete the food item");
          res.status(500).json({
            message: `Failed to delete the food item ${error}`,
            urlRedirect: `/places/touristcentres/`,
          });
        }
      },


      gettourplaceeditByplaceId:  async (req, res) => {

        try {
      
          const placeId = req.params.placeId;
      
          // Find the market item by ID
          const tourPlaces = await TouristCentre.findById(placeId);
          const tourGuides = await TourGuide.find();
          const hotels = await Hotel.find();
      
          console.log(tourPlaces);
      
          if (!tourPlaces) {
            req.flash("error", "Tour places item not found");
            return res.redirect("/places/touristcentres/");
          }
      
          // Render the edit form with the market item data
          res.render("admin/touristCentres/edittouristCentres", {
            tourPlaces,
            hotels,
            tourGuides,
            pageName: "Edit Car List",
          });
        } catch (error) {
          console.error(error);
          req.flash('error', 'Failed to fetch food item');
          res.redirect("/places/touristcentres/");
        }
      },

      posttourplaceeditByplaceId:  async (req, res) => {
        try {
    
          const placeId = req.params.placeId;
          const tourplaceData = req.body;
    
          console.log(tourplaceData);
    
          // Find the car by ID
          const tourplaces = await TouristCentre.findById(placeId);
    
          if (!tourplaces) {
            req.flash("error", "Car item not found");
            return res.redirect("/places/touristCentres");
          }
    
          const tourGuideObjectId = mongoose.Types.ObjectId(
            tourplaceData.centreTourGuide
          );
          const hotelObjectId = mongoose.Types.ObjectId(tourplaceData.centreHotel);
    
          tourplaces.productCode = tourplaceData.centreCode;
          tourplaces.name = tourplaceData.centreName;
          tourplaces.description = tourplaceData.centreDescription;
          tourplaces.location = tourplaceData.centreLocation;
          tourplaces.admissionFee = tourplaceData.centreAdmissionFee;
          tourplaces.requiresTourGuide = tourplaceData.requiresTourGuide === "true";
          tourplaces.available = tourplaceData.centreAvailable === "true";
          tourplaces.tourGuide = tourGuideObjectId;
          tourplaces.hotel = hotelObjectId;
    
          // Check if a new image is provided in the form
          if (req.file) {
            // Process and save the new image
            const pictureExtension = path.extname(req.file.originalname);
            const pictureName = `${tourplaceData.centreName}${pictureExtension}`;
    
            const directoryPath = path.join(
              __dirname,
              "..", // Adjust the relative path here based on your project structure
              "..", // Go up one more level to the main project directory
              "public",
              "storage",
              "centres"
            );
    
            // Move the renamed image to the desired directory
            const picturePath = path.join(directoryPath, pictureName);
            fs.renameSync(req.file.path, picturePath);
            // Update the imagePath property
            tourplaces.imagePath = `/storage/centres/${pictureName}`;
          }
    
          // Save the updated car item to the database
          await tourplaces.save();
    
          req.flash("success", "Tour Places item updated successfully");
          res.json({
            success: true,
            message: "Tour Places item updated successfully",
            redirectUrl: "/places/touristCentres/",
          });
        } catch (error) {
          console.error(error);
          req.flash("error", "Failed to update Tour Places item");
          res.json({
            success: false,
            message: "Error: Tour Places item cannot be updated",
            redirectUrl: "/places/touristCentres/",
          });
        }
      },

};

module.export = touristCenterController;