/**
 * Cross-tab calendar refresh using BroadcastChannel API.
 *
 * When an admin confirms / cancels / undoes a booking the blocked-dates on
 * the server change.  We broadcast a lightweight message so that any open
 * booking-card tab immediately re-fetches blocked dates without a page reload.
 */

const CHANNEL_NAME = "casa-calendar-refresh"

/** Notify every other tab that blocked dates have changed. */
export function broadcastCalendarRefresh(house?: string) {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.postMessage({ type: "calendar-refresh", house, ts: Date.now() })
    ch.close()
  } catch {
    // BroadcastChannel not supported – silent fallback
  }
}

/** Subscribe to calendar-refresh events from other tabs. Returns a cleanup fn. */
export function onCalendarRefresh(
  callback: (house?: string) => void,
): () => void {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "calendar-refresh") {
        callback(e.data.house)
      }
    }
    ch.addEventListener("message", handler)
    return () => {
      ch.removeEventListener("message", handler)
      ch.close()
    }
  } catch {
    return () => {}
  }
}
