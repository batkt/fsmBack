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

  const bId = baiguullagiinId 

  if (!baaziinNer || !clusterUrl || !userName || !password) {
    throw new Error("Бүх шаардлагатай талбаруудыг бөглөнө үү (baaziinNer, clusterUrl, userName, password)");
  }
  try {
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) {
      throw new Error("Main database connection not available");
    }

    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    let dbConfig = await baaziinMedeelelCol.findOne({
      baaz: baaziinNer,
      fsmEsekh: true
    });

    if (!dbConfig) {
      const dbConfigCaseInsensitive = await baaziinMedeelelCol.findOne({
        baaz: { $regex: new RegExp(`^${baaziinNer}$`, "i") },
        fsmEsekh: true
      });

      if (!dbConfigCaseInsensitive) {
        console.warn(`[DB Service] Database ${baaziinNer} is not registered for FSM access in baaziinMedeelel`);
        throw new Error(`Энэ бааз (${baaziinNer}) FSM системд бүртгэгдээгүй байна.`);
      }
      dbConfig = dbConfigCaseInsensitive;
    }
    if (dbConfig && dbConfig.baiguullagiinId && dbConfig.baiguullagiinId !== bId) {
      console.warn(`[DB Service] baiguullagiinId mismatch: Request has ${bId}, but baaziinMedeelel has ${dbConfig.baiguullagiinId} for database ${baaziinNer}. Allowing connection anyway.`);
    }

    console.log(`[DB Service] ✅ FSM access validated for database ${baaziinNer}${dbConfig ? ` (registered by ${dbConfig.baiguullagiinId})` : ''}`);

    await db.kholboltNemyeFSM(
      bId,
      baaziinNer,
      cloudMongoDBEsekh,
      clusterUrl,
      password,
      userName
    );

    try {
      const mongoUri = `mongodb://${userName}:${password}@${clusterUrl}/${baaziinNer}?authSource=admin`;
      const testConnection = mongoose.createConnection(mongoUri);
      
      await new Promise<void>((resolve, reject) => {
        testConnection.on("connected", async () => {
          try {
            // Create a test collection to ensure the database exists
            const testCol = testConnection.db.collection("_fsm_init");
            await testCol.insertOne({ 
              initialized: new Date(),
              baiguullagiinId: bId,
              baaz: baaziinNer
            });
            // Delete the test document immediately
            await testCol.deleteOne({ baiguullagiinId: bId });
            console.log(`[DB Service] ✅ FSM database ${baaziinNer} initialized and verified`);
            testConnection.close();
            resolve();
          } catch (err: any) {
            console.error(`[DB Service] Error initializing database ${baaziinNer}:`, err);
            testConnection.close();
            reject(err);
          }
        });

        testConnection.on("error", (err) => {
          console.error(`[DB Service] Error connecting to ${baaziinNer}:`, err);
          testConnection.close();
          reject(err);
        });

        // If already connected, resolve immediately
        if (testConnection.readyState === 1) {
          resolve();
        }
      });
    } catch (initError: any) {
      // Log but don't fail - zevbackv2 might have already created it
      console.warn(`[DB Service] Could not verify database initialization for ${baaziinNer}:`, initError.message);
    }

  } catch (error: any) {
    // Log the error for debugging
    console.error("[DB Service] Error creating FSM connection:", {
      baiguullagiinId: bId,
      baaziinNer,
      clusterUrl,
      error: error.message || error.toString()
    });
    
    // Re-throw with a more user-friendly message
    if (error.message?.includes("FSM системд хандах эрх") || error.message?.includes("бүртгэгдээгүй")) {
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
