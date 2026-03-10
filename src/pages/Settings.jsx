import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrg } from '../context/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import CreateOrgModal from '../components/CreateOrgModal.jsx';

const FONT_SIZE_KEY = 'caritas_font_size';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || 'en';
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { orgs, currentOrgId, setCurrentOrgId, refetchOrgs } = useOrg();
  const [fontSize, setFontSizeState] = useState('medium');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberStatus, setAddMemberStatus] = useState(null);
  const [showInviteOffer, setShowInviteOffer] = useState(false);
  const [pendingInviteEmail, setPendingInviteEmail] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgMembers, setOrgMembers] = useState([]);
  const [editingOrgName, setEditingOrgName] = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState('');
  const [orgNameError, setOrgNameError] = useState('');

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  const startEditOrgName = () => {
    setOrgNameDraft(currentOrg?.name ?? '');
    setOrgNameError('');
    setEditingOrgName(true);
  };

  const saveOrgName = async () => {
    const name = orgNameDraft.trim();
    if (!name || !currentOrgId) return;
    setOrgNameError('');
    const { error } = await supabase.from('organisations').update({ name }).eq('id', currentOrgId);
    if (error) {
      setOrgNameError(error.message);
      return;
    }
    setEditingOrgName(false);
    await refetchOrgs();
  };

  const cancelEditOrgName = () => {
    setEditingOrgName(false);
    setOrgNameError('');
  };

  const loadOrgMembers = React.useCallback(async () => {
    if (!currentOrgId || typeof currentOrgId !== 'string') {
      setOrgMembers([]);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('get_org_members_with_details', { p_org_id: currentOrgId });
      if (error) {
        console.warn('get_org_members_with_details:', error.message);
        setOrgMembers([]);
        return;
      }
      setOrgMembers(data ?? []);
    } catch (err) {
      console.warn('loadOrgMembers:', err);
      setOrgMembers([]);
    }
  }, [currentOrgId]);

  useEffect(() => {
    void loadOrgMembers();
  }, [loadOrgMembers]);

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
    setShowInviteOffer(false);
    const email = addMemberEmail.trim();
    if (!email || !currentOrgId) return;
    try {
      const { data: userId, error: lookupError } = await supabase.rpc('lookup_user_id_by_email', { p_email: email });
      if (lookupError) {
        setAddMemberStatus(lookupError.message || 'Lookup failed');
        return;
      }
      if (!userId) {
        setPendingInviteEmail(email);
        setShowInviteOffer(true);
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
      await loadOrgMembers();
    } catch (err) {
      setAddMemberStatus(err?.message || 'error');
    }
  };

  const handleSendInvite = async () => {
    if (!pendingInviteEmail || !currentOrgId) return;
    setAddMemberStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setAddMemberStatus('Please sign in again to send an invite.');
        return;
      }
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user-to-org`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ email: pendingInviteEmail, org_id: currentOrgId, redirect_to: redirectTo })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddMemberStatus(body?.error || body?.message || res.statusText || 'Invite failed');
        return;
      }
      setAddMemberStatus('invite_sent');
      setShowInviteOffer(false);
      setPendingInviteEmail('');
      setAddMemberEmail('');
    } catch (err) {
      setAddMemberStatus(err?.message || 'error');
    }
  };

  const handleCancelInvite = () => {
    setShowInviteOffer(false);
    setPendingInviteEmail('');
    setAddMemberStatus(null);
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
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${lang === 'en' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => i18n.changeLanguage('en')}
            data-testid="lang-en"
          >
            {t('settings.languageEnglish')}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${lang === 'it' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'}`}
            onClick={() => i18n.changeLanguage('it')}
            data-testid="lang-it"
          >
            {t('settings.languageItalian')}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">{t('settings.organisation')}</h2>
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500">{t('settings.currentOrg')}</p>
            {editingOrgName ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={orgNameDraft}
                  onChange={(e) => setOrgNameDraft(e.target.value)}
                  className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                  placeholder={t('createOrg.orgName')}
                  data-testid="settings-edit-org-name-input"
                />
                <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800" onClick={saveOrgName} data-testid="settings-save-org-name">
                  {t('bank.save')}
                </button>
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" onClick={cancelEditOrgName}>
                  {t('bank.cancel')}
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {orgs.length > 1 ? (
                  <select
                    value={currentOrgId || ''}
                    onChange={(e) => setCurrentOrgId(e.target.value || null)}
                    className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    data-testid="settings-switch-org"
                    aria-label={t('settings.switchOrg')}
                  >
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800">{currentOrg?.name ?? '—'}</p>
                )}
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={startEditOrgName}
                  data-testid="settings-rename-org-btn"
                >
                  {t('settings.renameOrg')}
                </button>
              </div>
            )}
            {orgNameError && <p className="mt-1 text-xs text-rose-600">{orgNameError}</p>}
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
              <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-100 bg-slate-50/50" data-testid="settings-members-list">
                {orgMembers.map((m) => (
                  <li key={m.user_id} className="px-2 py-1.5 text-sm text-slate-700" data-testid="settings-member-row">
                    <span className="font-medium">{m.email ?? '—'}</span>
                    {m.joined_at && (
                      <span className="ml-2 text-xs text-slate-500">
                        {t('settings.addedOn')} {new Date(m.joined_at).toLocaleDateString(i18n.language || 'en', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">{t('settings.addMember')}</p>
            {showInviteOffer ? (
              <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50/80 p-3" data-testid="settings-invite-offer">
                <p className="text-sm text-slate-700">
                  {t('settings.inviteNotRegistered', { email: pendingInviteEmail, orgName: currentOrg?.name ?? '' })}
                </p>
                <p className="mt-1 text-xs text-slate-600">{t('settings.inviteNotRegisteredHint')}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                    onClick={handleSendInvite}
                    data-testid="settings-send-invite-btn"
                  >
                    {t('settings.sendInvite')}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={handleCancelInvite}
                    data-testid="settings-cancel-invite-btn"
                  >
                    {t('bank.cancel')}
                  </button>
                </div>
              </div>
            ) : (
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
            )}
            {addMemberStatus === 'success' && <p className="mt-1 text-xs text-emerald-600">{t('settings.addMemberSuccess')}</p>}
            {addMemberStatus === 'invite_sent' && <p className="mt-1 text-xs text-emerald-600">{t('settings.inviteSent')}</p>}
            {addMemberStatus && addMemberStatus !== 'success' && addMemberStatus !== 'invite_sent' && <p className="mt-1 text-xs text-rose-600">{addMemberStatus}</p>}
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
