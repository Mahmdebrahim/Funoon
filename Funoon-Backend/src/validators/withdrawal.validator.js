// src/validators/withdrawal.validator.js
const { body } = require("express-validator");

const requestWithdrawalValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 50 })
    .withMessage("Minimum withdrawal amount is 50 SAR")
    .isFloat({ max: 100000 })
    .withMessage("Maximum withdrawal amount is 100,000 SAR"),
];

module.exports = { requestWithdrawalValidator };
