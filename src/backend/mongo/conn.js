import { MongoClient } from "mongodb";

//const password = encodeURI(process.env.MONGO_PASSWORD);
const connectionString = `mongodb+srv://mnmitsdarfer:LD0pck5f1bbzTQ1G@crunchtime.3sawqem.mongodb.net/?retryWrites=true&w=majority&appName=CrunchTime`;
//                        mongodb+srv://mnmitsdarfer:<password>@crunchtime.3sawqem.mongodb.net/?retryWrites=true&w=majority&appName=CrunchTime

const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch(e) {
  console.error(e);
}

let db = conn.db("crunchtime");

export default db;