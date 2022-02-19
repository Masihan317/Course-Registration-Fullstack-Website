/**
 * Name: Ameya, Sihan
 * Date: December 10, 2021
 * Section: CSE 154 AF
 *
 * This is the front-end js file used to add behavior to our webpage for our final
 * project. The various buttons/drop down menus will filter and show the user the
 * classes available, allow the user to put the classes in a registration list,
 * and allow the user to enroll in the class if the fulfill the pre-requisites,
 * major requirements, and if the class has space (It does so through fetching
 * requests to our own back-end API).
 */

"use strict";

(function() {

  /**
   * A function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  let loggedInUser = null;
  let loggedInName = null;

  /**
   * The function being called when the window is loaded. It loads all of the
   * classes when the user is loggined in and adds the event listeners to the
   * buttons so when the buttons are clicked, they will switch the views and
   * allow the user to register for classes.
   */
  function init() {
    id("login-form").addEventListener("submit", function(event) {
      event.preventDefault();
      handleForm();
    });
    id("logout").addEventListener("click", logout);
    id("list-view").addEventListener("click", changeView);
    id("grid-view").addEventListener("click", changeView);
    id("add-class").addEventListener("click", addToCart);
    id("enroll").addEventListener("click", registerForClass);
    let backBtns = qsa(".back-btn");
    backBtns.forEach(element => element.addEventListener("click", changeView));
    id("registration-btn").addEventListener("click", registrationOrEnrollment);
    id("enrollments-btn").addEventListener("click", registrationOrEnrollment);
    id("history-btn").addEventListener("click", registrationOrEnrollment);
    id("search-btn").addEventListener("click", searchClasses);
    id("filter").addEventListener("change", handleFilter);
    checkCookies();
  }

  /**
   * Clears the login cookie so that the session is ended, changes view back to original
   * This function is called when the logout button is clicked
   */
  function logout() {
    loggedInName = null;
    fetch("/getsession/" + loggedInUser + "/clear")
      .catch(handleError);
    loggedInUser = null;
    id("home-view").classList.add("hidden");
    id("class-view").classList.add("hidden");
    id("registration-view").classList.add("hidden");
    id("enrollments-view").classList.add("hidden");
    id("history-view").classList.add("hidden");
    qs("header").classList.add("hidden");
    id("login-view").classList.remove("hidden");
  }

  /**
   * Checks if the session ID in the cookie matches the database. If it does, allows user
   * to be automatically logged in.
   */
  function checkCookies() {
    let cookie = document.cookie;
    if (cookie) {
      let data = decodeURIComponent(cookie);
      data = JSON.parse(data.split("data=j:")[1]);
      fetch("/getsession/" + data.user + "/get")
        .then(statusCheck)
        .then(res => res.json())
        .then((res) => {
          if (res.session === data.sessionID) {
            handleLoginInfo(res);
          }
        })
        .catch(handleError);
    }
  }

  /**
   * Makes a fetch call when a filter is selected. Only shows classes that fits
   * the category of the given filter.
   */
  function handleFilter() {
    fetch("/classes?filter=" + this.value)
      .then(statusCheck)
      .then(res => res.json())
      .then(showResults)
      .catch(handleError);
  }

  /**
   * Allows the user to register for classes. Makes the fetch call with the class
   * code and the username in the form body, updates the enrolled classes for the
   * user, and shows the user that the classes has been registered on the enrollments
   * page.
   */
  function registerForClass() {
    let classes = qsa("#registration-container .class");
    if (classes.length > 0) {
      for (let i = 0; i < classes.length; i++) {
        let data = new FormData();
        data.append("username", loggedInUser);
        data.append("classCode", classes[i].id.split("-").join(" "));
        let msg = "Enrolled in all classes in the registration list. " +
          "See 'History' tab for confirmation number(s).";
        fetch("/register", {method: "POST", body: data})
          .then(statusCheck)
          .then(resp => resp.json())
          .then((res) => {
            handleError(msg);
            constructClasses(res, "enrollments-container");
          })
          .catch(handleError);
      }
    }
  }

  /**
   * Loads the registration page (cart, added but not yet registered), enrollment
   * (enrolled) classes page, and the confirmation of enrolled classes page.
   */
  function registrationOrEnrollment() {
    if (this.id === "registration-btn") {
      id("registration-view").classList.remove("hidden");
      id("home-view").classList.add("hidden");
      fetch("/registration/" + loggedInUser + "/cart")
        .then(statusCheck)
        .then(res => res.json())
        .then((res) => {constructClasses(res, "registration-container");})
        .catch(handleError);
    } else if (this.id === "enrollments-btn") {
      id("enrollments-view").classList.remove("hidden");
      id("home-view").classList.add("hidden");
      fetch("/registration/" + loggedInUser + "/enrollments")
        .then(statusCheck)
        .then(res => res.json())
        .then((res) => {constructClasses(res, "enrollments-container");})
        .catch(handleError);
    } else {
      id("history-view").classList.remove("hidden");
      id("home-view").classList.add("hidden");
      fetch("/history/" + loggedInUser)
        .then(statusCheck)
        .then(res => res.json())
        .then(fillTransactions)
        .catch(handleError);
    }
  }

  /**
   * Fill the history/confirmation of registering for a class page with a table
   * made from the information from the fetch request. The user can now see the
   * confirmation number, classes enrolled in, and the date the action was done.
   * @param {object} transactions - An array of javascript
   * objects with a confirmation number, a note, and the date the
   * enrollment happened from the fetch request.
   */
  function fillTransactions(transactions) {
    let rows = qsa("tr");
    rows.forEach((element, i) => {
      if (i !== 0) {
        element.remove();
      }
    });
    for (let i = 0; i < transactions.length; i++) {
      let container = gen("tr");
      let number = gen("td");
      number.textContent = transactions[i].id;
      let notes = gen("td");
      notes.textContent = transactions[i].notes;
      let time = gen("td");
      time.textContent = transactions[i].date;
      container.appendChild(number);
      container.appendChild(notes);
      container.appendChild(time);
      id("transaction-table").appendChild(container);
    }
  }

  /**
   * Makes a fetch call when the user clicks the search button to search for classes.
   * The home view will now only display the classes that matched the search term.
   */
  function searchClasses() {
    fetch("/classes?search=" + id("search-term").value.trim())
      .then(statusCheck)
      .then(resp => resp.json())
      .then(showResults)
      .catch(handleError);
  }

  /**
   * Get a list of all of the classes and display them so the user can see them.
   */
  function getClasses() {
    fetch("/classes")
      .then(statusCheck)
      .then(resp => resp.json())
      .then((res) => {constructClasses(res, "home-container");})
      .catch(handleError);
  }

  /**
   * Display the classes with the class code or name that matched the search result.
   * @param {object} data - One or a list of class code(s) of classes that matched
   * the given search result.
   */
  function showResults(data) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].code.split(" ").join("-");
    }
    let classes = id("home-container").children;
    for (let i = 0; i < classes.length; i++) {
      if (data.includes(classes[i].id)) {
        classes[i].classList.remove("hidden");
      } else {
        classes[i].classList.add("hidden");
      }
    }
  }

  /**
   * Constructs the containers for the individual classes and appends them to the
   * appropriate container.
   * @param {object} classInfo - One or a list of JSON formatted javascript object
   * of the class(es) with their class code, class name, and credits from the
   * fetch request.
   * @param {object} container - The DOM object of the container that the classes
   * will be appended to.
   */
  function constructClasses(classInfo, container) {
    id(container).innerHTML = "";
    for (let i = 0; i < classInfo.length; i++) {
      let classDiv = gen("div");
      classDiv.classList.add("class");
      classDiv.id = classInfo[i].code.split(" ").join("-");
      let code = gen("div");
      code.textContent = classInfo[i].code;
      let name = gen("div");
      name.textContent = classInfo[i].name;
      let credit = gen("div");
      credit.textContent = "Credits: " + classInfo[i].credits;
      classDiv.appendChild(code);
      classDiv.appendChild(name);
      classDiv.appendChild(credit);
      classDiv.addEventListener("click", showDetailed);
      id(container).appendChild(classDiv);
    }
  }

  /**
   * Make a fetch request that will show the detailed information of a class when
   * the user clicks on it.
   */
  function showDetailed() {
    fetch("/class/" + this.id)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(constructDetailed)
      .catch(handleError);
  }

  /**
   * Constructs and display the detailed information of an individual classes that
   * the user clicked on.
   * @param {object} info - A list of JSON formatted javascript object of the class
   * that the user clicked on with their class code, class name, credits, description,
   * schedule, whether or not it has pre-requisite classes from the fetch request.
   */
  function constructDetailed(info) {
    id("home-view").classList.add("hidden");
    id("registration-view").classList.add("hidden");
    id("enrollments-view").classList.add("hidden");
    id("history-view").classList.add("hidden");
    id("class-view").classList.remove("hidden");
    id("class-name").textContent = `${info.code}: ${info.name} (${info.credits} Cr.)`;
    id("desc").textContent = info.description;
    id("prereqs").textContent = info.prereqs ? info.prereqs.split("/").join(" or ") : "None";
    id("schedule").textContent = info.schedule;
    id("major").textContent = info.major === "Y" ? "Yes" : "No";
    id("capacity").textContent = `${info.enrollment}/${info.capacity}`;
  }

  /**
   * Allows the user to add classes to the registration list (like a cart where
   * the user is not yet enrolled, but is added to a registration list where the
   * user can then enroll). Displayed the classes that the user added to the
   * registration page.
   */
  function addToCart() {
    let data = new FormData();
    data.append("username", loggedInUser);
    data.append("classCode", id("class-name").textContent.split(":")[0]);
    fetch("/addtocart", {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then((res) => {
        handleError("Class added to the registration list!");
        constructClasses(res, "registration-container");
      })
      .catch(handleError);
  }

  /**
   * Changes the view of classes to and from list/grid view and returns to home
   * view when the back button is clicked.
   */
  function changeView() {
    if (this.id === "list-view") {
      id("home-container").classList.remove("classes-container-grid");
      id("home-container").classList.add("classes-container");
      let classes = qsa(".class-grid");
      for (let i = 0; i < classes.length; i++) {
        classes[i].classList.remove("class-grid");
        classes[i].classList.add("class");
      }
    } else if (this.id === "grid-view") {
      id("home-container").classList.remove("classes-container");
      id("home-container").classList.add("classes-container-grid");
      let classes = qsa(".class");
      for (let i = 0; i < classes.length; i++) {
        classes[i].classList.remove("class");
        classes[i].classList.add("class-grid");
      }
    } else if (this.classList.contains("back-btn")) {
      id("class-view").classList.add("hidden");
      id("registration-view").classList.add("hidden");
      id("history-view").classList.add("hidden");
      id("enrollments-view").classList.add("hidden");
      id("home-view").classList.remove("hidden");
    }
  }

  /**
   * Makes a fetch request that checks if the login credentials is valid by sending
   * the username and password in a form body to the API where the credentials are
   * then checked against the database.
   */
  function handleForm() {
    let data = new FormData();
    data.append("username", id("username").value);
    data.append("password", id("password").value);
    id("login-form").reset();
    fetch("/login", {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(handleLoginInfo)
      .catch(handleError);
  }

  /**
   * Populates the home page with a list of classes when the user logs in. Hides
   * any other views including the login view and only shows the home view with
   * the classes.
   * @param {object} info - A JSON formatted javascript object of the information
   * of the user including key value pairs of login username and the name of the user.
   */
  function handleLoginInfo(info) {
    loggedInUser = info.usrname;
    loggedInName = info.nickname;
    getClasses();
    id("search-btn").addEventListener("click", searchClasses);
    id("login-view").classList.add("hidden");
    id("enrollments-view").classList.add("hidden");
    id("history-view").classList.add("hidden");
    id("registration-view").classList.add("hidden");
    id("home-view").classList.remove("hidden");
    id("nickname").textContent = loggedInName;
    qs("header").classList.remove("hidden");
  }

  /**
   * Appends the error message to the bottom of the page with a descriptive message
   * when something goes wrong.
   * @param {object} err - An error that happened somewhere in our code/fetch
   * process.
   */
  function handleError(err) {
    const fiveSecond = 5000;
    if (id("error-tag")) {
      id("error-tag").remove();
    }
    let msg = gen("p");
    msg.id = "error-tag";
    msg.classList.add("text-styling");
    msg.textContent = err;
    qs("body").appendChild(msg);
    setTimeout(() => {
      msg.remove();
    }, fiveSecond);
  }

  /** ----------------------- Helper functions ------------------------- */
  /**
   * Checks if the status of the response is okay, if it is, returns the response
   * to go further down the .then chain.
   * @param {Response} res - Response object.
   * @returns {Response} the response from the API (if no error).
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();