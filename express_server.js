const express = require("express");
const app = express();
const bcrypt = require('bcryptjs');

const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const cookieSession = require('cookie-session');
app.use(cookieSession( {
  name: "session",
  keys: ["betYouWontGetThis"]
}));

const PORT = 8080; // default port 8080˜

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "i3BoGr": {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  "xjyrnc": { 
    longURL: 'http://example.com',
    userID: 'ez123' 
  },
  '05lf0u': { 
    longURL: 'http://crunchyroll.com', 
    userID: 'ez123' 
  },
  corzi9: { 
    longURL: 'http://example.com', 
    userID: 'ez123' 
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "ez123": {
    id: "ez123",
    email: "ez@example.com",
    password: bcrypt.hashSync("123hackme", 10)
  }
};

// ROUTE ENDPOINTS

app.get("/", (req, res) => {
  res.send("Hello!");
});

// /URLS ENDPONTS
app.post("/urls", (req, res) => {
  console.log("body urls:", req.body);
  console.log("params urls:", req.params);

  const user_id = req.session.user_id;
  const longURL = req.body.longURL;
  
  if (user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL,
      userID: users[user_id].id
    };
    console.log("databse:", urlDatabase);

    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Error: 403 - Forbidden. Only registered users can shorten URLs. Please log in.");
  }
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  console.log("session:", user_id)
  const user = users[user_id];

  const templateVars = { urls: urlsForUser(user_id, urlDatabase), user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login");
  } 

  const templateVars = { user: users[user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log("short params:", req.params);
  console.log("short body:", req.body);
  const user_id = req.session.user_id;

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[user_id]
  };

  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const user_id = req.session.user_id;
  
  if (user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.status(401).send("Error: 401 - Authorization Required. Users can only edit their own URLs.");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("Error: 401 - Authorization Required. Users can only delete their own URLs.");
  }
});

// /U ENDPOINT
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log("u:", urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL].userID) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Error: 404 - Request page not found. ShortURL does not exist")
  }
});

// REGISTER ENDPOINTS
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user: users[user_id] };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  //console.log(req.body);
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("Error: 400 - Bad Request. Cannot find email or password");
  } else if (getUserByEmail(newEmail, users)) {
    res.status(400).send("Error: 400 - Bad Request. User already exists");
  }

  const user_id = generateRandomString();

  users[user_id] = {
    id: user_id,
    email: newEmail,
    password: bcrypt.hashSync(newPassword, 10)
  };
  
    req.session["user_id"] = user_id;
    res.redirect("/urls");
});

// LOGIN ENDPOINTS
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user: users[user_id] };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  console.log(users);

  if (!email) {
    res.status(403).send("Error: 403 - Forbidden. You don't have permission to access this server. Email not found.");
  } else {
    if (!bcrypt.compareSync(password, user.password)) {
      res.status(403).send("Error: 403 - Forbidden. You don't have permission to access this server. Incorrect password.");
    } else {
      req.session["user_id"] = user.id;
      res.redirect("/urls");
    }
  }
});

// LOGOUT ENDPOINT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// OTHERS
app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
