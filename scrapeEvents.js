import puppeteer from 'puppeteer';

export default async function FetchEvents(teamName) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://www.ioimprov.com/search/?q=${teamName}`);
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
