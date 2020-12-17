const AWS = require('aws-sdk');
const axios = require('axios');
// https://nodejs.org/api/url.html#url_url_searchparams
const url_lib = require('url');

exports.handler = async (event, context, callback) => {
	const subscription = JSON.parse(event.body);
	const countKeysInUserObject = Object.keys(subscription).length;
	
	console.log(`subscription -> ${JSON.stringify(subscription)}`)
    
	if(typeof subscription == 'undefined' || countKeysInUserObject != 6){
		console.log("*** undefined subscription request. return.");
        const response = getResponse(400, "Gönderilen bilgiler eksik ya da uygun değil. Lütfen bir süre sonra tekrar deneyiniz.", subscription)
        return callback(null, response);
    }
    if(!isValidURL(subscription.Url)){
        const response =  getResponse(400, "Belirtilen URL standartlara uygun değil. Lütfen kontrol ediniz.", subscription)
        return callback(null, response);
    }
    if(subscription.NotificationType == 1){
        await verifyEmail(subscription.Email);
    }
    const url_obj = new URL(subscription.Url);
    if(url_obj.hostname.includes("www.")){
        subscription.Hostname = url_obj.hostname.substring(4, url_obj.hostname.length)
    }
    const url_custom = getCustomizedUrl(url_obj);
    subscription.Url = url_custom;
    const response = await sqsSendMessage(subscription);
    return callback(null, response);
}

function getCustomizedUrl(url_obj){
    // sorting=date_desc -> yoksa ekle.
    // pagingOffset=40   -> varsa sil, ilk sayfaya gitsin.
    // pagingSize=50     -> yoksa eklenebilir, sonraki sayfalara request sayısını azaltmak için.
    url_obj.searchParams.delete("pagingOffset");
    url_obj.searchParams.set("sorting", "date_desc");
    let pathVariables = url_obj.pathname.split('/');
    let lastPath = pathVariables.pop();
    if(lastPath === 'sahibinden' || lastPath === "emlak-ofisinden"){
        url_obj.pathname = pathVariables.join('/');
    }
    else{
        url_obj.pathname = pathVariables.join('/') +'/'+ lastPath;
    }
    return url_obj.href;
}

function isValidURL(url) {
  var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return urlregex.test(url);
}

async function sqsSendMessage(subscription){
    const region = process.env['envRegion'];
    const AWS_ACCESS_KEY_ID = process.env['envAccessKeyId'];
    const AWS_SECRET_ACCESS_KEY = process.env['envSecretAccessKey'];
    AWS.config.update({
        region: region,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    const sqs_queue = process.env['envSqsInsertSubscription'];
    var params = {
  		MessageBody: JSON.stringify(subscription),
  		QueueUrl: sqs_queue
	};
    let response = getResponse(200, "İlan takip isteğiniz alınmıştır.", subscription)
	var sqs = new AWS.SQS();
    await sqs.sendMessage(params).promise().then(
        function(data) { console.log("*** sqs message sent!"); },
	    function(error) {
            console.log("*** error -> ", error);
            response = getResponse(500, "Bir hatayla karşılaştık. Lütfen bir süre sonra tekrar deneyiniz.", subscription)
	    });
  	return response;
}

async function verifyEmail(email){
    const params = { EmailAddress: email };
    const SES = new AWS.SES();
    var publishPromise = SES.verifyEmailIdentity(params).promise();
    await publishPromise.then(
    function(data) {
      return;
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });
}

function getResponse(statusCode, message, subscription){
	const body = {
        userId: subscription.UserId,
		message: message,
		url: subscription.Url
	}
	return {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : '*',
			'Access-Control-Allow-Methods': '*'
		},
		statusCode: statusCode,
        body: JSON.stringify(body),
        isBase64Encoded: false
	}
}