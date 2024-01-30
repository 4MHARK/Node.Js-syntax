const express = require("express");
const Hotel = require("../../models/hotel");
const MarketItem = require("../../models/market");
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const Category = require("../../models/category");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const router = express.Router();



// View all market items with dropdown for category
router.get(
  "/marketitems",
  middleware.isLoggedIn,
  middleware.isAdmin, marketController.getmarketitems);




// GET Create a new hotel
router.get(
  "/create/products",
  middleware.isLoggedIn,
  middleware.isAdmin, marketController.getcreateBymarket);
 



// Create a new market item
router.post("/create/products",
storage({ single: 'productPicture' }), marketController.postcreateByproduct);



//GET:  Render the edit form
router.get('/edit/products/:productId',
marketController.geteditByproductsBy:productId);




//POST: Receive and update the Schema:
router.post('/edit/products/:productId', storage({ single: 'productPicture' }), 
marketController.posteditByproductBy:productId);




// Get a specific market item by ID
router.get("/marketitems/:id",
marketController.getmarketitemsBy:id);




// Delete a category by ID
router.post("/products/delete", marketController.postproductsBydelete);









module.exports = router;

