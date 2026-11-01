import express from "express";
import "dotenv/config";
import cros from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = 8000;

//middleware
app.use(cros());

const client = new MongoClient(process.env.MONGO_DB_CLIENT_STRING);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("BondHub");
const eventCollection = db.collection("upcomingEvent");

app.get("/events", async (req, res) => {
  const events = await eventCollection.find().toArray();
  res.send(events);
});

app.get("/events/:EventId", async (req, res) => {
  const { EventId } = req.params;
  const result = await eventCollection.findOne({_id: new ObjectId(EventId)})
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
