import { Response } from "express";
import { BookField } from "./book";

export interface BaseResponse extends Response {
    result?: boolean
};

export interface BookFieldResponse extends BaseResponse, BookField { };