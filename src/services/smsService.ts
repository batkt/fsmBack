/**
 * SMS Service for sending OTP codes using CallPro API
 * 
 * This service uses the msgIlgeeye function pattern to send SMS via CallPro API.
 * It retrieves CallPro credentials (msgIlgeekhKey, msgIlgeekhDugaar) from baiguullaga.tokhirgoo
 */

import { getConn } from "../utils/db";
const request = require("request");

const getCol = (name: string) => getConn().kholbolt.collection(name);

interface SMSOptions {
  to: string; // Phone number
  message: string; // SMS message content
  baiguullagiinId?: string; // Company ID to get CallPro credentials
}

/**
 * Get CallPro credentials from baiguullaga
 */
const getCallProCredentials = async (baiguullagiinId: string): Promise<{ key: string; dugaar: string }> => {
  if (!baiguullagiinId) {
    throw new Error("Байгууллагын ID шаардлагатай");
  }

  const baiguullaga = await getCol("baiguullaga").findOne({ 
    _id: require("mongoose").Types.ObjectId(baiguullagiinId) 
  });

  if (!baiguullaga || !baiguullaga.tokhirgoo) {
    throw new Error("Байгууллагын тохиргоо олдсонгүй");
  }

  const msgIlgeekhKey = baiguullaga.tokhirgoo.msgIlgeekhKey;
  const msgIlgeekhDugaar = baiguullaga.tokhirgoo.msgIlgeekhDugaar;

  if (!msgIlgeekhKey || !msgIlgeekhDugaar) {
    throw new Error("CallPro тохиргоо бүрэн бус байна (msgIlgeekhKey, msgIlgeekhDugaar)");
  }

  return { key: msgIlgeekhKey, dugaar: msgIlgeekhDugaar };
};

/**
 * Send SMS message using CallPro API (msgIlgeeye function pattern)
 * 
 * @param options SMS options including phone number, message, and optional baiguullagiinId
 * @returns Promise<boolean> - true if sent successfully
 */
export const sendSMS = async (options: SMSOptions): Promise<boolean> => {
  const { to, message, baiguullagiinId } = options;

  try {
    if (!to || !message) {
      throw new Error("Утасны дугаар болон мессеж шаардлагатай");
    }

    // If baiguullagiinId is provided, get CallPro credentials from baiguullaga
    let key: string;
    let dugaar: string;

    if (baiguullagiinId) {
      const credentials = await getCallProCredentials(baiguullagiinId);
      key = credentials.key;
      dugaar = credentials.dugaar;
    } else {
      // Fallback to environment variables if baiguullagiinId not provided
      key = process.env.MSG_ILGEEKH_KEY || "";
      dugaar = process.env.MSG_ILGEEKH_DUGAAR || "";
      
      if (!key || !dugaar) {
        throw new Error("CallPro тохиргоо олдсонгүй (MSG_ILGEEKH_KEY, MSG_ILGEEKH_DUGAAR эсвэл baiguullagiinId шаардлагатай)");
      }
    }

    // Check if MSG_SERVER is configured
    const msgServer = process.env.MSG_SERVER;
    if (!msgServer) {
      throw new Error("MSG_SERVER тохиргоо олдсонгүй (.env файлд MSG_SERVER тохируулна уу)");
    }

    // Build CallPro API URL
    let url = `${msgServer}/send` +
      `?key=${key}` +
      `&from=${dugaar}` +
      `&to=${to}` +
      `&text=${message}`;
    
    url = encodeURI(url);

    console.log(`[SMS] Sending SMS via CallPro to ${to}`);

    // Send SMS using CallPro API
    return new Promise((resolve, reject) => {
      request(url, { json: true }, (err: any, res: any, body: any) => {
        if (err) {
          console.error("[SMS] CallPro API error:", err);
          reject(new Error("SMS илгээхэд алдаа гарлаа: " + err.message));
          return;
        }

        if (res && res.statusCode !== 200) {
          console.error("[SMS] CallPro API returned error status:", res.statusCode, body);
          reject(new Error(`SMS илгээхэд алдаа гарлаа (Status: ${res.statusCode})`));
          return;
        }

        console.log(`[SMS] ✅ SMS sent successfully to ${to}`);
        console.log(`[SMS] Response:`, body);
        resolve(true);
      });
    });

  } catch (error: any) {
    console.error("[SMS] Failed to send SMS:", error);
    throw new Error(error.message || "SMS илгээхэд алдаа гарлаа");
  }
};

/**
 * Format phone number for SMS
 * Ensures phone number is in correct format (e.g., +976xxxxxxxx)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If it starts with 0, replace with country code
  if (cleaned.startsWith("0")) {
    cleaned = "976" + cleaned.substring(1);
  }
  
  // If it doesn't start with country code, add it
  if (!cleaned.startsWith("976")) {
    cleaned = "976" + cleaned;
  }
  
  // Add + prefix
  return "+" + cleaned;
};
