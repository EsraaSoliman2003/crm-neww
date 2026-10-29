"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  clearNavigationReturn,
  getNavigationPath,
  loadNavigationState,
  markNavigationReturn,
  saveNavigationState,
} from "@/utils/navigationState";

type RestoreRequest = {
  pathname: string;
  id: number;
};

export default function NavigationStateRestorer() {
  const pathname = usePathname();
  const [restoreRequest, setRestoreRequest] =
    useState<RestoreRequest | null>(null);
  const pendingSaveFrame = useRef<number | null>(null);

  useEffect(() => {
    saveNavigationState("scroll", getNavigationPath(window.location.pathname), {
      top: window.scrollY,
    });

    const saveScrollPosition = () => {
      if (pendingSaveFrame.current !== null) return;

      pendingSaveFrame.current = requestAnimationFrame(() => {
        pendingSaveFrame.current = null;
        saveNavigationState("scroll", getNavigationPath(window.location.pathname), {
          top: window.scrollY,
        });
      });
    };

    const saveScrollPositionImmediately = () => {
      if (pendingSaveFrame.current !== null) {
        cancelAnimationFrame(pendingSaveFrame.current);
        pendingSaveFrame.current = null;
      }
      saveNavigationState("scroll", getNavigationPath(window.location.pathname), {
        top: window.scrollY,
      });
    };

    const handlePopState = () => {
      const targetPath = getNavigationPath(window.location.pathname);
      markNavigationReturn(targetPath);
      setRestoreRequest({ pathname: targetPath, id: Date.now() });
    };

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", saveScrollPositionImmediately);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPositionImmediately);
      window.removeEventListener("popstate", handlePopState);
      if (pendingSaveFrame.current !== null) {
        cancelAnimationFrame(pendingSaveFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!restoreRequest || pathname !== restoreRequest.pathname) return;

    const savedPosition = loadNavigationState<{ top: number }>(
      "scroll",
      restoreRequest.pathname,
    );

    if (!savedPosition || !Number.isFinite(savedPosition.top)) {
      const clearTimer = window.setTimeout(clearNavigationReturn, 30000);
      return () => window.clearTimeout(clearTimer);
    }

    let frame = 0;
    let attempts = 0;
    let clearTimer = 0;
    const maxAttempts = 180;

    const restoreScrollPosition = () => {
      const pageCanReachPosition =
        document.documentElement.scrollHeight >=
        savedPosition.top + window.innerHeight;

      if (!pageCanReachPosition && attempts < maxAttempts) {
        attempts += 1;
        frame = requestAnimationFrame(restoreScrollPosition);
        return;
      }

      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, savedPosition.top);
      requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
      clearTimer = window.setTimeout(clearNavigationReturn, 30000);
    };

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(restoreScrollPosition);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(clearTimer);
    };
  }, [pathname, restoreRequest]);

  return null;
}
