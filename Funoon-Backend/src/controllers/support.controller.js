const SupportTicket = require("../models/SupportTicket");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

// @desc    Create support message (public + rate limited)
// @route   POST /api/v1/support
const createContactMessage = catchAsync(async (req, res) => {
  const { name, email, topic, message } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user?._id || null, // لو مسجل دخول نربطه بالحساب
    name,
    email,
    topic,
    message,
  });

  // ✅ إشعار + إيميل للأدمن عبر نظام الأحداث
  eventEmitter.safeEmit(EVENTS.SUPPORT_MESSAGE_RECEIVED, {
    ticketId: ticket._id,
    name: ticket.name,
    email: ticket.email,
    topic: ticket.topic,
  });

  return ApiResponse.created(
    res,
    ticket,
    "تم استلام رسالتك بنجاح — سنرد عليك خلال 24 ساعة عمل.",
  );
});

// @desc    Admin: list tickets
// @route   GET /api/v1/admin/support
const getSupportTickets = catchAsync(async (req, res) => {
  const { status = "NEW", page = 1, limit = 20 } = req.query;
  const filter = status !== "all" ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    SupportTicket.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    {
      tickets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    "Tickets retrieved",
  );
});

// @desc    Admin: update ticket status
// @route   PATCH /api/v1/admin/support/:id
const updateTicketStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );
  if (!ticket)
    throw new (require("../utils/api-error").NotFoundError)("Ticket not found");
  return ApiResponse.success(res, ticket, "Ticket updated");
});

module.exports = {
  createContactMessage,
  getSupportTickets,
  updateTicketStatus,
};
