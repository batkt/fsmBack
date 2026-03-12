import { getConn } from "./db";

// Helper to get per-organization FSM connection from request
// Prefers connection injected by authMiddleware
export const getFsmConnFromReq = (req: any) => {
  let baseConn = req.tukhainBaaziinKholbolt || req.body?.tukhainBaaziinKholbolt;
  
  if (!baseConn) {
    return getConn();
  }

  // Ensure compatibility with models that expect .kholboltFSM property
  if (baseConn.kholbolt && !baseConn.kholboltFSM) {
    baseConn.kholboltFSM = baseConn.kholbolt;
  }
  
  return baseConn;
};

