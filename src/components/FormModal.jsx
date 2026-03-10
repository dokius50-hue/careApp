import React from 'react';

/**
 * Shared form control classes for use inside FormModal (and other modals).
 * Apply these to inputs, selects, labels, and buttons for consistent on-brand styling.
 */
export const formModalClasses = {
  input:
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-colors',
  /** Use with amountEuroPrefix wrapper so currency shows inside the input. */
  inputWithEuroPrefix:
    'w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-colors',
  amountEuroPrefix: 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm',
  select:
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-colors',
  label: 'block text-sm font-medium text-slate-700',
  labelWithSpacing: 'block text-sm font-medium text-slate-700 mt-1',
  btnSecondary:
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50',
  btnDanger:
    'rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50',
  btnPrimarySlate:
    'rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800',
  btnPrimaryEmerald:
    'rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700',
  btnPrimaryRose:
    'rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700',
};

const FormModal = ({ open, onClose, title, 'aria-label': ariaLabel, children }) => {
  const titleId = React.useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default FormModal;
