import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuth } from 'google-auth-library';
import { DateTime } from 'luxon';
import config from './config';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

export function Authorize(credentials, callback, params = null) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, params);
    }
  });
}

export function ListEvents(auth) {
  const calendar = google.calendar('v3');
  calendar.events.list(
    {
      auth: auth,
      calendarId: 'primary',
    },
    (err, res) => {
      console.log(res.data.items);
    },
  );
}

export function AddEvent(auth, event) {
  const calendar = google.calendar('v3');
  const startTime = DateTime.fromISO(event.datetime).toISO();
  const endTime = DateTime.fromISO(event.datetime)
    .plus({ hours: 1 })
    .toISO();

  const attendees = config.team.emails.map(email => {
    return { email: email };
  });

  calendar.events.insert({
    auth,
    calendarId: 'primary',
    resource: {
      start: {
        dateTime: startTime,
      },
      end: {
        dateTime: endTime,
      },
      summary: `${config.team.name} Show: ${event.title}`,
      location: '1501 N Kingsbury St, Chicago, IL 60642',
      description: `${config.team.name} Show this night!`,
      attendees,
    },
  });
}

function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
