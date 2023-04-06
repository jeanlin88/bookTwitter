import { Filter, ObjectId } from "mongodb"
import { getDb } from "./db/conn"
import { Book, Booklist } from "./model/book";
import { User } from "./model/user"

export async function hasBookReview(username: string, bookId: string): Promise<boolean> {
    const query: Filter<Book> = {
        _id: new ObjectId(bookId),
        reviews: { username: username }
    };
    getDb().collection<Book>("book").findOne(query).then((book) => {
        return book !== null;
    }).catch(error => {
        console.error(error);
        return false;
    });
    return false;
}

export async function hasBooklistReview(username: string, booklistId: string): Promise<boolean> {
    const query: Filter<Booklist> = {
        _id: new ObjectId(booklistId),
        reviews: { username: username }
    };
    getDb().collection<Booklist>("booklist").findOne(query).then((booklist) => {
        return booklist !== null;
    }).catch(error => {
        console.error(error);
        return false;
    });
    return false;
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