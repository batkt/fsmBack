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
        
        const { cloudMongoDBEsekh, clusterUrl, password, userName } = config;
        
        if (!dbName) {
          console.warn(`[FSM] ⚠️ Skipping config with no database name: ${JSON.stringify(config)}`);
          continue;
        }

        // Register the connection in zevbackv2's registry (db.kholboltuud)
        // Primary registration ID (used by zevbackv2 internals)
        const primaryKey = orgId || internalId;
        
        await db.kholboltNemyeFSM(
          primaryKey,
          dbName,
          cloudMongoDBEsekh,
          clusterUrl,
          password,
          userName
        );

        // Find the newly added connection in the registry array and add helper identifiers
        if (db.kholboltuud && Array.isArray(db.kholboltuud)) {
          const connObj = db.kholboltuud.find((c: any) => c.baaziinNer === dbName && (c.baiguullagiinId === primaryKey || c.baiguullagiinId === orgId));
          
          if (connObj) {
            // Standardize identifiers for easier lookup
            connObj.baiguullagiinId = orgId || primaryKey;
            connObj.dotoodNer = shortName;
            connObj._id = internalId;
            
            console.log(`[FSM] ✅ Loaded ${dbName} (Org: ${orgId || shortName}). State: ${connObj.kholbolt?.readyState}`);
          } else {
            console.warn(`[FSM] ⚠️ Registered ${dbName} but could not find it in registry for decoration`);
          }
        }
      } catch (err) {
        console.error(`[FSM] ❌ Failed to load connection for ${config.baaziinNer || config.baaz}:`, err);
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
