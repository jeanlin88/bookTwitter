import express from "express";
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../db/conn";
import { hasBookReview, isArrayOfString } from "../../helper";
import { Book, BookField, BookSearch } from "../../model/book";
import { TypedRequestBody, TypedRequestQuery } from "../../model/request";
import { BookFieldResponse, BookResponse, errResBody, InsertedResponse } from "../../model/response";
import { Review } from "../../model/review";

export const bookRoutes = express.Router();

bookRoutes.route("/").get((req: TypedRequestQuery<BookSearch>, res) => {
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
  } else if (req.query.keywords) {
    return res.status(400).json(errResBody);
  }
  if (Array.isArray(req.query.labels)) {
    query.labels = { $all: req.query.labels };
  } else if (req.query.labels) {
    return res.status(400).json(errResBody);
  }
  console.debug("query:", JSON.stringify(query));
  getDb().collection<Book>("book").find(query).toArray().then((books) => {
    const resBody: BookResponse = { result: true, size: books.length, books };
    return res.json(resBody);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  });
});

bookRoutes.route("/").post((req: TypedRequestBody<Book>, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to create a book' */
  if (
    isArrayOfString(req.body.authors)
    && typeof req.body.coverImage === 'string'
    && typeof req.body.description === 'string'
    && isArrayOfString(req.body.labels)
    && typeof req.body.title === 'string'
  ) {
    const newBook: WithId<Book> = {
      _id: new ObjectId(uuidv4()),
      authors: req.body.authors,
      coverImage: req.body.coverImage,
      description: req.body.description,
      labels: req.body.labels,
      reviews: [],
      title: req.body.title
    };
    console.debug(newBook);
    //TODO: add duplicate checking
    getDb().collection<Book>("book").insertOne(newBook).then(result => {
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

bookRoutes.route("/fields").get((req, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to get available fields of book' */
  const aggs = [
    {
      $group: {
        _id: uuidv4(),
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
    const resBody: BookFieldResponse = { result: true, ...result[0] };
    return res.json(resBody);
  }).catch((error) => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
})

bookRoutes.route("/:bookId").get((req, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to get specific book by its id' */
  const query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").findOne(query).then((book) => {
    if (book === null) {
      return res.status(404).json(errResBody);
    }
    const resBody: BookResponse = { result: true, size: 1, books: [book] }
    return res.json(resBody);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  });;
});

bookRoutes.route("/:bookId").delete((req, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to delete a book by its id' */
  const query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  getDb().collection<Book>("book").deleteOne(query).then(() => {
    return res.status(204);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
});

bookRoutes.route("/:bookId/review").post(async (req: TypedRequestBody<Review>, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to create a book review' */
  if (
    typeof req.body.rank === 'number'
    && req.body.rank > 0
    && req.body.rank <= 5
    && typeof req.body.content === 'string'
    && typeof req.body.username === 'string'
  ) {
    if (!(await hasBookReview(req.params.bookId, req.body.username))) {
      return res.status(409).json(errResBody);
    }
    const newBookReview: Review = {
      content: req.body.content,
      createTime: new Date(),
      rank: req.body.rank,
      username: req.body.username
    };
    console.debug(newBookReview);
    const bookQuery: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
    const bookUpdate: UpdateFilter<Book> = { $push: { reviews: newBookReview } };
    getDb().collection<Book>("book").findOneAndUpdate(bookQuery, bookUpdate).then(result => {
      if (result.ok && result.value) {
        const resBody: BookResponse = { result: true, size: 1, books: [result.value] };
        return res.status(201).json(resBody);
      }
      return res.status(400).json(errResBody);
    }).catch((error) => {
      console.error(error);
      return res.status(500).json(errResBody);
    });
  } else {
    return res.status(400).json(errResBody);
  }
});
