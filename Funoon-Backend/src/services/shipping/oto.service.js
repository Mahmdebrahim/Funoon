// src/services/shipping/oto.service.js
const axios = require("axios");

class OTOService {
  constructor() {
    // ✅ استخدام Sandbox URL من الـ env
    this.baseURL = process.env.OTO_BASE_URL || "https://staging-api.tryoto.com";
    this.refreshToken = process.env.OTO_REFRESH_TOKEN;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async _getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/rest/v2/refreshToken`,
        { refresh_token: this.refreshToken },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;
      return this.accessToken;
    } catch (error) {
      console.error(
        "❌ OTO refreshToken error:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to get OTO access token");
    }
  }

  async _request(method, endpoint, data = null) {
    const token = await this._getAccessToken();
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    };

    if (data) config.data = data;

    try {
      const response = await axios(config);
      let responseData = response.data;

      // ✅ إصلاح: لو axios رجع string، نعمله parse يدوي
      if (typeof responseData === "string") {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          console.error("❌ Could not parse OTO response as JSON");
          console.error(
            "   Raw response (first 500 chars):",
            responseData.substring(0, 500),
          );
          throw new Error("Invalid JSON response from OTO");
        }
      }

      return responseData;
    } catch (error) {
      const errorData = error.response?.data || error.message;
      console.error(`❌ OTO API Error [${endpoint}]:`, errorData);

      if (error.response?.data) {
        let errorObj = error.response.data;
        // ✅ لو error response string، نعمله parse
        if (typeof errorObj === "string") {
          try {
            errorObj = JSON.parse(errorObj);
          } catch (e) {}
        }
        throw {
          success: false,
          otoErrorCode: errorObj.otoErrorCode,
          otoErrorMessage:
            errorObj.otoErrorMessage || errorObj.message || "Unknown error",
          fullError: errorObj,
        };
      }

      throw new Error(`OTO API failed: ${error.message}`);
    }
  }

  // ✅ Helper: تنسيق التاريخ بالشكل المطلوب من OTO (dd/MM/yyyy HH:mm)
  _formatOrderDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  async checkOTODeliveryFee(params) {
    try {
      return await this._request(
        "POST",
        "/rest/v2/checkOTODeliveryFee",
        params,
      );
    } catch (error) {
      console.error("❌ OTO checkOTODeliveryFee error:", error);
      throw error;
    }
  }

  /**
   * ✅ إنشاء Order في OTO (بدون createShipment)
   * حسب توصية الدعم: نعمل createShipment في خطوة منفصلة
   */
  async createOrder(orderData) {
    const {
      orderId,
      deliveryOptionId,
      paymentMethod = "paid",
      amount,
      packageWeight,
      packageCount = 1,
      boxWidth = 60,
      boxLength = 80,
      boxHeight = 5,
      items,
      senderInformation,
      customer,
      artist,
      buyer,
    } = orderData;

    const finalSenderInfo =
      senderInformation ||
      (artist
        ? {
            senderFullName: artist.name,
            senderMobile: artist.phone?.replace(/[^0-9]/g, "") || "0500000000",
            senderCountry: artist.address?.country || "SA",
            senderCity: artist.address?.city || "Riyadh",
            senderDistrict: artist.address?.district || "",
            senderStreet: artist.address?.street || "",
            senderAddressLine:
              `${artist.address?.buildingNo || ""}, ${artist.address?.street || ""}, ${artist.address?.district || ""}, ${artist.address?.city || ""}, ${artist.address?.zipCode || ""}, Saudi Arabia`.trim(),
            senderBuildingNo: artist.address?.buildingNo || "",
            senderPostcode: artist.address?.zipCode || "",
            senderShortAddressCode: artist.address?.shortAddressCode || "",
            lat: artist.address?.lat || undefined,
            lon: artist.address?.lon || undefined,
          }
        : null);

    const finalCustomer =
      customer ||
      (buyer
        ? {
            name: buyer.name,
            mobile: buyer.phone?.replace(/[^0-9]/g, "") || "0500000000",
            address:
              `${buyer.address?.buildingNo || ""}, ${buyer.address?.street || ""}, ${buyer.address?.district || ""}, ${buyer.address?.city || ""}, ${buyer.address?.zipCode || ""}, Saudi Arabia`.trim(),
            district: buyer.address?.district || "",
            city: buyer.address?.city || "Riyadh",
            country: buyer.address?.country || "SA",
            postcode: buyer.address?.zipCode || "",
            buildingNo: buyer.address?.buildingNo || "",
            street: buyer.address?.street || "",
            secondaryAddressNumber: buyer.address?.secondaryAddressNumber || "",
            shortAddressCode: buyer.address?.shortAddressCode || "",
            lat: buyer.address?.lat || undefined,
            lon: buyer.address?.lon || undefined,
          }
        : null);

    if (!finalSenderInfo) throw new Error("Missing sender information");
    if (!finalCustomer) throw new Error("Missing customer information");

    // ✅ استخدام الـ helper method للتنسيق الصحيح
    const orderDate = this._formatOrderDate();

    const otoOrderData = {
      orderId: orderId,
      senderInformation: finalSenderInfo,
      // ❌ شيلنا createShipment: true - هنعملها في خطوة منفصلة
      deliveryOptionId: deliveryOptionId,
      payment_method: paymentMethod,
      amount: amount,
      amount_due: paymentMethod === "cod" ? amount : 0,
      currency: "SAR",
      packageCount: packageCount,
      packageWeight: packageWeight,
      boxWidth: boxWidth,
      boxLength: boxLength,
      boxHeight: boxHeight,
      orderDate: orderDate, // ✅ format صحيح: dd/MM/yyyy HH:mm
      customer: finalCustomer,
      items: (items || []).map((item) => ({
        name: item.name || item.artworkTitle || "Artwork",
        price: item.price || 0,
        quantity: item.quantity || 1,
        sku: item.sku || `ART-${item._id || Date.now()}`,
      })),
      shippingNotes: "Artwork - Handle with care - Fragile 🎨",
      language: "ar",
    };

    console.log(`📦 Creating OTO order: ${orderId}`);
    console.log(`   📅 Order Date: ${orderDate}`);
    console.log(
      `   Sender: ${finalSenderInfo.senderFullName} (${finalSenderInfo.senderCity})`,
    );
    console.log(`   Customer: ${finalCustomer.name} (${finalCustomer.city})`);
    console.log(`   Delivery Option ID: ${deliveryOptionId}`);
    console.log(`   Amount: ${amount} SAR`);

    const response = await this._request(
      "POST",
      "/rest/v2/createOrder",
      otoOrderData,
    );
    console.log(`✅ OTO order created successfully: ${orderId}`);
    return response;
  }

  /**
   * ✅ جديد: إنشاء Shipment منفصل (الخطوة التانية في الـ Flow)
   * @param {string} orderId - معرف الأوردر (مثلاً: "FUNOON-xxx")
   * @param {number} deliveryOptionId - معرف شركة الشحن
   */
  async createShipment(orderId, deliveryOptionId) {
    console.log(`📦 Creating OTO shipment for order: ${orderId}`);
    console.log(`   Delivery Option ID: ${deliveryOptionId}`);

    const response = await this._request("POST", "/rest/v2/createShipment", {
      orderId: orderId,
      deliveryOptionId: deliveryOptionId,
    });

    console.log(`✅ OTO shipment created for: ${orderId}`);
    return response;
  }

  async getOrderStatus(orderId) {
    return await this._request("POST", "/rest/v2/orderStatus", {
      orderId: orderId,
    });
  }

  async getOrderStatusByOtoId(otoId) {
    return await this._request("POST", "/rest/v2/orderStatus", {
      otoId: otoId,
    });
  }

  async printAWB(orderId) {
    console.log(`🖨️ Printing AWB for order: ${orderId}`);
    const response = await this._request("GET", `/rest/v2/print/${orderId}`);
    return response;
  }

  async getOrderHistory(orderId) {
    return await this._request("POST", "/rest/v2/orderHistory", {
      orderId: orderId,
    });
  }

  async cancelOrder(orderId) {
    return await this._request("POST", "/rest/v2/cancelOrder", { orderId });
  }

  async getDeliveryFee(orderId) {
    return await this._request("POST", "/rest/v2/getDeliveryFee", { orderId });
  }
}

module.exports = new OTOService();
