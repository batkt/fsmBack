const { db }: any = require("zevbackv2");
import mongoose from "mongoose";

export const baiguullagaBurtgekh = async (data: any) => {
  const { 
    baiguullagiinId, 
    baaziinNer, 
    cloudMongoDBEsekh, 
    clusterUrl, 
    password, 
    userName 
  } = data;

  const bId = baiguullagiinId || new mongoose.Types.ObjectId().toString();

  // Validate required fields
  if (!baaziinNer || !clusterUrl || !userName || !password) {
    throw new Error("Бүх шаардлагатай талбаруудыг бөглөнө үү (baaziinNer, clusterUrl, userName, password)");
  }

  // Check if this company should have FSM access
  // Only create FSM connection if explicitly requested and valid
  try {
    // Check if company already has FSM config in baaziinMedeelel
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (mainConn) {
      const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
      const existingConfig = await baaziinMedeelelCol.findOne({
        baiguullagiinId: bId,
        fsmEsekh: true
      });

      // If no existing FSM config found, don't create connection
      // This prevents creating connections for companies that shouldn't have FSM
      if (!existingConfig) {
        console.warn(`[DB Service] Company ${bId} does not have FSM access configured. Skipping connection creation.`);
        throw new Error(`Энэ байгууллагад FSM системд хандах эрх байхгүй байна.`);
      }
    }

    // Wrap in Promise.race to add timeout
    await Promise.race([
      db.kholboltNemyeFSM(
        bId,
        baaziinNer,
        cloudMongoDBEsekh,
        clusterUrl,
        password,
        userName
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database connection timeout after 30 seconds")), 30000)
      )
    ]);
  } catch (error: any) {
    // Log the error for debugging
    console.error("[DB Service] Error creating FSM connection:", {
      baiguullagiinId: bId,
      baaziinNer,
      clusterUrl,
      error: error.message || error.toString()
    });
    
    // Re-throw with a more user-friendly message
    if (error.message?.includes("FSM системд хандах эрх")) {
      throw error; // Re-throw validation errors as-is
    }
    if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
      throw new Error(`MongoDB холболт хийхэд хугацаа дууссан. Сервер ${clusterUrl} хүртээмжтэй эсэхийг шалгана уу.`);
    }
    throw new Error(`MongoDB холболт үүсгэхэд алдаа гарлаа: ${error.message || error.toString()}`);
  }

  return { baiguullagiinId: bId, baaziinNer };
};

export const baiguullagaJagsaalt = async () => {
  const conn = db.erunkhiiKholbolt.kholbolt;
  return await conn.collection("baaziinMedeelel").find({}).toArray();
};
