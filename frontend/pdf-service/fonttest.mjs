import puppeteer from "puppeteer";
import path from "node:path";
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.goto("file://" + path.resolve("fonttest.html"));
const fonts = await page.evaluate(() => {
  const el = document.querySelector(".lbl");
  const cs = getComputedStyle(el);
  const width = el.getBoundingClientRect().width;
  return { fontFamily: cs.fontFamily, fontSize: cs.fontSize, labelWidthPx: width };
});
console.log(JSON.stringify(fonts, null, 2));
await page.pdf({ path: "fonttest.pdf", format: "A4", printBackground: true });
await browser.close();
console.log("wrote fonttest.pdf");
