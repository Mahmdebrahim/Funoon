


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
    .isFloat({ min: 1, max: 5000 })
    .withMessage("سعر اللوحة يجب أن يكون بين 1 و 5,000 ر.س (حد أقصى مؤقت للمرحلة الحالية)"),

  body("weight")
    .notEmpty()
    .withMessage("Weight is required")
    .isFloat({ min: 0.1 })
    .withMessage("Weight must be at least 0.1 KG"),

  // ✅ validator واحد بيتعامل مع JSON string أو object
  body("dimensions").custom((value, { req }) => {
    // في الـ update، dimensions اختياري
    if (value === undefined && req.method === "PUT") return true;
    if (!value) throw new Error("Dimensions are required");

    let dims;
    try {
      dims = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
      throw new Error("Invalid dimensions format");
    }

    if (!dims.width || Number(dims.width) <= 0)
      throw new Error("Width is required and must be greater than 0");
    if (!dims.height || Number(dims.height) <= 0)
      throw new Error("Height is required and must be greater than 0");
    if (dims.depth !== undefined && Number(dims.depth) < 0)
      throw new Error("Depth cannot be negative");

    return true;
  }),

  body("category")
    .optional()
    .isIn([
      "فن البورتريه",
      "فن المناظر الطبيعية",
      "الفن التجريدي",
      "الفن الواقعي",
      "فن الطبيعة الصامتة",
      "الفن الانطباعي",
      "الفن الإسلامي",
      "الفن الزخرفي",
      "الفن السريالي",
      "الفن التعبيري",
      "فن البوب",
      "الفن الكلاسيكي",
      "الفن التكعيبي",
      "الفن الشعبي",
      "الفن المفاهيمي",
      "اخرى",
    ])
    .withMessage("تصنيف غير صحيح"),

  body("paintType")
    .optional()
    .isIn([
      "ألوان الأكريليك",
      "الألوان الزيتية",
      "الألوان المائية",
      "ألوان الفحم",
      "ألوان الماركر",
      "ألوان الغواش",
      "الباستيل الناعم",
      "الألوان الخشبية",
      "أوراق الذهب",
      "أصباغ الريزن",
      "ألوان السبراي",
      "الباستيل الزيتي",
      "الأحبار الفنية",
      "ألوان القماش",
      "ألوان الزجاج",
      "اخرى",
    ])
    .withMessage("نوع الألوان غير صحيح"),

  body("canvasThickness")
    .optional()
    .isIn([
      "خفيف: 180–250 جم/م²",
      "متوسط: 250–350 جم/م²",
      "ثقيل: 350–450 جم/م²",
      "ثقيل جدًا: 450–600 جم/م²",
      "فائق السماكة: 600 جم/م²",
    ])
    .withMessage("سماكة قماش الكانفاس غير صحيحة"),

  body("dimensionType")
    .optional()
    .isIn(["2D", "3D"])
    .withMessage("نوع أبعاد اللوحة غير صحيح"),

  body("medium")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("الوسيط لا يمكن ان يتجاوز 100 حرف"),

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
    .isFloat({ min: 1, max: 5000 })
    .withMessage("سعر اللوحة يجب أن يكون بين 1 و 5,000 ر.س (حد أقصى مؤقت للمرحلة الحالية)"),

  body("weight")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Weight must be at least 0.1 KG"),

  body("dimensions").custom((value, { req }) => {
    if (value === undefined && req.method === "PUT") return true;
    if (!value) throw new Error("Dimensions are required");

    let dims;
    try {
      dims = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
      throw new Error("Invalid dimensions format");
    }

    if (!dims.width || Number(dims.width) <= 0)
      throw new Error("Width is required and must be greater than 0");
    if (!dims.height || Number(dims.height) <= 0)
      throw new Error("Height is required and must be greater than 0");
    if (dims.depth !== undefined && Number(dims.depth) < 0)
      throw new Error("Depth cannot be negative");

    return true;
  }),

  body("category")
    .optional()
    .isIn([
      "فن البورتريه",
      "فن المناظر الطبيعية",
      "الفن التجريدي",
      "الفن الواقعي",
      "فن الطبيعة الصامتة",
      "الفن الانطباعي",
      "الفن الإسلامي",
      "الفن الزخرفي",
      "الفن السريالي",
      "الفن التعبيري",
      "فن البوب",
      "الفن الكلاسيكي",
      "الفن التكعيبي",
      "الفن الشعبي",
      "الفن المفاهيمي",
      "اخرى",
    ])
    .withMessage("Invalid category"),

  body("paintType")
    .optional()
    .isIn([
      "ألوان الأكريليك",
      "الألوان الزيتية",
      "الألوان المائية",
      "ألوان الفحم",
      "ألوان الماركر",
      "ألوان الغواش",
      "الباستيل الناعم",
      "الألوان الخشبية",
      "أوراق الذهب",
      "أصباغ الريزن",
      "ألوان السبراي",
      "الباستيل الزيتي",
      "الأحبار الفنية",
      "ألوان القماش",
      "ألوان الزجاج",
      "اخرى",
    ])
    .withMessage("نوع الألوان غير صحيح"),

  body("canvasThickness")
    .optional()
    .isIn([
      "خفيف: 180–250 جم/م²",
      "متوسط: 250–350 جم/م²",
      "ثقيل: 350–450 جم/م²",
      "ثقيل جدًا: 450–600 جم/م²",
      "فائق السماكة: 600 جم/م²",
    ])
    .withMessage("Invalid canvas thickness"),

  body("dimensionType")
    .optional()
    .isIn(["2D", "3D"])
    .withMessage("Invalid dimension type"),

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
