# user-activity

A random user activity provider. Provides a user activity as per user preference.

## Getting Started
- Install nodejs, sqlite3 and express.
- Create a directory for this project and update to the directory. The directory should contain `package.json` and `app.js`
- Install dependencies, run in directory containing `package.json`
````
npm install
````
- Run the app, run in directory containing `app.js` 
````
node app.js
````
- To stop the app, kill it

## Using the app as a consumer
The app runs on port 3000
#### Set User Preference
````
POST /user
{
"name": <user's name>,
"accessibility": "High|Medium|Medium",
"price": "Free|Low|High" 
}
````
#### Get random activity as per preference
````
GET /activity
````

## Check internal state of the app
The following Rest commands log the internal state of the app to the console
- `GET /loglast` - Logs the last user profile used to filter activities.
- `GET /logusers` - Logs all the user profiles currently stored.

### Assumptions
 - The user profile is stored in memory, only user profile data saved since current start of app is saved. The data is lost when app terminates.
 - Accessibility and Price from Bored API are numbers, this app only maps when accessibility and price are numbers else the value from Bored API is given back to the user.
 - A configurable timeout of 10 seconds is set while fetching and filtering activities from Bored API. If the app doesn't get a match the request times out.
 - The database connections are reused and closed as this is an in memory mock database.



