// src/validators/admin-withdrawal.validator.js
const { body } = require("express-validator");

const approveWithdrawalValidator = []; // No body required

const markPaidWithdrawalValidator = [
  body("transferReference")
    .notEmpty()
    .withMessage("Transfer reference is required")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Transfer reference must be 5-100 characters"),
];

const rejectWithdrawalValidator = [
  body("reason")
    .notEmpty()
    .withMessage("Rejection reason is required")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be 10-500 characters"),
];

module.exports = {
  approveWithdrawalValidator,
  markPaidWithdrawalValidator,
  rejectWithdrawalValidator,
};
