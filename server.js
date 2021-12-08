import express from "express";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import knex from "knex";
import Clarifai from "clarifai";

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "Hti25122545$",
    database: "smart-brain",
  },
});

const api = new Clarifai.App({
  apiKey: "721446056adc48eab7e239d682358145",
});

db.select("*")
  .from("users")
  .then((data) => {
    console.log(data);
  });

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json("Invalid form submission");

  db("login")
    .where("email", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        db("users")
          .where("email", data[0].email)
          .then((user) => {
            return res.json(user[0]);
          })
          .catch((err) => res.status(400).json("wrong username or password"));
      } else {
        res.status(400).json("wrong username or password");
      }
    })
    .catch((err) => res.status(400).json("wrong username or password"));
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);

  if (!name || !email || !password)
    return res.status(400).json("Invalid form submission");

  db.transaction((trx) => {
    trx("login")
      .insert({
        hash: hash,
        email: email,
      })
      .returning("email")
      .then((loginEmail) => {
        console.log(loginEmail);
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) =>
    res.status(400).json("This email/username has already been used")
  );
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db("users")
    .where("id", id)
    .then((data) => {
      if (data.length) return res.json(data[0]);
      else return res.status(404).json("not found");
    });
});

app.put("/image", (req, res) => {
  const { id, inc } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", inc)
    .returning("entries")
    .then((entries) => res.json(entries[0]));
});

app.post("/imageurl", (req, res) => {
  api.models
    .predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => res.status(400).json("unable to work with API"));
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
