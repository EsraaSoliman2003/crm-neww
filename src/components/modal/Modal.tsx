"use client";

import React, { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  // close with ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-9999999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden  border border-white/20 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
          >
            {/* Glow */}
            <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {title}
                </h2>

              </div>

              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-all duration-200 hover:rotate-90 hover:bg-red-100 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="relative p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
