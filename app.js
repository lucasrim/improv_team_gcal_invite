import fs from 'fs';
import { Authorize, AddEvent } from './googleAuth';
import ScrapeEvents from './scrapeEvents';
import Playbook from './playbook';

Playbook.forEach(team => {
  ScrapeEvents(team.name).then(events => {
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }

      events.forEach(event => {
        Authorize(JSON.parse(content), AddEvent, event);
      });

      console.log(events);
      // Authorize a client with the loaded credentials, then call the
      // Google Calendar API.
    });
  });
});
