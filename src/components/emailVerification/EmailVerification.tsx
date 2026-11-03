"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

/**
 * Shows whether the profile email is confirmed; if not, lets the user get a
 * 6-digit code by email and enter it. Used on the supplier and company profiles.
 */
export default function EmailVerification() {
  const { profileData, setProfileData } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);

  if (!profileData?.email) return null;

  if (profileData.emailConfirmed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
        <BadgeCheck size={13} />
        مؤكد
      </span>
    );
  }

  const sendCode = async () => {
    try {
      setBusy("send");
      await axios.post("profile/email/send-code");
      setSent(true);
      toast.success(`تم إرسال رمز التأكيد إلى ${profileData.email}`);
    } catch (error) {
      console.log(error);
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("أدخل رمز التأكيد المكون من 6 أرقام");
      return;
    }
    try {
      setBusy("verify");
      await axios.post("profile/email/verify", { code: code.trim() });
      setProfileData({ ...profileData, emailConfirmed: true });
      toast.success("تم تأكيد البريد الإلكتروني");
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
      >
        <MailWarning size={13} />
        غير مؤكد - تأكيد
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 bg-white p-6 text-right shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">تأكيد البريد الإلكتروني</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              سيتم إرسال رمز مكون من 6 أرقام إلى{" "}
              <span className="font-semibold" dir="ltr">
                {profileData.email}
              </span>
            </p>

            <button
              type="button"
              onClick={sendCode}
              disabled={busy !== null}
              className="flex h-10 w-full items-center justify-center gap-2 border border-[#bf0200] text-[#bf0200] hover:bg-red-50 disabled:opacity-50"
            >
              {busy === "send" && <Loader2 size={16} className="animate-spin" />}
              {sent ? "إعادة إرسال الرمز" : "إرسال الرمز"}
            </button>

            {sent && (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  inputMode="numeric"
                  placeholder="رمز التأكيد"
                  className="h-10 flex-1 border border-gray-200 px-3 text-center tracking-[0.3em] outline-none focus:border-[#bf0200]"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={verify}
                  disabled={busy !== null}
                  className="flex h-10 min-w-24 items-center justify-center bg-[#bf0200] px-4 text-white hover:bg-[#9e0200] disabled:opacity-50"
                >
                  {busy === "verify" ? <Loader2 size={16} className="animate-spin" /> : "تأكيد"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
