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
const { t } = require('../../i18n');




    const featureIcons = {
        "TV": "fal fa-tv-retro",
        "Free Wifi": "fal fa-wifi",
        "Air Condition": "fal fa-air-conditioner",
        "Heater": "fal fa-dumpster-fire",
        "Phone": "fal fa-phone-rotary",
        "Laundry": "fal fa-dryer-alt",
        "Adults": "fal fa-user",
        "Size": "fal fa-square",
        "Bed Type": "fal fa-bed"
    };


// Change language route
router.get('/change-language/:lang', (req, res) => {
  const { lang } = req.params;

  // Validate that the requested language is supported
  const supportedLanguages = ['en', 'es', 'fr', 'de'];
  if (supportedLanguages.includes(lang)) {
    // Change the language in the i18next instance
    req.i18n.changeLanguage(lang);
    console.log('Updated language:', lang);
    req.session.lang = lang;
    // Redirect back to the previous page or a specific page
    res.redirect(req.get('referer') || '/');
  } else {
    res.status(404).send('Invalid language');
  }
});




router.get("/", async (req, res) => {

  console.log('this is a session token',req.session.csrfToken);
  // Explicitly set language from session
  req.i18n.changeLanguage(req.session.lang);

  try {
    // const hotels = await Hotel.find({}).populate("roomtypes");

    const hotels = await Hotel.find({}).populate("roomtypes");

    const lang = req.cookies.lang || req.session.lang || res.locals.lang

    const successMsg = req.flash("success")[0];
    const errorMsg = req.flash("error")[0];

// Filter out roomtypes with no available rooms
//const roomTypeNames = hotels.flatMap((hotel) => hotel.roomtypes.map((roomtype) => roomtype._id));

    const roomTypesWithRooms = await Promise.all(
      hotels.flatMap(async (hotel) => {
        const roomTypes = await Promise.all(
          hotel.roomtypes.map(async (roomtype) => {
            const rooms = await Room.find({
              roomType: roomtype._id,
              available: true,
            });
            const roomCount = rooms.length;
            return {
              roomTypeName: roomtype.name,
              roomCount: roomCount,
            };
          })
        );
        return roomTypes;
      })
    );

   const roomTypesWithAvailability = await Promise.all(
      hotels.flatMap(async (hotel) => {
        const roomTypes = await Promise.all(
          hotel.roomtypes.map(async (roomtype) => {
            const rooms = await Room.find({
              roomType: roomtype._id,
              available: true,
            });
            const isAvailable = rooms.length > 0;
            return {
              roomTypeId: roomtype._id,
              isAvailable: isAvailable,
            };
          })
        );
        return roomTypes;
      })
   );
  
    res.render("pages/index", {
      hotels, 
      lang: res.locals.lang,
      market:req.t('home:market'),
      food:req.t('home:food'),
      findYourHolidayRentals: req.t('home:findYourHolidayRentals'),
      introVideo: req.t('home:introVideo'),
      joyOfHome: req.t('home:joyOfHome'),
      findNextStay: req.t('home:findNextStay'),
      searchLowPrices: req.t('home:searchLowPrices'),
      customerSupport: req.t('home:customerSupport'),
      stay: req.t('home:stay'),
      carRentals: req.t('home:carRentals'),
      food: req.t('home:food'),
      attractions: req.t('home:attractions'),
      airportTaxis: req.t('home:airportTaxis'),
      login: req.t('home:login'),
      register: req.t('home:register'),
      checkInDate: req.t('home:checkInDate'),
      checkOutDate: req.t('home:checkOutDate'),
      adults: req.t('home:adults'),
      child: req.t('home:child'),
      room: req.t('home:room'),
      longestHoliday: req.t('home:longestHoliday'),
      browseProperties: req.t('home:browseProperties'),
      findAStay: req.t('home:findAStay'),
      getawayYourWay: req.t('home:getawayYourWay'),
      saveAtLeast15Percent: req.t('home:saveAtLeast15Percent'),
      findDeals: req.t('home:findDeals'),
      trendingApartments: req.t('home:trendingApartments'),
      searchByHotels: req.t('home:searchByHotels'),
      travellersSearching: req.t('home:travellersSearching'),
      getOfferHere: req.t('home:getOfferHere'),
      getBestDeals: req.t('home:getBestDeals'),
      subscriptionEnjoy: req.t('home:subscriptionEnjoy'),
      takeATourOfLuxury: req.t('home:takeATourOfLuxury'),
      ourBlog: req.t('home:ourBlog'),
      latestBlogAndNews: req.t('home:latestBlogAndNews'),
      readMore: req.t('home:readMore'),
      date: req.t('home:date'),
      home: req.t('home:home'),
      aboutUs: req.t('home:aboutUs'),
      services: req.t('home:services'),
      contactUs: req.t('home:contactUs'),
      blog: req.t('home:blog'),
      ourServices: req.t('home:ourServices'),
      faq: req.t('home:faq'),
      support: req.t('home:support'),
      privacy: req.t('home:privacy'),
      termsAndConditions: req.t('home:termsAndConditions'),
      subscribeToNewsletter: req.t('home:subscribeToNewsletter'),
      yourEmail: req.t('home:yourEmail'),
      roomTypesWithAvailability: roomTypesWithAvailability[0],
      featureIcons,
      //csrfToken: req.csrfToken(),
    successMsg, errorMsg});
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});


router.get("/activate-your-account", async (req, res, next) => {
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
});


//routes to display Hotel Data and all its associated routes
router.get("/hotels/:id/roomtypes", middleware.emailVerified, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate("roomtypes");
    const roomTypes = hotel.roomtypes;
    res.render("pages/rooms", { roomTypes, hotelName: hotel.name });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



//Get hoteal view specific hotels 
router.get("/hotels/HotelName",  async (req, res) => {
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


    res.render("bookings/hotel",
      {
        //csrfToken: req.csrfToken(),
        cart: cart,
        pay: pay,
        guest: guest,
      });
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});



//routes to display car rentals  Data and all its associated routes
router.get("/car/rentals", async (req, res) => {
  try {
//Queries heere
    res.render("bookings/car",{

    market:req.t('home:market'),

    

      });
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});



//routes to display car rentals  Data and all its associated routes
router.get("/marketplace", async (req, res) => {
  try {


//code here
    res.render("bookings/market",
      {
     
      });
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});


//routes to display car rentals  Data and all its associated routes
router.get("/attractions", async (req, res) => {
  try {
//code here
    res.render("bookings/attractions",
      {
      
      });
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});






module.exports = router;
