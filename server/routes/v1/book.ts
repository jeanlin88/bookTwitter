import express from "express";
import { Filter, ObjectId, UpdateFilter } from "mongodb";
import { getDb } from "../../db/conn";
import { getBookReview, isArrayOfString } from "../../helper";
import { BookRequest, Book, BookField, BookSearch } from "../../model/book";
import { TypedRequestBody, TypedRequestQuery } from "../../model/request";
import { BookFieldResponse, BookResponse, errResBody, InsertedResponse, ReviewResponse } from "../../model/response";
import { Review } from "../../model/review";

export const bookRoutes = express.Router();

bookRoutes.route("/").get((req: TypedRequestQuery<BookSearch>, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to search books' */

  /*  #swagger.parameters['labels'] = {
        in: 'query',
        description: 'labels this book has',
        required: false,
        type: 'array',
        items: { type: 'string' }
      } */
  console.debug("search book")
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
    console.error("keywords is not array");
    return res.status(400).json(errResBody);
  }
  if (Array.isArray(req.query.labels)) {
    query.labels = { $all: req.query.labels };
  } else if (req.query.labels) {
    console.error("labels is not array");
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

bookRoutes.route("/").post((req: TypedRequestBody<BookRequest>, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to create a book' */
  if (
    isArrayOfString(req.body.authors)
    && typeof req.body.coverImage === 'string'
    && typeof req.body.description === 'string'
    && isArrayOfString(req.body.labels)
    && typeof req.body.title === 'string'
  ) {
    const newBook: Book = {
      authors: req.body.authors,
      coverImage: req.body.coverImage,
      description: req.body.description,
      labels: req.body.labels,
      reviews: [],
      title: req.body.title,
      updatedAt: new Date()
    };
    console.debug(newBook);
    //TODO: add duplicate checking
    getDb().collection<Book>("book").insertOne(newBook).then(result => {
      if (result.insertedId === null) {
        console.error("insert failed");
        return res.status(400).json(errResBody);
      }
      const resBody: InsertedResponse = { id: result.insertedId };
      return res.status(201).json(resBody);
    }).catch((error) => {
      console.error(error);
      return res.status(500).json(errResBody);
    });
  } else {
    console.error("invalid parameters");
    return res.status(400).json(errResBody);
  }
});

bookRoutes.route("/").all((req, res) => res.status(405).send());

bookRoutes.route("/fields").get((req, res) => {
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
    const resBody: BookFieldResponse = { result: true, ...result[0] };
    return res.json(resBody);
  }).catch((error) => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
});

bookRoutes.route("/fields").all((req, res) => res.status(405).send());

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
  console.debug("delete book");
  const query: Filter<Book> = { _id: new ObjectId(req.params.bookId) };
  console.debug("query:", query);
  getDb().collection<Book>("book").deleteOne(query).then((result) => {
    console.debug("deleted");
    return res.status(204).send();
  }).catch(error => {
    console.error(error);
    return res.status(500).json(errResBody);
  })
  console.debug("finish delete book");
});

bookRoutes.route("/:bookId").all((req, res) => res.status(405).send());

bookRoutes.route("/:bookId/review").post(async (req: TypedRequestBody<Review>, res) => {
  /* 	#swagger.tags = ['Book']
      #swagger.description = 'Endpoint to create a book review' */
  console.debug("create book review");
  if (
    typeof req.body.rank === 'number'
    && req.body.rank > 0
    && req.body.rank <= 5
    && typeof req.body.content === 'string'
    && typeof req.body.username === 'string'
  ) {
    if (await getBookReview(req.body.username, req.params.bookId)) {
      console.debug("user", req.body.username, "already reviewed");
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
        console.debug("insert successfully");
        console.debug(result);
        const resBody: BookResponse = { result: true, size: 1, books: [result.value] };
        return res.status(201).json(resBody);
      }
      console.error("book review insert failed");
      return res.status(400).json(errResBody);
    }).catch((error) => {
      console.error(error);
      return res.status(500).json(errResBody);
    });
  } else {
    console.error("book review invalid parameters");
    return res.status(400).json(errResBody);
  }
});

bookRoutes.route("/:bookId/review/:username").get(async (req, res) => {
    /*  #swagger.tags = ['Book']
        #swagger.description = 'Endpoint to get book review of specific user' */
    const book = await getBookReview(req.params.username, req.params.bookId);
    if (book){
        const resBody: ReviewResponse = { result: true, size: 1, reviews: book.reviews }
        return res.status(200).json(resBody);
    }
    return res.status(404).json(errResBody);
})

bookRoutes.route("/:bookId/review").all((req, res) => res.status(405).send());