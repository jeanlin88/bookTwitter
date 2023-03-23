import express from "express";
import { ObjectId, Filter } from "mongodb";
import { getDb } from "../db/conn";
import { isArrayOfString } from "../helper";
import { Book, BookRequest } from "../model/book";
import { TypedRequestQuery } from "../model/request";
import { Search } from "../model/search";

export const bookRoutes = express.Router();

bookRoutes.route("/book").get(function (req: TypedRequestQuery<Search>, res) {
  let query: Filter<Book> = {};
  if (req.query.author) {
    query.authors = { $elemMatch: { $regex: `.*${req.query.author}.*`, $options: 'i' } };
  }
  if (Array.isArray(req.query.keywords)) {
    req.query.keywords.forEach(keyword => {
      query.$and = [
        ...query.$and ? query.$and : [],
        {
          $or: [
            { title: { $regex: `.*${keyword}.*`, $options: 'i' } },
            { description: { $regex: `.*${keyword}.*`, $options: 'i' } }
          ]
        }
      ];
    })
  } else {
    return res.status(400).json({ result: false });
  }
  if (Array.isArray(req.query.labels)) {
    query.labels = { $all: req.query.labels };
  } else {
    return res.status(400).json({ result: false });
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
  let query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").findOne(query).then(function (book) {
    return res.json({ result: true, book: book });
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });;
});

bookRoutes.route("/book").post(function (req: express.Request<BookRequest>, res) {
  try {
    if (
      isArrayOfString(req.body.authors)
      && typeof req.body.coverImage === 'string'
      && typeof req.body.description === 'string'
      && isArrayOfString(req.body.labels)
      && typeof req.body.title === 'string'
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

bookRoutes.route("/book/:bookId").delete(function (req, res) {
  let query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").deleteOne(query).then(function () {
    return res.status(204);
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });;
});
