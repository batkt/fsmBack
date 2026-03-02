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
export async function connectFSMDatabase(): Promise<void> {
  try {
    // Check if zevbackv2 already has FSM connections set up
    if (db.erunkhiiKholbolt?.kholboltFSM) {
      console.log("[FSM Connection] kholboltFSM already exists, skipping setup");
      return;
    }

    // Get the main connection (turees database) to query baiguullaga collection
    // baiguullaga and ajiltan are stored in the main turees database, not FSM
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) {
      throw new Error("Main database connection not available");
    }

    // Check if zevbackv2 has any FSM connections stored elsewhere
    console.log("[FSM Connection] Checking zevbackv2 FSM connections...");
    console.log("[FSM Connection] db.erunkhiiKholbolt keys:", Object.keys(db.erunkhiiKholbolt || {}));

    // Query baaziinMedeelel collection from main turees database for FSM database config
    // The FSM config is stored in baaziinMedeelel, not baiguullaga
    const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");
    
    // Try multiple query patterns to find FSM config
    let fsmConfig = await baaziinMedeelelCol.findOne({
      fsmEsekh: true,
      baaz: "fManageFsm",
    });

    // If not found, try with just fsmEsekh: true
    if (!fsmConfig) {
      console.log("[FSM Connection] Trying query with just fsmEsekh: true");
      fsmConfig = await baaziinMedeelelCol.findOne({
        fsmEsekh: true,
      });
    }

    // If still not found, try with just baaz: "fManageFsm"
    if (!fsmConfig) {
      console.log("[FSM Connection] Trying query with just baaz: 'fManageFsm'");
      fsmConfig = await baaziinMedeelelCol.findOne({
        baaz: "fManageFsm",
      });
    }

    // If still not found, try with baaz containing "fManage"
    if (!fsmConfig) {
      console.log("[FSM Connection] Trying query with baaz containing 'fManage'");
      fsmConfig = await baaziinMedeelelCol.findOne({
        baaz: { $regex: /fManage/i },
      });
    }

    if (!fsmConfig) {
      console.warn(
        "[FSM Connection] No FSM database config found in baaziinMedeelel collection. " +
          "Using main database connection as fallback for kholboltFSM.",
      );
      // Set kholboltFSM to main connection as fallback so models don't crash
      if (db.erunkhiiKholbolt) {
        db.erunkhiiKholbolt.kholboltFSM = db.erunkhiiKholbolt.kholbolt;
        console.log("[FSM Connection] kholboltFSM set to main connection as fallback");
      }
      return;
    }

    console.log("[FSM Connection] Found FSM config:", {
      baaz: fsmConfig.baaz,
      clusterUrl: fsmConfig.clusterUrl,
      userName: fsmConfig.userName,
    });

    // Build MongoDB connection URI
    const { clusterUrl, userName, password, baaz } = fsmConfig;
    const mongoUri = `mongodb://${userName}:${password}@${clusterUrl}/${baaz}?authSource=admin`;

    // Create a new mongoose connection for FSM database
    const fsmConnection = mongoose.createConnection(mongoUri);

    // Wait for connection to be established
    await new Promise<void>((resolve, reject) => {
      fsmConnection.on("connected", () => {
        console.log(`[FSM Connection] Connected to ${baaz} database at ${clusterUrl}`);
        resolve();
      });

      fsmConnection.on("error", (err) => {
        console.error(`[FSM Connection] Error connecting to ${baaz}:`, err);
        reject(err);
      });

      // If already connected, resolve immediately
      if (fsmConnection.readyState === 1) {
        resolve();
      }
    });

    // Set kholboltFSM on the connection object for models to use
    if (db.erunkhiiKholbolt) {
      db.erunkhiiKholbolt.kholboltFSM = fsmConnection;
      console.log("[FSM Connection] kholboltFSM set successfully");
      
      // Verify it's set
      if (db.erunkhiiKholbolt.kholboltFSM) {
        console.log("[FSM Connection] Verified: kholboltFSM is now available");
      } else {
        console.error("[FSM Connection] ERROR: kholboltFSM was not set properly!");
      }
    } else {
      throw new Error("db.erunkhiiKholbolt not available");
    }
  } catch (error) {
    console.error("[FSM Connection] Failed to connect to FSM database:", error);
    throw error;
  }
}
