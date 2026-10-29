import { cn } from "@/utils/cn";
import { LoaderCircle } from "lucide-react";
import React from "react";
interface Props {
  text: string;
  type?: "submit" | "button" | "reset";
  loading?: boolean;
  onClick?: () => void;
  border?: boolean;
}

const Button: React.FC<Props> = ({
  text,
  type = "button",
  loading = false,
  onClick,
  border = false,
}) => {
  return (
    <button
      type={type}
      disabled={loading}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-8 py-3 font-bold shadow-sm transition duration-200 disabled:cursor-wait disabled:opacity-60",
        border
          ? "border border-[#bf0200] bg-white text-[#bf0200] hover:bg-red-50"
          : "border border-[#bf0200] bg-[#bf0200] text-white hover:-translate-y-0.5 hover:bg-[#9f0200] hover:shadow-md",
      )}
      onClick={onClick}
    >
      {loading && <LoaderCircle size={18} className="animate-spin" />}
      {loading ? "جاري الحفظ..." : text}
    </button>
  );
};

export default Button;
