export function getFromStorage(key, defaultVal = null) {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultVal;
}

export function saveToStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
