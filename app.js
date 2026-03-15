const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongo = require('mongodb').MongoClient;
const fs = require('fs');

const app = express();
const url = "mongodb://0.0.0.0:27017/";

// Парсер данных формы (как в семинаре)
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Статические файлы (css)
app.use(express.static(path.join(__dirname, 'public')));

// Логирование запросов (как в семинаре)
app.use(function (request, response, next) {
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  let data = `${hour}:${minutes}:${seconds} ${request.method} ${request.url} ${request.get('user-agent')}`;
  console.log(data);
  fs.appendFile('server.log', data + '\n', function () {});
  next();
});

// GET / — страница с формой (пункт 3, 6)
// Сначала пытаемся найти последнюю запись и показать её в форме
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// GET /result — страница отображения данных (пункт 3, 6)
// Получаем данные из БД методом findOne и отображаем
app.get('/result', function (request, response) {
  mongo.connect(url, function (err, db) {
    if (err) {
      console.error('Ошибка подключения к MongoDB:', err);
      return response.status(500).send('<h2>Ошибка подключения к базе данных</h2>');
    }

    const dbo = db.db("studentsdb");

    // findOne — получаем последнюю добавленную запись (пункт 6)
    dbo.collection("students").findOne(
      {},
      { sort: { _id: -1 } },
      function (err, result) {
        db.close();

        if (err) throw err;

        if (!result) {
          return response.send('<h2>Данных пока нет. <a href="/">Назад</a></h2>');
        }

        // Читаем шаблон и подставляем данные
        fs.readFile(path.join(__dirname, 'views', 'result.html'), 'utf8', function (err, html) {
          if (err) throw err;

          html = html.replace('{{name}}', result.name || '');
          html = html.replace('{{age}}', result.age || '');
          html = html.replace('{{email}}', result.email || '');
          html = html.replace('{{group}}', result.group || '');

          response.send(html);
        });
      }
    );
  });
});

// POST /register — обработка формы, сохранение в БД, редирект (пункты 3, 5, 7)
app.post('/register', urlencodedParser, function (request, response) {
  if (!request.body) return response.sendStatus(400);

  console.log(request.body);

  const student = {
    name:  request.body.userName,
    age:   request.body.userAge,
    email: request.body.userEmail,
    group: request.body.userGroup
  };

  mongo.connect(url, function (err, db) {
    if (err) {
      console.error('Ошибка подключения к MongoDB:', err);
      return response.status(500).send('<h2>Ошибка подключения к базе данных</h2>');
    }

    const dbo = db.db("studentsdb");

    // insertOne — сохраняем данные формы (пункт 5)
    dbo.collection("students").insertOne(student, function (err, res) {
      db.close();

      if (err) throw err;

      console.log("1 документ добавлен в коллекцию students");

      // redirect на страницу результата (пункт 7)
      response.redirect('/result');
    });
  });
});

app.listen(3000, function () {
  console.log('Сервер запущен на http://localhost:3000');
});
