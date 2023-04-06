import express from "express";
import { Filter, ObjectId, UpdateFilter, WithId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../db/conn";
import { hasBooklistReview, isArrayOfString, usernameExist } from "../../helper";
import { Booklist, BooklistField } from "../../model/book";
import { TypedRequestBody, TypedRequestQuery } from "../../model/request";
import { BooklistFieldResponse, BooklistResponse, errResBody, InsertedResponse } from "../../model/response";
import { BooklistSearch } from "../../model/book";
import { Review } from "../../model/review";

export const booklistRoutes = express.Router();

booklistRoutes.route("/").get((req: TypedRequestQuery<BooklistSearch>, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to search booklists' */
    let query: Filter<Booklist> = {};
    if (Array.isArray(req.query.keywords)) {
        req.query.keywords.forEach(keyword => {
            query.$and = [
                ...query.$and ? query.$and : [],
                {
                    $or: [
                        { name: { $regex: `.*${keyword}.*`, $options: 'i' } },
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
    getDb().collection<Booklist>("booklist").find(query).toArray().then((booklists) => {
        const resBody: BooklistResponse = { result: true, size: booklists.length, booklists };
        return res.json(resBody);
    }).catch(error => {
        console.error(error);
        return res.status(500).json(errResBody);
    });
});

booklistRoutes.route("/").post(async (req: TypedRequestBody<Booklist>, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to create a booklist' */
    if (
        req.body.books.length > 0
        && isArrayOfString(req.body.books)
        && typeof req.body.description === 'string'
        && isArrayOfString(req.body.labels)
        && typeof req.body.name === 'string'
        && typeof req.body.public === 'boolean'
        && typeof req.body.username === 'string'
        && (await usernameExist(req.body.username))
    ) {
        const newBooklist: WithId<Booklist> = {
            _id: new ObjectId(uuidv4()),
            books: req.body.books,
            description: req.body.description,
            labels: req.body.labels,
            name: req.body.name,
            public: req.body.public,
            reviews: [],
            username: req.body.username
        };
        console.debug(newBooklist);
        //TODO: add duplicate checking
        getDb().collection<Booklist>("booklist").insertOne(newBooklist).then(result => {
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

booklistRoutes.route("/fields").get((req, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to get available fields of booklist' */
    const aggs = [
        {
            $group: {
                _id: uuidv4(),
                labels: { $addToSet: "$labels" }
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
                }
            }
        }
    ];
    const aggCursor = getDb().collection<Booklist>("booklist").aggregate<BooklistField>(aggs)
    const projectCursor = aggCursor.project<BooklistField>({ _id: 0 })
    projectCursor.toArray().then(result => {
        const resBody: BooklistFieldResponse = { result: true, ...result[0] };
        return res.json(resBody);
    }).catch((error) => {
        console.error(error);
        return res.status(500).json(errResBody);
    })
})

booklistRoutes.route("/:booklistId").get((req, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to get specific booklist by its id' */
    const query: Filter<Booklist> = { _id: new ObjectId(req.params.booklistId) };
    getDb().collection<Booklist>("booklist").findOne(query).then((booklist) => {
        if (booklist === null) {
            return res.status(404).json(errResBody);
        }
        const resBody: BooklistResponse = { result: true, size: 1, booklists: [booklist] };
        return res.json(resBody);
    }).catch(error => {
        console.error(error);
        return res.status(500).json(errResBody);
    });;
});

booklistRoutes.route("/:booklistId").delete((req, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to delete a booklist by its id' */
    const query: Filter<Booklist> = { _id: new ObjectId(req.params.booklistId) };
    getDb().collection<Booklist>("booklist").deleteOne(query).then(() => {
        return res.status(204);
    }).catch(error => {
        console.error(error);
        return res.status(500).json(errResBody);
    })
});

booklistRoutes.route("/:booklistId/review").post(async (req: TypedRequestBody<Review>, res) => {
    /* 	#swagger.tags = ['Booklist']
        #swagger.description = 'Endpoint to create a booklist review' */
    if (
        typeof req.body.rank === 'number'
        && req.body.rank > 0
        && req.body.rank <= 5
        && typeof req.body.content === 'string'
        && typeof req.body.username === 'string'
    ) {
        if (!(await hasBooklistReview(req.params.bookId, req.body.username))) {
            return res.status(409).json(errResBody);
        }
        const newBooklistReview: Review = {
            content: req.body.content,
            createTime: new Date(),
            rank: req.body.rank,
            username: req.body.username
        };
        console.debug(newBooklistReview);
        const booklistQuery: Filter<Booklist> = { _id: new ObjectId(req.params.booklistId) };
        const booklistUpdate: UpdateFilter<Booklist> = { $push: { reviews: newBooklistReview } };
        getDb().collection<Booklist>("booklist").findOneAndUpdate(booklistQuery, booklistUpdate).then(result => {
            if (result.ok && result.value) {
                const resBody: BooklistResponse = { result: true, size: 1, booklists: [result.value] };
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
