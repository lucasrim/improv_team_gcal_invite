import fs from 'fs';
import { Authorize, ListEvents } from './googleAuth';
import ScrapeEvents from './scrapeEvents';
import Playbook from './playbook';

Playbook.forEach(team => {
  ScrapeEvents(team.name).then(events => {
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
});
