const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  updateProfileValidator,
  changePasswordValidator,
  updateBankDetailsValidator,
} = require("../validators/user.validator");
//══════════════════════════════════════════════════════════════════════════════

// Public Routes
router.get("/public/:userId", userController.getPublicProfile);


// Protected Routes (All require authentication)
router.use(protect); // All routes below require authentication

// Profile
router.get("/profile", userController.getProfile);

router.put(
  "/profile",
  updateProfileValidator,
  validate,
  userController.updateProfile,
);

// Avatar
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);
router.post(
  "/cover-image",
  protect,
  upload.single("coverImage"),
  userController.uploadCoverImage,
);
router.delete("/cover-image", protect, userController.deleteCoverImage);
// Password
router.post(
  "/change-password",
  changePasswordValidator,
  validate,
  userController.changePassword,
);

// Bank Details (Artists only)
router.put(
  "/bank-details",
  updateBankDetailsValidator,
  validate,
  userController.updateBankDetails,
);

// Delete Account
router.delete("/account", userController.deleteAccount);

// Address endpoints
router.put("/address", protect, userController.updateAddress);
router.get("/address", protect, userController.getAddress);
router.post("/address/lookup", protect, userController.lookupAddress);

module.exports = router;
