const { db }: any = require("zevbackv2");
import mongoose from "mongoose";
import { loadAllFsmConnections } from "../utils/fsmConnection";

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

  // Upsert baaziinMedeelel to prevent duplicate rows (which cause hundreds of connections on startup)
  const mainConn = db.erunkhiiKholbolt?.kholbolt;
  if (!mainConn) {
    throw new Error("Main database connection not available");
  }

  const baaziinMedeelelCol = mainConn.collection("baaziinMedeelel");

  // For FSM tenant DB: we treat one org -> one FSM DB config
  await baaziinMedeelelCol.updateOne(
    { baiguullagiinId: bId, fsmEsekh: true },
    {
      $set: {
        baaz: baaziinNer,
        baaziinNer: baaziinNer, // keep both keys for compatibility with older data
        cloudMongoDBEsekh: !!cloudMongoDBEsekh,
        clusterUrl,
        password,
        userName,
        baiguullagiinId: bId,
        fsmEsekh: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  // Connect lazily: ensure there is a zevbackv2 connection object for this DB name.
  // If connection already exists in registry, do not create again.
  const existingConn = Array.isArray(db.kholboltuud)
    ? db.kholboltuud.find((c: any) => c.baaziinNer === baaziinNer)
    : null;

  if (!existingConn) {
    await db.kholboltNemyeFSM(
      bId,
      baaziinNer,
      cloudMongoDBEsekh,
      clusterUrl,
      password,
      userName,
    );
  }

  // Refresh orgId mapping set for this DB (and any other FSM DBs) without restarting the server
  await loadAllFsmConnections();

  return { baiguullagiinId: bId, baaziinNer };
};

export const baiguullagaJagsaalt = async () => {
  const conn = db.erunkhiiKholbolt.kholbolt;
  return await conn.collection("baaziinMedeelel").find({}).toArray();
};
