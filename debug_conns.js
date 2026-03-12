const { db } = require("zevbackv2");
require("dotenv").config();

async function debugConnections() {
  try {
    const fakeApp = { use: () => {} };
    const baaz = process.env.BAAZ || "turees";
    console.log("Connecting to main DB:", baaz);
    
    await db.kholboltUusgey(fakeApp, baaz);
    
    // Wait for internal loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("--- Registry Check ---");
    const registry = db.kholboltuud;
    console.log("IsArray:", Array.isArray(registry));
    console.log("Count:", registry ? registry.length : "N/A");
    
    if (Array.isArray(registry)) {
      registry.forEach((conn, i) => {
        console.log(`\nConnection ${i}:`);
        console.log(`  baaziinNer: ${conn.baaziinNer}`);
        console.log(`  baiguullagiinId: ${conn.baiguullagiinId}`);
        console.log(`  dotoodNer: ${conn.dotoodNer}`);
        console.log(`  _id: ${conn._id}`);
        console.log(`  State: ${conn.kholbolt ? conn.kholbolt.readyState : "No kholbolt"}`);
        if (conn.kholbolt) {
          console.log(`  DB Name in Mongoose: ${conn.kholbolt.name}`);
          console.log(`  Host: ${conn.kholbolt.host}`);
        }
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Debug Error:", err);
    process.exit(1);
  }
}

debugConnections();
