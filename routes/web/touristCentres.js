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


// View all tourist centres with dropdowns for tour guide and hotel
router.get(
  "/touristcentres",
  middleware.isLoggedIn,
  middleware.isAdmin, touristCenterController.gettouristcenteres);
 



//GET : Create Local Tours 
router.get(
  "/create/centres/",
  middleware.isLoggedIn,
  middleware.isAdmin, touristCenterController.getcreateBycentres);
 

//POST: Create local Tours
router.post(
  "/create/centres",
  storage({ single: "centreImage" }),
  middleware.isLoggedIn,
  middleware.isAdmin,  touristCenterController.postcreateBycentres);
 



// POST: Delete by IDS
router.post("/tourplace/delete",
touristCenterController.posttourplaceBydelete);





//GET:  Render the edit form
router.get('/tourplace/edit/:placeId', 
touristCenterController.gettourplaceByeditBy:placeId);






// POST: Receive and update the Schema:
router.post(
  "/tourplace/edit/:placeId",  touristCenterController.posttourplaceByeditBy:placeId);
  storage({ single: "centreImage" }),
 









module.exports = router;
