import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "kawaz-mcp-server API",
            version: "1.0.0",
            description: "MCP server for the Kawaz+ streaming platform",
        },
        servers: [{ url: "http://localhost:8080", description: "Development server" }],
        components: {
            securitySchemes: {
                basicAuth: {
                    type: "http",
                    scheme: "basic",
                    description: "Your Kawaz+ username and password (new sessions only)",
                },
            },
            schemas: {
                UnauthorizedError: {
                    type: "object",
                    properties: { error: { type: "string", example: "Invalid credentials" } },
                },
            },
        },
    },
    apis: ["./src/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);