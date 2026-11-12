const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/AVK97HXPV5E8Y';
const RELEASE_DATE_ISO = '2026-12-18T00:00:00+05:30';
const RAISED_LINE = 'Goal: $1. Raised so far: $0 — be the first.';

const releaseDate = new Date(RELEASE_DATE_ISO);
const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' };
const longDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(releaseDate);
const shortDate = new Intl.DateTimeFormat('en-US', { ...dateOptions, month: 'short' }).format(releaseDate);

document.querySelectorAll('[data-date-format]').forEach((element) => {
  const format = element.dataset.dateFormat;
  element.textContent = format === 'short' ? shortDate : format === 'upper' ? longDate.toUpperCase() : longDate;
  element.dateTime = RELEASE_DATE_ISO;
});
document.getElementById('goal-line').textContent = RAISED_LINE;
