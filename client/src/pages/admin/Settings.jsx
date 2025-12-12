import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Settings() {
    const { authFetch } = useAuth();
    const [settings, setSettings] = useState({ markup: '', minCharge: '', currency: 'USD' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await authFetch('/api/admin/settings');
            const data = await response.json();
            setSettings({
                markup: data.markup || '',
                minCharge: data.minCharge || '',
                currency: data.currency || 'USD',
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const response = await authFetch('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loader" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-slate-400">Configure global pricing parameters</p>
            </div>

            <div className="glass-card p-6 max-w-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Settings saved successfully!
                        </div>
                    )}

                    <div>
                        <label className="label">Markup Percentage (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.markup}
                            onChange={(e) => setSettings({ ...settings, markup: e.target.value })}
                            className="input"
                            placeholder="e.g., 15"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                            This percentage will be added to the base cost calculation.
                        </p>
                    </div>

                    <div>
                        <label className="label">Minimum Charge ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={settings.minCharge}
                            onChange={(e) => setSettings({ ...settings, minCharge: e.target.value })}
                            className="input"
                            placeholder="e.g., 25"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                            Quotes below this value will be raised to the minimum charge.
                        </p>
                    </div>

                    <div>
                        <label className="label">Currency</label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="select"
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            {saving ? (
                                <>
                                    <div className="loader w-5 h-5" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
