const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const logger = require("../utils/logger");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

const RELEASE_HOURS = Number(process.env.FUND_RELEASE_HOURS || 72);

async function releaseFundsForOrder(order, session) {
  const wallet = await Wallet.findOne({ user: order.artist }).session(session);
  if (wallet) {
    await wallet.releaseToAvailable(
      order.financials.totalArtistEarning,
      session,
    );
    await Transaction.create(
      [
        {
          wallet: wallet._id,
          order: order._id,
          user: order.artist,
          type: "CREDIT_RELEASE",
          amount: order.financials.totalArtistEarning,
          description: `إطلاق تلقائي لأموال الطلب #${order._id} بعد انتهاء مهلة الاستلام`,
          balanceAfter: {
            available: wallet.balance.available,
            pending: wallet.balance.pending,
          },
          status: "COMPLETED",
        },
      ],
      { session },
    );
  }
}

async function runFundsReleaseJob() {
  const cutoff = new Date(Date.now() - RELEASE_HOURS * 60 * 60 * 1000);

  const orders = await Order.find({
    status: "DELIVERED",
    onHold: false,
    fundsReleased: false,
    "shipping.deliveredAt": { $lte: cutoff },
  });

  if (orders.length === 0) return;
  logger.info(`💰 Funds release job: ${orders.length} order(s) to process`);

  for (const order of orders) {
    const session = await mongoose.startSession();
    session.startTransaction();
    let locked = null;
    try {
      locked = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: "DELIVERED",
          onHold: false,
          fundsReleased: false,
        },
        {
          $set: {
            status: "COMPLETED",
            fundsReleased: true,
            completedAt: new Date(),
          },
        },
        { new: true, session },
      );
      if (!locked) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      await releaseFundsForOrder(locked, session);
      await session.commitTransaction();
      session.endSession(); // ✅ close session هنا
      logger.info(`✅ Funds released for order ${order._id}`);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`❌ Funds release failed for ${order._id}:`, err.message);
      continue;
    }

    // ✅ Emit خارج الـ try-catch — الـ transaction خلصت بنجاح
    eventEmitter.safeEmit(EVENTS.ORDER_FUNDS_RELEASED, {
      artistId: locked.artist,
      amount: locked.financials.totalArtistEarning,
    });
  }
}

function startFundsReleaseJob() {
  const intervalMs = Number(
    process.env.FUND_RELEASE_INTERVAL_MS || 60 * 60 * 1000,
  );
  setInterval(runFundsReleaseJob, intervalMs);
  logger.info(
    `⏰ Funds release job started (release after ${RELEASE_HOURS}h, check every ${intervalMs / 60000} min)`,
  );
}

module.exports = { startFundsReleaseJob, runFundsReleaseJob };
