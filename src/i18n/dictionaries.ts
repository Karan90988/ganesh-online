export type Locale = "en" | "hi" | "mr";

export const LOCALES: Locale[] = ["en", "hi", "mr"];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

type Dict = Record<string, string>;

const en: Dict = {
  "header.retail": "Retail",
  "header.wholesale": "Wholesale",

  "common.contact": "Contact",
  "common.add": "Add",
  "common.outOfStock": "Out of Stock",
  "common.inStock": "In Stock",
  "common.grandTotal": "Grand Total",
  "common.proceedToCheckout": "Proceed to Checkout",
  "common.browseProducts": "Browse Products",
  "common.continueShopping": "Continue shopping",
  "common.viewAll": "View all",
  "common.addMore": "Add more items",

  "home.heroTitle1": "Your trusted kirana store,",
  "home.heroTitle2": "now online",
  "home.heroSubtitle":
    "Browse products, build your order and send it on WhatsApp. Wholesale and retail prices.",
  "home.shopRetail": "Shop Retail",
  "home.shopRetailDesc": "For homes & families",
  "home.startShopping": "Start shopping",
  "home.shopWholesale": "Shop Wholesale",
  "home.shopWholesaleDesc": "For shops & businesses",
  "home.bulkPrices": "Bulk prices",
  "home.retailDelivery": "Delivered within 30 minutes",
  "home.wholesaleDelivery": "Same-day delivery",
  "home.promo1": "🪔 Diwali Special Offers",
  "home.promo2": "🚚 Delivered within 30 minutes",
  "home.promo3": "💰 Stock up & save more",
  "home.retailBadge": "Up to 15% OFF",
  "home.wholesaleBadge": "Best bulk rates",
  "home.shopByCategory": "Shop by category",
  "home.popularProducts": "Popular products",
  "home.trending": "Trending products",
  "home.searchPlaceholder": "Search products…",

  "cart.title": "Your Cart",
  "cart.empty": "Your cart is empty",
  "cart.emptyDesc": "Add some products to get started.",
  "cart.priceNote": "Final price confirmed by the shop on WhatsApp. No online payment required.",
  "cart.minNotice": "Add {more} more to reach the minimum order of {min}.",

  "checkout.title": "Checkout",
  "checkout.retailOrder": "Retail Order",
  "checkout.wholesaleOrder": "Wholesale Order",
  "checkout.paymentNote": "no online payment. We confirm everything on WhatsApp.",
  "checkout.yourName": "Your Name",
  "checkout.namePlaceholder": "e.g. Ramesh Sharma",
  "checkout.mobileNumber": "Mobile Number",
  "checkout.mobilePlaceholder": "10-digit mobile number",
  "checkout.deliveryAddress": "Delivery Address",
  "checkout.addressPlaceholder": "House / shop no., building, road, area, landmark, pincode",
  "checkout.shopNameOptional": "Shop Name (optional)",
  "checkout.shopPlaceholder": "e.g. ABC Stores",
  "checkout.placeOrder": "Place Order on WhatsApp",
  "checkout.savedNote": "Your order is saved with us even if you don't send the WhatsApp message.",
  "checkout.welcomeBack": "Welcome back, {name}! Your details are filled in.",
  "checkout.notYou": "Not you?",
  "checkout.orderSaved": "Order saved!",
  "checkout.yourOrderId": "Your order ID is",
  "checkout.recordedNote":
    "We've recorded your order. Tap below to send it on WhatsApp so we can confirm delivery.",
  "checkout.sendWhatsApp": "Send on WhatsApp",
  "checkout.minNotice": "Minimum order is {min}. Add {more} more.",

  "contact.title": "Contact Us",
  "contact.subtitle": "We're happy to help with your wholesale or retail order.",
  "contact.phone": "Phone",
  "contact.address": "Address",
  "contact.open": "Open",
  "contact.chatWhatsApp": "Chat on WhatsApp",
  "contact.getDirections": "Get Directions on Google Maps",

  "footer.tagline":
    "Wholesale & retail kirana supplier. Browse products, build your order and send it to us on WhatsApp — we'll handle delivery.",
  "footer.categories": "Categories",
  "footer.admin": "Admin",
  "footer.viewMap": "(View map)",
  "footer.rights": "All rights reserved.",
};

const hi: Dict = {
  "header.retail": "खुदरा",
  "header.wholesale": "थोक",

  "common.contact": "संपर्क",
  "common.add": "जोड़ें",
  "common.outOfStock": "स्टॉक ख़त्म",
  "common.inStock": "उपलब्ध",
  "common.grandTotal": "कुल योग",
  "common.proceedToCheckout": "चेकआउट करें",
  "common.browseProducts": "उत्पाद देखें",
  "common.continueShopping": "खरीदारी जारी रखें",
  "common.viewAll": "सभी देखें",
  "common.addMore": "और सामान जोड़ें",

  "home.heroTitle1": "आपका भरोसेमंद किराना स्टोर,",
  "home.heroTitle2": "अब ऑनलाइन",
  "home.heroSubtitle":
    "उत्पाद देखें, अपना ऑर्डर बनाएँ और व्हाट्सऐप पर भेजें। थोक और खुदरा दाम।",
  "home.shopRetail": "खुदरा खरीदें",
  "home.shopRetailDesc": "घरों और परिवारों के लिए",
  "home.startShopping": "खरीदारी शुरू करें",
  "home.shopWholesale": "थोक खरीदें",
  "home.shopWholesaleDesc": "दुकानों और व्यवसायों के लिए",
  "home.bulkPrices": "थोक दाम",
  "home.retailDelivery": "30 मिनट में डिलीवरी",
  "home.wholesaleDelivery": "उसी दिन डिलीवरी",
  "home.promo1": "🪔 दिवाली विशेष ऑफर",
  "home.promo2": "🚚 30 मिनट में डिलीवरी",
  "home.promo3": "💰 ज़्यादा खरीदें, ज़्यादा बचाएँ",
  "home.retailBadge": "15% तक छूट",
  "home.wholesaleBadge": "सर्वोत्तम थोक दाम",
  "home.shopByCategory": "श्रेणी अनुसार खरीदें",
  "home.popularProducts": "लोकप्रिय उत्पाद",
  "home.trending": "ट्रेंडिंग उत्पाद",
  "home.searchPlaceholder": "उत्पाद खोजें…",

  "cart.title": "आपकी कार्ट",
  "cart.empty": "आपकी कार्ट खाली है",
  "cart.emptyDesc": "शुरू करने के लिए कुछ उत्पाद जोड़ें।",
  "cart.priceNote": "अंतिम कीमत दुकान व्हाट्सऐप पर बताएगी। ऑनलाइन भुगतान की ज़रूरत नहीं।",
  "cart.minNotice": "न्यूनतम ऑर्डर {min} के लिए {more} और जोड़ें।",

  "checkout.title": "चेकआउट",
  "checkout.retailOrder": "खुदरा ऑर्डर",
  "checkout.wholesaleOrder": "थोक ऑर्डर",
  "checkout.paymentNote": "कोई ऑनलाइन भुगतान नहीं। हम सब कुछ व्हाट्सऐप पर पक्का करते हैं।",
  "checkout.yourName": "आपका नाम",
  "checkout.namePlaceholder": "जैसे रमेश शर्मा",
  "checkout.mobileNumber": "मोबाइल नंबर",
  "checkout.mobilePlaceholder": "10 अंकों का मोबाइल नंबर",
  "checkout.deliveryAddress": "डिलीवरी पता",
  "checkout.addressPlaceholder": "मकान/दुकान नं., इमारत, सड़क, क्षेत्र, लैंडमार्क, पिनकोड",
  "checkout.shopNameOptional": "दुकान का नाम (वैकल्पिक)",
  "checkout.shopPlaceholder": "जैसे ABC स्टोर्स",
  "checkout.placeOrder": "व्हाट्सऐप पर ऑर्डर करें",
  "checkout.savedNote": "आपका ऑर्डर हमारे पास सुरक्षित है, भले ही आप व्हाट्सऐप संदेश न भेजें।",
  "checkout.welcomeBack": "वापस स्वागत है, {name}! आपकी जानकारी भर दी गई है।",
  "checkout.notYou": "आप नहीं?",
  "checkout.orderSaved": "ऑर्डर सहेजा गया!",
  "checkout.yourOrderId": "आपका ऑर्डर आईडी है",
  "checkout.recordedNote":
    "हमने आपका ऑर्डर दर्ज कर लिया है। डिलीवरी पक्की करने के लिए नीचे टैप करके व्हाट्सऐप पर भेजें।",
  "checkout.sendWhatsApp": "व्हाट्सऐप पर भेजें",
  "checkout.minNotice": "न्यूनतम ऑर्डर {min} है। {more} और जोड़ें।",

  "contact.title": "संपर्क करें",
  "contact.subtitle": "हम आपके थोक या खुदरा ऑर्डर में मदद के लिए तैयार हैं।",
  "contact.phone": "फ़ोन",
  "contact.address": "पता",
  "contact.open": "खुला",
  "contact.chatWhatsApp": "व्हाट्सऐप पर चैट करें",
  "contact.getDirections": "गूगल मैप्स पर दिशा देखें",

  "footer.tagline":
    "थोक और खुदरा किराना आपूर्तिकर्ता। उत्पाद देखें, अपना ऑर्डर बनाएँ और व्हाट्सऐप पर भेजें — डिलीवरी हम संभालेंगे।",
  "footer.categories": "श्रेणियाँ",
  "footer.admin": "एडमिन",
  "footer.viewMap": "(नक्शा देखें)",
  "footer.rights": "सर्वाधिकार सुरक्षित।",
};

const mr: Dict = {
  "header.retail": "किरकोळ",
  "header.wholesale": "घाऊक",

  "common.contact": "संपर्क",
  "common.add": "जोडा",
  "common.outOfStock": "स्टॉक संपला",
  "common.inStock": "उपलब्ध",
  "common.grandTotal": "एकूण रक्कम",
  "common.proceedToCheckout": "पुढे चला",
  "common.browseProducts": "उत्पादने पहा",
  "common.continueShopping": "खरेदी सुरू ठेवा",
  "common.viewAll": "सर्व पहा",
  "common.addMore": "आणखी वस्तू जोडा",

  "home.heroTitle1": "तुमचं विश्वासू किराणा दुकान,",
  "home.heroTitle2": "आता ऑनलाइन",
  "home.heroSubtitle":
    "उत्पादने पहा, तुमची ऑर्डर तयार करा आणि व्हॉट्सअ‍ॅपवर पाठवा. घाऊक आणि किरकोळ दर.",
  "home.shopRetail": "किरकोळ खरेदी",
  "home.shopRetailDesc": "घर आणि कुटुंबांसाठी",
  "home.startShopping": "खरेदी सुरू करा",
  "home.shopWholesale": "घाऊक खरेदी",
  "home.shopWholesaleDesc": "दुकाने आणि व्यवसायांसाठी",
  "home.bulkPrices": "घाऊक दर",
  "home.retailDelivery": "30 मिनिटांत डिलिव्हरी",
  "home.wholesaleDelivery": "त्याच दिवशी डिलिव्हरी",
  "home.promo1": "🪔 दिवाळी विशेष ऑफर",
  "home.promo2": "🚚 30 मिनिटांत डिलिव्हरी",
  "home.promo3": "💰 जास्त खरेदी, जास्त बचत",
  "home.retailBadge": "15% पर्यंत सूट",
  "home.wholesaleBadge": "उत्तम घाऊक दर",
  "home.shopByCategory": "वर्गानुसार खरेदी",
  "home.popularProducts": "लोकप्रिय उत्पादने",
  "home.trending": "ट्रेंडिंग उत्पादने",
  "home.searchPlaceholder": "उत्पादने शोधा…",

  "cart.title": "तुमची कार्ट",
  "cart.empty": "तुमची कार्ट रिकामी आहे",
  "cart.emptyDesc": "सुरू करण्यासाठी काही उत्पादने जोडा.",
  "cart.priceNote": "अंतिम किंमत दुकान व्हॉट्सअ‍ॅपवर सांगेल. ऑनलाइन पेमेंटची गरज नाही.",
  "cart.minNotice": "किमान ऑर्डर {min} साठी {more} आणखी जोडा.",

  "checkout.title": "चेकआउट",
  "checkout.retailOrder": "किरकोळ ऑर्डर",
  "checkout.wholesaleOrder": "घाऊक ऑर्डर",
  "checkout.paymentNote": "ऑनलाइन पेमेंट नाही. आम्ही सर्व व्हॉट्सअ‍ॅपवर निश्चित करतो.",
  "checkout.yourName": "तुमचं नाव",
  "checkout.namePlaceholder": "उदा. रमेश शर्मा",
  "checkout.mobileNumber": "मोबाइल नंबर",
  "checkout.mobilePlaceholder": "10 अंकी मोबाइल नंबर",
  "checkout.deliveryAddress": "डिलिव्हरी पत्ता",
  "checkout.addressPlaceholder": "घर/दुकान क्र., इमारत, रस्ता, परिसर, खूण, पिनकोड",
  "checkout.shopNameOptional": "दुकानाचं नाव (ऐच्छिक)",
  "checkout.shopPlaceholder": "उदा. ABC स्टोअर्स",
  "checkout.placeOrder": "व्हॉट्सअ‍ॅपवर ऑर्डर करा",
  "checkout.savedNote": "तुम्ही व्हॉट्सअ‍ॅप संदेश पाठवला नाही तरी तुमची ऑर्डर आमच्याकडे जतन होते.",
  "checkout.welcomeBack": "पुन्हा स्वागत आहे, {name}! तुमची माहिती भरली आहे.",
  "checkout.notYou": "तुम्ही नाही?",
  "checkout.orderSaved": "ऑर्डर जतन झाली!",
  "checkout.yourOrderId": "तुमचा ऑर्डर आयडी आहे",
  "checkout.recordedNote":
    "आम्ही तुमची ऑर्डर नोंदवली आहे. डिलिव्हरी निश्चित करण्यासाठी खाली टॅप करून व्हॉट्सअ‍ॅपवर पाठवा.",
  "checkout.sendWhatsApp": "व्हॉट्सअ‍ॅपवर पाठवा",
  "checkout.minNotice": "किमान ऑर्डर {min} आहे. {more} आणखी जोडा.",

  "contact.title": "संपर्क करा",
  "contact.subtitle": "तुमच्या घाऊक किंवा किरकोळ ऑर्डरसाठी आम्ही मदतीला तयार आहोत.",
  "contact.phone": "फोन",
  "contact.address": "पत्ता",
  "contact.open": "उघडे",
  "contact.chatWhatsApp": "व्हॉट्सअ‍ॅपवर चॅट करा",
  "contact.getDirections": "गूगल मॅप्सवर दिशा पहा",

  "footer.tagline":
    "घाऊक आणि किरकोळ किराणा पुरवठादार. उत्पादने पहा, तुमची ऑर्डर तयार करा आणि व्हॉट्सअ‍ॅपवर पाठवा — डिलिव्हरी आम्ही सांभाळू.",
  "footer.categories": "वर्ग",
  "footer.admin": "अ‍ॅडमिन",
  "footer.viewMap": "(नकाशा पहा)",
  "footer.rights": "सर्व हक्क राखीव.",
};

const dictionaries: Record<Locale, Dict> = { en, hi, mr };

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const table = dictionaries[locale] ?? dictionaries.en;
  let text = table[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "hi" || value === "mr";
}
