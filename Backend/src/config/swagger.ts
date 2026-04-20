import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GreenEx Waste Management API",
      version: "1.0.0",
      description: "API documentation for GreenEx waste collection platform",
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      responses: {
        BadRequest: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["full_name", "email", "telephone", "password", "confirm_password"],
          properties: {
            full_name: { type: "string", example: "Grace Uwera" },
            email: { type: "string", format: "email", example: "grace@example.com" },
            telephone: { type: "string", example: "+250 7XX XXX XXX" },
            role: {
              type: "string",
              enum: ["Citizen", "Collector", "Admin"],
              default: "Citizen",
            },
            password: { type: "string", minLength: 6, example: "secret123" },
            confirm_password: { type: "string", example: "secret123" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "grace@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            full_name: { type: "string", example: "Grace Uwera" },
            email: { type: "string", format: "email", example: "grace@example.com" },
            telephone: { type: "string", example: "+250 7XX XXX XXX" },
            password: { type: "string", minLength: 6, example: "newpassword123" },
          },
        },
        AdminUpdateRequest: {
          type: "object",
          properties: {
            full_name: { type: "string", example: "Grace Uwera" },
            email: { type: "string", format: "email", example: "grace@example.com" },
            telephone: { type: "string", example: "+250 7XX XXX XXX" },
            role: {
              type: "string",
              enum: ["Citizen", "Collector", "Admin"],
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "integer" },
            full_name: { type: "string" },
            email: { type: "string" },
            telephone: { type: "string" },
            role: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            token: { type: "string" },
            user: { $ref: "#/components/schemas/UserProfile" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
