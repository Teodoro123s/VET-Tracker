// Simple string formatter without regex
function formatFieldName(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}