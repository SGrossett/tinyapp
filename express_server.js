const express = require("express");
const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080˜

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
  },
  "ez123": {
    id: "ez123",
    email: "ez@example.com",
    password: "123hackme"
  }
};

// ROUTE ENDPOINTS

app.get("/", (req, res) => {
  res.send("Hello!");
});

// /URLS ENDPONTS
app.post("/urls", (req, res) => {
  const user_id = res.cookies.user_id;

  if (user_id) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Error: 403 - Forbidden \nOnly registered users can shorten URLs.")
  }
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  if (!user_id) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies.user_id;

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
});

// /U ENDPOINT
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


// REGISTER ENDPOINTS
app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  //console.log(req.body);
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("Error: 400 - Bad Request \nCannot find email or password");
  } else if (getUserByEmail(newEmail, users)) {
    res.status(400).send("Error: 400 - Bad Request. User already exists.");
  }

  user_id = generateRandomString();

  users[user_id] = {
    id: user_id,
    email: newEmail,
    password: newPassword
  };
  
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

// LOGIN ENDPOINTS
app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!email) {
    res.status(403).send("Error: 403 - Forbidden \nYou don't have permission to access this server. \nEmail not found.");
  } else {
    if (user.password !== password) {
      res.status(403).send("Error: 403 - Forbidden \nYou don't have permission to access this server. \nIncorrect password.");
    } else {
      res.cookie("user_id", user.id, {
        maxAge: 60000,
        expires: new Date(Date.now() + 600000),
        secure: true,
        httpOnly: false,
        sameSite: 'lax'
      });
      res.redirect("/urls");
    }
  }
});

// LOGOUT ENDPOINT
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// OTHERS
app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
};