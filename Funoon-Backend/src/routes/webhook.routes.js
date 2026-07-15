// src/routes/webhook.routes.js
const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");

// Moyasar webhook (no auth - verified by signature)
router.post("/moyasar", orderController.handleMoyasarWebhook);

module.exports = router;
