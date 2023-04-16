const express = require("express");
const router = new express.Router();
const conn = require("../db/conn");
const multer = require("multer");
const moment = require("moment")


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
        callback(null, Error("only image is allowd"))
    }
}

var upload = multer({
    storage: imgconfig,
    fileFilter: isImage
})



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

// post a user data 
router.post('/createUser', (req, res) => {
    const { name, email, password } = req.body;
  
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    conn.query(query, [name, email, password], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error storing form data' });
      } else {
        res.json({ success: true });
      }
    });
  });
  




// get user data
// router.get("/getdata", (req, res) => {
//     try {
//         conn.query("SELECT * FROM products", (err, result) => {
//             if (err) {
//                 console.log("error")
//             } else {
//                 console.log("data get")
//                 res.status(201).json({ status: 201, data: result })
//             }
//         })
//     } catch (error) {
//         res.status(422).json({ status: 422, error })
//     }
// });


// delete user
// router.delete("/:id", (req, res) => {
//     const { id } = req.params;
//     try {
//         conn.query(`DELETE FROM usersdata WHERE id ='${id}'`, (err, result) => {
//             if (err) {
//                 console.log("error")
//             } else {
//                 console.log("data delete")
//                 res.status(201).json({ status: 201, data: result })
//             }
//         })
//     } catch (error) {
//         res.status(422).json({ status: 422, error })
//     }
// })



module.exports = router;