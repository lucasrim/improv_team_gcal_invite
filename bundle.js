'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var readline = _interopDefault(require('readline'));
var googleapis = require('googleapis');
var googleAuthLibrary = require('google-auth-library');
var puppeteer = _interopDefault(require('puppeteer'));

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

function Authorize(credentials, callback) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new googleAuthLibrary.GoogleAuth();
  const oauth2Client = new googleAuthLibrary.OAuth2Client(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function ListEvents(auth) {
  const calendar = googleapis.google.calendar('v3');
  calendar.events.list(
    {
      auth: auth,
      calendarId: 'primary',
    },
    (err, res) => {
      console.log(res);
    },
  );
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

async function fetchEvents() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.ioimprov.com/search/?q=bad-bear');
  await page.waitFor(2000);

  const results = await page.evaluate(() => {
    const events = [];
    const listItems = [...document.querySelectorAll('.list-view-item')];

    const getInnerText = (node, selector) => {
      return node.querySelector(selector).innerText.trim();
    };

    listItems.forEach(listItem => {
      events.push(
        Object.assign(
          {
            date: getInnerText(listItem, '.dates'),
            time: getInnerText(listItem, '.times'),
            showTitle: getInnerText(listItem, '.headliners'),
          },
          {},
        ),
      );
    });

    return events;
  });
  browser.close();
  return results;
}

fetchEvents().then(events => {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    Authorize(JSON.parse(content), ListEvents);
  });
  console.log(events);
});
