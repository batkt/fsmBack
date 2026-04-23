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

    // Try to get CallPro credentials from baiguullaga first, fallback to environment variables
    let key: string = "";
    let dugaar: string = "";

    if (baiguullagiinId) {
      try {
        const credentials = await getCallProCredentials(baiguullagiinId);
        key = credentials.key;
        dugaar = credentials.dugaar;
        console.log(`[SMS] ✅ Using CallPro credentials from baiguullaga (ID: ${baiguullagiinId})`);
      } catch (dbError: any) {
        // If database credentials fail, fallback to environment variables
        console.log(`[SMS] ⚠️ Could not get credentials from database: ${dbError.message}`);
        console.log(`[SMS] Falling back to environment variables...`);
        key = process.env.MSG_ILGEEKH_KEY || "";
        dugaar = process.env.MSG_ILGEEKH_DUGAAR || "";
      }
    } else {
      // Use environment variables if baiguullagiinId not provided
      key = process.env.MSG_ILGEEKH_KEY || "";
      dugaar = process.env.MSG_ILGEEKH_DUGAAR || "";
    }

    // Final check - if still no credentials, throw error
    if (!key || !dugaar) {
      const errorMsg = baiguullagiinId
        ? `CallPro тохиргоо олдсонгүй. Баазад (baiguullaga.tokhirgoo.msgIlgeekhKey, msgIlgeekhDugaar) эсвэл .env файлд (MSG_ILGEEKH_KEY, MSG_ILGEEKH_DUGAAR) тохируулна уу.`
        : `CallPro тохиргоо олдсонгүй. .env файлд MSG_ILGEEKH_KEY болон MSG_ILGEEKH_DUGAAR тохируулна уу.`;
      throw new Error(errorMsg);
    }

    if (!baiguullagiinId || (key === process.env.MSG_ILGEEKH_KEY && dugaar === process.env.MSG_ILGEEKH_DUGAAR)) {
      console.log(`[SMS] ✅ Using CallPro credentials from environment variables`);
    }

    // Check if MSG_SERVER is configured
    const msgServer = process.env.MSG_SERVER;
    if (!msgServer) {
      throw new Error("MSG_SERVER тохиргоо олдсонгүй (.env файлд MSG_SERVER тохируулна уу)");
    }

    // Format phone number for CallPro API (remove + prefix, use local format)
    const phoneForCallPro = formatPhoneForCallPro(to);
    
    // Build CallPro API URL - encode only the message parameter
    const encodedMessage = encodeURIComponent(message);
    const url = `${msgServer}/send?key=${key}&from=${dugaar}&to=${phoneForCallPro}&text=${encodedMessage}`;

    console.log(`[SMS] Sending SMS via CallPro to ${phoneForCallPro} (original: ${to})`);
    console.log(`[SMS] URL (redacted key): ${msgServer}/send?key=***&from=${dugaar}&to=${phoneForCallPro}`);

    // Send SMS using CallPro API
    return new Promise((resolve, reject) => {
      request(url, { json: true, timeout: 10000 }, (err: any, res: any, body: any) => {
        if (err) {
          console.error("[SMS] ❌ CallPro API Network Error:", err);
          reject(new Error(`SMS илгээхэд сүлжээний алдаа гарлаа: ${err.message}`));
          return;
        }

        const statusCode = res?.statusCode;
        console.log(`[SMS] Response Status: ${statusCode}`);
        console.log(`[SMS] Response Body:`, JSON.stringify(body));

        if (statusCode !== 200) {
          console.error("[SMS] ❌ CallPro API returned error status:", statusCode, body);
          const errorReason = body?.reason || body?.message || body?.error || "Unknown error";
          reject(new Error(`SMS илгээхэд алдаа гарлаа (Status: ${statusCode}): ${errorReason}`));
          return;
        }

        // MessagePro sometimes returns 200 even for some errors inside the body
        if (body && body.success === false) {
           console.error("[SMS] ❌ CallPro API success:false in body:", body);
           reject(new Error(`SMS илгээхэд алдаа гарлаа: ${body.message || "Unknown provider error"}`));
           return;
        }

        console.log(`[SMS] ✅ SMS sent successfully to ${to}`);
        resolve(true);
      });
    });

  } catch (error: any) {
    console.error("[SMS] ❌ Failed to send SMS:", error);
    throw new Error(error.message || "SMS илгээхэд алдаа гарлаа");
  }
};


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

const formatPhoneForCallPro = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("976")) {
    cleaned = cleaned.substring(3);
  }
  
  // If it starts with 0, remove the 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
};
