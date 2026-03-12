// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

export const getConn = () => db.erunkhiiKholbolt;
export const getErunkhiiCol = (name: string) => db.erunkhiiKholbolt.kholbolt.collection(name);
export const getFsmConns = () => db.kholboltuud || [];
