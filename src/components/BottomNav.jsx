import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { to: '/', key: 'home', labelKey: 'nav.home', icon: '🏠' },
  { to: '/income-expenses', key: 'incomeExpenses', labelKey: 'nav.incomeExpenses', icon: '€' },
  { to: '/bank', key: 'bank', labelKey: 'nav.bank', icon: '🏦' },
  { to: '/volunteers', key: 'volunteers', labelKey: 'nav.volunteers', icon: '👥' },
  { to: '/settings', key: 'settings', labelKey: 'nav.settings', icon: '⚙️' }
];

const BottomNav = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur-sm">
      <div className="max-w-md mx-auto px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-between gap-1 text-xs">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex flex-col items-center flex-1 py-1 rounded-full',
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600'
              ].join(' ')
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="mt-1">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

