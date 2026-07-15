const multer = require('multer');
const { BadRequestError } = require('../utils/api-error');

// Use memory storage to allow processing in-memory with sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB default
  },
});

module.exports = upload;
