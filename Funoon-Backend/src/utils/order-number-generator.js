const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // 6-digit random number to ensure uniqueness within the same day
  const randomNum = Math.floor(100000 + Math.random() * 900000);

  return `ORD-${dateStr}-${randomNum}`;
};

module.exports = generateOrderNumber;
