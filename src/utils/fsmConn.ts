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

// Helper to get per-organization FSM connection from request.
// This MUST come from zevbackv2 token middleware as tukhainBaaziinKholbolt.
export const getFsmConnFromReq = (req: any) => {
  const baseConn = ensureFsmConn(
    req.tukhainBaaziinKholbolt || req.body?.tukhainBaaziinKholbolt
  );

  if (!baseConn || !baseConn.kholbolt) {
    throw new Error("FSM холболт олдсонгүй (tukhainBaaziinKholbolt)");
  }

  return baseConn;
};

