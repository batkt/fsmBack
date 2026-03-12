// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

export const getConn = () => db.erunkhiiKholbolt;
export const getErunkhiiCol = (name: string) => db.erunkhiiKholbolt.kholbolt.collection(name);
export const getFsmConns = () => {
  if (!db.kholboltuud) return [];
  // kholboltuud is typically an object mapping orgId -> connection object
  return Object.values(db.kholboltuud);
};
