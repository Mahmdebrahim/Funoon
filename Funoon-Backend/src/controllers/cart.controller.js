// cart.controller.js
const Cart = require("../models/Cart");
const Artwork = require("../models/Artwork");
const User = require("../models/User");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const messages = require("../utils/messages.ar");

/**
 * ✅ SHIPPING COST = 0 في الـ cart
 * الشحن الحقيقي بيتحسب في الـ checkout من OTO
 */
const calculateShippingCost = (artwork, artistPlan) => {
  return 0;
};

// @desc    Get current user's cart with summary
// @route   GET /api/v1/cart
// @access  Private
const getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  await cart.cleanInvalidItems();

  await cart.populate([
    { path: "items.artwork" },
    { path: "items.artist", select: "name email subscription" },
  ]);

  cart.items = cart.items.filter((item) => !item.artist?.isBanned);
  await cart.save();

  let subtotal = 0;

  const responseItems = cart.items.map((item) => {
    const currentPrice = item.artwork.price;
    subtotal += currentPrice;

    return {
      artwork: {
        _id: item.artwork._id,
        title: item.artwork.title,
        coverImage: item.artwork.coverImage,
        price: currentPrice,
        dimensions: item.artwork.dimensions,
        shippingType: item.artwork.shippingType,
        weight: item.artwork.weight, 
      },
      artist: {
        _id: item.artist._id,
        name: item.artist.name,
        city: item.artist.address?.city,
      },
      priceSnapshot: currentPrice,
      shippingCost: 0, 
      shippingType: item.artwork.shippingType,
    };
  });

  return ApiResponse.success(
    res,
    {
      items: responseItems,
      summary: {
        subtotal,
        totalShipping: 0, // ✅ الشحن بيتحسب في checkout
        total: subtotal,
      },
    },
    "Retrieved cart successfully",
  );
});

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
const addToCart = catchAsync(async (req, res, next) => {
  const { artworkId } = req.body;
  if (req.user.isBanned) {
    throw new ForbiddenError("حسابك محظور");
  }
  if (!artworkId) {
    throw new BadRequestError("Artwork ID is required");
  }

  const artwork = await Artwork.findById(artworkId).populate("artist");
  if (!artwork || !artwork.isActive || artwork.isSold) {
    throw new NotFoundError(messages.ARTWORK.NOT_FOUND);
  }

  const artist = artwork.artist;
  if (!artist || !artist.hasActiveSubscription()) {
    throw new BadRequestError(messages.ARTWORK.NO_ACTIVE_SUBSCRIPTION);
  }

  if (artist._id.toString() === req.user._id.toString()) {
    throw new BadRequestError("Cannot add your own artwork to the cart");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const exists = cart.items.some(
    (item) => item.artwork.toString() === artworkId,
  );
  if (exists) {
    throw new BadRequestError("Artwork is already in your cart");
  }

  if (cart.items.length >= 10) {
    throw new BadRequestError("Cart cannot exceed 10 items");
  }

  cart.items.push({
    artwork: artwork._id,
    artist: artist._id,
    priceSnapshot: artwork.price,
    shippingCost: 0, 
    shippingType: artwork.shippingType,
  });

  await cart.save();

  return ApiResponse.success(res, cart, "Item added to cart successfully");
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:artworkId
// @access  Private
const removeFromCart = catchAsync(async (req, res, next) => {
  const { artworkId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.artwork.toString() !== artworkId,
  );
  await cart.save();

  return ApiResponse.success(res, cart, "Item removed from cart successfully");
});

// @desc    Clear all items from cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return ApiResponse.success(res, null, "Cart cleared successfully");
});

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  calculateShippingCost,
};


