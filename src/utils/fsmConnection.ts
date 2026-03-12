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
export async function loadAllFsmConnections(): Promise<void> {
  try {
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) return;

    const configs = await mainConn.collection("baaziinMedeelel").find({ fsmEsekh: true }).toArray();
    console.log(`[FSM] 🔍 Processing ${configs.length} configurations...`);

    // Grouping configurations by database name to prevent redundant connections
    const dbGroups = new Map<string, any[]>();
    for (const config of configs) {
      const dbName = config.baaziinNer || config.baaz;
      if (!dbName) continue;
      if (!dbGroups.has(dbName)) dbGroups.set(dbName, []);
      dbGroups.get(dbName)?.push(config);
    }

    console.log(`[FSM] 📂 Unique databases to connect: ${dbGroups.size}`);

    for (const [dbName, dbConfigs] of dbGroups) {
      try {
        // Use the first config in the group for connection credentials
        const sample = dbConfigs[0];
        const primaryOrgId = sample.baiguullagiinId || sample._id.toString();
        
        // Only connect if not already present in the registry
        let connObj = Array.isArray(db.kholboltuud) 
          ? db.kholboltuud.find((c: any) => c.baaziinNer === dbName)
          : null;

        if (!connObj) {
          await db.kholboltNemyeFSM(
            primaryOrgId,
            dbName,
            sample.cloudMongoDBEsekh,
            sample.clusterUrl,
            sample.password,
            sample.userName
          );
          
          // Wait briefly for registry update
          await new Promise(r => setTimeout(r, 100));
          connObj = db.kholboltuud.find((c: any) => c.baaziinNer === dbName);
        }

        if (connObj) {
          // Initialize a Set for aliases if not present
          if (!connObj.orgIds) connObj.orgIds = new Set<string>();
          
          // Map ALL org IDs and short names associated with this DB to this connection object
          for (const cfg of dbConfigs) {
            if (cfg.baiguullagiinId) connObj.orgIds.add(cfg.baiguullagiinId.toString());
            if (cfg._id) connObj.orgIds.add(cfg._id.toString());
            if (cfg.dotoodNer) connObj.orgIds.add(cfg.dotoodNer);
          }

          const state = connObj.kholbolt?.readyState;
          console.log(`[FSM] ${state === 1 ? '✅' : '⏳'} ${dbName} mapped to ${connObj.orgIds.size} IDs. (State: ${state})`);
        }
      } catch (err) {
        console.error(`[FSM] ❌ Failed to connect to database ${dbName}:`, err);
      }
    }
  } catch (error) {
    console.error("[FSM] ❌ Critical error during tenant loading:", error);
    throw error;
  }
}
