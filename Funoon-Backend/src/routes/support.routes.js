const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const {
  createContactMessage,
  getSupportTickets,
  updateTicketStatus,
} = require("../controllers/support.controller");

const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "تم تجاوز الحد المسموح من الرسائل — حاول مرة أخرى لاحقاً.",
  },
});

router.post("/", supportLimiter, createContactMessage);

router.use(protect, restrictTo("admin"));
router.get("/", getSupportTickets);
router.patch("/:id", updateTicketStatus);

module.exports = router;
