const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RetenzaConnect API',
      version: '1.0.0',
      description:
        'API backend for RetenzaConnect - loyalty programs, QR codes, commerce management and merchant dashboard.',
      contact: {
        name: 'Retenza Support',
        email: 'support@retenza.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
            email: { type: 'string', example: 'merchant@example.com' },
            role: { type: 'string', enum: ['merchant', 'client', 'admin'], example: 'merchant' },
            firstName: { type: 'string', example: 'Jean' },
            lastName: { type: 'string', example: 'Dupont' },
            phone: { type: 'string', example: '+33612345678' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Commerce: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Café du Centre' },
            description: { type: 'string' },
            category: { type: 'string', example: 'Restaurant' },
            logo: { type: 'string', example: '/uploads/logo.png' },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' },
                postalCode: { type: 'string' },
              },
            },
            openingHours: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string', example: 'monday' },
                  open: { type: 'string', example: '09:00' },
                  close: { type: 'string', example: '18:00' },
                  isClosed: { type: 'boolean', example: false },
                },
              },
            },
            loyaltyProgram: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['points', 'stamps', 'cashback'], example: 'points' },
                pointsPerEuro: { type: 'number', example: 1 },
                stampsRequired: { type: 'number', example: 10 },
                cashbackPercentage: { type: 'number', example: 5 },
              },
            },
            status: { type: 'string', enum: ['active', 'suspended', 'pending'], example: 'active' },
            merchant: { type: 'string' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string', example: 'Marie' },
            lastName: { type: 'string', example: 'Martin' },
            email: { type: 'string', example: 'marie@example.com' },
            phone: { type: 'string', example: '+33698765432' },
            commerce: { type: 'string' },
            user: { type: 'string' },
          },
        },
        LoyaltyAccount: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            client: { type: 'string' },
            commerce: { type: 'string' },
            points: { type: 'number', example: 150 },
            stamps: { type: 'number', example: 3 },
            cashbackBalance: { type: 'number', example: 12.5 },
            totalEarned: { type: 'number', example: 500 },
            totalRedeemed: { type: 'number', example: 100 },
          },
        },
        LoyaltyTransaction: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            client: { type: 'string' },
            commerce: { type: 'string' },
            type: { type: 'string', enum: ['earn', 'redeem', 'adjustment'], example: 'earn' },
            programType: { type: 'string', enum: ['points', 'stamps', 'cashback'] },
            amount: { type: 'number', example: 10 },
            description: { type: 'string', example: 'Purchase reward' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        QRCode: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            commerce: { type: 'string' },
            code: { type: 'string', example: 'RC-A1B2C3D4' },
            url: { type: 'string', example: 'http://localhost:3000/scan/RC-A1B2C3D4' },
            scanCount: { type: 'number', example: 42 },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
    tags: [
      { name: 'Automated Tests', description: 'Run complete automated E2E tests for the platform' },
      { name: 'Authentication', description: 'User registration, login and password recovery' },
      { name: 'Commerce', description: 'Commerce profile management' },
      { name: 'QR Code', description: 'QR code generation and scan tracking' },
      { name: 'Client', description: 'Client acquisition after QR scan' },
      { name: 'Loyalty', description: 'Points, stamps and cashback loyalty programs' },
      { name: 'Wallet', description: 'Apple Wallet and Google Wallet pass data' },
      { name: 'Dashboard', description: 'Merchant dashboard statistics' },
      { name: 'Admin', description: 'Platform administration' },
      { name: 'Admin - Commerces', description: 'Gérer commerces - inviter, modifier, suspendre, supprimer' },
      { name: 'Admin - Support', description: 'Gérer support - consulter, répondre, clôturer' },
      { name: 'Admin - Incidents', description: 'Gérer incidents - consulter, modifier statut, répondre' },
      { name: 'Support', description: 'Soumission de demandes de support' },
      { name: 'Incidents', description: 'Signalement d\'incidents' },
      { name: 'Commerçant - Incidents', description: 'Consulter, créer, modifier incidents et confirmer résolution' },
      { name: 'Commerçant - Fidélité', description: 'Configurer points, tampons, cashback et QR code' },
      { name: 'Commerçant - Clients', description: 'Consulter clients et récompenses' },
      { name: 'Commerçant - Achats', description: 'Gérer achats, valider et attribuer récompenses' },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
