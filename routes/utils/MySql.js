// const mysql = require('mysql2/promise');
// require('dotenv').config();



// const config={
// connectionLimit:4,
//   host: process.env.host,//"localhost"
//   user: process.env.user,//"root"
//   password: '13579112Rom!',
//   database:process.env.database
//   // database:"mydb"
// }
// const pool = new mysql.createPool(config);

// const connection =  () => {
//   return new Promise((resolve, reject) => {
//   pool.getConnection((err, connection) => {
//     if (err) reject(err);
//     console.log("MySQL pool connected: threadId " + connection.threadId);
//     const query = (sql, binding) => {
//       return new Promise((resolve, reject) => {
//          connection.query(sql, binding, (err, result) => {
//            if (err) reject(err);
//            resolve(result);
//            });
//          });
//        };
//        const release = () => {
//          return new Promise((resolve, reject) => {
//            if (err) reject(err);
//            console.log("MySQL pool released: threadId " + connection.threadId);
//            resolve(connection.release());
//          });
//        };
//        resolve({ query, release });
//      });
//    });
//  };
// const query = (sql, binding) => {
//   return new Promise((resolve, reject) => {
//     pool.query(sql, binding, (err, result, fields) => {
//       if (err) reject(err);
//       resolve(result);
//     });
//   });
// };

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: 4,
  host: process.env.host,
  user: process.env.user,
  password: process.env.db_password,
  database: process.env.database
});

module.exports = {
  connection: () => pool.getConnection(),
  pool
};