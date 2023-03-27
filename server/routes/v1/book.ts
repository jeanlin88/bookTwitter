import express from "express";
import { ObjectId, Filter, UpdateFilter } from "mongodb";
import { getDb } from "../../db/conn";
import { isArrayOfString } from "../../helper";
import { Book, BookField, BookRequest, BookReview } from "../../model/book";
import { TypedRequestQuery } from "../../model/request";
import { BaseResponse, BookFieldResponse } from "../../model/response";
import { Search } from "../../model/search";
import { User } from "../../model/user";

export const bookRoutes = express.Router();

bookRoutes.route("/all/fields").get(function (req, res: BookFieldResponse | BaseResponse) {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to get available fields of book' */
  const aggs = [
    {
      $group: {
        _id: new ObjectId(),
        labels: { $addToSet: "$labels" },
        authors: { $addToSet: "$authors" }
      }
    },
    {
      $addFields: {
        labels: {
          $reduce: {
            input: "$labels",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] }
          }
        },
        authors: {
          $reduce: {
            input: "$authors",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] }
          }
        }
      }
    }
  ];
  const aggCursor = getDb().collection<Book>("book").aggregate<BookField>(aggs)
  const projectCursor = aggCursor.project<BookField>({ _id: 0 })
  projectCursor.toArray().then(result => {
    return res.json({ result: true, ...result[0] });
  }).catch((error) => {
    console.error(error);
    return res.status(500).json({ result: false });
  })
})

bookRoutes.route("/").get(function (req: TypedRequestQuery<Search>, res) {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to search books' */
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
  } else if (req.query.labels) {
    return res.status(400).json({ result: false });
  }
  if (Array.isArray(req.query.labels)) {
    query.labels = { $all: req.query.labels };
  } else if (req.query.labels) {
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

bookRoutes.route("/:bookId").get(function (req, res) {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to get specific book by its id' */
  let query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").findOne(query).then(function (book) {
    return res.json({ result: true, book: book });
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });;
});

bookRoutes.route("/").post(function (req: express.Request<BookRequest>, res) {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to insert a book into database' */
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
    }).catch((error) => {
      console.error(error);
      return res.status(500).json({ result: false });
    });
  }
  else {
    return res.status(400).json({ result: false });
  }
});

bookRoutes.route("/:bookId").delete(function (req, res) {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to delete a book from database by its id' */
  let query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").deleteOne(query).then(function () {
    return res.status(204);
  }).catch(error => {
    console.error(error);
    return res.status(500).json({ result: false });
  });;
});

bookRoutes.route("/:bookId/review").post(async function (req, res) {
  /* 	#swagger.tags = ['Book', 'Review']
      #swagger.description = 'Endpoint to delete a book from database by its id' */
  let username;
  if (typeof req.body.userId === 'string') {
    let query: Filter<User> = { _id: new ObjectId(req.body.userId) };
    getDb().collection<User>("user").findOne(query).then(function (user) {
      username = user?.username;
    });
  }
  if (
    typeof req.body.rank === 'number'
    && req.body.rank > 0
    && req.body.rank <= 5
    && typeof req.body.content === 'string'
    && username
    && await hasComment(req.body.bookId, username)
  ) {
    const newBookReview: BookReview = {
      content: req.body.content,
      createTime: new Date(),
      rank: req.body.rank,
      username: username
    };
    console.debug(newBookReview);
    let bookQuery: Filter<Book> = { _id: new ObjectId(req.body.bookId) };
    let bookUpdate: UpdateFilter<Book> = { $push: { reviews: newBookReview}};
    getDb().collection<Book>("book").findOneAndUpdate(bookQuery, bookUpdate).then(result => {
      return result
        ? res.status(204)
        : res.status(500).json({ result: false });
    }).catch((error) => {
      console.error(error);
      return res.status(500).json({ result: false });
    });
  }
  else {
    return res.status(400).json({ result: false });
  }
})

async function hasComment(bookId: string, username: string) {
  let query: Filter<Book> = {
    _id: new ObjectId(bookId),
    reviews: { username: username }
  };
  return getDb().collection<Book>("book").findOne(query).then(function (book) {
    return book !== null;
  })
}