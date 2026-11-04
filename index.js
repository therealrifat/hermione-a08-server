import express from "express";
import "dotenv/config";
import cros from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

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

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  // console.log(token);

  if (!token) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error" });
  }
};

app.get("/events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const events = await eventCollection
    .find({
      eventDate: { $gte: today },
    })
    .sort({ eventDate: 1 })
    .toArray();
  res.send(events);
});

app.get("/recent-event", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const events = await eventCollection
    .find({
      eventDate: { $gte: today },
    })
    .sort({ eventDate: 1 })
    .limit(6)
    .toArray();
  res.send(events);
});

app.get("/events/:EventId", async (req, res) => {
  const { EventId } = req.params;
  const result = await eventCollection.findOne({ _id: new ObjectId(EventId) });
  res.send(result);
});

app.post("/events/", verifyToken, async (req, res) => {
  const eventInfo = req.body;
  const result = await eventCollection.insertOne(eventInfo);
  res.send(result);
});

app.get("/manage/:emailId", verifyToken, async (req, res) => {
  const { emailId } = req.params;
  const result = await eventCollection
    .find({ creatorEmail: emailId })
    .toArray();
  res.send(result);
});

app.delete("/manage/:Id", verifyToken, async (req, res) => {
  const { Id } = req.params;
  const result = await eventCollection.deleteOne({ _id: new ObjectId(Id) });
  res.send(result);
});

app.patch("/manage/:Id", verifyToken, async (req, res) => {
  const { Id } = req.params;
  const data = req.body;
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(Id) },
    { $set: data },
  );
  res.send(result);
});

app.post("/manage/", verifyToken, async (req, res) => {
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

app.get("/EventJoin/:emailId", verifyToken,  async (req, res) => {
  const { emailId } = req.params;
  const result = await joinEvent
    .find({ email: emailId })
    .sort({ eventDate: 1 })
    .toArray();
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
