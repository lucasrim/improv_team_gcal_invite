import fs from 'fs';
import puppeteer from 'puppeteer';
import { Authorize, ListEvents } from './googleAuth';

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
