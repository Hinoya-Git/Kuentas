import React, { useEffect, useState } from 'react';
import { Building2, Save, User, X } from 'lucide-react';
import { TaxpayerProfile } from '../types/index.ts';

interface TaxpayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayer: TaxpayerProfile;
  onSave: (profile: TaxpayerProfile) => void;
}

const parseTinAndBranch = (fullTin: string) => {
  if (!fullTin) return { tinPart: '', branchPart: '0000' };

  const parts = fullTin.split('-');
  if (parts.length >= 4) {
    const branchPart = parts[parts.length - 1] || '0000';
    const tinPart = parts.slice(0, parts.length - 1).join('-');
    return {
      tinPart,
      branchPart: branchPart.padStart(4, '0').slice(-4),
    };
  }

  const digits = fullTin.replace(/\D/g, '');
  if (digits.length >= 13) {
    const t9 = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
    const b4 = digits.slice(9, 13);
    return { tinPart: t9, branchPart: b4 };
  } else if (digits.length >= 9) {
    const t9 = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
    const b = digits.slice(9).padStart(4, '0').slice(-4) || '0000';
    return { tinPart: t9, branchPart: b };
  }

  return { tinPart: fullTin, branchPart: '0000' };
};

export const TaxpayerModal: React.FC<TaxpayerModalProps> = ({
  isOpen,
  onClose,
  taxpayer,
  onSave,
}) => {
  const [profile, setProfile] = useState<TaxpayerProfile>({ ...taxpayer });
  const [tin, setTin] = useState<string>(() => parseTinAndBranch(taxpayer.tin || '').tinPart);
  const [branchCode, setBranchCode] = useState<string>(
    () => parseTinAndBranch(taxpayer.tin || '').branchPart || '0000'
  );

  useEffect(() => {
    if (isOpen) {
      setProfile({ ...taxpayer });
      const parsed = parseTinAndBranch(taxpayer.tin || '');
      setTin(parsed.tinPart);
      setBranchCode(parsed.branchPart || '0000');
    }
  }, [isOpen, taxpayer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let cleanTin = tin.trim();
    const digitsOnly = cleanTin.replace(/\D/g, '');
    if (digitsOnly.length === 9 && !cleanTin.includes('-')) {
      cleanTin = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 9)}`;
    }

    const cleanBranch = (branchCode.trim() || '0000').padStart(4, '0').slice(-4);
    const formattedFullTin = cleanTin ? `${cleanTin}-${cleanBranch}` : '';

    onSave({
      ...profile,
      tin: formattedFullTin,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                BIR Taxpayer &amp; Certificate Profile
              </h3>
              <p className="text-xs text-slate-500">
                Printed on official Cash Receipts Journal books and reference sheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Taxpayer Name (as per BIR Form 2303 COR)
            </label>
            <input
              type="text"
              required
              value={profile.taxpayerName}
              onChange={(e) => setProfile({ ...profile, taxpayerName: e.target.value.toUpperCase() })}
              placeholder="e.g. JUAN DELA CRUZ"
              className="w-full px-3 py-2 text-xs font-medium uppercase rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TIN (9 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="123-456-788"
                className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch Code (4 digits)
              </label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="0000"
                maxLength={4}
                className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              RDO (Revenue District Office)
            </label>
            <input
              type="text"
              value={profile.rdo}
              onChange={(e) => setProfile({ ...profile, rdo: e.target.value })}
              placeholder="e.g. 008 or RDO 044 - Taguig"
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Principal Business Address
            </label>
            <textarea
              rows={2}
              value={profile.registeredAddress}
              onChange={(e) => setProfile({ ...profile, registeredAddress: e.target.value })}
              placeholder="Unit #, Street, Barangay, City, Province, ZIP"
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Line of Business / Profession
            </label>
            <input
              type="text"
              value={profile.lineOfBusiness}
              onChange={(e) => setProfile({ ...profile, lineOfBusiness: e.target.value })}
              placeholder="e.g. Professional / IT & Software Development Consultancy"
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-950">
            <span className="font-bold">Tax Regime:</span> 8% Gross Income Tax (TRAIN Law RA 10963) in lieu of graduated rates and 3% percentage tax.
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
