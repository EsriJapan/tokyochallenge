const express = require("express");
const Twitter = require("twitter");

const consumerKey = '';
const consumerSecret = '';
const accessTokenKey = '';
const accessTokenSecret = '';

let client;

const app = express();

app.use(express.static('app'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const server = app.listen(3000, () => {
  console.log("Node.js is listening to PORT:" + server.address().port);
});

_initTwitter();

function _initTwitter() {
  client = new Twitter({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: accessTokenKey,
    access_token_secret: accessTokenSecret
  });
}

app.get("/api/query", (req, res) => {
  const q = req.query.q;
  client.get('search/tweets', {q: q}, (error, tweets, response) => {
    res.send(tweets);
  });
});
