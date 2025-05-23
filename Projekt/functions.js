const mongoose = require('mongoose')

// mongoose schemas:

const UserSchema = new mongoose.Schema({
    name: String,
    surname: String,
    email: String,
    password: String,
    role: String,
});

const ProductSchema = new mongoose.Schema({
    id: String,
    brand: String,
    model: String,
    hp: String,
    img: String,
    year: String,
    price: String,
});

const OrderSchema = new mongoose.Schema({
    date: String,
    city: String,
    street: String,
    number: String,
    email: String,
    userId: String,
    products: [
        {
            itemId: String,
            quantity: Number,
        },
    ],
});

// mongoose models:

const UserModel = mongoose.model("users", UserSchema);
const ProductModel = mongoose.model("products", ProductSchema);
const OrderModel = mongoose.model("orders", OrderSchema);

//functions to upload data to mongodb:

function uploadOrder(date, city, street, number, email, userId, products) {
    const { MongoClient } = require('mongodb');
    const url = 'mongodb://127.0.0.1:27017/appdb';
  
    MongoClient.connect(url)
      .then((client) => {
        const db = client.db("appdb");
        const myobj = [
          {date: date, city: city, street: street, number: number, email: email, userId: userId, products: products}
        ];
  
        return db.collection("orders").insertMany(myobj);
      })
      .catch((err) => {
        console.error(err);
      });
}

function uploadAccount(name, surname, email, password) {
    const { MongoClient } = require('mongodb');
    const url = 'mongodb://127.0.0.1:27017/appdb';
  
    MongoClient.connect(url)
      .then((client) => {
        const db = client.db("appdb");
        const myobj = [
          {name: name, surname: surname, email: email, password: password, role: "user"}
        ];
  
        return db.collection("users").insertMany(myobj);
      })
      .catch((err) => {
        console.error(err);
      });
}

function uploadProduct(id, brand, model, year, hp, img, price) {
    const { MongoClient } = require('mongodb');
    const url = 'mongodb://127.0.0.1:27017/appdb';
  
    MongoClient.connect(url)
      .then((client) => {
        const db = client.db("appdb");
        const myobj = [
          {id: id, brand: brand, model: model, hp: hp, img: img, year: year, price: price}
        ];
  
        return db.collection("products").insertMany(myobj);
      })
      .catch((err) => {
        console.error(err);
      });
}

// and to edit and delete product-oriented data:

function deleteProduct(id) {
    const { MongoClient } = require('mongodb');
    const url = 'mongodb://127.0.0.1:27017/appdb';

    var key = {id: id}

    MongoClient.connect(url)
      .then((client) => {
        const db = client.db("appdb");
        return db.collection("products").deleteOne(key);
      })
      .catch((err) => {
        console.error(err);
      });
}

function editProduct(id, newvalues) {
    const { MongoClient } = require('mongodb');
    const url = 'mongodb://127.0.0.1:27017/appdb';

    var key = {id: id}

    MongoClient.connect(url)
      .then((client) => {
        const db = client.db("appdb");
        return db.collection("products").updateOne(key, newvalues);
      })
      .catch((err) => {
        console.error(err);
      });
}

// exporting everything

module.exports = {
    editProduct,
    deleteProduct,
    uploadAccount,
    uploadOrder,
    uploadProduct,
    OrderModel,
    UserModel,
    ProductModel
};