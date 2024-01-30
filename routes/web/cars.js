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
  middleware.isAdmin,carsController.getcarrental);

 


//GET create-car rentals form
router.get(
  "/create/car-rentals",
  middleware.isLoggedIn,
  middleware.isAdmin, carsController.getcreateBycar-rentals);

  getcreateBycar-rentals ; async (req, res) => {
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
  },


//POST Create car Rebtals
router.post(
  "/create/carRentals",
  storage({ single: "carImage" }),
  middleware.isLoggedIn,
  middleware.isAdmin, 
 carsController. postcreateBycarRentals);


// Delete a food item by ID
router.post("/car/delete", 
carsController.postcarBydelete);





//GET:  Render the edit form
router.get('/edit/:carId', 
carsController.geteditbycarId);






// POST: Receive and update the Schema:
router.post('/edit/:carId', storage({ single: 'carImage' }), 
carsController.postediyBycarId);











module.exports = router;
