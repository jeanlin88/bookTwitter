import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../../db/conn";
import { User } from "../../model/user";

export const userRoutes = express.Router();

userRoutes.route("/:username").get(function (req, res) {
  //TODO: add regex check for username
  let query = { username: req.params.username };
  getDb().collection<User>("user").findOne(query).then((user) => {
    if (user === null) {
      return res.status(404).json({ result: false });
    };
    return res.json({ result: true, user: user });
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  })
});
