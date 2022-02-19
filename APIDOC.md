# Registration and Enrollment API Documentation
The Registration and EnrollmentAPI provides information about the login credentials
of the user, the classes that each user has in their registration list, the classes
that each user in enrolled in, a list of classes, and a transactions table for all
of the enrollments (confirmation number, date etc.).

## Endpoint 1: Gets the classes that the user is enrolled in, the confirmation number, and date/time
**Request Format:** /history/:usrname

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns confirmation about the classes that the user enrolled in,
the confirmation number, and what time they enrolled in the class.

**Example Request:** /history/sihanm2

**Example Response:**
```json
[
  {
    "id": 23,
    "user": "sihanm2",
    "notes": "Registered for MATH 124",
    "date": "2021-12-10 16:57:19"
  },
  {
    "id": 24,
    "user": "sihanm2",
    "notes": "Registered for CSE 142",
    "date": "2021-12-10 16:57:19"
  }
]
```

**Error Handling:**
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 2: Gets the list of available classes and allows the user to filter and/or search for classes.
**Request Format:** /classes

**Query Parameters:** search (optional), filter (optional)

**Request Type:** GET

**Returned Data Format**: JSON

**Description 1:** Given a search term, returns a list of class code with the class code
or name matching the given search term.

**Example Request 1:** /classes?search=20

**Example Response 1:**
```json
[
  {
    "code": "MATH 120"
  },
  {
    "code": "ECON 200"
  },
  {
    "code": "ECON 201"
  }
]
```

**Description 2:** Given a filter, returns a list of classes with the class code
or name matching the given filter.

**Example Request 2:** /classes?filter=ASIAN

**Example Response 2:**
```json
[
  {
    "code": "ASIAN 401",
    "name": "Introduction To Asian Linguistics",
    "credits": 5
  }
]
```

**Description 3:** Returns a list of the available classes.

**Example Request 3:** /classes

**Example Response 3:** (abbreviated)
```json
[
  {
    "code": "ART 140",
    "name": "Basic Photography",
    "credits": 5
  },
  {
    "code": "ART 190",
    "name": "Introduction To Drawing",
    "credits": 5
  },
  {
    "code": "ASIAN 401",
    "name": "Introduction To Asian Linguistics",
    "credits": 5
  },
  ...
]
```

**Error Handling:**
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 3: Gets the detailed information of the class selected.
**Request Format:** /class/:code

**Request Type**: GET

**Returned Data Format**: JSON

**Description:** Allows the user to see the more detailed information of the classes
they selected including the code, name, and description etc.

**Example Request:** /class/CSE 154

**Example Response:**
```json
{
  "code": "CSE 154",
  "dept": "CSE",
  "name": "Web Programming",
  "capacity": 125,
  "enrollment": 12,
  "description": "Covers languages, tools, and techniques for developing interactive and dynamic web pages.Topics include page styling, design, and layout; client and server side scripting; web security; and interacting with data sources such as databases.",
  "prereqs": "CSE 142/CSE 143/CSE 160",
  "schedule": "MWF 1:30 PM - 2:20 PM",
  "credits": 5,
  "major": "N"
}
```

**Error Handling:**
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 4: Gets the list of classes that the user added to their registration/enrollment list.
**Request Format:** /registration/:usrname/:type

**Request Type**: GET

**Returned Data Format**: JSON

**Description 1:** Allows the user to see the list of classes in their resgistration list.

**Example Request 1:** /registration/sihanm2/cart

**Example Response 1:**
```json
[
  {
    "code": "CSE 160",
    "name": "Data Programming",
    "credits": 4
  }
]
```

**Description 2:** Allows the user to see the list of classes in their enrollment list.

**Example Request 2:** /registration/sihanm2/enrollments

**Example Response 2:**
```json
[
  {
    "code": "MATH 124",
    "name": "Calculus With Analytic Geometry I",
    "credits": 5
  },
  {
    "code": "CSE 142",
    "name": "Computer Programming I",
    "credits": 4
  }
]
```

**Error Handling:**
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 5: Login
**Request Format:** /login endpoint with POST parameters of `username` and `password`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Checks if the user's login credentials is valid. Returns the username and the name
of the user.

**Example Request:** /login with POST parameters of `sihanm2` and `test pwd`

**Example Response:**
```json
{
  "usrname": "sihanm2",
  "nickname": "Sihan"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If passed in an invalid username and password combination, returns an error with the message: `Username or Password Incorrect!`
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 6: Add a class to registration list
**Request Format:** /addtocart endpoint with POST parameters of `username` and `classCode`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Allows the user to add a class to their registration list (added
to a cart but not yet enrolled) and updates the database accordingly. Returns the
list of all classes in the registration list.

**Example Request:** /addtocart with POST parameters of `sihanm2` and `ECON 200`

**Example Response:**
```json
[
  {
    "code": "CSE 160",
    "name": "Data Programming",
    "credits": 4
  },
  {
    "code": "ECON 200",
    "name": "Introduction To Microeconomics",
    "credits": 5
  }
]
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the user already has the class on the registration list or if the user is already enrolled in the class, returns an error with the message: `Already in Registration List or Enrollment List!`
  - If the user has not taken the prerequisite courses for the class, returns an error with the message `Could not register for XXX because: prerequisites not fulfilled` where the XXX class is the class that the user tries to add to the registration list.
  - If the class capacity is filled, returns an error with the message `Could not register for XXX because: class capacity reached`
  - If the user is not in the required major for the class, returns an error with the message `Could not register for XXX because: major  only class`
  - Note that when combinations of these errors occur together (ex. non-major AND class full), it will return the corresponding detailed
    error message such as `Could not register for XXX because: class capacity reached AND major only class`
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 7: Enroll in a class
**Request Format:** /register endpoint with POST parameters of `username` and `classCode`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Allows the user to enroll in a class and updates the database
accordingly. Returns the list of all enrolled classes.

**Example Request:** /register with POST parameters of `sihanm2` and `ECON 200`

**Example Response:**
```json
[
  {
    "code": "MATH 124",
    "name": "Calculus With Analytic Geometry I",
    "credits": 5
  },
  {
    "code": "CSE 142",
    "name": "Computer Programming I",
    "credits": 4
  },
  {
    "code": "ECON 200",
    "name": "Introduction To Microeconomics",
    "credits": 5
  }
]
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the user is already enrolled in the selected class, returns an error with the message: `Already Enrolled!`
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`

## Endpoint 8: Get Session
**Request Format:** /getsession/:username/:type

**Request Type:** GET

**Returned Data Format**: JSON

**Description 1:** Gets the username, nickname and session ID stored in the database for the given user if type param is "get"

**Example Request 1:** /getsession/sihanm2/get

**Example Response 1:**
```json
{
  "session": "b1biviowgq5w31ftssuxof",
  "usrname": "sihanm2",
  "nickname": "Sihan"
}
```

**Description 2:** Clears the session ID for given user if type param is "clear". Returns SQL metadata in JSON format.

**Example Request 2:** /getsession/sihanm2/clear

**Example Response 2:**
```json
{
  "stmt": {},
  "lastID": 0,
  "changes": 1
}
```

**Error Handling:**
- Possible 500 (server error) errors (all plain text):
  - If there's a server error, returns an error with the message: `An error occurred on the server. Try again later.`