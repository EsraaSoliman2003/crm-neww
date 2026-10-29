"use client"
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
    image: StaticImageData;
    title: string;
    actionText?: string;
    href?: string;
};

export default function EmptyState({
    image,
    title,
    actionText,
    href = "#",
}: Props) {
    return (
        <div className="bg-white h-65 flex flex-col items-center justify-center text-gray-400 shadow-[0_10px_25px_rgba(0,0,0,0.08)] gap-3">
            {/* Image */}
            <div className="w-16 h-16 relative">
                <Image
                    src={image}
                    alt="empty"
                    fill
                    className="object-contain"
                />
            </div>

            {/* Title */}
            <p className="text-sm text-center">
                {title}
            </p>

            {/* Action Button (optional) */}
            {actionText && (
                <Link
                    href={href}
                    className="text-orange-500 text-sm hover:underline"
                >
                    {actionText}
                </Link>
            )}
        </div>
    );
}