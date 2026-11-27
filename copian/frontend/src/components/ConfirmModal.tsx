"use client";

import React from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-50 bg-light-scrim/45 backdrop-blur-[1px] flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg max-w-md w-full p-6 shadow-xl flex flex-col gap-4 animate-modal-in"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              danger ? "bg-light-error-container text-light-error" : "bg-light-secondary-container text-light-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {danger ? "warning" : "help"}
            </span>
          </div>
          <div>
            <h3 className="font-headline text-title-lg text-light-on-surface">{title}</h3>
            <p className="font-body text-body-sm text-light-on-surface-variant mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-light-outline-variant/70">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-light-outline-variant font-body text-label-md text-light-on-surface hover:bg-light-surface-container-low"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded font-body text-label-md text-white ${
              danger ? "bg-light-error hover:opacity-90" : "bg-light-primary hover:bg-light-primary-container"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
