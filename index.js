const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wnao2sy.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    app.get("/foods", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    app.get("/foods/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const objectId = new ObjectId(id);
      const result = await foodCollection.findOne({ _id: objectId });

      res.send({
        success: true,
        result,
      });
    });

    app.post("/foods", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await foodCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // app.get("/foods", async (req, res) => {
    //   try {
    //     const { email } = req.query;
    //     if (!email) {
    //       return res.status(400).send({
    //         success: false,
    //         message: "Donator email is required",
    //       });
    //     }

    //     const result = await foodCollection
    //       .find({ "donator.email": email })
    //       .toArray();

    //     res.send({
    //       success: true,
    //       result,
    //     });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send({
    //       success: false,
    //       message: "Failed to fetch foods",
    //     });
    //   }
    // });

    // app.put("/foods/:id", async (req, res) => {
    //   const { id } = req.params;
    //   const updateFood = req.body;
    //   const objectId = new ObjectId(id);
    //   const existing = await foodCollection.findOne({ _id: objectId });

    //   if (existing.donator.email !== updateFood.userEmail) {
    //     return res.status(403).send({
    //       success: false,
    //       message: "Unauthorized: You can only update your own foods",
    //     });
    //   }

    //   const update = {
    //     $set: data,
    //   };
    //   const result = foodCollection.updateOne({ _id: objectId });
    //   res.send({
    //     success: true,
    //     result,
    //   });
    // });

    app.get("/foods", async (req, res) => {
      const email = req.query.email;
      const query = email ? { "donator.email": email } : {};
      const result = await foodCollection.find(query).toArray();
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

    app.delete("/food/:id", async (req, res) => {
      const { id } = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        result,
      });
    });

    app.get("/foods/:id/request", async (req, res) => {
      const { id } = req.params;
      const requestData = req.body;
      const result = await foodCollection.findOne(
        { _id: new ObjectId(id) },
        { $push: { requestData } }
      );
      res.send(result);
    });

    app.get("/foods/:foodId/request/:reqIndex", async (req, res) => {
      const { foodId, reqIndex } = req.params;
      const { status } = req.body;
      const food = await foodCollection.findOne({ _id: new ObjectId(foodId) });
      if (!food || !food.requests) {
        return res.status(404).send({ message: "Food or request not found" });
      }
      food.requests[reqIndex].status = status;
      if (status === "accepted") {
        food.food_status = "donated";
      }
      const result = await foodCollection.updateOne(
        { _id: new ObjectId(foodId) },
        { $set: food }
      );

      res.send(result);
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
