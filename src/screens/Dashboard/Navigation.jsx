// Navigation.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style.css';
import { useProfile } from '../../api/stateContext';

/* Mobile detector */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

const NAV_ITEMS = [
  {
    paths: ['/', '/searchbox', '/search-results', '/compareview', '/product', '/product/', '/compare'],
    text: 'Home',
    icon: '/home.svg',
    link: '/',
  },
  {
    paths: ['/notification'],
    text: 'Notification',
    icon: '/notify.svg',
    link: '/notification',
    showBadge: true,
  },
  {
    paths: ['/orders'],
    text: 'Orders',
    icon: '/Package.svg',
    link: '/orders',
  },
];

const Navigation = ({
  notificationCount = 0,
  hideOnRoutes = [],
}) => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { profile } = useProfile();

  const profileData = {
    profilePicture: profile?.profilePicture || '',
    name: profile?.name || '',
  };

  /* JSX-level conditional render (SAFE) */
  if (!isMobile || hideOnRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav className="main-navbar" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(({ paths, text, icon, link, showBadge }) => {
        const isActive = paths.some(p =>
          p === pathname || (p !== '/' && pathname.startsWith(p))
        );

        return (
          <Link
            key={link}
            to={link}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="nav-icon-wrapper">
              <img className="nav-icon" alt={text} src={icon} />
              {showBadge && notificationCount > 0 && (
                <span className="nav-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </div>
            <div className="nav-text">{text}</div>
          </Link>
        );
      })}

      <Link
        to="/profile"
        className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
        aria-current={pathname === '/profile' ? 'page' : undefined}
      >
        <div className="nav-icon-wrapper">
          <img
            src={profileData.profilePicture || '/profile.svg'}
            alt={profileData.name || 'Profile'}
            className={profileData.profilePicture ? 'nav-profile-avatar' : 'nav-icon'}
            onError={(e) => (e.target.src = '/profile.svg')}
          />
        </div>
        <div className="nav-text">Profile</div>
      </Link>
    </nav>
  );
};

export default Navigation;
