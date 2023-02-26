const { MongoClient } = require("mongodb");
const Db = process.env.ATLAS_URI;
//const Db = process.env.DB_URI;
console.log(Db)
const client = new MongoClient(Db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

var _db;

module.exports = {
    connectToServer: async function (callback) {
        try {
            var db = await client.connect();
            if (db) {
                _db = db.db("bookTwitter");
                console.log("Successfully connected to MongoDB.");
            }
        }
        catch (err) {
            return callback(err);
        }
    },

    getDb: function () {
        return _db;
    },
};