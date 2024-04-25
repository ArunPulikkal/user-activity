const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BORED_URL = 'http://www.boredapi.com/api/activity/';
const TIME_OUT = process.env.TIME_OUT || 10000;

const sqlite3 = require("sqlite3");
// In memory database, exists only as long this process is alive
const DB_URL = ':memory:';
const db = new sqlite3.Database(DB_URL, err => {
    if (err) {
        console.error(err.message);
    }
});

// Create userprofile table in database
db.run('CREATE TABLE IF NOT EXISTS userprofile (name TEXT, accessibility TEXT, price TEXT)').on('error', err => {
    if (err) {
        console.error(err.message);
    }
});

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

// Maps 'accessibility' and 'price' from numeric values to appropriate String values
// * Only mapped when the values are numeric
const mapper = (key, value) => {
    if (key === 'accessibility' && typeof value === 'number') {
        return value <= 0.25 ? 'High' : (value <= 0.75 ? 'Medium' : 'Low');
    } else if (key === 'price' && typeof value === 'number') {
        return value === 0 ? 'Free' : (value <= 0.5 ? 'Low' : 'High');
    } else {
        return value;
    }
}

// Fetch an activity from Bored API
const getActivity = async () => {
    const response = await fetch(BORED_URL);
    const text = await response.text();
    return JSON.parse(text, mapper);
}

// Fetch activity as per last saved user profile. If no saved user profile returns any activity
// Times out after if not able to find activity within TIME_OUT milliseconds
const getActivityAsPerProfile = async (userProfile) => {
    let shouldGetActivity = true;
    if (userProfile) {
        while (shouldGetActivity) {
            const mapped = await getActivity();
            if (userProfile.accessibility === mapped.accessibility && userProfile.price === mapped.price) {
                return mapped;
            }
            setTimeout(() => {
                shouldGetActivity = false;
            }, TIME_OUT); // Timeout after 10 seconds
        }
    } else {
        return getActivity();
    }
}

let lastUserProfile;

// Returns activity as per last saved user profile. If no saved user profile returns any activity
app.get("/activity", (req, res) => {
    getActivityAsPerProfile(lastUserProfile)
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send(err.message);
        });
});

// Class for UserProfile.
// An ORM can be used here, keeping it simple as we only have 1 operation
class UserProfile {

    constructor(name, accessibility, price) {
        this.name = name;
        this.accessibility = accessibility;
        this.price = price;
    }

    // Save current UserProfile to userprofile table
    save(database) {
        const statement = database.prepare('INSERT INTO userprofile (name, accessibility, price) VALUES (?, ?, ?)');
        statement.run(this.name, this.accessibility, this.price);
        statement.finalize(err => {
            if (err) {
                console.error(err.message);
            }
        });
        // Setting this user profile to the global variable.
        lastUserProfile = this;
    }

    // Log all UserProfile entries in userprofile table to console.
    static logAllUserProfiles(database) {
        database.each('SELECT name, accessibility, price FROM userprofile', (err, row) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(JSON.stringify(new UserProfile(row.name, row.accessibility, row.price)));
            }
        });
    }
}

// Saves user to database.
app.post('/user', (req, res) => {

    const userProfile = new UserProfile(req.body.name, req.body.accessibility, req.body.price);
    userProfile.save(db);
    res.status(200).send({});
});

// Logs all user profiles currently saved to console
app.get('/logusers', (_req, res) => {
    console.log('User Profiles in DB below :');
    UserProfile.logAllUserProfiles(db)
    res.status(200).send('logged all user profiles, check app logs');
});

// Logs all user profiles currently saved to console
app.get('/loglast', (_req, res) => {
    if (lastUserProfile) {
        console.log('Last User Profile : ' + JSON.stringify(lastUserProfile));
        res.status(200).send('logged last user profile, check app logs');
    } else {
        res.status(404).send('record not found');
    }
});