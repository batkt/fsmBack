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
  // First check baaziinMedeelel to see if this database name is allowed
  try {
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) {
      throw new Error("Main database connection not available");
    }

    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    // Step 1: Check if the database name (baaziinNer) exists in baaziinMedeelel with fsmEsekh: true
    // This is the primary check - the database must be registered for FSM access
    const dbConfig = await baaziinMedeelelCol.findOne({
      baaz: baaziinNer,
      fsmEsekh: true
    });

    if (!dbConfig) {
      // Try case-insensitive match
      const dbConfigCaseInsensitive = await baaziinMedeelelCol.findOne({
        baaz: { $regex: new RegExp(`^${baaziinNer}$`, "i") },
        fsmEsekh: true
      });

      if (!dbConfigCaseInsensitive) {
        console.warn(`[DB Service] Database ${baaziinNer} is not registered for FSM access in baaziinMedeelel`);
        throw new Error(`Энэ бааз (${baaziinNer}) FSM системд бүртгэгдээгүй байна.`);
      }
    }

    // Step 2: If database exists, check if the baiguullagiinId matches
    // If baiguullagiinId is provided in the request, verify it matches the one in baaziinMedeelel
    // If it doesn't match, we still allow it (since multiple companies might use the same FSM database)
    // but log a warning
    if (dbConfig && dbConfig.baiguullagiinId && dbConfig.baiguullagiinId !== bId) {
      console.warn(`[DB Service] baiguullagiinId mismatch: Request has ${bId}, but baaziinMedeelel has ${dbConfig.baiguullagiinId} for database ${baaziinNer}. Allowing connection anyway.`);
    }

    console.log(`[DB Service] ✅ FSM access validated for database ${baaziinNer}${dbConfig ? ` (registered by ${dbConfig.baiguullagiinId})` : ''}`);

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
