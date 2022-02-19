/**
 * Name: Ameya, Sihan
 * Date: December 10, 2021
 * Section: CSE 154 AF
 *
 * This is the back-end Node.js file of our classes API with several endpoints that
 * allow the user to to login, filter classes, search for classes, put the classes
 * they are interested in to a registration list if they meet the pre-requisite,
 * and enroll in a class. The API allows the user to edit the database to keep track
 * of the updates.
 */

'use strict';

const express = require('express');
const app = express();

const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const multer = require('multer');

const PARAM_ERROR = 400;
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "An error occurred on the server. Try again later.";
const COOKIE_LIFE = 3 * 60 * 60 * 1000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/**
 * Endpoint 1: GET endpoint that allows the user to see the classes that they enrolled
 * in, the confirmation number, and what time they enrolled in the class.
 */
app.get("/history/:usrname", async (req, res) => {
  let username = req.params.usrname;
  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM transactions WHERE user=?";
    let results = await db.all(query, [username]);
    res.json(results);
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 2: GET endpoint that gets the list of available classes and allows the
 * user to filter and/or search for classes.
 */
app.get("/classes", async (req, res) => {
  try {
    if (!req.query.filter) {
      res.json(await searchDB(req.query.search));
    } else {
      res.json(await filterDB(req.query.filter));
    }
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 3: GET endpoint that allows the user to see the more detailed information
 * of the classes they selected.
 */
app.get("/class/:code", async (req, res) => {
  let code = req.params.code;
  code = code.split("-").join(" ");
  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM classes WHERE code=?";
    let results = await db.get(query, [code]);
    await db.close();
    res.json(results);
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 4: GET endpoint that allows the user to see the classes that they added
 * to their registration (added to a cart but not yet enrolled) and/or enrollment
 * list.
 */
app.get("/registration/:usrname/:type", async (req, res) => {
  let username = req.params.usrname;
  let type = req.params.type;
  try {
    let db = await getDBConnection();
    let query = "SELECT code, name, credits FROM classes, cart WHERE usrname=? AND code=class_code";
    if (type === "enrollments") {
      query = "SELECT code, name, credits FROM classes, enrollments " +
        "WHERE usrname=? AND code=class_code";
    }
    let results = await db.all(query, [username]);
    res.json(results);
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 5: POST endpoint that checks if the user's login credential is valid. If it is
 * a session ID is generated and updated in the database.
 */
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  res.type("text");
  try {
    let db = await getDBConnection();
    let query = "SELECT usrname, nickname FROM users WHERE usrname=? AND pwd=?";
    let results = await db.get(query, [username, password]);
    if (results) {
      let cookieData = {"user": username, "sessionID": await getSessionID()};
      res.cookie("data", cookieData, {expires: new Date(Date.now() + COOKIE_LIFE)});
      await db.run("UPDATE users SET session=? WHERE usrname=?", [cookieData.sessionID, username]);
      res.send(results);
    } else {
      res.status(PARAM_ERROR);
      res.send("Username or Password Incorrect!");
    }
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 6: POST endpoint that allows the user to add a class to their registration
 * list (added to a cart but not yet enrolled) and updates the database accordingly.
 * If the class has been added to the registration/enrollment list or if the user
 * doesn't fulfull the requirements, they will not be allowed to register.
 */
app.post("/addtocart", async (req, res) => {
  let username = req.body.username;
  let classCode = req.body.classCode;
  try {
    let db = await getDBConnection();
    let prereqInfo = await checkPrereqs(username, classCode);
    if (await checkExisting(username, classCode)) {
      res.status(PARAM_ERROR);
      res.type("text").send("Already in Registration List or Enrollment List!");
    } else if (prereqInfo.allowed) {
      let query = "INSERT INTO cart (usrname, class_code) VALUES (?, ?)";
      await db.run(query, [username, classCode]);
      query = "SELECT code, name, credits FROM classes, cart WHERE usrname=? AND code=class_code";
      let results = await db.all(query, [username]);
      res.json(results);
    } else {
      res.status(PARAM_ERROR);
      res.type("text").send(prereqInfo.info);
    }
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 7: POST endpoint that allows the user to enroll in a class (add a class
 *  to their enrollment list) and updates the database accordingly.
 * If the user is already registered in the class, they will not be allowed to register.
 */
app.post("/register", async (req, res) => {
  let username = req.body.username;
  let classCode = req.body.classCode;
  try {
    let db = await getDBConnection();
    let query = "SELECT class_code FROM enrollments WHERE usrname=? AND class_code=?";
    let results = await db.get(query, [username, classCode]);
    if (results) {
      res.status(PARAM_ERROR);
      res.type("text").send("Already Enrolled!");
    } else {
      query = "DELETE FROM cart WHERE usrname=?  AND class_code=?";
      await db.run(query, [username, classCode]);
      query = "INSERT INTO enrollments (usrname, class_code) VALUES (?, ?)";
      await db.run(query, [username, classCode]);
      addTransaction(username, classCode);
      query = "SELECT code, name, credits FROM classes, enrollments " +
        "WHERE usrname=? AND code=class_code";
      results = await db.all(query, [username]);
      res.json(results);
    }
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Endpoint 8: GET endpoint that returns the session ID and user information
 * for a given user from the database.
 */
app.get("/getsession/:username/:type", async (req, res) => {
  let username = req.params.username;
  let type = req.params.type;
  try {
    let db = await getDBConnection();
    let query = "SELECT session, usrname, nickname FROM users WHERE usrname=?";
    if (type === "clear") {
      query = "UPDATE users SET session=? WHERE usrname=?";
      res.json(await db.run(query, ["", username]));
    } else {
      let results = await db.get(query, username);
      res.json(results);
    }
    await db.close();
  } catch (err) {
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

/**
 * Adds a record to the trasaction table when a user enrolls in a class.
 * @param {string} username - The username of the currently user logged in
 * @param {string} classCode - The classCode of the class that the user want to
 * enroll in.
 */
async function addTransaction(username, classCode) {
  let db = await getDBConnection();
  let query = "INSERT INTO transactions (user, notes) VALUES (?, ?)";
  await db.run(query, [username, "Registered for " + classCode]);
  await db.close();
}

/**
 * Checks if the user is already registered for or enrolled in the chosen class.
 * @param {string} username - The username of the currently user logged in
 * @param {string} classCode - The classCode of the class that the user wants to
 * enroll in.
 * @returns {Boolean} - indicating whether the class already exists in either table.
 */
async function checkExisting(username, classCode) {
  let db = await getDBConnection();
  let query1 = "SELECT class_code FROM cart WHERE usrname=? AND class_code=?";
  let results1 = await db.get(query1, [username, classCode]);
  let query2 = "SELECT class_code FROM enrollments WHERE usrname=? AND class_code=?";
  let results2 = await db.get(query2, [username, classCode]);
  await db.close();
  return Boolean(results1 || results2);
}

/**
 * Checks if the class has space, if the user's major matches and if the user has completed
 * the preqrequisites.
 * @param {string} username - The username of the currently user logged in
 * @param {string} classCode - The classCode of the class that the user wants to
 * register for.
 * @returns {object} - JS object with a boolean of whether we can register and information about
 * what is stopping us from registering.
 */
async function checkPrereqs(username, classCode) {
  let flag = true;
  let message = "Could not register for " + classCode + " because: ";
  let errors = [];
  let db = await getDBConnection();
  let classData = await db.get("SELECT * FROM classes WHERE code=?", [classCode]);
  let userData = await db.get("SELECT * FROM users WHERE usrname=?", [username]);
  if (classData.enrollment >= classData.capacity) {
    flag = false;
    errors.push("class capacity reached");
  }
  if (classData.major === "Y" && (userData.major !== classData.dept)) {
    flag = false;
    errors.push("major only class");
  }
  if (classData.prereqs) {
    if (userData.classes) {
      let userClasses = userData.classes.split(",");
      let options = classData.prereqs.split("/");
      if (!userClasses.some(element => options.includes(element))) {
        flag = false;
        errors.push("prerequisites not fulfilled");
      }
    } else {
      flag = false;
      errors.push("prerequisites not fulfilled");
    }
  }
  return {allowed: flag, info: message + errors.join(" AND ")};
}

/**
 * Select all of the classes with a code or a name that matched the given term.
 * @param {string} searchTerm - The search term that the user entered in the search
 * bar.
 * @returns {object} - A list of JSON formatted object with the code, name, and the
 * number of credits that matched te given search term.
 */
async function searchDB(searchTerm) {
  let db = await getDBConnection();
  let results = null;
  if (!searchTerm) {
    let query = "SELECT code, name, credits FROM classes ORDER BY code";
    results = await db.all(query);
  } else {
    let query = "SELECT code FROM classes WHERE code LIKE \"%" + searchTerm +
      "%\"OR name LIKE \"%" + searchTerm + "%\"";
    results = await db.all(query);
  }
  await db.close();
  return results;
}

/**
 * Select all of the classes that matched the given filter.
 * @param {string} filter - The pre-set filter including filters of departments
 * and number of credits.
 * @returns {object} - A list of JSON formatted object with the code, name, and the
 * number of credits that matched te given filter.
 */
async function filterDB(filter) {
  if (filter === "none") {
    return searchDB("");
  }
  let db = await getDBConnection();
  let query = "SELECT code, name, credits FROM classes WHERE dept=?";
  if (parseInt(filter)) {
    query = "SELECT code, name, credits FROM classes WHERE credits=?";
  }
  let results = await db.all(query, [filter]);
  await db.close();
  return results;
}

/**
 * Generates an unused sessionid and returns it to the user. Borrowed from Section 18
 * @returns {string} - The random session id.
 */
async function getSessionID() {
  let query = 'SELECT session FROM users WHERE session = ?';
  let id;
  let db = await getDBConnection();
  do {
    id = Math.random().toString(36)
      .substring(2, 15) + Math.random().toString(36)
      .substring(2, 15);
  } while (((await db.all(query, id)).length) > 0);
  await db.close();
  return id;
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'course_enrollment.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const DEFAULT = 8000;
const PORT = process.env.PORT || DEFAULT;
app.listen(PORT);