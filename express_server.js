const express = require("express");
const app = express();
const bcrypt = require('bcryptjs');

const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: "session",
  keys: ["betYouWontGetThis"]
}));

const PORT = 3000; // default port 8080˜

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

// ROUTE ENDPOINTS

// Redirects user to homepage if logged in. If not, redirects to login
app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


// /URLS ENDPONTS

// Adds URL info to user's profile
// If user isn't logged in, send 403 error
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const longURL = req.body.longURL;
  
  if (user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL,
      userID: users[user_id].id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Error: 403 - Forbidden. Only registered users can shorten URLs. Please log in.");
  }
});

// Displays user's hompage with their URLs
// Returns a 401 error if not logged in
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];

  if (user_id) {
    const templateVars = { urls: urlsForUser(user_id, urlDatabase), user: user };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("Error: 401 - Authorization Required. Please log in to access this page");
  }
});

// Displays form to add new URL
// If user isn't logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[user_id] };
    res.render("urls_new", templateVars);
  }
});

// Generate shortURL if user is logged in
// Returns a 401 error if not logged in
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


// Edits a users shortURL if credentials check out
// Returns a 401 error is shortURL doesn't belong to user
// Returns a 404 error if shortURL doesn't exist
// Returns a 401 error if user is not logged in
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!user_id) res.status(401).send("Error: 401 - Authorization Required. Please log in to edit URL.");
  if (!urlDatabase[shortURL]) {
    const templateVars = { user: users[user_id] };
    res.status(404).send("Error: 404 - Request page not found. ShortURL does not exist");
  } else if (user_id === urlDatabase[shortURL].userID) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("Error: 401 - Authorization Required. Users can only edit their own URLs.");
  }
});


// Deletes a users shortURL if credentials check out 
// Returns a 401 error is shortURL doesn't belong to user
// Returns a 404 error if shortURL doesn't exist
// Returns a 401 error if user is not logged in
app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!user_id) res.status(401).send("Error: 401 - Authorization Required. Please log in to delete URL.");
  if (!urlDatabase[shortURL]) {
    const templateVars = { user: users[user_id] };
    res.status(404).send("Error: 404 - Request page not found. ShortURL does not exist");
  } else if (user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("Error: 401 - Authorization Required. Users can only delete their own URLs.");
  }
});

// /U ENDPOINT
// Redirect to longURL if given ID exists
// Return 404 error is not
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (urlDatabase[req.params.shortURL].userID) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Error: 404 - Request page not found. ShortURL does not exist");
  }
});

// REGISTER ENDPOINTS

// Redirect to homepage if logged if
// If not, display register form
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  
  if (user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[user_id] };
    res.render("registration", templateVars);
  }
});

// Creates new user
// Return 404 error if email or password are missing
// Return 400 error is email already exists
app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (!newEmail || !newPassword) {
    res.status(400).send("Error: 400 - Bad Request. Cannot find email or password");
  } else if (getUserByEmail(newEmail, users)) {
    res.status(400).send("Error: 400 - Bad Request. User already exists");
  } else {
    const user_id = generateRandomString();

    users[user_id] = {
      id: user_id,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, 10)
    };
    
    req.session["user_id"] = user_id;
    res.redirect("/urls");
  }

});

// LOGIN ENDPOINTS

// Redirects to /urls if logged in
// If not, display login form
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[user_id] };
    res.render("login", templateVars);
  }
});

// Checks login credentials
// Redirects to homepage if good
// Returns 403 error if email not found
// Returns 403 error for incorrect password
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

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
// Logs user out and redirects them to the homepage
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});