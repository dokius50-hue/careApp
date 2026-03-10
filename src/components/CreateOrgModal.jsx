import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';
import FormModal, { formModalClasses as fm } from './FormModal.jsx';

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
    <FormModal open onClose={onClose} title={t('createOrg.title')}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className={fm.label}>
          {t('createOrg.orgName')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 ${fm.input}`}
            required
          />
        </label>
        <label className={fm.label}>
          {t('createOrg.openingBalance')}
          <div className="relative mt-1">
            <span className={fm.amountEuroPrefix} aria-hidden>€</span>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={fm.inputWithEuroPrefix}
            />
          </div>
        </label>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" className={fm.btnSecondary} onClick={onClose}>
            {t('incomeExpenses.cancel')}
          </button>
          <button type="submit" className={`${fm.btnPrimarySlate} disabled:opacity-60`} disabled={loading}>
            {loading ? t('createOrg.creating') : t('createOrg.submit')}
          </button>
        </div>
      </form>
    </FormModal>
  );
};

export default CreateOrgModal;
