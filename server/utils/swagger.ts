import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { version } from '../../package.json';
import path from 'path';

// Swagger definition
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkWise SA API Documentation',
      version,
      description: 'API documentation for the WorkWise SA platform',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'WorkWise SA Support',
        url: 'https://workwisesa.co.za',
        email: 'support@workwisesa.co.za',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.workwisesa.co.za',
        description: 'Production server',
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
      tags: [
        {
          name: 'Info',
          description: 'API information endpoints',
        },
        {
          name: 'Categories',
          description: 'Job category endpoints',
        },
        {
          name: 'Jobs',
          description: 'Job listing endpoints',
        },
        {
          name: 'Companies',
          description: 'Company information endpoints',
        },
        {
          name: 'Users',
          description: 'User management endpoints',
        },
        {
          name: 'Files',
          description: 'File upload and management endpoints',
        },
        {
          name: 'CV',
          description: 'CV generation and analysis endpoints',
        },
        {
          name: 'Dashboard',
          description: 'Dashboard data endpoints',
        },
        {
          name: 'WebSocket',
          description: 'WebSocket real-time communication',
        },
      ],
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
                  example: {
                    field: 'email',
                    message: 'Email is required',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'name'],
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
              format: 'email',
              example: 'john.doe@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            notificationPreference: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
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
            company: {
              type: 'string',
              example: 'TechSA',
            },
            companyLogo: {
              type: 'string',
              example: 'https://example.com/logo.png',
            },
            location: {
              type: 'string',
              example: 'Cape Town, Western Cape',
            },
            salary: {
              type: 'string',
              example: 'R55,000 - R75,000',
            },
            type: {
              type: 'string',
              example: 'Full-time',
            },
            category: {
              type: 'string',
              example: 'Information Technology',
            },
            description: {
              type: 'string',
              example: 'We are looking for an experienced software engineer...',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['5+ years in software development', 'Experience with React'],
            },
            postedDate: {
              type: 'string',
              format: 'date',
              example: '2023-01-01',
            },
            isFeatured: {
              type: 'boolean',
              example: true,
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
              example: 'TechSA',
            },
            logo: {
              type: 'string',
              example: 'https://example.com/logo.png',
            },
            description: {
              type: 'string',
              example: 'A leading tech company...',
            },
            location: {
              type: 'string',
              example: 'Cape Town, Western Cape',
            },
            industry: {
              type: 'string',
              example: 'Information Technology',
            },
            size: {
              type: 'string',
              example: '100-250 employees',
            },
            website: {
              type: 'string',
              example: 'https://techsa.co.za',
            },
            foundedYear: {
              type: 'integer',
              example: 2010,
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'integer',
              example: 1,
            },
            originalName: {
              type: 'string',
              example: 'resume.pdf',
            },
            storagePath: {
              type: 'string',
              example: 'uploads/1234567890-resume.pdf',
            },
            fileUrl: {
              type: 'string',
              example: 'http://localhost:5000/uploads/1234567890-resume.pdf',
            },
            mimeType: {
              type: 'string',
              example: 'application/pdf',
            },
            size: {
              type: 'integer',
              example: 12345,
            },
            fileType: {
              type: 'string',
              example: 'cv',
            },
            metadata: {
              type: 'object',
              example: {
                parsed: true,
                pages: 2,
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
      },
    },
  },
  apis: [
    './server/server/index.ts',
    './server/routes/*.ts',
    './server/routes.ts',
    './server/websocket.ts',
  ],
};

const specs = swaggerJsdoc(options);

/**
 * Initialize Swagger documentation
 */
export const setupSwagger = (app: Express) => {
  // Add WebSocket documentation
  specs.paths['/ws'] = {
    get: {
      tags: ['WebSocket'],
      summary: 'WebSocket connection endpoint',
      description: 'Connect to this endpoint using a WebSocket client to receive real-time updates. See the WebSocket documentation for details on message formats and protocols.',
      responses: {
        '101': {
          description: 'Switching Protocols - WebSocket connection established',
        },
      },
      'x-websocket': true,
    },
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Serve WebSocket documentation
  app.get('/api-docs/websocket', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'server/docs/websocket.md'));
  });
};
