const { body } = require("express-validator");

// Create artwork validation
const createArtworkValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 1 })
    .withMessage("Price must be at least 1 SAR"),

  body("weight")
    .notEmpty()
    .withMessage("Weight is required")
    .isFloat({ min: 0.1 })
    .withMessage("Weight must be at least 0.1 KG"),

  body("dimensions.width")
    .notEmpty()
    .withMessage("Width is required")
    .isFloat({ min: 0.1 })
    .withMessage("Width must be greater than 0"),

  body("dimensions.height")
    .notEmpty()
    .withMessage("Height is required")
    .isFloat({ min: 0.1 })
    .withMessage("Height must be greater than 0"),

  body("dimensions.depth")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Depth cannot be negative"),

  body("category")
    .optional()
    .isIn([
      "painting",
      "drawing",
      "photography",
      "digital",
      "sculpture",
      "mixed",
      "other",
    ])
    .withMessage("Invalid category"),

  body("medium")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Medium cannot exceed 100 characters"),

  body("tags")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        } catch {
          throw new Error("Tags must be a valid JSON array");
        }
      } else if (!Array.isArray(value)) {
        throw new Error("Tags must be an array");
      }
      return true;
    }),
];

// Update artwork validation (all fields optional)
const updateArtworkValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Price must be at least 1 SAR"),

  body("weight")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Weight must be at least 0.1 KG"),

  body("dimensions.width")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Width must be greater than 0"),

  body("dimensions.height")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Height must be greater than 0"),

  body("dimensions.depth")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Depth cannot be negative"),

  body("category")
    .optional()
    .isIn([
      "painting",
      "drawing",
      "photography",
      "digital",
      "sculpture",
      "mixed",
      "other",
    ])
    .withMessage("Invalid category"),

  body("medium")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Medium cannot exceed 100 characters"),

  body("tags")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        } catch {
          throw new Error("Tags must be a valid JSON array");
        }
      } else if (!Array.isArray(value)) {
        throw new Error("Tags must be an array");
      }
      return true;
    }),
];

module.exports = {
  createArtworkValidator,
  updateArtworkValidator,
};
