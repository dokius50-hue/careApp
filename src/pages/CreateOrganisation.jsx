import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../context/OrgContext.jsx';

const CreateOrganisationPage = () => {
  const { t } = useTranslation();
  const { orgs, refetchOrgs } = useOrg();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const openingBalanceCents = Math.round(parseFloat(balance || '0') * 100);

    const { error: rpcError } = await supabase.rpc('create_organisation', {
      p_name: name,
      p_opening_balance_cents: openingBalanceCents
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      await refetchOrgs();
    }

    setLoading(false);
  };

  if (orgs.length > 0) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto w-full p-4 pb-24">
      <h2 className="text-xl font-semibold mb-4">{t('createOrg.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600" htmlFor="org-name">
            {t('createOrg.orgName')}
          </label>
          <input
            id="org-name"
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600" htmlFor="opening-balance">
            {t('createOrg.openingBalance')}
          </label>
          <input
            id="opening-balance"
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 rounded-full bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? t('createOrg.creating') : t('createOrg.submit')}
        </button>
      </form>
    </div>
  );
};

export default CreateOrganisationPage;

