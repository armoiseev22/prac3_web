// Скрипт создания базы данных и пустой коллекции (пункт 4 задания)
const mongo = require('mongodb').MongoClient;
const url = "mongodb://0.0.0.0:27017/";

mongo.connect(url, (err, db) => {
  if (err) throw err;

  const dbo = db.db("studentsdb");

  dbo.createCollection("students", (err, res) => {
    if (err) throw err;
    console.log("База данных 'studentsdb' создана!");
    console.log("Коллекция 'students' создана!");
    db.close();
  });
});
