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
  middleware.isAdmin,  localToursController.getlocaltours);
 



//GET : Create Local Tours 
router.get(
  "/create/local-tour",
  middleware.isLoggedIn,
  middleware.isAdmin, localToursController.getcreateBylocal-tour);



// POST Create a new local tour
router.post(
  "/create/tours",
  storage({ single: "tourImage" }),
  middleware.isLoggedIn,
  middleware.isAdmin, localToursController.postcreateBytours);

//POST: Delete a function Delete a local tour by ID
router.post("/tours/delete", 
localToursController.posttoursBydelete);





//GET:  Render the edit form
router.get('/edit/:tourId',
localToursController.geteditBytourId);





//POST: Receive and update the Schema:
router.post('/edit/:tourId', storage({ single: 'tourImage' }), 
localToursController.posteditBytourId);







module.exports = router;
