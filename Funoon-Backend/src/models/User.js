const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── Sub-Schemas ────────────────────────────────────────────────────────────

const addressSchema = new mongoose.Schema(
  {
    // ✅ كل الحقول اختيارية - المستخدم يضيفها لاحقاً
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: "SA", trim: true },

    // حقول جديدة للشحن (اختيارية)
    buildingNo: { type: String, trim: true },
    shortAddressCode: { type: String, trim: true },
    secondaryAddressNumber: { type: String, trim: true },
    lat: { type: String },
    lon: { type: String },
  },
  { _id: false },
);

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["none", "opal_classic", "opal_plus", "opal_prestige"],
      default: "none",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false },
    pricePaid: { type: Number, default: 0 },

    // ✅ Moyasar fields
    moyasarPaymentId: { type: String },
    moyasarPaymentStatus: { type: String },

    // ✅ Cron Job fields
    reminderSent: { type: Boolean, default: false },
    autoRenew: { type: Boolean, default: true },
  },
  { _id: false },
);

// ─── Plan Config (Single Source of Truth) ───────────────────────────────────

const PLAN_CONFIG = {
  opal_classic: {
    id: "opal_classic",
    label: "Opal Classic",
    price: 299,
    durationMonths: 12,
    commission: 0.15,
    maxArtworks: 5,
    coversStandardShipping: false,
    features: {
      canSeeDetailedViews: false,
      prioritySupport: false,
      customProfile: false,
    },
  },
  opal_plus: {
    id: "opal_plus",
    label: "Opal Plus",
    price: 399,
    durationMonths: 12,
    commission: 0.15,
    maxArtworks: 15,
    coversStandardShipping: false,
    features: {
      canSeeDetailedViews: true,
      prioritySupport: true,
      customProfile: true,
    },
  },
  opal_prestige: {
    id: "opal_prestige",
    label: "Opal Prestige",
    price: 599,
    durationMonths: 12,
    commission: 0.1,
    maxArtworks: Infinity,
    coversStandardShipping: true,
    features: {
      canSeeDetailedViews: true,
      prioritySupport: true,
      customProfile: true,
    },
  },
};

// ─── Main Schema ─────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      match: [/^[0-9+\s-]{7,15}$/, "Please enter a valid phone number"],
    },
    role: {
      type: String,
      enum: ["buyer", "artist", "admin"],
      default: "buyer",
    },
    avatar: { type: String, default: null },
    profileViewsCount: { type: Number, default: 0 },

    // Address (required for shipping)
    address: { type: addressSchema, default: () => ({}) },

    // Bank Details
    // bankDetails: {
    //   iban: { type: String, trim: true },
    //   bankName: { type: String, trim: true },
    //   accountHolder: { type: String, trim: true },
    // },

    // Artist-only fields
    bio: { type: String, maxlength: 500 },
    subscription: { type: subscriptionSchema, default: () => ({}) },
    freelanceVerification: {
      certificateNumber: { type: String, trim: true },
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
    },

    // Compliance
    termsAccepted: { type: Boolean, required: true, default: false },
    termsAcceptedAt: { type: Date },

    // Security
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true, select: false },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "subscription.isActive": 1, "subscription.endDate": 1 });
userSchema.index({ "bankDetails.iban": 1 }, { sparse: true });

// ─── Pre-save: Hash Password ──────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ─── Pre-save: Set termsAcceptedAt ────────────────────────────────────────────

userSchema.pre("save", function (next) {
  if (this.isModified("termsAccepted") && this.termsAccepted) {
    this.termsAcceptedAt = new Date();
  }
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

// Compare entered password with hashed
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if subscription is currently active
userSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription.isActive &&
    this.subscription.endDate &&
    this.subscription.endDate > new Date()
  );
};

userSchema.methods.hasFeature = function (featureName) {
  const config = PLAN_CONFIG[this.subscription?.plan];
  return config?.features?.[featureName] || false;
};

// Get plan configuration
userSchema.methods.getPlanConfig = function () {
  return PLAN_CONFIG[this.subscription.plan] || null;
};

// Get commission rate based on current plan
userSchema.methods.getCommissionRate = function () {
  const config = this.getPlanConfig();
  return config ? config.commission : 0.15; // Default 15%
};

// Check if platform covers shipping
userSchema.methods.isShippingCovered = function () {
  const config = this.getPlanConfig();
  return config ? config.shippingCoverd : false;
};

// ─── Statics ─────────────────────────────────────────────────────────────────

userSchema.statics.PLAN_CONFIG = PLAN_CONFIG;

module.exports = mongoose.model("User", userSchema);
