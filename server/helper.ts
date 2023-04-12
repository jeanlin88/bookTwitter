import { Filter, ObjectId } from "mongodb"
import { getDb } from "./db/conn"
import { Book, Booklist } from "./model/book";
import { Review } from "./model/review";
import { User } from "./model/user"

export async function getBookReview(username: string, bookId: string) {
    console.debug("check reviewed or not");
    console.debug(username, bookId);
    const query: Filter<Book> = {
        _id: new ObjectId(bookId),
        reviews: { username: username }
    };
    console.debug("query:", query);
    return getDb().collection<Book>("book").findOne(query)
        .then(result => result)
        .catch(error => {
            console.error(error);
            return null;
        });
}

export async function getBooklistReview(username: string, booklistId: string) {
    const query: Filter<Booklist> = {
        _id: new ObjectId(booklistId),
        'reviews.username': { username }
    };
    return getDb().collection<Booklist>("booklist").findOne(query)
        .then(result => result)
        .catch(error => {
            console.error(error);
            return null;
        });
}

export function isArrayOfString(arr: any): boolean {
    return (
        Array.isArray(arr)
        && arr.filter(ele => typeof ele === 'string').length === arr.length
    )
};

export async function usernameExist(username: string): Promise<boolean> {
    const query: Filter<User> = { username };
    getDb().collection<User>("user").findOne(query).then(user => {
        return user !== null;
    })
    return false;
}

export async function emailExist(email: string): Promise<boolean> {
    const query: Filter<User> = { email };
    getDb().collection<User>("user").findOne(query).then(user => {
        return user !== null;
    })
    return false;
}