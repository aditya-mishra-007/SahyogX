import React from 'react';
import { Home, Activity, ClipboardCheck, Clock, LifeBuoy } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const quickItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'welfare', label: 'Welfare', icon: Activity },
    { id: 'assessment', label: 'Assess', icon: ClipboardCheck },
    { id: 'workload', label: 'Duty', icon: Clock },
    { id: 'resources', label: 'Help', icon: LifeBuoy }
  ];

  return (
    <div className="mobile-nav" role="navigation" aria-label="Mobile Navigation">
      <div className="mobile-nav-inner">
        {quickItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
