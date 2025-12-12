const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash,
        },
    });
    console.log('✓ Admin user created (admin / admin123)');

    // Create materials
    const materials = [
        { name: 'Steel', defaultDensity: 7.85 },
        { name: 'Aluminum', defaultDensity: 2.70 },
        { name: 'Stainless Steel', defaultDensity: 8.00 },
    ];

    for (const mat of materials) {
        await prisma.material.upsert({
            where: { name: mat.name },
            update: {},
            create: mat,
        });
    }
    console.log('✓ Materials created');

    // Create pricing entries
    const steel = await prisma.material.findUnique({ where: { name: 'Steel' } });
    const aluminum = await prisma.material.findUnique({ where: { name: 'Aluminum' } });
    const stainless = await prisma.material.findUnique({ where: { name: 'Stainless Steel' } });

    const pricingData = [
        // Steel pricing
        { materialId: steel.id, thickness: 1.0, costPerArea: 0.00005, costPerTime: 50, cutSpeed: 3000 },
        { materialId: steel.id, thickness: 2.0, costPerArea: 0.00008, costPerTime: 50, cutSpeed: 2500 },
        { materialId: steel.id, thickness: 3.0, costPerArea: 0.00012, costPerTime: 50, cutSpeed: 2000 },
        // Aluminum pricing
        { materialId: aluminum.id, thickness: 1.0, costPerArea: 0.00007, costPerTime: 45, cutSpeed: 4000 },
        { materialId: aluminum.id, thickness: 2.0, costPerArea: 0.00011, costPerTime: 45, cutSpeed: 3500 },
        { materialId: aluminum.id, thickness: 3.0, costPerArea: 0.00016, costPerTime: 45, cutSpeed: 3000 },
        // Stainless pricing
        { materialId: stainless.id, thickness: 1.0, costPerArea: 0.00010, costPerTime: 60, cutSpeed: 2500 },
        { materialId: stainless.id, thickness: 2.0, costPerArea: 0.00015, costPerTime: 60, cutSpeed: 2000 },
        { materialId: stainless.id, thickness: 3.0, costPerArea: 0.00022, costPerTime: 60, cutSpeed: 1500 },
    ];

    for (const entry of pricingData) {
        await prisma.pricingEntry.upsert({
            where: {
                materialId_thickness: {
                    materialId: entry.materialId,
                    thickness: entry.thickness,
                },
            },
            update: entry,
            create: entry,
        });
    }
    console.log('✓ Pricing entries created');

    // Create global settings
    const settings = [
        { key: 'markup', value: '15' },
        { key: 'minCharge', value: '25' },
        { key: 'currency', value: 'USD' },
    ];

    for (const setting of settings) {
        await prisma.globalSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log('✓ Global settings created');

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
