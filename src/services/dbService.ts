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

  const bId = baiguullagiinId || new mongoose.Types.ObjectId().toString();

  await db.kholboltNemyeFSM(
    bId,
    baaziinNer,
    cloudMongoDBEsekh,
    clusterUrl,
    password,
    userName
  );

  return { baiguullagiinId: bId, baaziinNer };
};

export const baiguullagaJagsaalt = async () => {
  const conn = db.erunkhiiKholbolt.kholbolt;
  return await conn.collection("baaziinMedeelel").find({}).toArray();
};
