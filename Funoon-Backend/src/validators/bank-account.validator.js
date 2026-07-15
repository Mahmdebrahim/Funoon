// src/validators/bank-account.validator.js
const { body } = require("express-validator");

const setBankAccountValidator = [
  body("accountHolder")
    .notEmpty()
    .withMessage("Account holder name is required")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Account holder name must be 3-100 characters"),

  body("iban")
    .notEmpty()
    .withMessage("IBAN is required")
    .trim()
    .toUpperCase()
    .matches(/^SA\d{22}$/)
    .withMessage("Invalid Saudi IBAN format (SA + 22 digits)"),

  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Bank name must be 2-100 characters"),
];

module.exports = { setBankAccountValidator };
