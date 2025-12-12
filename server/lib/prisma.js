// Import Prisma client from parent node_modules (generated there via schema in /prisma)
const { PrismaClient } = require('../../node_modules/@prisma/client');

// Create a single instance of PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;
