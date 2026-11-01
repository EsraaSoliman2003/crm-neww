"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { logo } from "@/assets";
import { useAppDispatch } from "@/rtk/hooks";
import { resendOtp, verifyPhone } from "@/rtk/slices/authSlice";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyPhoneForm() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const userId = Number(searchParams.get("userId"));
  // "sent=1": a code was just sent (on sign-up or from login), so the backend
  // won't send another one for 60 seconds.
  const justSent = searchParams.get("sent") === "1";

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!Number.isInteger(userId) || userId <= 0) {
    return (
      <Card>
        <p className="text-gray-600 mb-6">رابط التحقق غير صالح.</p>
        <Link href="/login" className="block py-3 text-center rounded-lg bg-red-700 text-white">
          تسجيل الدخول
        </Link>
      </Card>
    );
  }

  if (verified) {
    return (
      <Card>
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-800">تم تأكيد رقم الهاتف</h2>
        <p className="mt-3 text-gray-500 leading-7">
          حسابك الآن في انتظار موافقة الإدارة، ويمكنك تسجيل الدخول بعد الموافقة.
        </p>
        <Link href="/login" className="block py-3 text-center rounded-lg bg-red-700 text-white mt-6">
          تسجيل الدخول
        </Link>
      </Card>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setVerifying(true);
    const result = await dispatch(verifyPhone({ userId, code }));
    setVerifying(false);

    if (verifyPhone.fulfilled.match(result)) {
      setVerified(true);
    } else {
      // The error itself is shown by the axios interceptor.
      setCode("");
    }
  };

  const onResend = async () => {
    setResending(true);
    const result = await dispatch(resendOtp({ userId }));
    setResending(false);

    if (resendOtp.fulfilled.match(result)) {
      toast.success("تم إرسال رمز جديد على واتساب");
      setCode("");
      setCooldown(result.payload.resendAfterSeconds || RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <Card>
      <div className="flex justify-center mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MessageCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2 text-gray-800">تأكيد رقم الهاتف</h2>
      <p className="text-sm text-gray-500 mb-6 leading-6">
        أرسلنا رمز تحقق من 6 أرقام على واتساب الرقم المسجل. الرمز صالح لمدة 5 دقائق.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          dir="ltr"
          placeholder="------"
          aria-label="رمز التحقق"
          className="w-full border border-gray-200 rounded-md px-3 py-3 text-center text-2xl tracking-[0.75em] focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <button
          type="submit"
          disabled={code.length !== 6 || verifying}
          className="w-full bg-[#BC2120] text-white py-2 rounded-md hover:bg-[#9c1616] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "جاري التحقق..." : "تأكيد"}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        لم يصلك الرمز؟{" "}
        {cooldown > 0 ? (
          <span className="text-gray-400">يمكنك طلب رمز جديد بعد {cooldown} ثانية</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="text-[#BC2120] font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
          </button>
        )}
      </div>

      <Link href="/login" className="block mt-4 text-sm text-gray-500 hover:underline">
        العودة لتسجيل الدخول
      </Link>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-115 max-w-full text-center">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src={logo}
              alt="Construction Pricing"
              width={200}
              height={100}
              className="h-auto w-32 object-contain"
              priority
            />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense>
      <VerifyPhoneForm />
    </Suspense>
  );
}
