#!/usr/bin/env node
const puppeteer = require("puppeteer");
const inquirer = require("inquirer");
const chalk = require("chalk");
const boxen = require("boxen");
const Table = require("cli-table");

const guerrillamail_url = "https://www.guerrillamail.com/en";
const proton_url = "https://account.protonvpn.com/signup";

let options = {
  confirmation: {
    type: "confirm",
    name: "confirmation",
    message: "Generate a new ProtonVPN account?",
  },
};

const { version } = require("./../package.json");
console.log(
  boxen("blockiller (ProtonVPN) Creds Generator", {
    padding: 1,
    margin: 1,
    borderStyle: "double",
  })
);
console.log(chalk.bold("Originally coded by " + chalk.magenta("leandev")));
console.log(chalk.bold("Edits by " + chalk.magenta("frostech")));
console.log(
  chalk.bold(
    chalk.red(
      "This is an unofficial tool and is not affiliated with Proton Technologies AG\n"
    )
  )
);

const getAuthCode = () => {
  const all_emails = Array.from(
    document.querySelector("#email_list").querySelectorAll("tr")
  );
  for (const email of all_emails) {
    const body = email.querySelector(".email-excerpt").innerText;
    if (body.includes("Your Proton verification code is: ")) {
      return body.replace("Your Proton verification code is: ", "");
    } else {
      return false;
    }
  }
};

const createRandomString = (length) => {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

async function createAccount() {
  let user = createRandomString(32);
  let pasw = createRandomString(32);

  const browser = await puppeteer.launch({
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false,
  });

  await console.log(
    chalk.bold(chalk.cyan("i ") + "Generation process is a go...")
  );

  const page_guerrillamail = await browser.newPage();

  await page_guerrillamail.goto(guerrillamail_url);
  await page_guerrillamail.click("#use-alias");

  await page_guerrillamail.waitForSelector("#email-widget");
  const mail = await page_guerrillamail.evaluate(
    () => document.querySelector("#email-widget").innerText
  );
  const page_proton = await browser.newPage();
  await page_proton.goto(proton_url);

  await page_proton
    .waitForSelector(
      "body > div.app-root > div.flex-no-min-children.flex-nowrap.flex-column.h100.sign-layout-bg.scroll-if-needed.relative > div.sign-layout-container.flex-item-fluid-auto.flex.flex-nowrap.flex-column.flex-justify-space-between > div > main > div.sign-layout-main-content > form > button",
      { visible: true }
    )
    .then(() => {})
    .catch((e) => {
      console.log(chalk.bold(chalk.red("X ") + "Selector error"));
      browser.close();
    });

  await console.log(
    chalk.bold(
      chalk.cyan("i ") +
        "Supplying credentials... (if this throws an error, terminate runtime and try again)"
    )
  );
  await page_proton.waitForSelector("#email");
  const username_element = await page_proton.$("#email");
  const email_element = await page_proton.$("#recovery-email");

  await username_element.type(user, { delay: 300 });
  await page_proton.type("#password", pasw);
  await page_proton.type("#repeat-password", pasw);
  await email_element.type(mail, { delay: 300 });

  // Click "Create"
  await page_proton.click(
    "body > div.app-root > div.flex-no-min-children.flex-nowrap.flex-column.h100.sign-layout-bg.scroll-if-needed.relative > div.sign-layout-container.flex-item-fluid-auto.flex.flex-nowrap.flex-column.flex-justify-space-between > div > main > div.sign-layout-main-content > form > button"
  );

  // Wait for "Continue with free"
  await page_proton
    .waitForSelector(
      "body > div.app-root > div.flex-no-min-children.flex-nowrap.flex-column.h100.sign-layout-bg.scroll-if-needed.relative > div > div > div > main.ui-standard.w100.relative.sign-layout.shadow-lifted.on-tiny-mobile-no-box-shadow.mw30r.on-tablet-mb2 > div.sign-layout-main-content > div.mt1.mb2 > button"
    )
    .catch((e) => {
      console.log(chalk.bold(chalk.red("X ") + "Selector error"));
      browser.close();
    });

  // Click "Continue with free"
  await page_proton.click(
    "body > div.app-root > div.flex-no-min-children.flex-nowrap.flex-column.h100.sign-layout-bg.scroll-if-needed.relative > div > div > div > main.ui-standard.w100.relative.sign-layout.shadow-lifted.on-tiny-mobile-no-box-shadow.mw30r.on-tablet-mb2 > div.sign-layout-main-content > div.mt1.mb2 > button"
  );

  // Wait for "Email" tab
  await page_proton.waitForSelector("#label_1").catch((e) => {
    console.log(chalk.bold(chalk.red("X ") + "Selector error"));
    browser.close();
  });

  // Click "Email" tab
  await page_proton.click("#label_1");

  // Wait for "Get verification code" button
  await page_proton.waitForSelector("#key_1 > button").catch((e) => {
    console.log(chalk.bold(chalk.red("X ") + "Selector error"));
    browser.close();
  });

  // Click "Get verification code" button
  await page_proton.click("#key_1 > button");

  // Account created!

  await console.log(chalk.bold(chalk.green("? ") + "Credentials supplied."));
  await console.log(
    chalk.bold(
      chalk.cyan("i ") +
        "Waiting for verification email... (this will take some time, please be patient!)"
    )
  );
  await page_guerrillamail.bringToFront();

  await page_guerrillamail.setDefaultTimeout(1000000);

  await page_guerrillamail.waitForFunction(getAuthCode);

  const auth_code = await page_guerrillamail.evaluate(getAuthCode);
  await console.log(
    chalk.bold(chalk.green("? ") + "Verification email recieved.")
  );
  await page_proton.bringToFront();

  await page_proton.type("#verification", auth_code);
  await page_proton.click(
    "body > div.app-root > div.flex-no-min-children.flex-nowrap.flex-column.h100.sign-layout-bg.scroll-if-needed.relative > div > div > main > div.sign-layout-main-content > button.button.button-large.button-solid-norm.w100.mt1-75"
  );

  let table = await new Table({
    head: [
      chalk.green("ProtonVPN Username"),
      chalk.green("ProtonVPN Password"),
      chalk.green("ProtonVPN Email"),
    ],
    chars: {
      top: "-",
      "top-mid": "-",
      "top-left": "+",
      "top-right": "+",
      bottom: "-",
      "bottom-mid": "-",
      "bottom-left": "+",
      "bottom-right": "+",
      left: "ý",
      "left-mid": "ý",
      mid: "-",
      "mid-mid": "+",
      right: "ý",
      "right-mid": "ý",
      middle: "ý",
    },
  });

  await table.push([user, pasw, mail]);

  console.log(chalk.bold(chalk.green("? ") + "Account generated!"));
  console.log(table.toString());
  console.log(chalk.bold(chalk.cyan("i ") + "Grabbing OpenVPN details..."));
  await page_proton.waitForSelector(
    "body > div.app-root > div.content-container.flex.flex-column.flex-nowrap.no-scroll > div > div > div.main.ui-standard.flex.flex-column.flex-nowrap.flex-item-fluid > main > div > h1"
  );
  await page_proton.goto("https://account.protonvpn.com/account");
  await page_proton.waitForSelector(
    "body > div.app-root > div.content-container.flex.flex-column.flex-nowrap.no-scroll > div > div > div.main.ui-standard.flex.flex-column.flex-nowrap.flex-item-fluid > main > div > section:nth-child(9) > div > div:nth-child(4) > div.settings-layout-right.flex.flex-align-items-center > div.flex.flex-item-noshrink.on-mobile-mt0-5 > button:nth-child(2)"
  );
  await page_proton.click(
    "body > div.app-root > div.content-container.flex.flex-column.flex-nowrap.no-scroll > div > div > div.main.ui-standard.flex.flex-column.flex-nowrap.flex-item-fluid > main > div > section:nth-child(9) > div > div:nth-child(4) > div.settings-layout-right.flex.flex-align-items-center > div.flex.flex-item-noshrink.on-mobile-mt0-5 > button:nth-child(2)"
  );
  setTimeout(async () => {
    const ovpnusr = await page_proton.evaluate(
      () =>
        document.querySelector(
          "body > div.app-root > div.content-container.flex.flex-column.flex-nowrap.no-scroll > div > div > div.main.ui-standard.flex.flex-column.flex-nowrap.flex-item-fluid > main > div > section:nth-child(9) > div > div:nth-child(3) > div.settings-layout-right.flex.flex-align-items-center > div.text-ellipsis.max-w100.mr1.on-mobile-mr0 > code"
        ).innerText
    );
    const ovpnpsw = await page_proton.evaluate(
      () =>
        document.querySelector(
          "body > div.app-root > div.content-container.flex.flex-column.flex-nowrap.no-scroll > div > div > div.main.ui-standard.flex.flex-column.flex-nowrap.flex-item-fluid > main > div > section:nth-child(9) > div > div:nth-child(4) > div.settings-layout-right.flex.flex-align-items-center > div.text-ellipsis.max-w100.mr1.on-mobile-mr0 > code"
        ).innerText
    );

    console.log(
      chalk.bold(chalk.red("! ") + "blockiller Username: " + ovpnusr)
    );
    console.log(
      chalk.bold(chalk.red("! ") + "blockiller Password: " + ovpnpsw)
    );
  }, 5000);

  console.log(chalk.bold(chalk.green("? ") + "LETS FREAKING GOOOO, done"));
  setTimeout(async () => {
    await browser.close();
    await console.log(chalk.bold(chalk.cyan("i ") + "Exiting..."));
    await process.exit();
  }, 2000);
}

createAccount();
