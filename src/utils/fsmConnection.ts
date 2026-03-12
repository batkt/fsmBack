import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

/**
 * Connects to the FSM database (fManageFsm) using credentials from baaziinMedeelel collection
 * Sets the connection as kholboltFSM for models to use
 * 
 * Note: baiguullaga and ajiltan collections are in the main turees database (kholbolt),
 * not in the FSM database. The FSM database config is stored in baaziinMedeelel collection.
 * This function queries baaziinMedeelel from the main DB to get FSM connection config,
 * then connects to the separate fManageFsm database.
 */
/**
 * Loads all registered FSM tenant connections from the main database at startup.
 * Queries baaziinMedeelel collection and registers each one using zevbackv2.
 */
export async function loadAllFsmConnections(): Promise<void> {
  try {
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) {
      console.error("[FSM] ❌ Main database connection not available for loading tenants");
      return;
    }

    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    // Find all configurations registered for FSM
    const configs = await baaziinMedeelelCol.find({
      fsmEsekh: true
    }).toArray();

    console.log(`[FSM] 🔍 Found ${configs.length} FSM configurations to load.`);

    for (const config of configs) {
      try {
        const orgId = config.baiguullagiinId;
        const internalId = config._id.toString();
        const shortName = config.dotoodNer;
        const dbName = config.baaziinNer || config.baaz;
        
        if (!dbName) continue;

        // Check if this database name is already registered to avoid duplicates
        const existing = Array.isArray(db.kholboltuud) 
          ? db.kholboltuud.find((c: any) => c.baaziinNer === dbName)
          : null;

        if (!existing) {
          const { cloudMongoDBEsekh, clusterUrl, password, userName } = config;
          const primaryKey = orgId || internalId;
          
          await db.kholboltNemyeFSM(
            primaryKey,
            dbName,
            cloudMongoDBEsekh,
            clusterUrl,
            password,
            userName
          );
        }

        // Standardize identifiers in the registry array
        if (db.kholboltuud && Array.isArray(db.kholboltuud)) {
          const connObj = db.kholboltuud.find((c: any) => c.baaziinNer === dbName);
          
          if (connObj) {
            if (orgId) connObj.baiguullagiinId = orgId;
            if (shortName) connObj.dotoodNer = shortName;
            if (internalId && !connObj._id) connObj._id = internalId;
            
            const state = connObj.kholbolt?.readyState;
            console.log(`[FSM] ${state === 1 ? '✅' : '⏳'} ${dbName} (Org: ${orgId || shortName}). State: ${state}`);
          }
        }
      } catch (err) {
        console.error(`[FSM] ❌ Failed to process ${config.baaziinNer || config.baaz}:`, err);
      }
    }

    // Set a fallback for the global object to prevent crashes in non-tenant contexts
    // but prioritize tenant-specific connections in controllers.
    if (db.erunkhiiKholbolt && !db.erunkhiiKholbolt.kholboltFSM) {
       // Optional: Set a default FSM connection if needed, otherwise leave it for explicit 404s
       console.log("[FSM] ℹ️ Startup configuration loading completed.");
    }

  } catch (error) {
    console.error("[FSM] ❌ Critical error during tenant loading:", error);
    throw error;
  }
}
