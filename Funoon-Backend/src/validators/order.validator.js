const { body } = require('express-validator');

const checkoutValidator = [
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street name is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
];

module.exports = {
  checkoutValidator,
};
