const express = require("express");
const middleware = require("../../middleware/confirm");
const storage = require("../../middleware/storage");
const fs = require("fs");
const marketController = require("../../controller/marketsController");
const router = express.Router();


// View all market items with dropdown for category
router.get("/marketitems",middleware.isLoggedIn,middleware.isAdmin, 
marketController.getmarketitems);
// GET Create a new hotel
router.get("/create/products",middleware.isLoggedIn,middleware.isAdmin, 
marketController.getCreateProducts);
// Create a new market item
router.post("/create/products", storage({ single: 'productPicture' }), 
marketController.postCreateProducts);
//GET:  Render the edit form
router.get('/edit/products/:productId',
marketController.geteditproductsByproductId);




//POST: Receive and update the Schema:
router.post('/edit/products/:productId', storage({ single: 'productPicture' }), 
marketController.posteditproductByproductId);




// Get a specific market item by ID
router.get("/marketitems/:id",
marketController.getmarketitemsByid);




// Delete a category by ID
router.post("/products/delete", marketController.postDeleteProducts);









module.exports = router;

