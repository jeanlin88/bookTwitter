const swaggerAutogen = require('swagger-autogen');

const doc = {
    info: {
        version: '0.1.0',
        title: "Book Twitter API",
        description: "API document for Book Twitter",
    },
    host: "localhost:5000",
    schemes: ["http"],
    tags: [
        {
            "name": "Book",
            "description": "Book API Endpoints"
        },
        {
            "name": "User",
            "description": "User API Endpoints"
        }
    ]
};

const outputFile = './docs/swagger-output.json';
const endpointsFiles = ['./server.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);