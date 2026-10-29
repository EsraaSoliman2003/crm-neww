"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  label?: string;
  name: string;
  value: string | number;
  placeholder?: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  formatNumber?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  value,
  placeholder = "",
  type = "text",
  onChange,
  className = "",
  formatNumber = false,
  min,
  max,
  step,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "").replace(/[^\d]/g, "");

    const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const newEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: formatted,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(newEvent);
  };

  return (
    <div className="space-y-2 text-right">
      {label && (
        <label className="text-gray-700 font-bold block mb-3">{label}</label>
      )}

      <div className="relative">
        <input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : formatNumber
                ? "text"
                : type
          }
          inputMode={formatNumber ? "numeric" : undefined}
          name={name}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={formatNumber ? handleNumberChange : onChange}
          className={`
    w-full border border-gray-300 p-3 h-13.75 text-[15px] bg-white
    transition-all duration-300 ease-in-out rounded-2xl
    focus:border-rose-300 focus:ring-4 focus:ring-rose-100
    ${className}
  `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
