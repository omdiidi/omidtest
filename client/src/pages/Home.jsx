import { useState, useEffect, useRef, useCallback } from 'react';
import { parseDxf, readDxfFile, DxfRenderer } from '../lib/dxf';
import { calculatePrice, formatCurrency, formatNumber } from '../lib/pricing';

export default function Home() {
    const [config, setConfig] = useState({ materials: [], settings: {} });
    const [loading, setLoading] = useState(true);
    const [dxfData, setDxfData] = useState(null);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [selectedThickness, setSelectedThickness] = useState('');
    const [priceBreakdown, setPriceBreakdown] = useState(null);

    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

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

    // Initialize canvas renderer
    useEffect(() => {
        if (canvasRef.current && !rendererRef.current) {
            rendererRef.current = new DxfRenderer(canvasRef.current);
        }
        return () => {
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, [dxfData]);

    // Update renderer when DXF data changes
    useEffect(() => {
        if (rendererRef.current && dxfData) {
            rendererRef.current.setEntities(dxfData.entities, dxfData.metrics.bounds);
        }
    }, [dxfData]);

    // Calculate price when inputs change
    useEffect(() => {
        if (!dxfData || !config.materials.length) return;

        const material = config.materials.find(m => m.id.toString() === selectedMaterial);
        if (!material) return;

        const pricing = material.pricingEntries.find(p => p.thickness.toString() === selectedThickness);
        if (!pricing) return;

        const breakdown = calculatePrice(dxfData.metrics, pricing, config.settings);
        setPriceBreakdown(breakdown);
    }, [dxfData, selectedMaterial, selectedThickness, config]);

    const handleFile = async (file) => {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.dxf')) {
            setError('Please upload a DXF file');
            return;
        }

        setError('');
        try {
            const content = await readDxfFile(file);
            const parsed = parseDxf(content);
            setDxfData(parsed);
        } catch (err) {
            setError(err.message);
            setDxfData(null);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    const currentMaterial = config.materials.find(m => m.id.toString() === selectedMaterial);
    const thicknesses = currentMaterial?.pricingEntries || [];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold gradient-text">DXF Quote Tool</h1>
                    <a href="/admin/login" className="text-slate-400 hover:text-white text-sm transition">
                        Admin →
                    </a>
                </div>
            </header>

            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="loader" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Upload & Preview */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Upload Area */}
                            {!dxfData && (
                                <div
                                    className={`dropzone ${dragActive ? 'active' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    <input
                                        type="file"
                                        accept=".dxf"
                                        onChange={(e) => handleFile(e.target.files[0])}
                                        className="hidden"
                                        id="file-input"
                                    />
                                    <label htmlFor="file-input" className="cursor-pointer">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div className="text-lg font-medium mb-2">Drop your DXF file here</div>
                                        <div className="text-slate-400">or click to browse</div>
                                    </label>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* DXF Viewer */}
                            {dxfData && (
                                <div className="glass-card overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="font-medium">DXF Preview</span>
                                            <span className="text-sm text-slate-400">
                                                {dxfData.metrics.entityCount} entities
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setDxfData(null)}
                                            className="text-slate-400 hover:text-white transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <canvas
                                        ref={canvasRef}
                                        width={800}
                                        height={500}
                                        className="w-full bg-slate-900"
                                        style={{ cursor: 'grab' }}
                                    />
                                </div>
                            )}

                            {/* Metrics */}
                            {dxfData && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Width', value: formatNumber(dxfData.metrics.width, 'mm') },
                                        { label: 'Height', value: formatNumber(dxfData.metrics.height, 'mm') },
                                        { label: 'Cut Length', value: formatNumber(dxfData.metrics.totalLength, 'mm') },
                                        { label: 'Bounding Area', value: formatNumber(dxfData.metrics.area, 'mm²', 0) },
                                    ].map((metric) => (
                                        <div key={metric.label} className="glass-card p-4">
                                            <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
                                            <div className="text-lg font-semibold">{metric.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Quote Panel */}
                        <div className="space-y-6">
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-semibold mb-6">Get Your Quote</h2>

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
                                </div>

                                {/* Price Display */}
                                {priceBreakdown && dxfData ? (
                                    <div className="mt-8">
                                        <div className="text-center py-6 border-t border-slate-700/50">
                                            <div className="text-sm text-slate-400 mb-2">Estimated Price</div>
                                            <div className="text-4xl font-bold gradient-text">
                                                {formatCurrency(priceBreakdown.finalPrice, priceBreakdown.currency)}
                                            </div>
                                            {priceBreakdown.minChargeApplied && (
                                                <div className="text-amber-400 text-xs mt-2">
                                                    ⚠️ Minimum charge applied
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm pt-4 border-t border-slate-700/50">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Area Cost</span>
                                                <span>{formatCurrency(priceBreakdown.areaCost)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Cut Time ({priceBreakdown.details.cutTimeMinutes.toFixed(1)} min)</span>
                                                <span>{formatCurrency(priceBreakdown.timeCost)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Markup ({priceBreakdown.markupPercent}%)</span>
                                                <span>+{formatCurrency(priceBreakdown.markupAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 text-center py-8 border-t border-slate-700/50">
                                        <div className="text-slate-400">
                                            {dxfData ? 'Select material and thickness' : 'Upload a DXF file to get a quote'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info Card */}
                            <div className="glass-card p-6">
                                <h3 className="font-medium mb-3">How it works</h3>
                                <ol className="space-y-3 text-sm text-slate-400">
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">1</span>
                                        Upload your DXF file
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">2</span>
                                        Select material and thickness
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">3</span>
                                        Get instant pricing
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
