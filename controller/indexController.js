const express = require("express");
// const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Product = require("../../models/market");
const Hotel = require("../../models/hotel");
const RoomType = require("../../models/roomType");
const Room = require("../../models/room");
const Cart = require("../../models/cart");
const Order = require("../../models/order");
const db = require("../../config/dbb");
const middleware = require("../../middleware/confirm");
const router = express.Router();
const { t } = require("../../i18n");

const indexController = {




  getchangelanguagelanggetchangelanguageBylang : (req, res) => {
    const { lang } = req.params;

    // Validate that the requested language is supported
    const supportedLanguages = ["en", "es", "fr", "de"];
    if (supportedLanguages.includes(lang)) {
      // Change the language in the i18next instance
      req.i18n.changeLanguage(lang);
      console.log("Updated language:", lang);
      req.session.lang = lang;
      // Redirect back to the previous page or a specific page
      res.redirect(req.get("referer") || "/");
    } else {
      res.status(404).send("Invalid language");
    }
  },




  getactivateyouraccount : async (req, res, next) => {
    try {
      req.i18n.changeLanguage(req.session.lang);
  
      const lang = req.cookies.lang || req.session.lang || res.locals.lang;
  
      console.log(lang);
  
      const successMsg = req.flash("success")[0];
      const errorMsg = req.flash("error")[0];
      res.render("user/confirm", {
        successMsg,
        errorMsg,
        lang,
        //csrfToken: req.csrfToken(),
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  },





    gethotelsByidroomtypes :  async (req, res) => {
        try {
          const hotel = await Hotel.findById(req.params.id).populate("roomtypes");
          const roomTypes = hotel.roomtypes;
    
          console.log(hotel);
          console.log(roomTypes)
    
          res.render("pages/viewAccomodation", {
            roomTypes,
            hotelName: hotel.name,
            hotel,
          });
        } catch (err) {
          console.error(err);
          res.status(500).send("Server Error");
        }
      },
      gethotelsHotelName : async (req, res) => {
        try {
          let cart;
          let guest;
          let cartItemsCount = 0;
      
          if (req.user) {
            cart = await Cart.findOne({ user: req.user._id });
            guest = await Guest.findOne({ user: req.user._id });
      
            cartItemsCount = cart.items.reduce((acc, item) => acc + item.noRooms, 0);
          }
          if (!req.user || !cart) {
            cart = new Cart({});
          }
          const pay = process.env.PAYSTACK_KEY;
      
          res.render("bookings/hotel", {
            //csrfToken: req.csrfToken(),
            cart: cart,
            pay: pay,
            guest: guest,
          });
        } catch (err) {
          console.log(err.message);
          res.redirect("/");
        }
      },
      getrentals : async (req, res) => {
        try {
          //Queries heere
          res.render("bookings/carR", {
            market: req.t("home:market"),
          });
        } catch (err) {
          console.log(err.message);
          res.redirect("/");
        }
      },
      getmarketplace : async (req, res) => {
        try {
          //code here
          res.render("bookings/market", {});
        } catch (err) {
          console.log(err.message);
          res.redirect("/");
        }
      },
      getfood: async (req, res) => {
        try {
          //code here
          res.render("bookings/food", {});
        } catch (err) {
          console.log(err.message);
          res.redirect("/");
        }
      },
      getattractions:async (req, res) => {
        try {
          //code here
          res.render("bookings/attra", {});
        } catch (err) {
          console.log(err.message);
          res.redirect("/");
        }
      },
};

module.export = indexController;