import { Response } from "express";
import { ObjectId, WithId } from "mongodb";
import { Book, BookField, Booklist, BooklistField } from "./book";
import { Review } from "./review";
import { User } from "./user";

export interface BaseResponse {
    result?: boolean
}

export interface CountResponse extends BaseResponse {
    size: number
}

export interface InsertedResponse {
    id: ObjectId
}

export interface BookResponse extends CountResponse {
    books: WithId<Book>[]
}

export interface BookFieldResponse extends BaseResponse, BookField { }

export interface BooklistResponse extends CountResponse {
    booklists: WithId<Booklist>[]
}

export interface BooklistFieldResponse extends BaseResponse, BooklistField { };

export interface ReviewResponse extends CountResponse {
    reviews: Review[]
}

export interface UserResponse extends BaseResponse {
    user: User
}

export const errResBody: BaseResponse = { result: false };