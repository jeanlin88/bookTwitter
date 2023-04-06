import express from "express";
import { Filter, ObjectId, WithId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../db/conn";
import { emailExist, usernameExist } from "../../helper";
import { TypedRequestBody } from "../../model/request";
import { errResBody, InsertedResponse, UserResponse } from "../../model/response";
import { User, UserRequest } from "../../model/user";

export const userRoutes = express.Router();

userRoutes.route("/:username").get((req, res) => {
  /* 	#swagger.tags = ['User']
      #swagger.description = 'Endpoint to get user info by its username' */
  //TODO: add regex check for username
  const query = { username: req.params.username };
  getDb().collection<User>("user").findOne(query).then((user) => {
    if (user === null) {
      return res.status(404).json(errResBody);
    };
    delete user.hashedPass
    const resBody: UserResponse = { result: true, user };
    return res.json(resBody);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
});

userRoutes.route("/").post(async (req: TypedRequestBody<UserRequest>, res) => {
  /* 	#swagger.tags = ['User']
      #swagger.description = 'Endpoint to post user info' */
  //TODO: add regex check for email, username
  if (
    typeof req.body.avatar === 'string'
    && typeof req.body.email === 'string'
    && typeof req.body.hashedPass === 'string'
    && typeof req.body.username === 'string'
  ) {
    if (
      await usernameExist(req.body.username)
      || await emailExist(req.body.email)
    ) {
      return res.status(409).json(errResBody);
    }
    const newUser: WithId<User> = {
      _id: new ObjectId(uuidv4()),
      avatar: req.body.avatar,
      email: req.body.email,
      hashedPass: req.body.hashedPass,
      registrationDate: new Date(),
      username: req.body.username
    };
    console.debug(newUser);
    getDb().collection<User>("user").insertOne(newUser).then(result => {
      if (result.insertedId === null) {
        return res.status(400).json(errResBody);
      }
      const resBody: InsertedResponse = { id: result.insertedId };
      return res.status(201).json(resBody);
    }).catch((error) => {
      console.error(error);
      return res.status(500).json(errResBody);
    });
  } else {
    return res.status(400).json(errResBody);
  }
});

userRoutes.route("/:userId").delete((req, res) => {
  /* 	#swagger.tags = ['User']
      #swagger.description = 'Endpoint to delete user info by its id' */
  const query: Filter<User> = { _id: new ObjectId(req.params.userId) };
  getDb().collection<User>("user").deleteOne(query).then(() => {
    return res.status(204);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
});