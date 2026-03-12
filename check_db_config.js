const { db } = require("zevbackv2");
require("dotenv").config();

async function checkRegistry() {
  try {
    const fakeApp = { use: () => {} };
    const baaz = process.env.BAAZ || "turees";
    console.log("Connecting with BAAZ:", baaz);
    
    await db.kholboltUusgey(fakeApp, baaz);
    
    console.log("Registry type:", Array.isArray(db.kholboltuud) ? "Array" : typeof db.kholboltuud);
    console.log("Registry length/keys:", Array.isArray(db.kholboltuud) ? db.kholboltuud.length : Object.keys(db.kholboltuud || {}).length);
    
    if (Array.isArray(db.kholboltuud) && db.kholboltuud.length > 0) {
      console.log("First element sample:", JSON.stringify(db.kholboltuud[0], (key, value) => {
        if (key === "kholbolt" || key === "kholboltRead" || key === "kholboltBackupRead") return "[MongooseConnection]";
        return value;
      }, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error in checkRegistry:", err);
    process.exit(1);
  }
}

checkRegistry();
