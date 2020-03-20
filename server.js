// db connection stuff
var { Pool } = require("pg");

var pool = new Pool({
  connectionString: (process.env.DATABASE_URL =
    "postgres://vcbhxepkdmfkzt:f36c2431282797e087687dbed6d322790c2d99a3c236b3f2b6a89c366abb4404@ec2-18-210-51-239.compute-1.amazonaws.com:5432/ddtrjfjs5afd22"),
  ssl: true
});

var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors());
var port = process.env.PORT || 8080;

app.get("/", function(request, response) {
  response.json({
    welcome: "welcome to my API!"
  });
});
// example from module
app.get("/todos", async function(request, response) {
  console.log(process.env.DATABASE_URL);
  var client = await pool.connect();
  var result = await client.query("select * from todos");
  response.json(result.rows);
  client.release();
});
app.get("/todos/:id", async function(request, response) {
  var client = await pool.connect();
  var result = await client.query("select * from todos where id = $1", [
    request.params.id
  ]);
  if (result.rows.length === 1) {
    response.json(result.rows[0]);
  } else {
    response.status(404).end("product " + request.params.id + " not found");
  }
  client.release();
});
app.post("/todos", async function(request, response) {
  var name = request.body.title.trim();
  var client = await pool.connect();
  var result = await client.query(
    "insert into todos (title, completed) values ($1, $2) returning *",
    [name, false]
  );
  var id = result.rows[0].id;
  response.redirect("/todos/" + id);
  client.release();
});
// app.put("/products/:id", async function(request, response) {
//   if (request.body.name === undefined || request.body.price === undefined) {
//     response.status(400).end("name and price are required");
//     return;
//   }

//   var id = request.params.id;
//   var name = request.body.name.trim();
//   var slug = name
//     .toLowerCase()
//     .split(" ")
//     .join("-");
//   var price = parseFloat(request.body.price).toFixed(2);

//   var client = await pool.connect();
//   var result = await client.query(
//     "update product set slug = $2, name = $3, price = $4 where id = $1 returning *",
//     [id, slug, name, price]
//   );
//   if (result.rows.length === 1) {
//     response.json(result.rows[0]);
//   } else {
//     response.status(404).end("product " + request.params.id + " not found");
//   }
//   client.release();
// });
app.delete("/todos/:id", async function(request, response) {
  var client = await pool.connect();
  var result = await client.query("select * from todos where id = $1", [
    request.params.id
  ]);
  if (result.rows.length > 0) {
    await client.query("delete from todos where id = $1", [request.params.id]);
    response.redirect("/todos");
  } else {
    response.status(404).end("todo " + request.params.id + " not found");
  }
  client.release();
});

app.listen(port);
