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
const endpointsFiles = ['./routes/book.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);