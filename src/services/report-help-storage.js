const key = (userId) => `bojogae:report-help:v1:${userId}`;
const canvasGuideKey = (userId) => `bojogae:canvas-toolbar-guide:v4:${userId || "guest"}`;
const reportListGuideKey = (userId) => `bojogae:report-list-guide:v1:${userId || "guest"}`;
const remodelingGuideKey = (userId) => `bojogae:remodeling-guide:v1:${userId || "guest"}`;
const remodelingNoProposalGuideKey = (userId) => `bojogae:remodeling-no-proposal-guide:v1:${userId || "guest"}`;

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

export function hasSeenCanvasGuide(userId) {
  try {
    return window.localStorage.getItem(canvasGuideKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markCanvasGuideSeen(userId) {
  try {
    window.localStorage.setItem(canvasGuideKey(userId), "true");
  } catch {
    // Ignore storage errors in private/restricted browsers.
  }
}

export function hasSeenReportListGuide(userId) {
  try {
    return window.localStorage.getItem(reportListGuideKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markReportListGuideSeen(userId) {
  try {
    window.localStorage.setItem(reportListGuideKey(userId), "true");
  } catch {
    // Ignore storage errors in private/restricted browsers.
  }
}

export function hasSeenRemodelingGuide(userId) {
  try {
    return window.localStorage.getItem(remodelingGuideKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markRemodelingGuideSeen(userId) {
  try {
    window.localStorage.setItem(remodelingGuideKey(userId), "true");
  } catch {
    // Ignore storage errors in private/restricted browsers.
  }
}

export function hasSeenRemodelingNoProposalGuide(userId) {
  try {
    return window.localStorage.getItem(remodelingNoProposalGuideKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markRemodelingNoProposalGuideSeen(userId) {
  try {
    window.localStorage.setItem(remodelingNoProposalGuideKey(userId), "true");
  } catch {
    // Ignore storage errors in private/restricted browsers.
  }
}
