// module.exports = {
//   AUTH: {
//     REGISTER_SUCCESS: 'تم إنشاء الحساب بنجاح',
//     LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
//     INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
//     TERMS_REQUIRED: 'يجب الموافقة على الشروط والأحكام',
//     EMAIL_EXISTS: 'البريد الإلكتروني مسجل بالفعل',
//     NOT_LOGGED_IN: 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى',
//     INVALID_TOKEN: 'رمز التحقق غير صالح، يرجى تسجيل الدخول مرة أخرى',
//     TOKEN_EXPIRED: 'انتهت صلاحية رمز التحقق، يرجى تسجيل الدخول مرة أخرى',
//     USER_NOT_FOUND: 'المستخدم غير موجود',
//     DEACTIVATED: 'هذا الحساب تم إلغاء تفعيله',
//     PASSWORD_CHANGED: 'تم تغيير كلمة المرور مؤخراً، يرجى تسجيل الدخول مجدداً',
//     FORBIDDEN: 'ليس لديك الصلاحية لإجراء هذه العملية',
//     LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
//     RESET_EMAIL_SENT: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
//     PASSWORD_RESET_SUCCESS: 'تم إعادة تعيين كلمة المرور بنجاح',
//     PROFILE_FETCHED: 'تم جلب بيانات الملف الشخصي بنجاح',
//     PROFILE_UPDATED: 'تم تحديث الملف الشخصي بنجاح',
//     AVATAR_UPLOADED: 'تم رفع الصورة الشخصية بنجاح',
//     AVATAR_REQUIRED: 'يرجى إرفاق صورة شخصية',
//   },
//   VALIDATION: {
//     NAME_REQUIRED: 'الاسم مطلوب',
//     NAME_TOO_LONG: 'يجب ألا يتجاوز الاسم 50 حرفاً',
//     EMAIL_INVALID: 'يرجى إدخال بريد إلكتروني صحيح',
//     PASSWORD_MIN_LENGTH: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
//     PHONE_INVALID: 'يرجى إدخال رقم هاتف صحيح',
//     IBAN_INVALID: 'صيغة الآيبان غير صحيحة، يجب أن يبدأ بـ SA ويليه 22 رقماً',
//     AMOUNT_REQUIRED: 'القيمة مطلوبة',
//   },
//   ARTWORK: {
//     TITLE_REQUIRED: 'عنوان اللوحة مطلوب',
//     PRICE_MIN: 'السعر يجب أن يكون 1 ريال على الأقل',
//     DIMENSIONS_REQUIRED: 'الأبعاد مطلوبة',
//     SUBSCRIPTION_LIMIT: 'لقد تجاوزت الحد المسموح به من اللوحات في باقتك الحالية',
//     NO_ACTIVE_SUBSCRIPTION: 'يجب أن يكون لديك اشتراك نشط لإضافة لوحة فنية',
//     IMAGE_REQUIRED: 'يرجى إرفاق صورة واحدة على الأقل للوحة الفنية',
//     NOT_FOUND: 'اللوحة الفنية غير موجودة',
//     UNAUTHORIZED_UPDATE: 'غير مصرح لك بتحديث هذه اللوحة الفنية',
//     UNAUTHORIZED_DELETE: 'غير مصرح لك بحذف هذه اللوحة الفنية',
//     DELETE_SUCCESS: 'تم حذف اللوحة الفنية بنجاح',
//     TOGGLE_SUCCESS: 'تم تعديل حالة ظهور اللوحة بنجاح',
//   },
//   ORDER: {
//     CHECKOUT_SUCCESS: 'تم إنشاء الطلب بنجاح',
//     PAYMENT_PENDING: 'في انتظار الدفع',
//     DELIVERY_CONFIRMED: 'تم تأكيد استلام الطلب',
//     NOT_FOUND: 'الطلب غير موجود',
//     UNAUTHORIZED: 'غير مصرح لك بالوصول إلى هذا الطلب',
//     ALREADY_PAID: 'الطلب مدفوع بالفعل',
//     NOT_PAID: 'الطلب لم يتم دفعه بعد',
//     STATUS_UPDATED: 'تم تحديث حالة الطلب بنجاح',
//     CANCEL_SUCCESS: 'تم إلغاء الطلب بنجاح',
//     CART_EMPTY: 'السلة فارغة، لا يمكن إتمام الطلب',
//     ARTWORK_SOLD: 'بعض اللوحات في السلة تم بيعها بالفعل',
//     SHIPPING_CALC_FAILED: 'فشل حساب تكلفة الشحن',
//   },
//   WALLET: {
//     INSUFFICIENT_BALANCE: 'الرصيد غير كافٍ',
//     WITHDRAWAL_MIN: 'الحد الأدنى للسحب هو 50 ريال',
//     WITHDRAWAL_SUBMITTED: 'تم تقديم طلب السحب بنجاح',
//     WITHDRAWAL_APPROVED: 'تمت الموافقة على طلب السحب بنجاح',
//     WITHDRAWAL_REJECTED: 'تم رفض طلب السحب',
//     WITHDRAWAL_PAID: 'تم تحويل مبلغ السحب للحساب البنكي',
//   },
//   SUBSCRIPTION: {
//     PLAN_REQUIRED: 'نوع الباقة مطلوب',
//     INVALID_PLAN: 'الباقة المحددة غير صحيحة',
//     ALREADY_SUBSCRIBED: 'لديك اشتراك نشط بالفعل ولا تحتاج للاشتراك حالياً',
//     ACTIVATED: 'تم تفعيل الاشتراك بنجاح',
//     EXPIRED: 'انتهت صلاحية الاشتراك الخاص بك',
//   },
//   COMMON: {
//     NOT_FOUND: 'المورد غير موجود',
//     BAD_REQUEST: 'طلب غير صحيح',
//     SERVER_ERROR: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
//     VALIDATION_FAILED: 'فشل التحقق من البيانات المرسلة',
//   },
// };

/**
 * رسائل المستخدم الموحدة (بالعربي)
 * كل الـ controllers تستخدم الرسائل دي عشان نضمن الاتساق
 */
module.exports = {
  // ═══ Auth ═══
  auth: {
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    emailExists: "هذا البريد الإلكتروني مسجل بالفعل",
    notLoggedIn: "يرجى تسجيل الدخول أولاً",
    invalidToken: "جلسة غير صالحة — يرجى تسجيل الدخول مرة أخرى",
    expiredToken: "انتهت صلاحية الجلسة — يرجى تسجيل الدخول مرة أخرى",
    accountDisabled: "هذا الحساب معطل — تواصل مع الدعم",
    accountBanned: "حسابك محظور من المنصة — تواصل مع الدعم",
    emailNotVerified: "يرجى تأكيد بريدك الإلكتروني أولاً",
    otpSent: "تم إرسال رمز التأكيد إلى بريدك الإلكتروني",
    otpInvalid: "رمز التأكيد غير صحيح أو منتهي الصلاحية",
    otpLocked: "تم قفل التأكيد مؤقتاً لكثرة المحاولات — حاول لاحقاً",
    otpDailyLimit: "تم تجاوز الحد اليومي لرموز التأكيد — حاول غداً",
    otpResendWait: "انتظر قليلاً قبل طلب رمز جديد",
    passwordResetSent: "إذا كان البريد مسجلاً لدينا، سيتم إرسال رابط الاستعادة خلال دقائق",
    passwordResetInvalid: "رابط الاستعادة غير صالح أو منتهي الصلاحية",
    passwordChanged: "تم تغيير كلمة المرور بنجاح",
    registered: "تم إنشاء حسابك بنجاح",
    loggedIn: "تم تسجيل الدخول بنجاح",
    loggedOut: "تم تسجيل الخروج بنجاح",
  },

  // ═══ Artworks ═══
  artworks: {
    notFound: "اللوحة غير موجودة",
    created: "تم رفع لوحتك بنجاح وهي قيد المراجعة",
    updated: "تم تحديث اللوحة بنجاح",
    deleted: "تم حذف اللوحة بنجاح",
    notOwner: "هذه اللوحة ليست ملكك",
    alreadySold: "هذه اللوحة مباعة بالفعل",
    notApproved: "هذه اللوحة غير معتمدة بعد",
    featureNotPrestige: "ميزة التمييز متاحة فقط لباقة Prestige",
    featureLimit: "لديك لوحة مميزة بالفعل — ألغِ تمييزها أولاً",
    featured: "تم تمييز لوحتك بنجاح",
    unfeatured: "تم إلغاء تمييز اللوحة",
  },

  // ═══ Orders & Cart ═══
  orders: {
    cartEmpty: "سلة المشتريات فارغة",
    notFound: "الطلب غير موجود",
    notOwner: "هذا الطلب ليس ملكك",
    created: "تم إنشاء الطلب بنجاح",
    paid: "تم تأكيد الدفع بنجاح",
    cancelled: "تم إلغاء الطلب",
    cancelNotAllowed: "لا يمكن إلغاء الطلب في حالته الحالية",
    confirmDelivery: "تم تأكيد الاستلام — شكراً لك",
    alreadyConfirmed: "تم تأكيد استلام هذا الطلب مسبقاً",
    notDelivered: "لا يمكن تأكيد الاستلام قبل التوصيل",
  },

  // ═══ Wallet & Withdrawals ═══
  wallet: {
    notFound: "المحفظة غير موجودة",
    insufficientBalance: "الرصيد المتاح غير كافٍ",
    withdrawalCreated: "تم إرسال طلب السحب — سيتم مراجعته خلال 3-5 أيام عمل",
    withdrawalNotFound: "طلب السحب غير موجود",
    withdrawalAlreadyProcessed: "تم معالجة هذا الطلب مسبقاً",
    minWithdrawal: "الحد الأدنى للسحب هو {amount} ر.س",
    bankAccountRequired: "أضف حسابك البنكي أولاً من صفحة الملف الشخصي",
  },

  // ═══ Subscriptions ═══
  subscriptions: {
    planNotFound: "الباقة غير موجودة",
    alreadyActive: "لديك اشتراك نشط بالفعل",
    activated: "تم تفعيل اشتراكك بنجاح",
    cancelled: "تم إلغاء الاشتراك",
    limitReached: "وصلت للحد الأقصى من اللوحات في باقتك الحالية",
  },

  // ═══ Reviews ═══
  reviews: {
    created: "تم إضافة تقييمك بنجاح",
    updated: "تم تحديث تقييمك",
    notFound: "التقييم غير موجود",
    notOwner: "هذا التقييم ليس ملكك",
    alreadyReviewed: "قيّمت هذا الطلب مسبقاً",
    orderNotCompleted: "يمكن التقييم بعد اكتمال الطلب فقط",
    windowExpired: "انتهت فترة السماح للتقييم (30 يوم)",
    editWindowExpired: "انتهت فترة تعديل التقييم (7 أيام)",
    hidden: "تم إخفاء التقييم",
    unhidden: "تم إظهار التقييم",
  },

  // ═══ Shipping ═══
  shipping: {
    notFound: "الشحنة غير موجودة",
    alreadyCreated: "تم إنشاء شحنة لهذا الطلب مسبقاً",
    notPaid: "لا يمكن الشحن قبل تأكيد الدفع",
    noDeliveryOption: "لا توجد خيارات شحن متاحة لهذا الطلب",
    created: "تم إنشاء الشحنة بنجاح",
    missingAddress: "بيانات العنوان ناقصة — تواصل مع الدعم",
  },

  // ═══ Admin ═══
  admin: {
    noPermission: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
    approved: "تم الاعتماد بنجاح",
    rejected: "تم الرفض",
    suspended: "تم الإيقاف",
    userBanned: "تم حظر المستخدم",
    userUnbanned: "تم رفع الحظر عن المستخدم",
  },

  // ═══ General ═══
  general: {
    validationError: "بيانات غير صالحة — راجع الحقول المطلوبة",
    serverError: "حدث خطأ غير متوقع — حاول مرة أخرى",
    notFound: "العنصر المطلوب غير موجود",
    rateLimited: "تم تجاوز الحد المسموح من المحاولات — حاول لاحقاً",
    fileTooLarge: "حجم الملف كبير جداً",
    invalidFileType: "نوع الملف غير مدعوم",
  },
};