// src/validators/subscription.validator.js
const { body } = require("express-validator");

const purchaseSubscriptionValidator = [
  body("planId")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isIn(["opal_classic", "opal_plus", "opal_prestige"])
    .withMessage(
      "Invalid plan. Must be one of: opal_classic, opal_plus, opal_prestige",
    ),
];

module.exports = { purchaseSubscriptionValidator };
