const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "بريد إلكتروني غير صالح"],
    },
    topic: {
      type: String,
      required: true,
      enum: ["ORDER", "PAYMENT", "ARTWORK", "ACCOUNT", "PARTNERSHIP", "OTHER"],
    },
    message: { type: String, required: true, minlength: 10, maxlength: 2000 },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "RESOLVED"],
      default: "NEW",
      index: true,
    },
  },
  { timestamps: true },
);

supportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
