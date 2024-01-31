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


const marketsController = {

    getmarketitems :  async (req, res) => {
        const successMsg = req.flash("success")[0];
        const errorMsg = req.flash("error")[0];
    
        try {
          // Fetch all market items with populated category reference
          const marketItems = await MarketItem.find({}).populate("category").populate("hotel");
    
          res.render("admin/market/markets", {
            marketItems,
            successMsg,
            errorMsg,
            pageName: "Market Item Lists",
              });
        } catch (err) {
          console.error(err);
          req.flash("error", "Failed to fetch market item data");
          res.redirect("/");
        }
      },

      getcreateBymarket :  async(req, res) => {
        const successMsg = req.flash("success")[0];
        const errorMsg = req.flash("error")[0];
        
        const hotels = await Hotel.find({});
        const categories = await Category.find({});
    
        try {
    
           res.render("admin/market/createProduct", {
             pageName: "Create Hotel",
             successMsg,
             errorMsg,
             hotels,
             categories,
             url: process.env.HOST,
           });
        } catch (err) {
          console.error(err);
          req.flash("error", "Failed to fetch market item data");
          res.redirect("/");
        }
      },

      postcreateproduct :async (req, res) => {
        try {
        
        const productData = req.body;
        
        if (!req.file) {
        throw new Error("Product picture is missing");
        }
        
        //Extract the form data from the request body
        const {
        productCode,
        productName,
        productDescription,
        quantityProduct,
        price,
        category,
        manufacturer,
        available,
        hotel,
        } = req.body;
        
        const productPicture = req.file;
        const pictureExtension = path.extname(productPicture.originalname);
        const pictureName = `${productName}${pictureExtension}`;
        
        const directoryPath = path.join(
        __dirname,
        "..", // Adjust the relative path here based on your project structure
        "..", // Go up one more level to the main project directory
        "public",
        "storage",
        "market"
        );
        
        const picturePath = path.join(directoryPath, pictureName);
        
        // Create the directory if it doesn't exist
        if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
        }
        
        // Move the renamed image to the desired directory
        fs.renameSync(productPicture.path, picturePath);
        
        // Convert hotel value to ObjectId
        const categoryObjectId = mongoose.Types.ObjectId(category);
        const hotelObjectId = mongoose.Types.ObjectId(hotel);
        
        newimagePath = `/storage/market/${pictureName}`;
        
        // Create a new MarketItem instance
        const newMarketItem = new MarketItem({
        productCode,
        price,
        manufacturer,
        available,
        quantity:quantityProduct,
        name: productName,
        imagePath:newimagePath,
        description: productDescription,
        category: categoryObjectId,
        hotel: hotelObjectId,
        available: true,
        });
        
        // Save the new market item to the database
        await newMarketItem.save();
        req.flash("success", "Market item created successfully");
        res.json({
        success: true,
        message: "Hotels created successfully",
        redirectUrl: `/market/marketitems`,
        });
        } catch (error) {
        console.error(error);
        req.flash("error", "Failed to create market item");
        res.json({
        success: true,
        message: "Error: Hotels cannot be created",
        redirectUrl: `/market/marketitems`,
        });
        }
        },
        geteditproductsByproductId: async (req, res) => {
            try {
              const productId = req.params.productId;
          
              // Find the market item by ID
              const marketItem = await MarketItem.findById(productId).populate("hotel").populate("category");
              const hotels = await Hotel.find();
              const categories = await Category.find();
          
              if (!marketItem) {
                req.flash('error', 'Market item not found');
                return res.redirect('/market/marketitems');
              }
          
              // Render the edit form with the market item data
              res.render('admin/market/editProduct', {
                marketItem,
                hotels,
                categories,
                pageName: "Edit Product List"
              });
            } catch (error) {
              console.error(error);
              req.flash('error', 'Failed to fetch market item');
              res.redirect('/market/marketitems');
            }
          },

          posteditproductByproductId : async (req, res) => {
            try {
              const productId = req.params.productId;
              const productData = req.body;
          
              // Find the market item by ID
              const marketItem = await MarketItem.findById(productId);
          
              if (!marketItem) {
                req.flash('error', 'Market item not found');
                return res.redirect('/market/marketitems');
              }
          
              // Update market item data based on the form submission
              marketItem.productCode = productData.productCode;
              marketItem.price = productData.price;
              marketItem.manufacturer = productData.manufacturer;
              marketItem.available = true;
              marketItem.quantity = productData.quantityProduct;
              marketItem.name = productData.productName;
              marketItem.description = productData.productDescription;
              marketItem.category = mongoose.Types.ObjectId(productData.category);
              marketItem.hotel = mongoose.Types.ObjectId(productData.hotel);
          
              // Check if a new image is provided in the form
              if (req.file) {
                // Process and save the new image
                const pictureExtension = path.extname(req.file.originalname);
                const pictureName = `${productData.productName}${pictureExtension}`;
                const directoryPath = path.join(
                __dirname,
                "..", // Adjust the relative path here based on your project structure
                "..", // Go up one more level to the main project directory
                "public",
                "market"
                  );
                
                const picturePath = path.join(directoryPath, pictureName);
                // Move the renamed image to the desired directory
                fs.renameSync(req.file.path, picturePath);
          
                // Update the imagePath property
                marketItem.imagePath = `/market/${pictureName}`;
              }
          
              // Save the updated market item to the database
              await marketItem.save();
          
              req.flash('success', 'Market item updated successfully');
              res.json({
                success: true,
                message: 'Market item updated successfully',
                redirectUrl: '/market/marketitems',
              });
            } catch (error) {
              console.error(error);
              req.flash('error', 'Failed to update market item');
              res.json({
                success: false,
                message: 'Error: Market item cannot be updated',
                redirectUrl: '/market/marketitems',
              });
            }
          },

          getmarketitemsByid :async (req, res) => {
            try {
              const marketItem = await MarketItem.findById(req.params.id).populate(
                "category"
              );
              if (!marketItem) {
                req.flash("error", "Market item not found");
                return res.status(404).json({ error: "Market item not found" });
              }
              res.json(marketItem);
            } catch (error) {
              console.error(error);
              req.flash("error", "Failed to fetch market item data");
              res.status(500).json({ error: "Internal Server Error" });
            }
          },

          postproductsdelete :  async (req, res) => {
            try {
              //const catId = req.params.roomId;
              const idsToDelete = req.body.ids;
              // Find the room by ID
        
              // Use deleteMany to delete MarketItems by their IDs
              const marketItem = await MarketItem.findOneAndDelete({ _id: idsToDelete });
        
              //check of category exists
              if (!marketItem) {
                req.flash("error", "Product not Found . . .");
                return res.redirect(`/market/marketitems/`);
              }
        
              // Delete the associated image
              const imagePath = path.join(
                __dirname,
                "..",
                "..",
                "public",
                marketItem.imagePath
              );
        
              try {
                await fs.promises.unlink(imagePath);
                console.log(`Image deleted successfully: ${imagePath}`);
              } catch (imageDeleteError) {
                console.error(`Failed to delete image: ${imagePath}`, imageDeleteError);
              }
        
              req.flash("success", "MarketItems deleted successfully");
              res.status(200).json({
                message: "Products  deleted successfully.",
                urlRedirect: `/market/marketitems/`,
              });
            } catch (error) {
              console.error(error);
              console.log(error)
              req.flash("error", "Failed to delete the category");
              res.status(500).json({
                message: `Failed to delete the Products ${error}`,
                urlRedirect: `/admin/categories/`
              });
            }
          },

};

module.export = marketsController;