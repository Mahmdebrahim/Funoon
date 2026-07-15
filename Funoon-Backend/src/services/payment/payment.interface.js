class IPaymentService {
  /**
   * Initiates payment and returns invoice metadata and payment URL.
   * @param {object} paymentData 
   * @returns {Promise<{ invoiceId: string, paymentUrl: string }>}
   */
  async initiatePayment(paymentData) {
    throw new Error('initiatePayment must be implemented');
  }

  /**
   * Verifies the status of a payment.
   * @param {string} invoiceId 
   * @returns {Promise<{ success: boolean, invoiceId: string, paymentId: string, method: string, paidAt: Date }>}
   */
  async verifyPayment(invoiceId) {
    throw new Error('verifyPayment must be implemented');
  }

  /**
   * Refunds a payment.
   * @param {string} paymentId 
   * @param {number} amount 
   * @returns {Promise<object>}
   */
  async refundPayment(paymentId, amount) {
    throw new Error('refundPayment must be implemented');
  }

  /**
   * Checks the raw status of a payment.
   * @param {string} paymentId 
   * @returns {Promise<object>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus must be implemented');
  }
}

module.exports = IPaymentService;
