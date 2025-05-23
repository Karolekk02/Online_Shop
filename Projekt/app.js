// doing all required imports

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');

const {
    ShopName,
    saltRounds,
    DB,
} = require('./CONST.js');

const {
    editProduct,
    deleteProduct,
    uploadAccount,
    uploadOrder,
    uploadProduct,
    OrderModel,
    UserModel,
    ProductModel
} = require('./functions.js');

var app = express();
mongoose.connect(DB);

// mongodb getting functions

function getProducts(phase) {
    const query = phase
      ? {
          $or: [
            { brand: { $regex: phase, $options: 'i' } },
            { model: { $regex: phase, $options: 'i' } },
          ],
        }
      : {};
    return ProductModel.find(query);
};

function getOrders() {
    return OrderModel.find();
};

function getUsers() {
    return UserModel.find();
};

// data valid checking modules

const isPasswordValid = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

function isEmailValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// app set/use

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.use(
    session({
        secret: 'session2137',
        saveUninitialized: true,
        resave: false,
        cookie: {
            httpOnly: true,
            maxAge: 6000000,
        }
    })
)

app.use((req, res, next) => {
    if (isPasswordValid(req.body.password)) {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
                return next(err);
            }
            req.body.password = hash;
            next();
        });
    } else {
        req.body.password = '';
        next();
    }
});

// app get


app.get("/", (req, res) => {
    if(req.session.user == undefined) {
        req.session.user = {
            name: '',
            surname: '',
            email: '',
            role: 'guest',
        };
        req.session.logged = false;
        req.session.cart = [];
    }
    getProducts('')
      .then((products) => {
        res.render('HomePage', {
          title : ShopName,
          products : products,
          user : req.session.user, 
          logged : req.session.logged,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
});

app.get("/users", (req, res) => {
    getUsers()
      .then((users) => {
        res.render('Users', {
          title: ShopName,
          users: users,
          user: req.session.user,
          logged : req.session.logged,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
});

app.get("/orders", (req, res) => {
    getOrders()
      .then((orders) => {
        res.render('Orders', {
          title: ShopName,
          orders: orders,
          user: req.session.user,
          logged : req.session.logged,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
});

app.get("/assortment", (req, res) => {
    getProducts('')
      .then((products) => {
        res.render('Assortment', {
          title : ShopName,
          products : products,
          user : req.session.user, 
          logged : req.session.logged,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
});

app.get("/account", (req, res) => {
    res.render('Account', {
        title: ShopName,
        user: req.session.user,
        logged : req.session.logged,
    });
});

app.get("/cart", (req, res) => {
    res.render('Cart', {
        title : ShopName,
        cart : req.session.cart,
        user : req.session.user, 
        logged : req.session.logged,
    });
});

app.get("/create", (req, res) => {
    res.render('Create_account', {
        title : ShopName,
        user : req.session.user, 
        logged : req.session.logged,
    });
});

app.get("/login", (req, res) => {
    res.render('LogIn', {
        title : ShopName,
        user : req.session.user, 
        logged : req.session.logged,
    });
});

app.get("/summary", (req, res) => {
    res.render('Summary', {
        title : ShopName,
        cart: req.session.cart,
        user : req.session.user, 
        logged : req.session.logged,
    });
});

// modules for comparing given data with data base

async function checkEmailIfUsed(email) {
    try {
        const users = await getUsers();
        var check = false;
        users.forEach(user => {
            if (user.email == email) {
                check = true;
            }
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
    return check;
};

function checkPassword(password, email) {
    return new Promise((resolve, reject) => {
        getUsers()
            .then(users => {
                let isPasswordCorrect = false;
                users.forEach(user => {
                    if (user.email === email) {
                        bcrypt.compare(password, user.password, (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                if (result) {
                                    isPasswordCorrect = true;
                                    resolve(user);
                                }
                                resolve('');
                            }
                        });
                    }
                });
            })
            .catch(err => {
                reject(err);
            });
    });
};

// app post

app.post("/create", (req, res) => {
    if(req.body.password && isEmailValid(req.body.email) && req.body.name && req.body.surname){
        checkEmailIfUsed(req.body.password)
        .then(isEmailUsed => {
            if(isEmailUsed) {
                res.render('Create_account', {
                    title: ShopName,
                    user: req.session.user,
                    logged : req.session.logged,
                    error: "Email already used.",
                });
            }
            else {
                uploadAccount(req.body.name, req.body.surname, req.body.email, req.body.password);
                res.render('Create_account', {
                    title: ShopName,
                    user: req.session.user,
                    logged : req.session.logged,
                    error: "Thanks for creating an account!",
                });
            }
        })
        .catch(error => {
            console.error(error);
        });
    }
    else {
        res.render('Create_account', {
            title: ShopName,
            user: req.session.user,
            logged : req.session.logged,
            error: "Password has to be minimum 8 characters long, have at least one uppercase letter and at least one number.",
        });
    }
});

app.post("/login", (req, res) => {
    if(req.body.logout == "true") {
        req.session.logged = false;
        req.session.user = {
            name: '',
            surname: '',
            email: '',
            role: 'guest',
        };
        res.render('LogIn', {
            title: ShopName,
            user: req.session.user,
            logged : req.session.logged,
        });
    }
    else {
        checkPassword(req.body.pass, req.body.email)
        .then(user => {
            if(user) {
                req.session.logged = true;
                req.session.user = user;
                res.redirect('/');
            }
            else {
                res.render('LogIn', {
                    title: ShopName,
                    user: req.session.user,
                    logged : req.session.logged,
                    error: "Password or email is incorrect.",
                });
            }
        })
        .catch(error => {
            console.error(error);
        });
    }
});

app.post("/users", (req, res) => {  
    UserModel.findByIdAndUpdate(req.body.update, { $set: { role: "admin" } }, { new: true })
        .then((updatedUser) => {
            res.redirect("/users");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});

app.post('/', (req, res) => {
    if(req.body.search) {
        getProducts(req.body.search)
        .then((products) => {
            res.render('HomePage', {
                title : ShopName,
                products : products,
                user : req.session.user, 
                logged : req.session.logged,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Internal Server Error");
        });
    }
    else if(req.session.logged) {
        let _inCart = false;
        req.session.cart.forEach(product => {
            if(product.id == req.body.id) {
                product.quantity += 1;
                _inCart = true;
            }
        });
        if(_inCart == false) {
            var product = {
                id : req.body.id,
                brand : req.body.brand,
                model : req.body.model,
                hp : req.body.hp,
                year : req.body.year,
                img : req.body.img,
                price : req.body.price,
                quantity : 1,
            }
            req.session.cart.push(product);
        }
        res.redirect('/');
    }
    else {
        res.redirect('/login');
    }
});

app.post('/cart', (req, res) => {
    if(req.body.action[0] == 'r') {
        for(let i = 0; i < req.session.cart.length; i++) {
            if(req.session.cart[i].id == req.body.action.substring(1)) {
                if(req.session.cart[i].quantity > 1){
                    req.session.cart[i].quantity = (parseInt(req.session.cart[i].quantity) - 1).toString();
                    break;
                }
                else {
                    delete req.session.cart[i];
                    break;
                }
            }
        };
        res.redirect('Cart');
    }
    else if(req.body.action[0] == 'a') {
        for(let i = 0; i < req.session.cart.length; i++) {
            if(req.session.cart[i].id == req.body.action.substring(1)) {
                req.session.cart[i].quantity = (parseInt(req.session.cart[i].quantity) + 1).toString();
                break;
            }
        }
        res.redirect('Cart');
    }
    else if(req.body.action == 'summary') {
        res.redirect('Summary');
    }
});

app.post('/assortment', (req, res) => {
    if(req.body.action) {
        deleteProduct(req.body.action);
    }
    else if(req.body.id) {
        var newvalues = { $set: 
            {
                brand : req.body.brand,
                model : req.body.model,
                hp : req.body.hp,
                img : req.body.img,
                year : req.body.year,
                price : req.body.price,
            } 
        };
        editProduct(req.body.id, newvalues);
    }
    else if(req.body.Sid) {
        uploadProduct(req.body.Sid, req.body.Sbrand, req.body.Smodel, req.body.Syear, req.body.Shp, req.body.Simg, req.body.Sprice);
    }
    res.redirect('Assortment');
});

app.post('/summary', (req, res) => {
    let date = new Date().toDateString();
    let products = [];
    req.session.cart.forEach(product => {
        products.push({ itemId: product.id, quantity: product.quantity });
    });
    uploadOrder(date, req.body.city, req.body.street, req.body.number, req.session.user.email, req.session.user._id.toString(), products);
    req.session.cart = [];
    res.redirect("Cart");
});

// app listener on port 3000

app.listen(3000, () => {
    console.log('Port 3000');
});
