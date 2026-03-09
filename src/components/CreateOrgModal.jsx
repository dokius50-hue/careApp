import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';

const CreateOrgModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const openingBalanceCents = Math.round(parseFloat(balance || '0') * 100);
    const { data: newOrgId, error: rpcError } = await supabase.rpc('create_organisation', {
      p_name: name,
      p_opening_balance_cents: openingBalanceCents
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSuccess?.(newOrgId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">{t('createOrg.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            {t('createOrg.orgName')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            {t('createOrg.openingBalance')}
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" onClick={onClose}>
              {t('incomeExpenses.cancel')}
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-60" disabled={loading}>
              {loading ? t('createOrg.creating') : t('createOrg.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrgModal;
