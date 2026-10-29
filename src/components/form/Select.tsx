"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    name: string;
    value: string | number;
    options: Option[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    loading?: boolean;
    className?: string;
    disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
    label,
    name,
    value,
    options,
    onChange,
    loading = false,
    className = "",
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    if (loading) {
        return (
            <div className="space-y-2 text-right">
                {label && <label className="font-medium text-gray-700">{label}</label>}
                <div className="h-11 w-full border border-gray-200 bg-gray-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-2 text-right">
            {label && <label className="font-bold text-gray-700">{label}</label>}

            <div className="relative">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled }
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setIsOpen(false)}
                    className={`
                        h-13.75 mt-3 w-full border border-gray-200
                        px-3 text-gray-600
                        appearance-none
                        outline-none
                        transition-all duration-300 ease-in-out
                        focus:border-orange-400 focus:ring-4 focus:ring-orange-200/40
                        disabled:bg-gray-100 disabled:text-gray-400
                        ${className} text-[15px]
                    `}
                >
                    <option value="" disabled hidden>
                        {label ? `اختر ${label}` : "Select option"}
                    </option>

                    {options.length === 0 ? (
                        <option value="" disabled>
                            No options available
                        </option>
                    ) : (
                        options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))
                    )}
                </select>

                <ChevronDown
                    size={18}
                    className={`
                        absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none
                        transition-transform duration-300 mt-1
                        ${isOpen ? "rotate-180" : "rotate-0"}
                    `}
                />
            </div>
        </div>
    );
};

export default Select;