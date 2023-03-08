import { Db, MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: "./config.env" });

const client = new MongoClient(process.env.ATLAS_URI || '');

var _db: Db;

export function connectToServer(callback: Function) {
    client.connect().then(() => {
        _db = client.db("bookTwitter");
        console.info("successfully connect to database");
    }).catch(error => callback(error));
};

export function getDb() {
    return _db;
};