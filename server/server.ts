import cors from "cors";
import express from "express";
import * as swaggerUi from "swagger-ui-express";
import { connectToServer } from "./db/conn";
import { bookRoutes } from "./routes/book";
import { userRoutes } from "./routes/user";
import * as swaggerDocument from "./docs/swagger-output.json";

const app = express();

app.use(cors());
app.use(express.json());

//middleware
app.use(function (req, res, next) {
    console.debug(req.url, req.params, req.body);
    next();
});
//routes
app.use(bookRoutes);
app.use(userRoutes);
//API swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//default 404 response
app.use(function (req, res) {
    res.status(404).json({ result: false });
})
//listen
app.listen(process.env.PORT || 5000, () => {
    // perform a database connection when server starts
    connectToServer(function (err: Error) {
        console.error(err);
    });
});