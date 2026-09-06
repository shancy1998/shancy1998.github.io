const RECIPIENT_EMAIL = 'Shyams3946@gmail.com';
const SUCCESS_PAGE = 'https://shancy1998.github.io/quote-success.html';

function doGet() {
  return ContentService.createTextOutput('Quote endpoint is active.');
}

function doPost(event) {
  const data = event && event.parameter ? event.parameter : {};
  const name = data.name || 'Not provided';
  const phone = data.phone || 'Not provided';
  const email = data.email || 'Not provided';
  const property = data.property || 'Not provided';
  const service = data.service || 'Not provided';
  const message = data.message || 'Not provided';
  const callbackRequested = data.callback ? 'Yes' : 'No';

  const subject = 'New CCTV Quote Request - ' + service;
  const body = [
    'New quote request received from the website.',
    '',
    'Name: ' + name,
    'Phone: ' + phone,
    'Email: ' + email,
    'Property: ' + property,
    'Service: ' + service,
    'Callback requested: ' + callbackRequested,
    '',
    'Project details:',
    message
  ].join('\n');

  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    replyTo: email,
    subject: subject,
    body: body
  });

  return HtmlService.createHtmlOutput(
    '<script>window.top.location.href = ' + JSON.stringify(SUCCESS_PAGE) + ';</script>'
  );
}
