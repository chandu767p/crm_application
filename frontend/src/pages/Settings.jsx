import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings);
    } catch (err) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    try {
      await api.post('/settings', { key, value });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      toast.success(`${key} updated successfully`);
    } catch (err) {
      toast.error(`Failed to update ${key}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage global configurations and system-wide preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings Card */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">General Config</h2>
          </div>
          <div className="p-6 space-y-6">
            <SettingItem 
              label="System Name" 
              description="The name used in notifications and tab titles."
              value={settings.find(s => s.key === 'system_name')?.value || 'Do Systems CRM'}
              onUpdate={(val) => handleUpdate('system_name', val)}
              disabled={saving}
            />
            <SettingItem 
              label="Contact Email" 
              description="Primary administration contact email."
              value={settings.find(s => s.key === 'admin_email')?.value || 'admin@dosystems.io'}
              onUpdate={(val) => handleUpdate('admin_email', val)}
              disabled={saving}
            />
          </div>
        </section>

        {/* Security Settings Card */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Security & Authentication</h2>
          </div>
          <div className="p-6 space-y-6">
            <SettingToggle 
              label="Allow Registration" 
              description="Enable or disable new user registration from the login page."
              checked={settings.find(s => s.key === 'allow_registration')?.value === 'true'}
              onToggle={(val) => handleUpdate('allow_registration', val ? 'true' : 'false')}
              disabled={saving}
            />
            <SettingToggle 
              label="Enforce 2FA" 
              description="Require all users to setup Two-Factor Authentication."
              checked={settings.find(s => s.key === 'enforce_2fa')?.value === 'true'}
              onToggle={(val) => handleUpdate('enforce_2fa', val ? 'true' : 'false')}
              disabled={saving}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const SettingItem = ({ label, description, value, onUpdate, disabled }) => {
  const [tempValue, setTempValue] = useState(value);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="max-w-md">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={tempValue} 
          onChange={(e) => setTempValue(e.target.value)}
          className="form-input text-sm py-1.5 px-3 min-w-[200px]"
          onBlur={() => tempValue !== value && onUpdate(tempValue)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, checked, onToggle, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="max-w-md">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <button
      onClick={() => onToggle(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  </div>
);

export default Settings;
