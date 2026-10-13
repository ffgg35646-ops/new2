import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { remote } from "webdriverio";

const baseUrl = (process.env.E2E_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/?directConnection=true";
const dbName = process.env.MONGODB_DB_NAME || "aqar_albatin_ios_e2e";
const mailpitUrl = process.env.MAILPIT_URL || "http://127.0.0.1:8025";
const runId = randomUUID().slice(0, 8);
const individualEmail = "ios-individual-" + runId + "@example.test";
const officeEmail = "ios-office-" + runId + "@example.test";
const password = "IosE2E-" + randomUUID() + "!";
const individualName = "اختبار فرد iOS " + runId;
const officeName = "مكتب اختبار iOS " + runId;
const firstRequestText = "اختبار طلب لعرض المكتب iOS " + runId + ": أبحث عن أرض سكنية";
const secondRequestText = "اختبار إنهاء الطلب iOS " + runId + ": أبحث عن شقة";
const propertyTitle = "عرض عقاري للاختبار iOS " + runId;

const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
await mongo.connect();
const db = mongo.db(dbName);
const users = db.collection("users");
const offices = db.collection("offices");
const requests = db.collection("property_requests");
const offers = db.collection("office_offers");
const properties = db.collection("properties");

await db.collection("governorates").updateOne(
  { id: "ios-e2e-governorate" },
  {
    $set: {
      id: "ios-e2e-governorate",
      name_ar: "محافظة الاختبار",
      code: "IOS_E2E",
      banner_url: null,
      is_active: true,
      sort_order: 1,
      updated_at: new Date(),
    },
    $setOnInsert: { created_at: new Date() },
  },
  { upsert: true },
);
await db.collection("neighborhoods").updateOne(
  { id: "ios-e2e-neighborhood" },
  {
    $set: {
      id: "ios-e2e-neighborhood",
      governorate_id: "ios-e2e-governorate",
      name_ar: "حي الاختبار",
      is_active: true,
      updated_at: new Date(),
    },
    $setOnInsert: { created_at: new Date() },
  },
  { upsert: true },
);

let driver;
let activeContext = "NATIVE_APP";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message) => console.log("[iOS-E2E] " + message);

async function bodyText() {
  return String(await driver.$("body").getText().catch(() => ""));
}
async function waitForText(text, timeout = 20000) {
  await driver.waitUntil(async () => (await bodyText()).includes(text), {
    timeout, interval: 500, timeoutMsg: "Expected page text: " + text,
  });
}
async function waitForUrl(part, timeout = 20000) {
  await driver.waitUntil(async () => String(await driver.getUrl()).includes(part), {
    timeout, interval: 300, timeoutMsg: "Expected URL to contain " + part + "; got " + await driver.getUrl(),
  });
}
async function connectWebView() {
  await driver.waitUntil(async () => {
    const contexts = await driver.getContexts();
    const context = contexts.find((item) => String(item).toLowerCase().includes("webview"));
    if (!context) return false;
    await driver.switchContext(context);
    activeContext = String(context);
    return true;
  }, {
    timeout: 90000, interval: 1000,
    timeoutMsg: "iOS WebView never became available to WebDriver",
  });
}
async function goto(path) {
  if (activeContext === "NATIVE_APP") await connectWebView();
  await driver.url(baseUrl + path);
  await waitForUrl(path.split("?")[0], 25000);
  await sleep(300);
}
async function fill(selector, value) {
  const element = await driver.$(selector);
  await element.waitForDisplayed({ timeout: 20000 });
  await element.setValue(String(value));
}
async function clickText(tag, text, exact = false) {
  const query = exact
    ? "//" + tag + "[normalize-space(.)=\"" + text + "\"]"
    : "//" + tag + "[contains(normalize-space(.), \"" + text + "\")]";
  const element = await driver.$(query);
  await element.waitForDisplayed({ timeout: 20000 });
  await element.click();
}
async function waitForCode(email) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const res = await fetch(mailpitUrl + "/api/v1/messages?limit=100");
    if (res.ok) {
      const list = await res.json();
      const message = (list.messages || []).find((item) =>
        (item.To || []).some((recipient) => String(recipient.Address || "").toLowerCase() === email.toLowerCase())
      );
      if (message && message.ID) {
        const detailRes = await fetch(mailpitUrl + "/api/v1/message/" + message.ID);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const html = typeof detail.HTML === "string" ? detail.HTML : "";
          const exact = html.match(/letter-spacing\s*:\s*10px[^>]*>(\d{6})<\/div>/i);
          const generic = [detail.Text, detail.Snippet, html].filter(Boolean).join(" ").match(/\b\d{6}\b/);
          const code = (exact && exact[1]) || (generic && generic[0]);
          if (code) return code;
        }
      }
    }
    await sleep(1000);
  }
  throw new Error("Verification email did not arrive in Mailpit for " + email);
}
async function registerAndVerify(role, email, name, isOffice = false) {
  await goto(role === "office" ? "/auth/office" : "/auth/individual");
  if (role === "individual") await clickText("button", "ليس لدي حساب");
  await fill('input[placeholder="مثال: محمد العتيبي"]', name);
  if (isOffice) {
    await fill('input[placeholder="مثال: مكتب عقار البطين"]', officeName);
    await fill('input[placeholder="رقم فال"]', "IOS-E2E-LICENSE-123");
    await fill('input[placeholder="10xxxxxxxx"]', "IOS-E2E-REG-123");
  }
  const govSelect = await driver.$("select");
  await govSelect.waitForDisplayed({ timeout: 20000 });
  await driver.waitUntil(async () => {
    const options = await govSelect.$("option");
    for (const option of options) {
      if ((await option.getAttribute("value")) === "ios-e2e-governorate") return true;
    }
    return false;
  }, { timeout: 15000, interval: 300, timeoutMsg: "Test governorate option did not load" });
  await govSelect.selectByAttribute("value", "ios-e2e-governorate");
  await (await driver.$('input[type="checkbox"]')).click();
  await fill('input[placeholder="you@example.com"]', email);
  await fill('input[type="password"]', password);
  await clickText("button", "إنشاء الحساب", true);
  await waitForUrl("/auth/verify-email", 30000);
  await waitForText(email, 10000);
  await fill('input[placeholder="123456"]', await waitForCode(email));
  await clickText("button", "تأكيد البريد الإلكتروني", true);
  await waitForUrl(role === "office" ? "/office/status" : "/home", 30000);
  const user = await users.findOne({ email });
  if (!user) throw new Error("Verified " + role + " user was not stored in MongoDB");
  log("Signup + OTP passed: " + role);
  return user;
}
async function signIn(role, email) {
  await goto(role === "office" ? "/auth/office" : "/auth/individual");
  if (role === "office") await clickText("button", "لدي حساب بالفعل");
  await fill('input[placeholder="you@example.com"]', email);
  await fill('input[type="password"]', password);
  await clickText("button", "تسجيل الدخول", true);
  await waitForUrl(role === "office" ? "/office" : "/home", 30000);
  log("Password login passed: " + role);
}
async function signOutFromUi(role) {
  const path = role === "office" ? "/office/profile" : "/account";
  await goto(path);
  await waitForText("تسجيل الخروج", 15000);
  await clickText("button", "تسجيل الخروج", true);
  await driver.waitUntil(async () => {
    const currentUrl = String(await driver.getUrl());
    const pathname = new URL(currentUrl).pathname;
    return pathname !== path && !(await bodyText()).includes("تسجيل الخروج");
  }, { timeout: 15000, interval: 300, timeoutMsg: "UI logout did not complete for " + role });
  log("UI logout passed: " + role);
}
async function createRequest(description) {
  await goto("/request");
  await fill("textarea", description);
  await clickText("button", "نشر الطلب", true);
  await waitForText("تم نشر طلبك", 20000);
  await driver.waitUntil(async () => !!(await requests.findOne({ description })), {
    timeout: 15000, interval: 500, timeoutMsg: "Request was not persisted",
  });
  const record = await requests.findOne({ description });
  if (!record) throw new Error("Created request not found");
  log("Request created");
  return record;
}
async function endRequest(record) {
  await goto("/requests?tab=sent");
  const card = await driver.$("#request-card-" + record.id);
  await card.waitForDisplayed({ timeout: 20000 });
  await card.$("button").click();
  await clickText("button", "تأكيد إنهاء الطلب", true);
  await driver.waitUntil(async () => {
    const updated = await requests.findOne({ id: record.id });
    return updated && ["ended", "cancelled", "fulfilled", "completed"].includes(String(updated.status));
  }, { timeout: 20000, interval: 500, timeoutMsg: "Request status did not change after ending it" });
  log("End-request flow passed");
}
async function sendOffer(requestRecord) {
  await goto("/office/requests?tab=market");
  await waitForText("عرض بيانات الطلب", 20000);

  // The market card intentionally hides the description. Open each visible detail
  // sheet and select the request by its unique test description.
  let matchingRequestOpened = false;
  for (let index = 0; index < 40; index++) {
    const detailButtons = await driver.$('//button[normalize-space(.)="عرض بيانات الطلب"]');
    if (index >= detailButtons.length) break;
    await detailButtons[index].click();

    const details = await driver.$('[role="dialog"][aria-label="تفاصيل طلب العميل"]');
    await details.waitForDisplayed({ timeout: 10000 });
    const detailsText = await details.getText();

    if (detailsText.includes(firstRequestText)) {
      const acceptOfferButton = await details.$('.//button[normalize-space(.)="قبول العرض"]');
      await acceptOfferButton.waitForDisplayed({ timeout: 10000 });
      await acceptOfferButton.click();
      matchingRequestOpened = true;
      break;
    }

    await details.$('button[aria-label="إغلاق"]').click();
    await sleep(300);
  }

  if (!matchingRequestOpened) {
    throw new Error("Could not find the unique test request in the office market cards");
  }

  await waitForText("ما السبب الذي يجعل العميل يختارك؟", 10000);
  await fill("textarea", "عرض اختبار آيفون من " + officeName + "؛ تم إرساله من محاكي iOS.");
  await fill('input[placeholder="السعر المقترح (اختياري)"]', "125000");
  await clickText("button", "تأكيد وإرسال العرض", true);
  await waitForText("تم إرسال عرضك للعميل", 20000);
  await driver.waitUntil(async () => !!(await offers.findOne({ request_id: requestRecord.id })), {
    timeout: 15000, interval: 500, timeoutMsg: "Offer was not persisted",
  });
  const offer = await offers.findOne({ request_id: requestRecord.id });
  if (!offer) throw new Error("Sent offer not found");
  log("Office offer submission passed");
  return offer;
}
async function acceptOffer(offer) {
  await goto("/requests?tab=sent");
  const card = await driver.$("#offer-card-" + offer.id);
  await card.waitForDisplayed({ timeout: 25000 });
  await card.$('.//button[contains(normalize-space(.), "قبول العرض")]').click();
  await driver.waitUntil(async () => {
    const updated = await offers.findOne({ id: offer.id });
    return updated && ["accepted", "completed", "awaiting_confirmation"].includes(String(updated.status));
  }, { timeout: 20000, interval: 500, timeoutMsg: "Offer status did not change after acceptance" });
  log("Individual accepted the office offer");
}
async function createAndDeleteProperty() {
  await goto("/office/properties/new");
  await fill('input[placeholder="أرض سكنية بحي الروضة"]', propertyTitle);
  await fill('input[placeholder="المزاحمية"]', "محافظة الاختبار");
  await fill('input[placeholder="حي الروضة"]', "حي الاختبار");
  const numeric = await driver.$$('input[type="number"]');
  if (numeric.length < 2) throw new Error("Missing property price/area fields");
  await numeric[0].setValue("125000");
  await numeric[1].setValue("400");
  await clickText("button", "نشر العرض", true);
  await waitForText("تم نشر العرض بنجاح", 20000);
  await driver.waitUntil(async () => !!(await properties.findOne({ title: propertyTitle })), {
    timeout: 15000, interval: 500, timeoutMsg: "Published property was not persisted",
  });
  const property = await properties.findOne({ title: propertyTitle });
  if (!property) throw new Error("Published property not found");
  log("Property publishing passed");

  await goto("/office/properties");
  const menu = await driver.$('button[aria-label="خيارات العقار: ' + propertyTitle + '"]');
  await menu.waitForDisplayed({ timeout: 20000 });
  await menu.click();
  const deleteItem = await driver.$('//div[@role="menuitem"][contains(normalize-space(.), "حذف العقار")]');
  await deleteItem.waitForDisplayed({ timeout: 10000 });
  await deleteItem.click();
  await waitForText("تأكيد حذف العقار");
  await clickText("button", "نعم، احذف العقار", true);
  await driver.waitUntil(async () => {
    const updated = await properties.findOne({ id: property.id });
    return updated && updated.is_deleted === true;
  }, { timeout: 20000, interval: 500, timeoutMsg: "Property was not soft-deleted" });
  log("Property delete flow passed");
}

let failed = false;
try {
  driver = await remote({
    hostname: "127.0.0.1", port: 4723, path: "/", logLevel: "warn",
    // XCUITest may need several minutes to compile and launch WDA on a fresh macOS runner.
    // Do not let WebdriverIO retry POST /session while the original session is still building WDA.
    connectionRetryTimeout: 360000,
    connectionRetryCount: 0,
    capabilities: {
      platformName: "iOS",
      "appium:platformVersion": "18.5",
      "appium:automationName": "XCUITest",
      "appium:deviceName": process.env.IOS_DEVICE_NAME || "iPhone 16",
      "appium:udid": process.env.IOS_SIMULATOR_UDID,
      "appium:bundleId": "cloud.baytialkhass.app",
      // The Web Inspector reports this page under a process-* bundle identifier.
      "appium:additionalWebviewBundleIds": ["*"],
      // WDA is prebuilt in the workflow to avoid a stalled xcodebuild launch.
      "appium:usePreinstalledWDA": true,
      "appium:prebuiltWDAPath": process.env.WDA_APP_PATH || "/tmp/aqar-wda-derived/Build/Products/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app",
      "appium:noReset": false,
      "appium:newCommandTimeout": 300,
      "appium:autoAcceptAlerts": true,
      "appium:webviewConnectTimeout": 45000,
      "appium:wdaLaunchTimeout": 240000,
      "appium:wdaConnectionTimeout": 240000,
      "appium:wdaStartupRetries": 1,
      "appium:wdaStartupRetryInterval": 10000,
      "appium:showXcodeLog": true,
    },
  });
  await connectWebView();
  await driver.waitUntil(async () => (await bodyText()).includes("عقار البطين"), {
    timeout: 45000, interval: 500, timeoutMsg: "App did not load on iPhone simulator",
  });
  log("Capacitor app opened on iPhone simulator");

  const individual = await registerAndVerify("individual", individualEmail, individualName);
  // OTP confirmation creates an authenticated session; log out before proving password login.
  await signOutFromUi("individual");
  await signIn("individual", individualEmail);
  const offerRequest = await createRequest(firstRequestText);
  const requestToEnd = await createRequest(secondRequestText);
  await endRequest(requestToEnd);
  await signOutFromUi("individual");

  const office = await registerAndVerify("office", officeEmail, "مدير " + runId, true);
  // Approval is test setup in the isolated Mongo database only. Sign out before
  // approval and then log back in, so the office role/status is reloaded normally.
  await signOutFromUi("office");
  await offices.updateOne(
    { owner_id: office._id, is_deleted: { $ne: true } },
    { $set: { verification_status: "verified", updated_at: new Date() } },
  );
  const officeDoc = await offices.findOne({ owner_id: office._id, is_deleted: { $ne: true } });
  if (!officeDoc) throw new Error("Office profile missing after signup");
  if (officeDoc.governorate_id !== "ios-e2e-governorate") throw new Error("Office governorate did not persist");
  await signIn("office", officeEmail);

  const offer = await sendOffer(offerRequest);
  await createAndDeleteProperty();
  await signOutFromUi("office");
  await signIn("individual", individualEmail);
  await acceptOffer(offer);

  const finalOffer = await offers.findOne({ id: offer.id });
  const finalRequest = await requests.findOne({ id: offerRequest.id });
  if (!finalOffer || !["accepted", "completed", "awaiting_confirmation"].includes(String(finalOffer.status))) {
    throw new Error("Accepted offer status was not saved");
  }
  if (!finalRequest) throw new Error("Customer request disappeared during offer flow");

  log("PASS: signup/OTP/login for individual + office, create/end request, send/accept offer, publish/delete property");
  console.log(JSON.stringify({
    result: "PASS",
    simulator: process.env.IOS_DEVICE_NAME || "iPhone 16",
    individualEmail,
    officeEmail,
    offerStatus: finalOffer.status,
    requestStatus: finalRequest.status,
    propertyDeleted: true,
  }, null, 2));
} catch (error) {
  failed = true;
  console.error("[iOS-E2E] FAIL", error);
  if (driver) {
    try { await driver.saveScreenshot("/tmp/aqar-ios-e2e-failure.png"); } catch {}
    try { console.error("[iOS-E2E] URL:", await driver.getUrl()); } catch {}
    try { console.error("[iOS-E2E] PAGE:", (await bodyText()).slice(0, 4000)); } catch {}
  }
} finally {
  if (driver) await driver.deleteSession().catch(() => {});
  await mongo.close().catch(() => {});
}
if (failed) process.exit(1);
