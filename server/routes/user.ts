import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/conn";
import { User } from "../document/user";

export const userRoutes = express.Router()

var db = getDb();

userRoutes.route("/user/:username").get(function (req, res) {
  db = getDb();
  let query = { ...req.params };
  db.collection<User>("user").findOne(query).then((user) => {
    console.debug("1");
    if (user == null) {
      console.debug("2");
      res.status(404).json({ result: false });
      return;
    };
    console.debug("3");
    res.json({ result: true, user: user });
    console.debug("4");
  }).catch(error => {
    console.error(error);
    res.status(500).json({ result: false });
  })
});
