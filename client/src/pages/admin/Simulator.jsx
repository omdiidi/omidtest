import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePrice, formatCurrency } from '../../lib/pricing';

export default function Simulator() {
    const { authFetch } = useAuth();
    const [config, setConfig] = useState({ materials: [], settings: {} });
    const [loading, setLoading] = useState(true);

    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [selectedThickness, setSelectedThickness] = useState('');
    const [dimensions, setDimensions] = useState({ width: 100, height: 100, length: 500 });
    const [priceBreakdown, setPriceBreakdown] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();
            setConfig(data);
            if (data.materials.length > 0) {
                setSelectedMaterial(data.materials[0].id.toString());
                if (data.materials[0].pricingEntries.length > 0) {
                    setSelectedThickness(data.materials[0].pricingEntries[0].thickness.toString());
                }
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateQuote();
    }, [selectedMaterial, selectedThickness, dimensions, config]);

    const calculateQuote = () => {
        const material = config.materials.find(m => m.id.toString() === selectedMaterial);
        if (!material) return;

        const pricing = material.pricingEntries.find(p => p.thickness.toString() === selectedThickness);
        if (!pricing) return;

        const metrics = {
            width: parseFloat(dimensions.width) || 0,
            height: parseFloat(dimensions.height) || 0,
            totalLength: parseFloat(dimensions.length) || 0,
            area: (parseFloat(dimensions.width) || 0) * (parseFloat(dimensions.height) || 0),
        };

        const breakdown = calculatePrice(metrics, pricing, config.settings);
        setPriceBreakdown(breakdown);
    };

    const currentMaterial = config.materials.find(m => m.id.toString() === selectedMaterial);
    const thicknesses = currentMaterial?.pricingEntries || [];

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
                <h1 className="text-3xl font-bold mb-2">Pricing Simulator</h1>
                <p className="text-slate-400">Test pricing calculations with manual dimensions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-6">Input Parameters</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="label">Material</label>
                            <select
                                value={selectedMaterial}
                                onChange={(e) => {
                                    setSelectedMaterial(e.target.value);
                                    const mat = config.materials.find(m => m.id.toString() === e.target.value);
                                    if (mat?.pricingEntries.length > 0) {
                                        setSelectedThickness(mat.pricingEntries[0].thickness.toString());
                                    }
                                }}
                                className="select"
                            >
                                {config.materials.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Thickness</label>
                            <select
                                value={selectedThickness}
                                onChange={(e) => setSelectedThickness(e.target.value)}
                                className="select"
                            >
                                {thicknesses.map((p) => (
                                    <option key={p.thickness} value={p.thickness}>{p.thickness} mm</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Width (mm)</label>
                                <input
                                    type="number"
                                    value={dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Height (mm)</label>
                                <input
                                    type="number"
                                    value={dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Cut Length (mm)</label>
                                <input
                                    type="number"
                                    value={dimensions.length}
                                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Panel */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-6">Price Breakdown</h2>

                    {priceBreakdown ? (
                        <div className="space-y-4">
                            <div className="text-center py-6 border-b border-slate-700/50">
                                <div className="text-4xl font-bold gradient-text">
                                    {formatCurrency(priceBreakdown.finalPrice, priceBreakdown.currency)}
                                </div>
                                {priceBreakdown.minChargeApplied && (
                                    <div className="text-amber-400 text-sm mt-2">
                                        ⚠️ Minimum charge applied
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Bounding Box Area</span>
                                    <span>{priceBreakdown.details.area.toLocaleString()} mm²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Area Cost</span>
                                    <span>{formatCurrency(priceBreakdown.areaCost, priceBreakdown.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Cut Time</span>
                                    <span>{priceBreakdown.details.cutTimeMinutes.toFixed(2)} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Time Cost</span>
                                    <span>{formatCurrency(priceBreakdown.timeCost, priceBreakdown.currency)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-700/50">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span>{formatCurrency(priceBreakdown.subtotal, priceBreakdown.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Markup ({priceBreakdown.markupPercent}%)</span>
                                    <span>+{formatCurrency(priceBreakdown.markupAmount, priceBreakdown.currency)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-700/50 font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(priceBreakdown.withMarkup, priceBreakdown.currency)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-8">
                            Select material and enter dimensions to see pricing
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
