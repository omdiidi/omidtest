const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// ================== MATERIALS ==================

// GET /api/admin/materials
router.get('/materials', async (req, res) => {
    try {
        const materials = await prisma.material.findMany({
            include: { pricingEntries: true },
            orderBy: { name: 'asc' },
        });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});

// POST /api/admin/materials
router.post('/materials', async (req, res) => {
    try {
        const { name, defaultDensity } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const material = await prisma.material.create({
            data: { name, defaultDensity: defaultDensity || null },
        });
        res.status(201).json(material);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Material name already exists' });
        }
        console.error('Error creating material:', error);
        res.status(500).json({ error: 'Failed to create material' });
    }
});

// PUT /api/admin/materials/:id
router.put('/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, defaultDensity } = req.body;
        const material = await prisma.material.update({
            where: { id: parseInt(id) },
            data: { name, defaultDensity: defaultDensity || null },
        });
        res.json(material);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Material not found' });
        }
        console.error('Error updating material:', error);
        res.status(500).json({ error: 'Failed to update material' });
    }
});

// DELETE /api/admin/materials/:id
router.delete('/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.material.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Material deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Material not found' });
        }
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'Failed to delete material' });
    }
});

// ================== PRICING ==================

// GET /api/admin/pricing
router.get('/pricing', async (req, res) => {
    try {
        const pricing = await prisma.pricingEntry.findMany({
            include: { material: true },
            orderBy: [{ materialId: 'asc' }, { thickness: 'asc' }],
        });
        res.json(pricing);
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.status(500).json({ error: 'Failed to fetch pricing' });
    }
});

// POST /api/admin/pricing
router.post('/pricing', async (req, res) => {
    try {
        const { materialId, thickness, costPerArea, costPerTime, cutSpeed } = req.body;
        if (!materialId || thickness === undefined) {
            return res.status(400).json({ error: 'Material ID and thickness are required' });
        }
        const entry = await prisma.pricingEntry.create({
            data: {
                materialId: parseInt(materialId),
                thickness: parseFloat(thickness),
                costPerArea: parseFloat(costPerArea) || 0,
                costPerTime: parseFloat(costPerTime) || 0,
                cutSpeed: parseFloat(cutSpeed) || 1000,
            },
            include: { material: true },
        });
        res.status(201).json(entry);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Pricing entry for this material/thickness already exists' });
        }
        console.error('Error creating pricing:', error);
        res.status(500).json({ error: 'Failed to create pricing entry' });
    }
});

// PUT /api/admin/pricing/:id
router.put('/pricing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { materialId, thickness, costPerArea, costPerTime, cutSpeed } = req.body;
        const entry = await prisma.pricingEntry.update({
            where: { id: parseInt(id) },
            data: {
                materialId: parseInt(materialId),
                thickness: parseFloat(thickness),
                costPerArea: parseFloat(costPerArea),
                costPerTime: parseFloat(costPerTime),
                cutSpeed: parseFloat(cutSpeed),
            },
            include: { material: true },
        });
        res.json(entry);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Pricing entry not found' });
        }
        console.error('Error updating pricing:', error);
        res.status(500).json({ error: 'Failed to update pricing entry' });
    }
});

// DELETE /api/admin/pricing/:id
router.delete('/pricing/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.pricingEntry.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Pricing entry deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Pricing entry not found' });
        }
        console.error('Error deleting pricing:', error);
        res.status(500).json({ error: 'Failed to delete pricing entry' });
    }
});

// ================== SETTINGS ==================

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
    try {
        const settingsArray = await prisma.globalSettings.findMany();
        const settings = settingsArray.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/admin/settings
router.put('/settings', async (req, res) => {
    try {
        const settings = req.body;
        const updates = Object.entries(settings).map(([key, value]) =>
            prisma.globalSettings.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            })
        );
        await Promise.all(updates);
        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
