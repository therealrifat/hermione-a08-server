import express from "express";
import "dotenv/config";
import cros from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = 8000;

//middleware
app.use(cros());
app.use(express.json());

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
const joinEvent = db.collection("JoinedEvent");

app.get("/events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const events = await eventCollection
    .find({
      eventDate: { $gte: today },
    })
    .sort({ eventDate: 1 }).toArray();
  res.send(events);
});

app.get("/events/:EventId", async (req, res) => {
  const { EventId } = req.params;
  const result = await eventCollection.findOne({ _id: new ObjectId(EventId) });
  res.send(result);
});

app.post("/events/", async (req, res) => {
  const eventInfo = req.body;
  const result = await eventCollection.insertOne(eventInfo);
  res.send(result);
});

app.get("/manage/:emailId", async (req, res) => {
  const { emailId } = req.params;
  const result = await eventCollection
    .find({ creatorEmail: emailId })
    .toArray();
  res.send(result);
});

app.delete("/manage/:Id", async (req, res) => {
  const { Id } = req.params;
  const result = await eventCollection.deleteOne({ _id: new ObjectId(Id) });
  res.send(result);
});

app.patch("/manage/:Id", async (req, res) => {
  const { Id } = req.params;
  const data = req.body;
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(Id) },
    { $set: data },
  );
  res.send(result);
});

app.post("/manage/", async (req, res) => {
  const eventJoin = req.body;
  const joinedCheck = await joinEvent.findOne(eventJoin);
  if (joinedCheck) {
    return res.send({ message: "Already Joined", isJoined: true });
  }
  const result = await joinEvent.insertOne(eventJoin);
  res.send({
    message: "Successfully Joined",
    isJoined: true,
    result,
  });
});

app.get("/EventJoin/:emailId", async (req, res) => {
  const { emailId } = req.params;
  const result = await joinEvent.find({ email: emailId }).toArray();
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
