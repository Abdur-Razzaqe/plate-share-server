const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wnao2sy.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("share-db");
    const foodCollection = db.collection("foods");
    const requestsCollection = db.collection("requests");
    console.log("Connected to bd");

    app.get("/foods", async (req, res) => {
      const email = req.query.email;
      const query = email ? { "donator.email": email } : {};

      const result = await foodCollection.find(query).toArray();
      res.send({ success: true, result });
    });

    app.get("/foods/:id", async (req, res) => {
      const { id } = req.params;
      const result = await foodCollection.findOne({ _id: new ObjectId(id) });
      if (!result)
        return res
          .status(404)
          .send({ success: false, message: "Food not Found" });

      res.send({
        success: true,
        result,
      });
    });

    app.post("/foods", async (req, res) => {
      const data = req.body;

      const foodData = {
        ...data,
        donator: {
          name: data.donator?.name || data.donator_Name || "Unknown",
          email:
            data.donator?.email || data.donator_email || "Unknown@email.com",
          image: data.donator?.image || data.donator_image || "",
        },
        foods_status: data.food_status || "Available",
        createdAt: new Date(),
      };
      const result = await foodCollection.insertOne(foodData);
      res.send({
        success: true,
        result,
      });
    });

    app.put("/foods/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send({
        success: true,
        result,
      });
    });

    app.delete("/foods/:id", async (req, res) => {
      const { id } = req.params;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        result,
      });
    });

    app.get("/requests", async (req, res) => {
      const result = await requestsCollection.find().toArray();
      res.send({
        success: true,
        result,
      });
    });

    app.post("/requests", async (req, res) => {
      const { id } = req.params;
      const request = req.body;

      const result = await requestsCollection.insertOne(request);
      res.send({ success: true, result });
    });

    app.get("/foodRequest/:foodId", async (req, res) => {
      const { foodId } = req.params;
      const requests = await requestsCollection.find({ foodId }).toArray();
      res.send({ success: true, requests });
    });

    app.put("/foodRequests/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      if (status === "accepted") {
        await requestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { food_status: "donated" } }
        );
      }
      res.send({ success: true, result });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
