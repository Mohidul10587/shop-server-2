const express = require("express");
const nodemailer = require("nodemailer");
const router = new express.Router();
const conn = require("../db/conn");
const multer = require("multer");
const moment = require("moment")
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const SECRET_KEY = 'b9682406b6545de642ff8026527300b35ec4d70803b4fe40ce37c9ea292634bcb3829fad2e685531abc6bc15e6243f2e06e46e8d9c9c28a407c8f01af5761378';
router.use(cors())
// img storage confing
var imgconfig = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads");
    },
    filename: (req, file, callback) => {
        callback(null, `image-${Date.now()}.${file.originalname}`)
    }
});


// img filter
const isImage = (req, file, callback) => {
    if (file.mimetype.startsWith("image")) {
        callback(null, true)
    } else {
        callback(null, Error("only image is allowed"))
    }
}

var upload = multer({
    storage: imgconfig,
    fileFilter: isImage
})

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {

        if (err) return res.sendStatus(403);

        req.user = user;

        next();
    });
}


// add a product
router.post("/addProduct", upload.single("photo"), (req, res) => {
    const { fname, categoryName, subCategoryName, unit, priceOfUnit } = req.body;
    console.log(subCategoryName)
    const { filename } = req.file;


    if (!fname || !filename) {
        res.status(422).json({ status: 422, message: "fill all the details" })
    }

    try {

        let date = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

        conn.query("INSERT INTO products SET ?", { name: fname, img: filename, categoryName: categoryName, subCategoryName: subCategoryName, unit: unit, priceOfUnit: priceOfUnit, date: date }, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                console.log("data added")
                res.status(201).json({ status: 201, data: req.body })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});



// get all product
router.get("/products", (req, res) => {
    try {
        conn.query("SELECT * FROM products", (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("all products data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});


// get  products by category
router.get("/getProductByCategory/:productCategory", (req, res) => {

    const categoryName = req.params.productCategory
    console.log(categoryName)
    try {
        conn.query(`SELECT * FROM products WHERE categoryName ='${categoryName}'`, (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});

// get  products by sub category
router.get("/getProductBySubCategoryName/:productSubCategory", (req, res) => {

    const subCategoryName = req.params.productSubCategory
    console.log(subCategoryName)
    try {
        conn.query(`SELECT * FROM products WHERE subCategoryName ='${subCategoryName}'`, (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});

// post a product in cart 
router.post('/cart/:email', (req, res) => {
    const { name, price, category, subCategoryName, img, quantity, customersEmail } = req.body;
    const email = req.params.email;

    // Create a SQL query to insert the cart data
    const query = `INSERT INTO cart (name, price, category, subCategoryName, img, quantity, customers_email) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // Execute the query using the connection pool
    conn.query(query, [name, price, category, subCategoryName, img, quantity, customersEmail], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error storing cart data' });
        } else {
            res.json({ success: true });
        }
    });
});

// get product from cart by user email 
router.get("/cart/:email", (req, res) => {

    const email = req.params.email

    try {
        conn.query(`SELECT * FROM cart WHERE customers_email ='${email}'`, (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});


// get  product by id
router.get("/product/:id", (req, res) => {

    const id = req.params.id

    try {
        conn.query(`SELECT * FROM products WHERE id ='${id}'`, (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});


// updateSubCategory of a category
router.put('/updateSubCreateCategory/:categoryName', function (req, res) {
    const updateSubCreateCategory = JSON.stringify(req.body.updateSubCreateCategory);
    console.log(updateSubCreateCategory)
    const categoryName = req.params.categoryName
    const sql = `UPDATE category SET subCategoryName='${updateSubCreateCategory}' WHERE categoryName='${categoryName}'`;

    try {
        conn.query(sql, (err, result) => {
            if (err) {
                console.log(err)
                res.status(500).json({ error: err });
            } else {
                console.log("data updated")
                res.status(200).json({ status: 200, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});

// create category
router.post("/createCategory", (req, res) => {
    const { categoryName, subCategory } = req.body;
    console.log(subCategory)
    try {

        conn.query("INSERT INTO category SET ?", { categoryName: categoryName, subCategoryName: JSON.stringify(subCategory) }, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                console.log("data added")
                res.status(201).json({ status: 201, data: req.body })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});

// get all category 
router.get("/getCategoryName", (req, res) => {
    try {
        conn.query("SELECT * FROM category", (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});


// get all user
router.get("/getAllUsers", (req, res) => {
    try {
        conn.query("SELECT * FROM usersT", (err, result) => {
            if (err) {
                console.log("error")
            } else {
                console.log("data get")
                res.status(201).json({ status: 201, data: result })
            }
        })
    } catch (error) {
        res.status(422).json({ status: 422, error })
    }
});



// create a user
router.post('/userRegister', async (req, res) => {
    const { name, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();
    const verificationToken = uuidv4();

    // Store user information in database
    const query = 'INSERT INTO usersT (id,name, email, password ,verification_token) VALUES (?, ?, ?, ?, ?)'
    conn.query(query, [id, name, email, passwordHash, verificationToken], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error storing form data' });
        } else {

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: 'smtp-relay.sendinblue.com',
                port: 587,
                secure: false,
                auth: {

                    user: 'mohid10587@gmail.com',
                    pass: '7MOSEnf4UhFQrgsz'
                }
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Fred Foo 👻" <foo@example.com>', // sender address
                to: email, // list of receivers
                subject: "Test email verification", // Subject line
                text: `Click this link to verify your email: http://localhost:7004/verify/${verificationToken}`,
                html: `<b>Click this link to verify your email:<a href='https://shop-server2.onrender.com/verify/${verificationToken}'>Link</a></b>`, // html body
            });
            
            res.json({ user: true });
        }
    });

});

// Route to log in an existing user
router.post('/log', (req, res) => {
    const { email, password } = req.body;

    // Check if the email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Get the user from the database using the provided email
        conn.query(`SELECT * FROM usersT WHERE email = ?`, [email], async (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            console.log(results)
            // Check if the user with the provided email exists
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Check if the provided password matches the hashed password stored in the database
            const isMatch = await bcrypt.compare(password, results[0].password);

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Create a JWT for the authenticated user
            const token = jwt.sign({ email: results[0].email }, SECRET_KEY);

            // Send the JWT as the response
            res.json({ token });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Route to retrieve the current user's information
router.get('/me', authenticateToken, (req, res) => {
    const { email } = req.user;

    // Retrieve user information from database
    const query = `SELECT * FROM usersT WHERE email='${email}'`;
    conn.query(query, (err, result) => {
        if (err) throw err;
        const user = result[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ email: user.email });
    });
});


router.get("/verify/:verificationToken", async (req, res) => {
    console.log('EMAIL')
    try {
      const { verificationToken } = req.params;
      const query = `UPDATE usersT SET verified = true WHERE verification_token = '${verificationToken}'`
       conn.query(query, [verificationToken]);
      res.send("Email verified!");
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  });


// Route to update a user's password
// router.put('/password/me', authenticateToken, async (req, res) => {
//     const { id } = req.user;
//     const { currentPassword, newPassword } = req.body;

//     // Retrieve user information from database
//     const user = await db.collection('users').findOne({ id });
//     if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
//         return res.status(401).json({ message: 'Incorrect current password' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(newPassword, salt);

//     // Update user's password in database
//     const result = await db.collection('users').updateOne(
//         { id },
//         { $set: { passwordHash } }
//     );
//     console.log(result);

//     res.json({ message: 'Password updated successfully' });
// });


module.exports = router;