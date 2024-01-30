const express = require("express");
const router = express.Router();
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user");

const middleware = require("../../middleware/confirm");
const userController = require("../../controller/userController");

// function to generate Token
function generateToken() {
  return require("crypto").randomBytes(20).toString("hex");
}

const {
  userSignUpValidationRules,
  userSignInValidationRules,
  validateSignup,
  validateSignin,
} = require("../../middleware/validator");

const {
  sendPasswordResetEmailInBackground,
  sendVerificationEmailInBackground,
} = require("../../worker/workers");

//send a verification email
async function sendVerificationEmail(email) {
  // Check if the user exists in the database
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User does not exist");
  }

  // Generate a new token and save it to the user's record in the database
  const token = generateToken();
  user.emailVerificationToken = token;
  user.emailVerificationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ); // Token expires in 24 hours
  await user.save();

  // Send the verification email to the user
  await sendVerificationEmailInBackground(token, email, user.username);
}

// Authentication Utilities
router.post("/forgot", userController.postForgotPassword);
router.get("/reset/:token", userController.getResetToken);
router.post("/reset/:token", userController.postResetToken);
router.get("/verify/:token", userController.getVerifiedToken);
router.get("/activate-your-account", userController.getActivateAccount);
router.get("/verification-success", userController.getVerificationSuccess);
router.get("/request-password",middleware.isNotLoggedIn,userController.getForgotPassword);
router.get("/resend-verification-email",middleware.isLoggedIn,userController.getResendVerificationEmail);


//Users Authentications
router.get("/register", userController.getUserRegister);
router.post("/signup",[middleware.isNotLoggedIn, userSignUpValidationRules(), validateSignup,
    middleware.emailVerified,passport.authenticate("local.signup", {
      successRedirect: "/user/activate-your-account",failureRedirect: "/user/register",
      failureFlash: true,successFlash: true,}),],userController.postUserRegister);
router.get("/login", middleware.isNotLoggedIn, userController.getUserLogin);
router.post("/signin",[middleware.isNotLoggedIn,userSignInValidationRules(),validateSignin,
    passport.authenticate("local.signin", {failureRedirect: "/user/login",failureFlash: true,
    }),
  ],
  userController.postUserLogin
);

//User Adminitrations
router.get("/profile", middleware.isLoggedIn, userController.getUserProfile);
router.get("/account", middleware.isLoggedIn, userController.getUserAccount);
router.get("/bookings", middleware.isLoggedIn, userController.getUserBookings);
router.get(
  "/notifications",
  middleware.isLoggedIn,
  userController.getUserNotification
);
router.get(
  "/preference",
  middleware.isLoggedIn,
  userController.getUserPreference
);
router.get("/security", middleware.isLoggedIn, userController.getUserSecurity);
router.get("/payments", middleware.isLoggedIn, userController.getUserPayment);
router.get("/logout", middleware.isLoggedIn, userController.getUserLogout);




module.exports = router;
