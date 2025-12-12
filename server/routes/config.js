const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/config - Public endpoint for frontend configuration
router.get('/', async (req, res) => {
    try {
        // Get all materials with their pricing entries
        const materials = await prisma.material.findMany({
            include: {
                pricingEntries: {
                    orderBy: { thickness: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Get global settings as key-value object
        const settingsArray = await prisma.globalSettings.findMany();
        const settings = settingsArray.reduce((acc, item) => {
            // Parse numeric values
            if (['markup', 'minCharge'].includes(item.key)) {
                acc[item.key] = parseFloat(item.value);
            } else {
                acc[item.key] = item.value;
            }
            return acc;
        }, {});

        res.json({
            materials,
            settings,
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

module.exports = router;
