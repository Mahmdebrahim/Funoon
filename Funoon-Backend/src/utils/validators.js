/**
 * Validates if the given string is a valid Saudi IBAN (SA followed by 22 digits).
 * @param {string} iban
 * @returns {boolean}
 */
const isValidSaudiIban = (iban) => {
  if (!iban) return false;
  // Clean spaces
  const cleanIban = iban.replace(/\s+/g, "").toUpperCase();
  // Regex check: SA followed by 22 digits
  return /^SA\d{22}$/.test(cleanIban);
};

module.exports = {
  isValidSaudiIban,
};
