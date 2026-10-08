import React, { useState } from 'react';
import { X, UserPlus, ChevronDown } from 'lucide-react';

export default function GoogleAccountChooserModal({ isOpen, onClose, onSelectAccount }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Rohit',
      email: 'r26377269@gmail.com',
      avatarBg: '#8b5cf6',
      initial: 'R',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
    },
    {
      name: 'AG Support',
      email: 'community@agcloud.fun',
      avatarBg: '#0284c7',
      initial: 'A',
      photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80'
    }
  ];

  const handleSelect = (account) => {
    onSelectAccount({
      uid: 'google_' + Math.random().toString(36).substr(2, 9),
      displayName: account.name,
      email: account.email,
      photoURL: account.photoURL
    });
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const nameToUse = customName || customEmail.split('@')[0];
    const generatedPhoto = customPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToUse)}&background=0284c7&color=ffffff&bold=true`;

    onSelectAccount({
      uid: 'google_' + Math.random().toString(36).substr(2, 9),
      displayName: nameToUse,
      email: customEmail,
      photoURL: generatedPhoto
    });
    onClose();
  };

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div className="google-modal-window" onClick={e => e.stopPropagation()}>

        <div className="google-modal-topbar">
          <div className="topbar-title">
            <span className="google-g-icon">G</span>
            <span>Sign in with Google</span>
          </div>
          <button className="topbar-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="google-modal-body">
          <h2 className="chooser-heading">Choose an account</h2>
          <p className="chooser-subheading">
            to continue to <span className="app-domain">ag-cloud-a4a6d.firebaseapp.com</span>
          </p>

          {!showCustomInput ? (
            <div className="account-list">
              {defaultAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="account-row"
                  onClick={() => handleSelect(acc)}
                >
                  <img
                    src={acc.photoURL}
                    alt={acc.name}
                    className="account-avatar-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="account-avatar-circle" style={{ backgroundColor: acc.avatarBg, display: 'none' }}>
                    {acc.initial}
                  </div>
                  <div className="account-details">
                    <span className="account-name">{acc.name}</span>
                    <span className="account-email">{acc.email}</span>
                  </div>
                </div>
              ))}

              <div
                className="account-row use-another-row"
                onClick={() => setShowCustomInput(true)}
              >
                <div className="account-avatar-circle another-avatar">
                  <UserPlus size={20} />
                </div>
                <div className="account-details">
                  <span className="account-name font-medium">Use another account</span>
                </div>
              </div>
            </div>
          ) : (
            <form className="custom-account-form" onSubmit={handleCustomSubmit}>
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohit Kumar"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Google Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Google Profile Photo Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://lh3.googleusercontent.com/..."
                  value={customPhotoUrl}
                  onChange={e => setCustomPhotoUrl(e.target.value)}
                />
              </div>

              <div className="custom-form-actions">
                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={() => setShowCustomInput(false)}
                >
                  Back
                </button>
                <button type="submit" className="primary-btn small glow-btn">
                  Continue & Login
                </button>
              </div>
            </form>
          )}

          <div className="google-modal-footer">
            <div className="lang-select">
              English (United Kingdom) <ChevronDown size={12} />
            </div>
            <div className="footer-links">
              <span>Help</span>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
