// Helper to get per-organization FSM connection from request
// Uses tukhainBaaziinKholbolt provided by zevbackv2 token middleware
export const getFsmConnFromReq = (req: any) => {
  let baseConn = req.body?.tukhainBaaziinKholbolt;
  if (baseConn && baseConn.kholbolt && !baseConn.kholboltFSM) {
    // For FSM we treat kholboltFSM as the same as tukhainBaaziinKholbolt.kholbolt
    baseConn.kholboltFSM = baseConn.kholbolt;
  }
  return baseConn;
};

