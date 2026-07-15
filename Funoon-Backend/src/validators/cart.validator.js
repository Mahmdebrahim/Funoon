const { body } = require("express-validator");

const addToCartValidator = [
  body("artworkId")
    .notEmpty()
    .withMessage("Artwork ID is required")
    .isMongoId()
    .withMessage("Invalid artwork ID"),
];

module.exports = { addToCartValidator };
