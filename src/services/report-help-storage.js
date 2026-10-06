const key = (userId) => `bojogae:report-help:v1:${userId}`;

export function hasSeenReportHelp(userId) {
  try {
    return window.localStorage.getItem(key(userId)) === 'true';
  } catch {
    return false;
  }
}

export function markReportHelpSeen(userId) {
  try {
    window.localStorage.setItem(key(userId), 'true');
  } catch {
    // Help still works when browser storage is unavailable.
  }
}
