const swaggerAutogen = require("swagger-autogen")();

const doc = {
    info: {
        title: "Book Twitter API",
        description: "API document for Book Twitter",
    },
    host: "localhost:5000",
    schemes: ["http"],
};

const outputFile = './docs/swagger-output.json';
const endpointsFiles = ['./server.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);