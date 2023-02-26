const express = require("express");
const bookRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

bookRoutes.route("/book").get(function (req, res) {
  let db_connect = dbo.getDb();
  console.log(req.query);
  searches = {
    title: req.query.title || '',
    author: req.query.author || '',
    labels: req.query.labels?.split(',') || [],
  }
  console.log("get book, search", searches);
  db_connect.collection("book").find({}).toArray().then((books, err) => {
    if (err) throw err;
    res.json({ result: true, books: books });
  });
});

bookRoutes.route("/book/:id").get(function (req, res) {
  let db_connect = dbo.getDb();
  db_connect.collection("book").find({ id: req.body.id }).toArray(function (err, result) {
    if (err) throw err;
    res.json({ result: true, book: result });
  });
});

bookRoutes.route("/book").post(function (req, res) {
  let db_connect = dbo.getDb();
  let newBook = {
    title: req.body.title,
    authors: [...req.body.authors],
    reviews: [],
    coverImage: req.body.coverImage,
    description: req.body.description
  }
  db_connect.collection("book").insertOne(newBook, function (err, result) {
    if (err) throw err;
    res.json({ result: true, bookId: result.insertedId });
  });
});

module.exports = bookRoutes;