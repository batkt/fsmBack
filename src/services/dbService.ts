const { db }: any = require("zevbackv2");
import mongoose from "mongoose";
import { loadAllFsmConnections } from "../utils/fsmConnection";

export const baiguullagaBurtgekh = async (data: any) => {
  const { 
    baiguullagiinId, 
    register,
    baaziinNer, 
    cloudMongoDBEsekh, 
    clusterUrl, 
    password, 
    userName 
  } = data;

  let bId = baiguullagiinId;

  if (!bId && register) {
    const mainConn = db.erunkhiiKholbolt?.kholbolt;
    if (mainConn) {
      const org = await mainConn.collection("baiguullaga").findOne({
        $or: [
          { register: register },
          { register: register.toString() },
          { register: Number(register) }
        ]
      });
      if (org) {
        bId = org._id.toString();
      }
    }
  }

  if (!bId) {
    throw new Error("Байгууллагын ID эсвэл регистрийн дугаар олдсонгүй.");
  }

  await db.kholboltNemyeFSM(
    bId,
    baaziinNer,
    cloudMongoDBEsekh,
    clusterUrl,
    password,
    userName
  );

  await loadAllFsmConnections();

  return { baiguullagiinId: bId, baaziinNer };
};

export const baiguullagaJagsaalt = async () => {
  const conn = db.erunkhiiKholbolt.kholbolt;
  return await conn.collection("baaziinMedeelel").find({}).toArray();
};
