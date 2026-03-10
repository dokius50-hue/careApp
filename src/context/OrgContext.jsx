import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { debugLog } from '../lib/debugLog.js';
import { useAuth } from './AuthContext.jsx';

const STORAGE_KEY = 'caritas_current_org_id';

const OrgContext = createContext(null);

export const OrgProvider = ({ children }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [currentOrgId, setCurrentOrgIdState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrgs([]);
      setCurrentOrgIdState(null);
      return;
    }

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, organisations ( id, name, deleted_at )')
        .eq('user_id', user.id);

      const activeOrgs =
        data
          ?.map((row) => row.organisations)
          .filter((o) => o && o.deleted_at === null) ?? [];

      debugLog('OrgContext.jsx:load', 'org_load_result', {
        errorMessage: error?.message ?? null,
        activeOrgsCount: activeOrgs.length
      }, 'H4');

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading organisations', error);
        setOrgs([]);
        setCurrentOrgIdState(null);
        setLoading(false);
        return;
      }

      setOrgs(activeOrgs);

      if (activeOrgs.length === 0) {
        const defaultName = user?.email ? `${user.email.split('@')[0]}'s organisation` : 'My organisation';
        const { error: rpcError } = await supabase.rpc('create_organisation', {
          p_name: defaultName,
          p_opening_balance_cents: 0
        });
        if (rpcError) {
          // eslint-disable-next-line no-console
          console.error('Error auto-creating organisation', rpcError);
          setCurrentOrgIdState(null);
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }
        const { data: data2, error: err2 } = await supabase
          .from('org_members')
          .select('org_id, organisations ( id, name, deleted_at )')
          .eq('user_id', user.id);
        const afterOrgs =
          data2?.map((row) => row.organisations).filter((o) => o && o.deleted_at === null) ?? [];
        if (err2 || afterOrgs.length === 0) {
          setCurrentOrgIdState(null);
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }
        setOrgs(afterOrgs);
        setCurrentOrgIdState(afterOrgs[0].id);
        localStorage.setItem(STORAGE_KEY, afterOrgs[0].id);
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const stillMember = activeOrgs.find((o) => o.id === stored);

      const nextId = stillMember ? stillMember.id : activeOrgs[0].id;
      setCurrentOrgIdState(nextId);
      localStorage.setItem(STORAGE_KEY, nextId);
      setLoading(false);
    };

    void load();
  }, [user]);

  const setCurrentOrgId = (orgId) => {
    setCurrentOrgIdState(orgId);
    if (orgId) {
      localStorage.setItem(STORAGE_KEY, orgId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refetchOrgs = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('org_members')
      .select('org_id, organisations ( id, name, deleted_at )')
      .eq('user_id', user.id);
    const activeOrgs =
      data?.map((row) => row.organisations).filter((o) => o && o.deleted_at === null) ?? [];
    if (!error) setOrgs(activeOrgs);
    if (activeOrgs.length > 0) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const stillMember = activeOrgs.find((o) => o.id === stored);
      const nextId = stillMember ? stillMember.id : activeOrgs[0].id;
      setCurrentOrgIdState(nextId);
      localStorage.setItem(STORAGE_KEY, nextId);
    } else {
      setCurrentOrgIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, [user]);

  const value = {
    orgs,
    currentOrgId,
    setCurrentOrgId,
    refetchOrgs,
    loading
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return ctx;
};

