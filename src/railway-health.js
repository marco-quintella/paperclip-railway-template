/**
 * Map a loopback probe of Paperclip `/api/health` to a Railway-safe response.
 * Private exposure returns 403 for public Host headers; loopback is 2xx.
 * If loopback is reachable but non-2xx, still report healthy so Railway
 * does not kill a running instance.
 */
export function railwayHealthResponse(health) {
  if (!health) {
    return {
      status: 503,
      json: { status: "starting", wrapper: "ready", paperclipReady: false },
    };
  }
  if (health.ok) {
    return {
      status: health.status,
      body: health.body,
      contentType: health.contentType,
    };
  }
  return {
    status: 200,
    json: {
      status: "ok",
      wrapper: "ready",
      paperclipReady: true,
      upstreamStatus: health.status,
    },
  };
}
