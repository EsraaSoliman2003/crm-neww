const RETURN_TARGET_KEY = "crm:return-target";
const STATE_KEY_PREFIX = "crm:navigation-state";
const RETURN_TARGET_TTL = 30000;

export function getNavigationPath(pathname: string) {
  return pathname || "/";
}

function getStateKey(kind: string, pathname: string, id = "") {
  return `${STATE_KEY_PREFIX}:${kind}:${encodeURIComponent(pathname)}:${encodeURIComponent(id)}`;
}

export function markNavigationReturn(pathname: string) {
  sessionStorage.setItem(
    RETURN_TARGET_KEY,
    JSON.stringify({ pathname, createdAt: Date.now() }),
  );
}

export function isReturningToPath(pathname: string) {
  const storedTarget = sessionStorage.getItem(RETURN_TARGET_KEY);
  if (!storedTarget) return false;

  try {
    const target = JSON.parse(storedTarget) as {
      pathname: string;
      createdAt: number;
    };

    if (Date.now() - target.createdAt > RETURN_TARGET_TTL) {
      sessionStorage.removeItem(RETURN_TARGET_KEY);
      return false;
    }

    return target.pathname === pathname;
  } catch (error) {
    console.error("تعذر قراءة حالة الرجوع للتنقل", error);
    sessionStorage.removeItem(RETURN_TARGET_KEY);
    return false;
  }
}

export function clearNavigationReturn() {
  sessionStorage.removeItem(RETURN_TARGET_KEY);
}

export function loadNavigationState<T>(
  kind: string,
  pathname: string,
  id = "",
): T | null {
  const storedState = sessionStorage.getItem(getStateKey(kind, pathname, id));
  if (!storedState) return null;

  try {
    return JSON.parse(storedState) as T;
  } catch (error) {
    console.error("تعذر قراءة الحالة المحفوظة للصفحة", error);
    sessionStorage.removeItem(getStateKey(kind, pathname, id));
    return null;
  }
}

export function saveNavigationState<T>(
  kind: string,
  pathname: string,
  state: T,
  id = "",
) {
  sessionStorage.setItem(getStateKey(kind, pathname, id), JSON.stringify(state));
}

export function getQueryStateKey(kind: string, id = "") {
  return `crm_${kind}_${encodeURIComponent(id)}`;
}

export function readQueryState<T>(key: string): T | null {
  const serializedState = new URLSearchParams(window.location.search).get(key);
  return parseQueryState<T>(serializedState);
}

export function parseQueryState<T>(serializedState: string | null): T | null {
  if (!serializedState) return null;

  try {
    return JSON.parse(serializedState) as T;
  } catch (error) {
    console.error("تعذر قراءة حالة الفلتر من عنوان الصفحة", error);
    return null;
  }
}

export function writeQueryState<T>(key: string, state: T | null) {
  const url = new URL(window.location.href);
  const serializedState = state === null ? null : JSON.stringify(state);

  if (url.searchParams.get(key) === serializedState) return;

  if (serializedState === null) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, serializedState);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const historyState = { ...window.history.state };
  delete historyState.__NA;
  delete historyState._N;
  delete historyState.__PRIVATE_NEXTJS_INTERNALS_TREE;
  window.history.replaceState(historyState, "", nextUrl);
}
