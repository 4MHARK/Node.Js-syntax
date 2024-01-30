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















    gethotelsByidByroomtypes :  async (req, res) => {
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
      gethotelsByHotelName : async (req, res) => {
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