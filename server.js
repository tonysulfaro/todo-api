var todos = require('./todos.js')

// db connection stuff
var { Pool } = require('pg')

var pool = new Pool({
  connectionString: process.env.DATABASE_URL = 'postgres://xlqsffmfcdtwwn:9a2e967849f8bb089c9a7b20a4a6b03806521001f9f49a871b2022efc0dcdd97@ec2-184-72-236-57.compute-1.amazonaws.com:5432/d6i3ptnca9u5ud',
  ssl: true
})

var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(cors())
var port = process.env.PORT || 8080

app.get('/', function (request, response) {
  response.json({
    welcome: 'welcome to my API!'
  })
})
// example from module
app.get('/products', async function (request, response) {
  console.log(process.env.DATABASE_URL)
  var client = await pool.connect()
  var result = await client.query('select * from product')
  response.json(result.rows)
  client.release()
})
app.get('/products/:id', async function (request, response) {
  var client = await pool.connect()
  var result = await client.query(
    'select * from product where id = $1',
    [request.params.id]
  )
  if (result.rows.length === 1) {
    response.json(result.rows[0])
  } else {
    response.status(404).end(
      'product ' + request.params.id + ' not found'
    )
  }
  client.release()
})
app.post('/products', async function (request, response) {
  var name = request.body.name.trim()
  var slug = name.toLowerCase().split(' ').join('-')
  var price = parseFloat(request.body.price).toFixed(2)

  var client = await pool.connect()
  var result = await client.query(
    'insert into product (slug, name, price) values ($1, $2, $3) returning *',
    [slug, name, price]
  )
  var id = result.rows[0].id
  response.redirect('/products/' + id)
  client.release()
})
app.put('/products/:id', async function (request, response) {
  if (
    request.body.name === undefined ||
    request.body.price === undefined
  ) {
    response.status(400).end(
      'name and price are required'
    )
    return
  }

  var id = request.params.id
  var name = request.body.name.trim()
  var slug = name.toLowerCase().split(' ').join('-')
  var price = parseFloat(request.body.price).toFixed(2)

  var client = await pool.connect()
  var result = await client.query(
    'update product set slug = $2, name = $3, price = $4 where id = $1 returning *',
    [id, slug, name, price]
  )
  if (result.rows.length === 1) {
    response.json(result.rows[0])
  } else {
    response.status(404).end(
      'product ' + request.params.id + ' not found'
    )
  }
  client.release()
})
app.delete('/products/:id', async function (request, response) {
  var client = await pool.connect()
  var result = await client.query(
    'select * from product where id = $1',
    [request.params.id]
  )
  if (result.rows.length > 0) {
    await client.query(
      'delete from product where id = $1',
      [request.params.id]
    )
    response.redirect('/products')
  } else {
    response.status(404).end(
      'product ' + request.params.id + ' not found'
    )
  }
  client.release()
})

// actual todo logic
app.get('/todos', function (request, response) {
  response.json(todos)
})
app.get('/todos/:slug', function (request, response) {
  if (!todos[request.params.slug]) {
    response.status(404).json({ message: 'sorry, no such todo: ' + request.params.slug })
    return
  }
  response.json(todos[request.params.slug])
})
app.post('/todos', function (request, response) {
  var slug = request.body.title.trim().toLowerCase().split(' ').join('-')
  todos[slug] = {
    title: request.body.title.trim(),
    completed: request.body.completed
  }
  // https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express
  response.set('Location', request.protocol + '://' + request.get('host') + '/todos/' + slug)
  response.status(201).json(todos[slug])
})
app.put('/todos/:slug', function (request, response) {
  var todo = todos[request.params.slug]
  if (request.body.title !== undefined) {
    todo.title = request.body.title.trim()
  }
  if (request.body.completed !== undefined) {
    todo.completed = request.body.completed
  }
  response.redirect('/todos/' + request.params.slug)
})
app.delete('/todos/:slug', function (request, response) {
  delete todos[request.params.slug]
  response.redirect('/todos')
})

app.use(function (request, response, next) {
  response.status(404).json({ message: request.url + ' not found' })
})

app.listen(port)
