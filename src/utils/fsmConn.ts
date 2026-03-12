import { getConn } from "./db";

// Ensures connection object has both .kholbolt and .kholboltFSM for model compatibility
export const ensureFsmConn = (conn: any) => {
  if (!conn) return conn;

  if (conn.kholbolt && !conn.kholboltFSM) {
    conn.kholboltFSM = conn.kholbolt;
  } else if (conn.kholboltFSM && !conn.kholbolt) {
    conn.kholbolt = conn.kholboltFSM;
  } else if (!conn.kholbolt && !conn.kholboltFSM && conn.model) {
    // If conn IS the mongoose connection object itself, wrap it
    return { kholbolt: conn, kholboltFSM: conn };
  }
  return conn;
};

// Helper to get per-organization FSM connection from request
// Prefers connection injected by authMiddleware
export const getFsmConnFromReq = (req: any) => {
  const { db }: any = require("zevbackv2");
  
  // 1. Try connection already attached by middleware
  let baseConn = req.tukhainBaaziinKholbolt || req.body?.tukhainBaaziinKholbolt;
  
  // 2. If missing, try to lookup by organization ID or short name in the array
  if (!baseConn && db.kholboltuud && Array.isArray(db.kholboltuud)) {
    const orgId = (req.ajiltan?.baiguullagiinId || req.body?.baiguullagiinId || req.query?.baiguullagiinId)?.toString();
    
    if (orgId) {
      baseConn = db.kholboltuud.find((c: any) => 
        c.orgIds && c.orgIds.has(orgId)
      );
      
      if (baseConn) {
        // Cache it on the request for subsequent calls
        req.tukhainBaaziinKholbolt = baseConn;
      }
    }
  }

  // 3. Fallback to main database
  if (!baseConn) {
    baseConn = getConn();
  }

  return ensureFsmConn(baseConn);
};

