"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, UserPlus } from "lucide-react";
import instance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationList = {
  unreadCount: number;
  items: Notification[];
};

const POLL_INTERVAL_MS = 30_000;

function timeAgo(value: string) {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

// Bell in the admin header: shows new join requests (and future admin
// notifications). Polls quietly; failures don't toast every 30 seconds.
export default function NotificationBell() {
  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = !!role?.includes("ADMIN");

  const [data, setData] = useState<NotificationList>({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await instance.get<NotificationList>("Notification", {
        params: { take: 15 },
        silent: true,
      });
      setData(res.data);
    } catch {
      // Keep the last list; the next poll retries.
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const first = setTimeout(load, 0);
    const timer = setInterval(load, POLL_INTERVAL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!isAdmin) return null;

  const openNotification = async (notification: Notification) => {
    setOpen(false);
    if (!notification.isRead) {
      setData((prev) => ({
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      }));
      instance.put(`Notification/${notification.id}/read`, null, { silent: true }).catch(() => load());
    }
    if (notification.link) router.push(notification.link);
  };

  const markAllRead = async () => {
    setData((prev) => ({
      unreadCount: 0,
      items: prev.items.map((n) => ({ ...n, isRead: true })),
    }));
    try {
      await instance.put("Notification/read-all", null, { silent: true });
    } catch {
      load();
    }
  };

  const badge = data.unreadCount > 99 ? "99+" : String(data.unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`الإشعارات${data.unreadCount ? `، ${data.unreadCount} غير مقروء` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-rose-50/85 transition hover:bg-white/10 hover:text-white"
      >
        <Bell size={20} />
        {data.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#2b0d12]">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute left-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gray-100 bg-white text-right shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">الإشعارات</p>
            {data.unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#bf0200] hover:underline"
              >
                <CheckCheck size={14} />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">لا توجد إشعارات</p>
            ) : (
              data.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-right transition hover:bg-gray-50",
                    !n.isRead && "bg-red-50/60",
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <UserPlus size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-gray-600">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/request-management");
            }}
            className="block w-full bg-gray-50 px-4 py-2.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            عرض كل طلبات الانضمام
          </button>
        </div>
      )}
    </div>
  );
}
