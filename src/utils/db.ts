// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db }: any = require("zevbackv2");

export const getConn = () => db.erunkhiiKholbolt;
export const getCol = (name: string) => db.erunkhiiKholbolt.kholbolt.collection(name);
