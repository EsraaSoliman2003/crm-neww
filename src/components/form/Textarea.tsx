// components/form/Textarea.tsx
"use client"
import React from "react"

interface TextareaProps {
    label: string
    name: string
    value: string
    placeholder?: string
    rows?: number
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    className?: string
}

const Textarea: React.FC<TextareaProps> = ({
    label,
    name,
    value,
    placeholder = "",
    rows = 5,
    onChange,
    className = "",
}) => {
    return (
        <div className="space-y-2 text-right">
            <label className="font-bold text-gray-700">{label}</label>
            <textarea
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                name={name}
                value={value}
                placeholder={placeholder}
                rows={rows}
                onChange={onChange}
                className={`
                    mt-3 w-full border border-gray-300 p-3 resize-none transition-all duration-300 ease-in-out
                    focus:border-orange-400 focus:ring-4 focus:ring-orange-200/40 ${className} outline-none
                `}
            />
        </div>
    )
}

export default Textarea
