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

  // 0 = disconnected, 2 = connecting, 3 = disconnecting
  if (baseConn.kholbolt.readyState === 2) {
    // If it's connecting, wait a bit instead of failing immediately or buffering for 10s
    console.log(`[FSM] Connection is connecting, waiting...`);
    // We don't want to block the event loop with a sync wait, 
    // but since this is an async-ish context (controllers are usually async), 
    // we can't easily wait here without changing the signature to async.
  }

  if (baseConn.kholbolt.readyState !== 1) {
    const states: any = { 0: "Disconnected", 2: "Connecting", 3: "Disconnecting" };
    const stateStr = states[baseConn.kholbolt.readyState] || "Unknown";
    throw new Error(`FSM холболт бэлэн биш байна (State: ${stateStr})`);
  }

  return baseConn;
};

