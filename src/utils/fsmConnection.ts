import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

/**
 * Connects to the FSM database (fManageFsm) using credentials from baiguullaga collection
 * Sets the connection as kholboltFSM for models to use
 * 
 * Note: baiguullaga and ajiltan collections are in the main turees database (kholbolt),
 * not in the FSM database. This function queries baiguullaga from the main DB to get
 * FSM connection config, then connects to the separate fManageFsm database.
 */
export async function connectFSMDatabase(): Promise<void> {
  try {
    // Get the main connection (turees database) to query baiguullaga collection
    // baiguullaga and ajiltan are stored in the main turees database, not FSM
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (!mainConn) {
      throw new Error("Main database connection not available");
    }

    // Query baiguullaga collection from main turees database for FSM database config
    const baiguullagaCol = mainConn.collection("baiguullaga");
    
    // Try multiple query patterns to find FSM config
    let fsmConfig = await baiguullagaCol.findOne({
      fsmEsekh: true,
      baaz: "fManageFsm",
    });

    // If not found, try with just fsmEsekh: true
    if (!fsmConfig) {
      fsmConfig = await baiguullagaCol.findOne({
        fsmEsekh: true,
      });
    }

    // If still not found, try with just baaz: "fManageFsm"
    if (!fsmConfig) {
      fsmConfig = await baiguullagaCol.findOne({
        baaz: "fManageFsm",
      });
    }

    if (!fsmConfig) {
      console.warn(
        "[FSM Connection] No FSM database config found in baiguullaga collection. " +
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
    } else {
      throw new Error("db.erunkhiiKholbolt not available");
    }
  } catch (error) {
    console.error("[FSM Connection] Failed to connect to FSM database:", error);
    throw error;
  }
}
