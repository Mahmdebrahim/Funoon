const { body } = require('express-validator');

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("كلمة المرور مطلوبة")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور 8 حروف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("كلمة المرور لازم تحتوي على حرف كبير وصغير ورقم"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\s-]{7,15}$/)
    .withMessage("Please enter a valid phone number (7 to 15 digits)"),
  body("role")
    .optional()
    .isIn(["buyer", "artist"])
    .withMessage('Role must be either "buyer" or "artist"'),
  body("termsAccepted")
    .custom((value) => value === true || value === "true")
    .withMessage("يجب الموافقة على الشروط والأحكام"),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\s-]{7,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.district').optional().trim(),
  body('address.zipCode').optional().trim(),
];

const verifyEmailValidator = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("معرّف المستخدم مطلوب")
    .isMongoId()
    .withMessage("معرّف المستخدم غير صحيح"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("رمز التأكيد مطلوب")
    .matches(/^[0-9]{6}$/)
    .withMessage("رمز التأكيد لازم يكون 6 أرقام"),
];

const resendOtpValidator = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("معرّف المستخدم مطلوب")
    .isMongoId()
    .withMessage("معرّف المستخدم غير صحيح"),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  verifyEmailValidator,
  resendOtpValidator,
};
