import cors from "cors";
import express from "express";
import { connectToServer } from "./db/conn";
import { bookRoutes } from "./routes/book";
import { userRoutes } from "./routes/user";

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
app.use(function (req, res) {
    res.status(404).json({ result: false });
})

app.listen(process.env.PORT || 5000, () => {
    // perform a database connection when server starts
    connectToServer(function (err: Error) {
        if (err) console.error(err);
    });
});