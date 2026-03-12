import { Response } from "express";

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
