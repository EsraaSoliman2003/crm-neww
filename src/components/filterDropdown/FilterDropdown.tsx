"use client"

import { filter } from "@/assets"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface Option {
    label: string
    value: string
}

interface FilterProps {
    options: Option[]
    onSelect: (value: string | null) => void
}

export default function FilterDropdown({
    options,
    onSelect,
}: FilterProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<Option | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (opt: Option) => {
        setSelected(opt)
        onSelect(opt.value)
        setOpen(false)
    }

    const handleReset = () => {
        setSelected(null)
        onSelect(null)
        setOpen(false)
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Button */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center text-sm md:text-md gap-2 bg-white px-3 md:px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-50 transition"
            >
                <div className="w-4 h-4 relative">
                    <Image src={filter} alt="filter" fill />
                </div>

                {/* 👇 عرض الاختيار */}
                {selected ? selected.label : "فلترة"}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 mt-2 w-44 bg-white shadow-lg rounded-xl overflow-hidden z-50">

                    {/* Reset */}
                    {
                        selected && (
                            <div
                                onClick={handleReset}
                                className="px-4 py-2 text-sm text-red-500 hover:bg-gray-100 cursor-pointer"
                            >
                                مسح الفلتر
                            </div>
                        )
                    }

                    {/* Options */}
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => handleSelect(opt)}
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selected?.value === opt.value
                                    ? "bg-gray-100 font-medium"
                                    : ""
                                }`}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}