const { db } = require("zevbackv2");

async function checkConfigs() {
  try {
    const fakeApp = { use: () => {} };
    // Connect to main DB to read configs
    await db.kholboltUusgey(fakeApp, process.env.BAAZ || "turees");
    
    const conn = db.erunkhiiKholbolt.kholbolt;
    const configs = await conn.collection("baaziinMedeelel").find({ fsmEsekh: true }).toArray();
    
    console.log("FSM Configs count:", configs.length);
    if (configs.length > 0) {
      configs.forEach((cfg, i) => {
        console.log(`Config ${i} keys:`, Object.keys(cfg));
        console.log(`Config ${i} - baiguullagiinId: ${cfg.baiguullagiinId}, baaziinNer: ${cfg.baaziinNer}, baaz: ${cfg.baaz}`);
      });
    }
    
    console.log("Registered connections (db.kholboltuud):", Object.keys(db.kholboltuud || {}));
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkConfigs();
