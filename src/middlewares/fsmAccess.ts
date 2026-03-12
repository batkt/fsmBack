import { Response } from "express";

/**
 * Get list of baiguullagiinId that have FSM access
 * Used for filtering GET requests
 */
export const getFSMAuthorizedBaiguullagiinIds = async (): Promise<string[]> => {
  try {
    const { db }: any = require("zevbackv2");
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    
    if (!mainConn) {
      return [];
    }

    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    // Get all baiguullagiinId that have FSM access
    const fsmConfigs = await baaziinMedeelelCol.find({
      fsmEsekh: true
    }).toArray();
    
    return fsmConfigs
      .map((config: any) => config.baiguullagiinId)
      .filter((id: any) => id); // Remove null/undefined
  } catch (error: any) {
    console.error("[FSM Access] Error getting authorized IDs:", error);
    return [];
  }
};

/**
 * Middleware to validate that baiguullagiinId has FSM access
 * Checks if the baiguullagiinId exists in baaziinMedeelel with fsmEsekh: true
 */
export const validateFSMAccess = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    
    if (!bid) {
      return res.status(400).json({ 
        success: false, 
        message: "Байгууллагын ID шаардлагатай" 
      });
    }

    const { db }: any = require("zevbackv2");
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    
    if (!mainConn) {
      return res.status(500).json({ 
        success: false, 
        message: "Мэдээллийн сангийн холболт алдаатай байна" 
      });
    }

    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    // Check if this baiguullagiinId is registered for FSM access
    const fsmConfig = await baaziinMedeelelCol.findOne({
      baiguullagiinId: bid,
      fsmEsekh: true
    });
    
    if (!fsmConfig) {
      return res.status(403).json({ 
        success: false, 
        message: `Тухайн байгууллага FSM системд хандах эрхгүй байна.` 
      });
    }

    // Store the validated baiguullagiinId in request for use in controllers
    req.validatedBaiguullagiinId = bid;
    next();
  } catch (error: any) {
    console.error("[FSM Access Validation] Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "FSM эрх шалгахад алдаа гарлаа" 
    });
  }
};

/**
 * Middleware to filter GET requests to only return data for companies with FSM access
 * Adds baiguullagiinId filter to query if not already present
 */
export const filterFSMAccess = async (req: any, res: Response, next: any) => {
  try {
    const authorizedIds = await getFSMAuthorizedBaiguullagiinIds();
    
    if (authorizedIds.length === 0) {
      // If no authorized IDs found, return empty results
      req.fsmAuthorizedIds = [];
      return next();
    }

    // Store authorized IDs in request for controllers to use
    req.fsmAuthorizedIds = authorizedIds;
    
    // If baiguullagiinId is already in query, validate it
    if (req.query.baiguullagiinId) {
      if (!authorizedIds.includes(req.query.baiguullagiinId)) {
        // If requested baiguullagiinId is not authorized, return empty results
        req.query.baiguullagiinId = null; // Will be filtered in controller
      }
    }
    
    next();
  } catch (error: any) {
    console.error("[FSM Filter] Error:", error);
    // On error, continue but with empty authorized list
    req.fsmAuthorizedIds = [];
    next();
  }
};
