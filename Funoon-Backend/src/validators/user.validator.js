const { body } = require("express-validator");

const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\s-]{7,15}$/)
    .withMessage("Please enter a valid phone number"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
];

const updateBankDetailsValidator = [
  body("iban")
    .notEmpty()
    .withMessage("IBAN is required")
    .matches(/^SA\d{22}$/)
    .withMessage("Invalid Saudi IBAN format. Must be SA + 22 digits"),

  body("bankName").notEmpty().withMessage("Bank name is required").trim(),

  body("accountHolder")
    .notEmpty()
    .withMessage("Account holder name is required")
    .trim(),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  updateBankDetailsValidator,
};
