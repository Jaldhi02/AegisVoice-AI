/**
 * Formats duration in seconds to MM:SS string (e.g. 5 -> "00:05", 27 -> "00:27", 92 -> "01:32").
 * Returns "--:--" if seconds is missing, invalid, or zero.
 */
export const formatDuration = (secs) => {
  if (secs === null || secs === undefined || isNaN(secs) || !isFinite(secs) || secs < 0) {
    return "--:--";
  }
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Formats seconds to a human readable short string (e.g. "27s", "1m 32s").
 */
export const formatDurationShort = (secs) => {
  if (secs === null || secs === undefined || isNaN(secs) || !isFinite(secs) || secs <= 0) {
    return "--:--";
  }
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};
