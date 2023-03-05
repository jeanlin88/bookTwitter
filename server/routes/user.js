const express = require("express");
const userRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

userRoutes.route("/user/:username").get(function (req, res) {
  let db_connect = dbo.getDb();
  console.debug("get user");
  let query = { username: req.params.username };
  db_connect.collection("user").findOne(query).then((user) => {
    console.debug("1");
    if (user == null) {
      console.debug("2");
      res.status(404).json({result: false});
      return;
    };
    console.debug("3");
    res.json({ result: true, user: user });
    console.debug("4");
  }).catch(error => {
    console.error(error);
    res.status(500);
  })
});

module.exports = userRoutes;