export const markLandingSeen = () => {
  try {
    localStorage.setItem("studentos_has_seen_landing", "true");
  } catch {
    // Safely ignore storage errors
  }
};
