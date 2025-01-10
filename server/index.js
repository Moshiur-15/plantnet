require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId, Timestamp } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const port = process.env.PORT || 9001
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', ''],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

const uri = "mongodb+srv://PalntNet:LzDR0FYbKuho2zDG@cluster0.c3dgh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
    const UserCollection = client.db('PlantNet-me').collection('users')
    const PlantCollection = client.db('PlantNet-me').collection('Plants')
    const ordersCollection = client.db('PlantNet-me').collection('orders')
    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // user collection
    // Create a new user
    app.post('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email }
      const user = req.body
      const isExist = await UserCollection.findOne(query)
      if (isExist) {
        return res.send({ message: 'Email already exists' })
      }
      const result = await UserCollection.insertOne({...user, timestamp: Date.now(), role:'customer' })
      res.send(result)
    })

    app.patch('/user/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = {email}
      const user = await UserCollection.findOne(query);
      if(!user || user.status === 'Requested'){
        return res.status(400).send({message: 'request pending'})
      }
      const updateDoc={
        $set: {
          status: 'Requested'
        }
      }
      const result = await UserCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // user role
    app.get('/users/role/:email', verifyToken, async(req, res)=>{
      const email = req.params.email
      const result = await UserCollection.findOne({email})
      res.send({role: result?.role})
    })

    // plant collection
    // get plant data
    app.get('/plants', async(req, res)=>{
      const plant = await PlantCollection.find().toArray()
      res.send(plant)
    })

    // Create a new plant
    app.post('/plant', verifyToken, async(req, res)=>{
      const plant = req.body
      const result = await PlantCollection.insertOne(plant)
      res.send(result)
    })

    // get plant data in id
    app.get('/plant/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id:new ObjectId(id)}
      const result =await PlantCollection.findOne(query)
      res.send(result)
    })

    // orders collection
    // Create a new order
    app.post('/order', verifyToken, async(req, res)=>{
      const orderInfo = req.body
      const result = await ordersCollection.insertOne(orderInfo)
      res.send(result)
    })

    app.patch('/order/quantity/:id', verifyToken, async (req, res)=>{
      const id = req.params.id
      const {updateTotalQuantity, status} = req.body;
      const filter = { _id: new ObjectId(id) }
      let updateDoc={
        $inc:{
          quantity: -updateTotalQuantity
        }
      }
      if (status === 'increase'){
        updateDoc={
          $inc:{
            quantity: updateTotalQuantity
          }
        }
      }
      const result = await PlantCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // get all orders for a specific customer
    app.get('/my-orders/:email', verifyToken, async(req, res)=>{
      const email = req.params.email
      const query = {'customer.email':email}
      const result = await ordersCollection.aggregate([
        {
          $match:query
        },
        {
          $addFields:{Plant_id:{
            $toObjectId:'$Plant_id'
          }}
        },
        {
          $lookup:{
            from: 'Plants',
            localField: 'Plant_id',
            foreignField: '_id',
            as: 'Plants'
          }
        },
        {
          $unwind: '$Plants',
        },
        {
          $addFields:{
            name: '$Plants.name',
            image: '$Plants.image',
            category: '$Plants.category',
          }
        },
        {
          $project:{
            Plants:0,
          } 
        }
      ]).toArray()
      res.send(result)
    })

    // delate orders
    app.delete('/delate/:id', verifyToken, async(req, res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const order = await ordersCollection.findOne(query);
      if(order.status === 'Delivered')return res.status(409).send('Cannot cancel product is delivered!');
      const result = await ordersCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})
