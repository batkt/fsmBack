import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");
import mongoose from "mongoose";

const getCol = (name: string) => db.erunkhiiKholbolt.kholbolt.collection(name);

export const loginWithTurees = async (nevtrekhNer: string, nuutsUg: string) => {
  const ajiltan = await getCol("ajiltan").findOne({ nevtrekhNer });
  if (!ajiltan || !(await bcrypt.compare(nuutsUg, ajiltan.nuutsUg))) return null;

  const baiguullaga = ajiltan.baiguullagiinId ? await getCol("baiguullaga").findOne({ _id: new mongoose.Types.ObjectId(ajiltan.baiguullagiinId) }) : null;
  const token = jwt.sign({ id: ajiltan._id, ner: ajiltan.ner, baiguullagiinId: ajiltan.baiguullagiinId }, process.env.APP_SECRET || "tokenUusgekhZevTabs2022", { expiresIn: "12h" });
  delete ajiltan.nuutsUg;

  return { token, result: ajiltan, baiguullaga };
};

export const getAjiltanDetails = async (id: string, baiguullagiinId: string) => {
  const ajiltan = await getCol("ajiltan").findOne({ _id: new mongoose.Types.ObjectId(id) }, { projection: { nuutsUg: 0 } });
  const baiguullaga = baiguullagiinId ? await getCol("baiguullaga").findOne({ _id: new mongoose.Types.ObjectId(baiguullagiinId) }) : null;
  return { ajiltan, baiguullaga };
};
