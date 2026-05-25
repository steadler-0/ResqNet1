/** Newest submitted incidents first (not GPS movement updates). */
export function getSubmittedTime(alert) {
  return new Date(alert.submittedAt || alert.timestamp || 0).getTime();
}

export function sortAlertsNewestFirst(alerts) {
  return [...alerts].sort((a, b) => getSubmittedTime(b) - getSubmittedTime(a));
}
