const express = require("express");
const router = express.Router();
const {
  getMyWallet,
  getMyTransactions,
} = require("../controllers/wallet.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

router.use(protect);
router.use(restrictTo("artist"));

router.get("/", getMyWallet);
router.get("/transactions", getMyTransactions);

module.exports = router;
