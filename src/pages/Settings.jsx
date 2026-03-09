import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import CreateOrgModal from '../components/CreateOrgModal.jsx';

const FONT_SIZE_KEY = 'caritas_font_size';

const SettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { orgs, currentOrgId, setCurrentOrgId, refetchOrgs } = useOrg();
  const [fontSize, setFontSizeState] = useState('medium');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberStatus, setAddMemberStatus] = useState(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgMembers, setOrgMembers] = useState([]);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  useEffect(() => {
    if (!currentOrgId) {
      setOrgMembers([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase.from('org_members').select('user_id').eq('org_id', currentOrgId);
      setOrgMembers(data ?? []);
    };
    void load();
  }, [currentOrgId]);

  useEffect(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY) || 'medium';
    setFontSizeState(stored);
    document.documentElement.setAttribute('data-font-size', stored);
  }, []);

  const setFontSize = (size) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_SIZE_KEY, size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddMemberStatus(null);
    const email = addMemberEmail.trim();
    if (!email || !currentOrgId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
      const { data: fnData, error: fnError } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email },
        ...(headers && { headers })
      });
      const fnErrorMsg = fnData?.error ?? fnError?.message;
      if (fnErrorMsg || fnError) {
        setAddMemberStatus(fnErrorMsg || 'Lookup failed');
        return;
      }
      const userId = fnData?.user_id ?? fnData?.data?.user_id;
      if (!userId) {
        setAddMemberStatus(fnData?.error || 'User not found');
        return;
      }
      const { error: rpcError } = await supabase.rpc('add_org_member', {
        p_org_id: currentOrgId,
        p_target_user_id: userId
      });
      if (rpcError) {
        setAddMemberStatus(rpcError.message || 'Could not add member');
        return;
      }
      setAddMemberStatus('success');
      setAddMemberEmail('');
      const { data: members } = await supabase.from('org_members').select('user_id').eq('org_id', currentOrgId);
      setOrgMembers(members ?? []);
    } catch (err) {
      setAddMemberStatus(err?.message || 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-slate-500">{t('settings.exportSettings')}</h2>
        <p className="text-sm text-slate-600">{t('settings.exportSettingsPlaceholder')}</p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700">{t('settings.fontSize')}</h2>
        <div className="mt-2 flex gap-2">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm ${fontSize === size ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'}`}
              onClick={() => setFontSize(size)}
              data-testid={`font-size-${size}`}
            >
              {t(`settings.fontSize${size.charAt(0).toUpperCase() + size.slice(1)}`)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700">{t('settings.language')}</h2>
        <p className="text-sm text-slate-600">{t('settings.languageEnglish')}</p>
        <p className="text-xs text-slate-500">{t('settings.languageItalian')}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">{t('settings.organisation')}</h2>
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500">{t('settings.currentOrg')}</p>
            {orgs.length > 1 ? (
              <select
                value={currentOrgId || ''}
                onChange={(e) => setCurrentOrgId(e.target.value || null)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                data-testid="settings-switch-org"
                aria-label={t('settings.switchOrg')}
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm font-medium text-slate-800">{currentOrg?.name ?? '—'}</p>
            )}
          </div>
          <div>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setShowCreateOrg(true)}
            >
              {t('settings.createNewOrg')}
            </button>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t('settings.membersWithAccess')}</p>
            <p className="mt-0.5 text-sm text-slate-600">{t('settings.memberCount', { count: orgMembers.length })}</p>
            {orgMembers.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">{t('settings.noMembers')}</p>
            ) : (
              <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-100 bg-slate-50/50">
                {orgMembers.map((m) => (
                  <li key={m.user_id} className="px-2 py-1.5 text-sm text-slate-700">
                    Member
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">{t('settings.addMember')}</p>
            <form onSubmit={handleAddMember} className="mt-1 flex gap-2">
              <input
                type="email"
                value={addMemberEmail}
                onChange={(e) => setAddMemberEmail(e.target.value)}
                placeholder={t('settings.addMemberPlaceholder')}
                className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                data-testid="settings-add-member-input"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                data-testid="settings-add-member-btn"
              >
                {t('settings.addMember')}
              </button>
            </form>
            {addMemberStatus === 'success' && <p className="mt-1 text-xs text-emerald-600">{t('settings.addMemberSuccess')}</p>}
            {addMemberStatus && addMemberStatus !== 'success' && <p className="mt-1 text-xs text-rose-600">{addMemberStatus}</p>}
          </div>
        </div>
      </section>

      <section>
        <button
          type="button"
          className="w-full rounded-xl border border-rose-200 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
          onClick={handleLogout}
          data-testid="settings-logout-btn"
        >
          {t('settings.logout')}
        </button>
      </section>

      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onSuccess={async (newOrgId) => {
            await refetchOrgs();
            if (newOrgId) setCurrentOrgId(newOrgId);
          }}
        />
      )}
    </div>
  );
};

export default SettingsPage;
