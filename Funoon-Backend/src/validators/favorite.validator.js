const { body } = require("express-validator");

const toggleFavoriteValidator = [
  body("artworkId")
    .notEmpty()
    .withMessage("Artwork ID is required")
    .isMongoId()
    .withMessage("Invalid artwork ID"),
];

module.exports = { toggleFavoriteValidator };
