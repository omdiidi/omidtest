import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Materials() {
    const { authFetch } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState({ name: '', defaultDensity: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const response = await authFetch('/api/admin/materials');
            const data = await response.json();
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (material = null) => {
        setEditingMaterial(material);
        setFormData(material ? { name: material.name, defaultDensity: material.defaultDensity || '' } : { name: '', defaultDensity: '' });
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMaterial(null);
        setFormData({ name: '', defaultDensity: '' });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const url = editingMaterial
                ? `/api/admin/materials/${editingMaterial.id}`
                : '/api/admin/materials';

            const response = await authFetch(url, {
                method: editingMaterial ? 'PUT' : 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    defaultDensity: formData.defaultDensity ? parseFloat(formData.defaultDensity) : null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save');
            }

            await fetchMaterials();
            closeModal();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this material? This will also delete all associated pricing entries.')) {
            return;
        }

        try {
            await authFetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
            await fetchMaterials();
        } catch (error) {
            console.error('Failed to delete:', error);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Materials</h1>
                    <p className="text-slate-400">Manage material types for your quoting system</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Material
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Density (g/cm³)</th>
                            <th>Pricing Entries</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-400">
                                    No materials found. Add your first material to get started.
                                </td>
                            </tr>
                        ) : (
                            materials.map((material) => (
                                <tr key={material.id}>
                                    <td className="font-medium">{material.name}</td>
                                    <td>{material.defaultDensity || '—'}</td>
                                    <td>
                                        <span className="px-2 py-1 bg-slate-700 rounded-lg text-sm">
                                            {material.pricingEntries?.length || 0} entries
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => openModal(material)} className="btn btn-secondary mr-2 py-2 px-3">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(material.id)} className="btn btn-danger py-2 px-3">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6">
                            {editingMaterial ? 'Edit Material' : 'Add Material'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="label">Material Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Steel, Aluminum"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Default Density (g/cm³) - Optional</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.defaultDensity}
                                    onChange={(e) => setFormData({ ...formData, defaultDensity: e.target.value })}
                                    className="input"
                                    placeholder="e.g., 7.85"
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
