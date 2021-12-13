const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
}
const urlsForUser = (id, database) => {
  const urls = {};
  for (let shortURLs in database) {
    if (database[shortURLs].userID === id) {
      urls[shortURLs] = database[shortURLs];
    }
  }
  return urls;
}

module.exports = { generateRandomString, getUserByEmail, urlsForUser };