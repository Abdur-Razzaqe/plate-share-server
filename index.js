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
      try {
        const email = req.query.email;

        const query = email ? { "donator.email": email } : {};

        const result = await foodCollection.find(query).toArray();
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, error: "Failed to fetch foods" });
      }
    });

    app.get("/foods/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await foodCollection.findOne({ _id: new ObjectId(id) });
        if (!result)
          return res
            .status(404)
            .send({ success: false, message: "Food not Found" });
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: "Failed to fetch food" });
      }
    });

    app.post("/foods", async (req, res) => {
      try {
        const data = req.body;
        const foodData = {
          ...data,
          donator: {
            name: data.donator?.name || data.donator_Name || "Unknown",
            email:
              data.donator?.email || data.donator_email || "Unknown@email.com",
            image: data.donator?.image || data.donator_image || "",
          },
          food_status: data.food_status || "Available",
          createdAt: new Date(),
        };
        const result = await foodCollection.insertOne(foodData);
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: "Failed to fetch food" });
      }
    });

    app.put("/foods/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, error: "Failed to update food" });
      }
    });

    app.patch("/foods/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: "Failed to patch food" });
      }
    });

    app.delete("/foods/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await foodCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, error: "Failed to delete food" });
      }
    });

    app.post("/foods/:id/request", async (req, res) => {
      // try {
      const foodId = req.params.id;
      const requestData = req.body;
      requestData.foodId = foodId;
      requestData.status = "pending";
      requestData.requestDate = new Date();

      const result = await requestsCollection.insertOne(requestData);
      res.send({ success: true, insertedId: result.insertedId });
      // } catch (error) {
      //   console.error(err);
      //   res.status(500).send({ error: "Failed to create request" });
      // }
    });

    app.get("/foods/:id/requests", async (req, res) => {
      // try {
      const foodId = req.params.id;
      console.log("found", req.params.id);

      const result = await requestsCollection
        .find({ foodId: foodId })
        .toArray();

      res.send({ success: true, result });
    });

    app.patch("/foods/:foodId/requests/:reqId", async (req, res) => {
      try {
        const { reqId } = req.params;
        const { status } = req.body;
        const result = await requestsCollection.updateOne(
          { _id: new ObjectId(reqId) },
          { $set: { status } }
        );

        if (status === "accepted") {
          await foodCollection.updateOne(
            { _id: new ObjectId(req.params.foodId) },
            { $set: { food_status: "donated" } }
          );
        }

        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ success: false, error: "Failed to update request" });
      }
    });

    app.get("/requests", async (req, res) => {
      try {
        const result = await requestsCollection.find().toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ success: false, error: "Failed to get request" });
      }
    });

    app.get("/foods/search", async (req, res) => {
      try {
        const search = req.query.q || "";
        let query = {};
        if (search.trim) {
          query = { food_name: { $regex: `^${search}`, $option: "i" } };
        }
        const result = await foodCollection.find(query).toArray();
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: "Search failed" });
      }
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
