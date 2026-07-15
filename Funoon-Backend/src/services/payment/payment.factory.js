const MoyasarService = require('./moyasar.service');

const PaymentFactory = {
  getService: () => {
    return MoyasarService;
  },
};

module.exports = PaymentFactory;
