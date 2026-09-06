const { EventEmitter } = require("events");
const logger = require("../utils/logger");

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    // زيادة الحد الأقصى للـ listeners (عشان مفيش تحذيرات)
    this.setMaxListeners(50);

    // Logging كل event (في dev فقط)
    if (process.env.NODE_ENV === "development") {
      this.onAny?.((event, ...args) => {
        logger.debug(`[Event] ${event}`, args[0]);
      });

      // EventEmitter مفيش فيها onAny افتراضياً — نعملها يدوياً
      const originalEmit = this.emit.bind(this);
      this.emit = (event, ...args) => {
        logger.debug(`[Event] ${event}`);
        return originalEmit(event, ...args);
      };
    }
  }

  /**
   * Safe emit — لو مفيش listeners، منرميش error
   */
  safeEmit(event, payload) {
    try {
      this.emit(event, payload);
    } catch (error) {
      logger.error(`[Event] Error emitting ${event}:`, error);
    }
  }
}

// Singleton — كل الـ app بتشترك في نفس الـ instance
module.exports = new AppEventEmitter();
