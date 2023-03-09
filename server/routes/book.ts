import express from "express";
import { Db, ObjectId } from "mongodb";
import { getDb } from "../db/conn";
import { Book } from "../model/book";

export const bookRoutes = express.Router();

var db: Db;

bookRoutes.route("/book").get(function (req, res) {
  db = getDb();
  let query = { ...req.query };
  db.collection<Book>("book").find(query).toArray().then((books) => {
    res.json({ result: true, books: books });
  }).catch(error => {
    console.error(error);
    res.status(500).json({ result: false });
  });
});

bookRoutes.route("/book/:id").get(function (req, res) {
  db = getDb();
  let query = { _id: new ObjectId(req.params.id) };
  db.collection<Book>("book").findOne(query).then(function (book) {
    res.json({ result: true, book: book });
  }).catch(error => {
    console.error(error);
    res.status(500).json({ result: false });
  });;
});

bookRoutes.route("/book").post(function (req, res) {
  db = getDb();
  try {
    const newBook = req.body as Book;
    db.collection("book").insertOne(newBook).then(result => {
      result
        ? res.status(201).json({ bookId: result.insertedId })
        : res.status(500).json({ result: false });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ result: false });
  }
});
