import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "compare:selectedProduct:v1";

let _selected = null;
let _loaded = false;
const _subs = new Set();

function emit() {
  for (const cb of _subs) cb(_selected);
}

async function loadOnce() {
  if (_loaded) return _selected;
  _loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    _selected = raw ? JSON.parse(raw) : null;
  } catch {
    _selected = null;
  }
  emit();
  return _selected;
}

export async function getCompareProduct() {
  await loadOnce();
  return _selected;
}

export async function setCompareProduct(product) {
  _selected = product ?? null;
  try {
    if (_selected) await AsyncStorage.setItem(KEY, JSON.stringify(_selected));
    else await AsyncStorage.removeItem(KEY);
  } catch {}
  emit();
  return _selected;
}

export async function clearCompareProduct() {
  return setCompareProduct(null);
}

export function subscribeCompareProduct(cb) {
  _subs.add(cb);
  loadOnce().finally(() => cb(_selected));
  return () => _subs.delete(cb);
}
