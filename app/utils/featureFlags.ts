/**
 * Capture-from-URL is enabled in local dev (against the local screenshotter at
 * SCREENSHOTTER_URL) but disabled in production until the fly.io service is deployed
 * and the prod env vars (SCREENSHOTTER_URL/TOKEN, CAPTURE_SIGNING_SECRET) are set.
 */
export const URL_CAPTURE_ENABLED = import.meta.dev
