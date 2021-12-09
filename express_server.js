const express = require("express");
const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// ROUTE ENDPOINTS 
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
 const templateVars = { urls: urlDatabase, username: req.cookies.username };
 res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
 const templateVars = { username: req.cookies.username };
 res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username 
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  //console.log(req.body);
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  //console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`)
});


//app.post("/urls/ids")


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


//app.get("/login")


app.get("/register", (req, res) => {
  res.render("registration");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username, {
    maxAge: 60000,
    expires: new Date(Date.now() + 600000),
    secure: true,
    httpOnly: false,
    sameSite: 'lax'
  });
  res.redirect("/urls");
});


app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const userData = { email, password };
  


});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};