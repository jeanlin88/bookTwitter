import express from "express";
import { ObjectId, Filter } from "mongodb";
import { getDb } from "../db/conn";
import { Book } from "../model/book";
import { Search } from "../model/search";
import { isArrayOfString } from "../helper";

export const bookRoutes = express.Router();

bookRoutes.route("/book").get(function (req: express.Request<Search>, res) {
  let query = {} as Filter<Book>;
  if (req.query.author) {
    query.authors = { $elemMatch: { $regex: `.*${req.query.author}.*` } };
  }
  if (req.query.keyword) {
    query.$or = [
      { title: { $regex: `.*${req.query.keyword}.*` } },
      { description: { $regex: `.*${req.query.keyword}.*` } }
    ];
  }
  if (Array.isArray(req.query.labels)) {
    query.labels = { $all: req.query.labels };
  }
  console.debug("query:", JSON.stringify(query));
  getDb().collection<Book>("book").find(query).toArray().then((books) => {
    return res.json({ result: true, books: books });
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });
});

bookRoutes.route("/book/:bookId").get(function (req, res) {
  let query = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").findOne(query).then(function (book) {
    return res.json({ result: true, book: book });
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });;
});

bookRoutes.route("/book").post(function (req, res) {
  try {
    if (
      isArrayOfString(req.body.book.authors)
      && typeof req.body.book.coverImage === 'string'
      && typeof req.body.book.description === 'string'
      && isArrayOfString(req.body.book.labels)
      && typeof req.body.book.title === 'string'
    ) {
      const newBook: Book = {
        authors: req.body.book.authors,
        coverImage: req.body.book.coverImage,
        description: req.body.book.description,
        labels: req.body.book.labels,
        reviews: [],
        title: req.body.book.title
      };
      console.debug(newBook);
      //TODO: add duplicate checking
      getDb().collection<Book>("book").insertOne(newBook).then(result => {
        return result
          ? res.status(201).json({ bookId: result.insertedId })
          : res.status(500).json({ result: false });
      });
    }
    else {
      return res.status(400).json({ result: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ result: false });
  }
});
