import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Pricing() {
    const { authFetch } = useAuth();
    const [pricing, setPricing] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [formData, setFormData] = useState({
        materialId: '',
        thickness: '',
        costPerArea: '',
        costPerTime: '',
        cutSpeed: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pricingRes, materialsRes] = await Promise.all([
                authFetch('/api/admin/pricing'),
                authFetch('/api/admin/materials'),
            ]);
            setPricing(await pricingRes.json());
            setMaterials(await materialsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (entry = null) => {
        setEditingEntry(entry);
        if (entry) {
            setFormData({
                materialId: entry.materialId.toString(),
                thickness: entry.thickness.toString(),
                costPerArea: entry.costPerArea.toString(),
                costPerTime: entry.costPerTime.toString(),
                cutSpeed: entry.cutSpeed.toString(),
            });
        } else {
            setFormData({
                materialId: materials[0]?.id?.toString() || '',
                thickness: '',
                costPerArea: '',
                costPerTime: '',
                cutSpeed: '',
            });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEntry(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const url = editingEntry
                ? `/api/admin/pricing/${editingEntry.id}`
                : '/api/admin/pricing';

            const response = await authFetch(url, {
                method: editingEntry ? 'PUT' : 'POST',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save');
            }

            await fetchData();
            closeModal();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this pricing entry?')) return;

        try {
            await authFetch(`/api/admin/pricing/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Group pricing by material
    const groupedPricing = pricing.reduce((acc, entry) => {
        const materialName = entry.material?.name || 'Unknown';
        if (!acc[materialName]) acc[materialName] = [];
        acc[materialName].push(entry);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loader" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Pricing</h1>
                    <p className="text-slate-400">Configure pricing for each material and thickness</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary" disabled={materials.length === 0}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Pricing
                </button>
            </div>

            {materials.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <p className="text-slate-400">Add materials first before setting up pricing.</p>
                    <a href="/admin/materials" className="btn btn-primary mt-4 inline-flex">
                        Go to Materials
                    </a>
                </div>
            ) : Object.keys(groupedPricing).length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <p className="text-slate-400">No pricing entries found. Add your first pricing entry.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedPricing).map(([materialName, entries]) => (
                        <div key={materialName} className="glass-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                                <h3 className="font-semibold text-lg">{materialName}</h3>
                                <span className="text-sm text-slate-400">({entries.length} entries)</span>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Thickness (mm)</th>
                                        <th>Cost/Area ($/mm²)</th>
                                        <th>Cost/Time ($/hr)</th>
                                        <th>Cut Speed (mm/min)</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="font-medium">{entry.thickness} mm</td>
                                            <td>${entry.costPerArea.toFixed(6)}</td>
                                            <td>${entry.costPerTime.toFixed(2)}</td>
                                            <td>{entry.cutSpeed.toLocaleString()}</td>
                                            <td className="text-right">
                                                <button onClick={() => openModal(entry)} className="btn btn-secondary mr-2 py-2 px-3">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(entry.id)} className="btn btn-danger py-2 px-3">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6">
                            {editingEntry ? 'Edit Pricing Entry' : 'Add Pricing Entry'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="label">Material</label>
                                <select
                                    value={formData.materialId}
                                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                                    className="select"
                                    required
                                >
                                    {materials.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Thickness (mm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.thickness}
                                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                                    className="input"
                                    placeholder="e.g., 1.0"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Cost per Area ($/mm²)</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={formData.costPerArea}
                                        onChange={(e) => setFormData({ ...formData, costPerArea: e.target.value })}
                                        className="input"
                                        placeholder="e.g., 0.00005"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Cost per Time ($/hr)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={formData.costPerTime}
                                        onChange={(e) => setFormData({ ...formData, costPerTime: e.target.value })}
                                        className="input"
                                        placeholder="e.g., 50"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Cut Speed (mm/min)</label>
                                <input
                                    type="number"
                                    step="100"
                                    value={formData.cutSpeed}
                                    onChange={(e) => setFormData({ ...formData, cutSpeed: e.target.value })}
                                    className="input"
                                    placeholder="e.g., 3000"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
