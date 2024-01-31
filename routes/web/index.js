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



const featureIcons = {
  TV: "fal fa-tv-retro",
  "Free Wifi": "fal fa-wifi",
  "Air Condition": "fal fa-air-conditioner",
  Heater: "fal fa-dumpster-fire",
  Phone: "fal fa-phone-rotary",
  Laundry: "fal fa-dryer-alt",
  Adults: "fal fa-user",
  Size: "fal fa-square",
  "Bed Type": "fal fa-bed",
};

// Change language route
router.get("/change-language/:lang", 
indexController.getchange-languageBylang);





router.get("/", 
// indexController.get/);

async (req, res) => {
  console.log("this is a session token", req.session.csrfToken);
  // Explicitly set language from session
  req.i18n.changeLanguage(req.session.lang);

  try {
    // const hotels = await Hotel.find({}).populate("roomtypes");

    const hotels = await Hotel.find({}).populate("roomtypes");

    const lang = req.cookies.lang || req.session.lang || res.locals.lang;

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


    // <%= t('home:food') %> ---//

    res.render("pages/index", {
      hotels,
      lang: res.locals.lang,
      market: req.t("home:market"),
      food: req.t("home:food"),
      findYourHolidayRentals: req.t("home:findYourHolidayRentals"),
      introVideo: req.t("home:introVideo"),
      joyOfHome: req.t("home:joyOfHome"),
      findNextStay: req.t("home:findNextStay"),
      searchLowPrices: req.t("home:searchLowPrices"),
      customerSupport: req.t("home:customerSupport"),
      stay: req.t("home:stay"),
      carRentals: req.t("home:carRentals"),
      food: req.t("home:food"),
      attractions: req.t("home:attractions"),
      airportTaxis: req.t("home:airportTaxis"),
      login: req.t("home:login"),
      register: req.t("home:register"),
      checkInDate: req.t("home:checkInDate"),
      checkOutDate: req.t("home:checkOutDate"),
      adults: req.t("home:adults"),
      child: req.t("home:child"),
      room: req.t("home:room"),
      longestHoliday: req.t("home:longestHoliday"),
      browseProperties: req.t("home:browseProperties"),
      findAStay: req.t("home:findAStay"),
      getawayYourWay: req.t("home:getawayYourWay"),
      saveAtLeast15Percent: req.t("home:saveAtLeast15Percent"),
      findDeals: req.t("home:findDeals"),
      trendingApartments: req.t("home:trendingApartments"),
      searchByHotels: req.t("home:searchByHotels"),
      travellersSearching: req.t("home:travellersSearching"),
      getOfferHere: req.t("home:getOfferHere"),
      getBestDeals: req.t("home:getBestDeals"),
      subscriptionEnjoy: req.t("home:subscriptionEnjoy"),
      takeATourOfLuxury: req.t("home:takeATourOfLuxury"),
      ourBlog: req.t("home:ourBlog"),
      latestBlogAndNews: req.t("home:latestBlogAndNews"),
      readMore: req.t("home:readMore"),
      date: req.t("home:date"),
      home: req.t("home:home"),
      aboutUs: req.t("home:aboutUs"),
      services: req.t("home:services"),
      contactUs: req.t("home:contactUs"),
      blog: req.t("home:blog"),
      ourServices: req.t("home:ourServices"),
      faq: req.t("home:faq"),
      support: req.t("home:support"),
      privacy: req.t("home:privacy"),
      termsAndConditions: req.t("home:termsAndConditions"),
      subscribeToNewsletter: req.t("home:subscribeToNewsletter"),
      yourEmail: req.t("home:yourEmail"),
      roomTypesWithAvailability: roomTypesWithAvailability[0],
      featureIcons,
      successMsg,
      errorMsg,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
},




router.get("/activate-your-account", 
indexController.getactivateyouraccount);



//routes to display Hotel Data and all its associated routes
router.get(
  "/hotels/:id/roomtypes",
  middleware.emailVerified,
  indexController.gethotelsByidroomtypes);





//Get hotel view specific hotels
router.get("/hotels/HotelName", 
indexController.gethotelsHotelName);




//routes to display car rentals  Data and all its associated routes
router.get("/rentals", 
indexController.getrentals);




//routes to display car rentals  Data and all its associated routes
router.get("/marketplace",
indexController.getmarketplace);


router.get("/food", 
indexController.getfood);


//routes to display car rentals  Data and all its associated routes
router.get("/attractions", 
indexController.getattractions);








module.exports = router;
