import React from 'react';
import { Coffee, Heart, X } from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all print:hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Support Kuentas!
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This tool is 100% free! If it helped you out, consider sending a GCash tip to keep the coffee flowing. 💙
          </p>

          {/* GCash QR Code Image */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-inner flex flex-col items-center justify-center">
            <img
              src="/gcash.jpeg"
              alt="GCash QR Code"
              className="w-48 h-48 object-contain rounded-lg mx-auto"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackTried) {
                  target.dataset.fallbackTried = 'true';
                  target.src = `${import.meta.env.BASE_URL}gcash.jfif`;
                }
              }}
            />
          </div>

          {/* Footer Text */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Scan with GCash</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
