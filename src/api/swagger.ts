// src/api/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkWise SA API',
      version: '1.0.0',
      description: 'API documentation for WorkWise SA platform',
      contact: {
        name: 'WorkWise SA Support',
        email: 'support@workwisesa.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'ValidationError',
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data',
                },
                details: {
                  type: 'object',
                  example: { field: 'username', issue: 'Required' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john.doe@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            role: {
              type: 'string',
              example: 'user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Software Engineer',
            },
            description: {
              type: 'string',
              example: 'We are looking for a skilled software engineer...',
            },
            companyId: {
              type: 'integer',
              example: 1,
            },
            location: {
              type: 'string',
              example: 'Cape Town, South Africa',
            },
            salary: {
              type: 'string',
              example: 'R30,000 - R45,000 per month',
            },
            jobType: {
              type: 'string',
              example: 'Full-time',
            },
            featured: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Acme Corporation',
            },
            slug: {
              type: 'string',
              example: 'acme-corporation',
            },
            description: {
              type: 'string',
              example: 'A leading technology company...',
            },
            logo: {
              type: 'string',
              example: 'https://example.com/logo.png',
            },
            website: {
              type: 'string',
              example: 'https://acme.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Information Technology',
            },
            slug: {
              type: 'string',
              example: 'information-technology',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/v1/routes/*.ts', './src/api/swagger-docs.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express) {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api-docs');
}
