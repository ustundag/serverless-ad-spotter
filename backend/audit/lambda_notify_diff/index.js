var AWS = require('aws-sdk');

exports.handler = async (event) => {
    const event_main = event.Records[0].body;
	if(typeof event_main == 'undefined' || event_main == {}){
		console.log("*** undefined body. return.");
		return;
	}
    const body = JSON.parse(event_main);
    const [ name, to, title ] = [body.Name, body.Email, body.Title];
    const from = "ustundaganil@gmail.com";
    const subject = "Yeni ilanların var!";
    const html = getHtmlContent(name, title, body.Diff);
    if (!to || !from || !subject) {
      console.log("*** to, from, subject are all required in the body");
      return;
    }
    const params = {
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Body: {
                Text: { Data: "" },
                Html: { Data: html }
            },
            Subject: { Data: subject },
        },
        Source: from,
    };
    await sendEmail(params);
    return;
};

function getHtmlContent(subscriptionName, subscriptionTitle, subscriptionDiff){
    const style = `<style>table {border-collapse: separate; border:none;} ` +
    `th {padding: 4px 10px; position: relative; border-bottom: solid 2px black;} ` +
    `@media screen and (max-width: 600px) { ` +
    `table {border: 0;} table caption {font-size: 1.3em;} ` +
    `table thead {border: none; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px;} ` +
    `table tr {border-bottom: 3px solid #ddd; display: block; margin-bottom: .625em;} ` +
    `table td {border-bottom: 1px solid #ddd; display: block; font-size: .8em; text-align: right;} ` +
    `table td::before {content: attr(data-label); float: left; font-weight: bold; text-transform: uppercase;} ` +
    `table td:last-child {border-bottom: 0;}} </style>`
    const head = `<head><title>Adspotter Notification</title>${style}</head>`

    const intro = `<div> Selam ${subscriptionName}! <br/><br/>` +
    `<b> ${subscriptionTitle} </b> başlıklı aramana ait <b> ${subscriptionDiff.length} yeni ilan </b> bulduk. ` +
    `İlanları aşağıdan inceleyebilirsin. Görüşmek üzere! </div><br/><br/>`

    const diffTableHead = `<table style='font-size:80%;'> <thead> <tr> ` +
        `<th> &nbsp; </th>` +
        `<th> İlan No </th>` +
        `<th> İlan Başlığı </th>` +
        `<th> Fiyat </th>` +
    `</tr> </thead> `

    let diffTableRows = ""
    subscriptionDiff.forEach(ad => {
        let tableRow = `<tr>` +
            `<td><a href="${ad.AdUrl}">` +
            `<img src="${ad.ImageUrl}" border=1 height=100 width=100></img>` +
            `</a></td>` +
            `<td style="padding:0 20px 0 20px;">${ad.AdNo}</td>` +
            `<td style="padding:0 20px 0 20px;">${ad.AdTtitle}</td>` +
            `<td style="padding:0 20px 0 20px;">${ad.Price} TL</td>` +
            `</tr>`
        diffTableRows = diffTableRows + tableRow;
    });

    const diffTable = `<table style='font-size:80%;'> ${diffTableHead} ` +
    `<tbody> ${diffTableRows} </tbody></table>`

    const footer = `<br/><br/><br/><hr>` +
    `<p style='font-size:80%'> Bu e-mail hatırlatma amaçlıdır. Lütfen cevaplamayınız. &#x2764;&#xfe0f; AdSpotter Ekibi </p>`

    const body = `<body> ${intro} ${diffTable} ${footer} </body>`
    return `<html> ${head} ${body} </html>`;
};

async function sendEmail(params){
    const AWS_ACCESS_KEY_ID = process.env['envAccessKeyId']
    const AWS_SECRET_ACCESS_KEY = process.env['envSecretAccessKey']
    const region = process.env['envRegion']
    AWS.config.update({
        region: region,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    const SES = new AWS.SES();
    var publishPromise = SES.sendEmail(params).promise();
    await publishPromise
    .then(function(data) { return; })
    .catch(function(err) { console.error(err, err.stack);});
}
