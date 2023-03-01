const express = require("express");
const userRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

userRoutes.route("/user/:id").get(function (req, res) {
  let db_connect = dbo.getDb();
  db_connect.collection("user").find({ id: req.body.id }).toArray(function (err, result) {
    if (err) throw err;
    res.json({ result: true, user: result });
  });
});

module.exports = userRoutes;