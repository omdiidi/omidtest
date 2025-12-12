import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState({ materials: 0, pricing: 0 });
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [materialsRes, pricingRes, settingsRes] = await Promise.all([
                authFetch('/api/admin/materials'),
                authFetch('/api/admin/pricing'),
                authFetch('/api/admin/settings'),
            ]);

            const materials = await materialsRes.json();
            const pricing = await pricingRes.json();
            const settingsData = await settingsRes.json();

            setStats({
                materials: materials.length,
                pricing: pricing.length,
            });
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loader" />
            </div>
        );
    }

    const statCards = [
        { label: 'Materials', value: stats.materials, icon: '📦', color: 'from-blue-500 to-cyan-500' },
        { label: 'Pricing Entries', value: stats.pricing, icon: '💰', color: 'from-green-500 to-emerald-500' },
        { label: 'Markup', value: `${settings.markup || 0}%`, icon: '📈', color: 'from-purple-500 to-pink-500' },
        { label: 'Min Charge', value: `$${settings.minCharge || 0}`, icon: '🏷️', color: 'from-orange-500 to-red-500' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-slate-400">Overview of your DXF Quote System</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card) => (
                    <div key={card.label} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">{card.icon}</span>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} opacity-20`} />
                        </div>
                        <div className="text-2xl font-bold mb-1">{card.value}</div>
                        <div className="text-slate-400 text-sm">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <a href="/admin/materials" className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium">Add Material</div>
                                    <div className="text-sm text-slate-400">Create a new material type</div>
                                </div>
                            </div>
                        </a>
                        <a href="/admin/pricing" className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium">Add Pricing</div>
                                    <div className="text-sm text-slate-400">Set up pricing for materials</div>
                                </div>
                            </div>
                        </a>
                        <a href="/admin/simulator" className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium">Test Pricing</div>
                                    <div className="text-sm text-slate-400">Simulate pricing calculations</div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Current Settings</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                            <span className="text-slate-400">Currency</span>
                            <span className="font-medium">{settings.currency || 'USD'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                            <span className="text-slate-400">Markup Percentage</span>
                            <span className="font-medium">{settings.markup || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-slate-400">Minimum Charge</span>
                            <span className="font-medium">${settings.minCharge || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
