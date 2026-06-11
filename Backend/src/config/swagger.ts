import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GreenEx Waste Management API",
      version: "1.0.0",
      description: "API documentation for GreenEx waste collection platform",
    },
    servers: [{ url: "http://localhost:8000" }],
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
          required: ["full_name", "email", "telephone", "role", "password", "confirm_password"],
          properties: {
            full_name: { type: "string", example: "Grace Uwera" },
            email: { type: "string", format: "email", example: "grace@example.com" },
            telephone: { type: "string", example: "+250 7XX XXX XXX" },
            role: {
              type: "string",
              enum: ["citizen", "waste_collector", "admin"],
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
              enum: ["citizen", "waste_collector", "admin"],
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
        CompanyVehicle: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            company_id: { type: "integer", example: 7 },
            plate_number: { type: "string", example: "RAB 123 A" },
            model: { type: "string", example: "Isuzu NPR" },
            year: { type: "string", example: "2020" },
            capacity: { type: "string", example: "5 tons" },
            assigned_zone: { type: "string", example: "Kicukiro" },
            insurance_number: { type: "string", example: "INS-2024-001" },
            status: { type: "string", example: "active" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ChatMessage: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            company_id: { type: "integer", example: 7 },
            user_id: { type: "integer", example: 3 },
            sender_role: { type: "string", enum: ["citizen", "company"], example: "citizen" },
            sender_name: { type: "string", example: "Grace Uwera" },
            message: { type: "string", example: "Hello, when is the next collection?" },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
