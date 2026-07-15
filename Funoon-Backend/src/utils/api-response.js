class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Created') {
    return this.success(res, data, message, 201);
  }
}

module.exports = ApiResponse;
