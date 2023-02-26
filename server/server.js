const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

//middleware
app.use(function (req, res, next) {
    console.log("middleware");
    if (!dbo.getDb()) {
        res.status(503);
        res.json({ result: false, error: { code: 1, message: "Database is down" } });
        return
    }
    next();
});

app.use(require("./routes/book"));
// get driver connection
const dbo = require("./db/conn");

app.listen(port, () => {
    // perform a database connection when server starts
    dbo.connectToServer(function (err) {
        if (err) console.error(err);

    });
    console.log(`Server is running on port: ${port}`);
});