const mysql = require("mysql2");


const conn = mysql.createConnection({
    user:'admin',
    host:'mysql-121477-0.cloudclusters.net',
    password:'gizDWPUf',
    database:'shop',
    port:10028
});

conn.connect((error)=>{
    if(error) throw error;
    console.log("connected !")
});

module.exports = conn