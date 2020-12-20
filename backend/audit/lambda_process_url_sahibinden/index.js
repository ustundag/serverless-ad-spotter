const AWS = require('aws-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = (event) => {
    const subscription = event.Records[0].body;
	if(typeof subscription == 'undefined' || subscription.length <= 0){
		console.log("*** undefined subscription. return.");
		return;
	}
	getTodaysAdsAndSendSQS(JSON.parse(subscription));
}

async function getTodaysAdsAndSendSQS(subscription) {
    const url_given = new URL(subscription.Url);
    const encoded_url = escape(url_given.href);
    const cookie = `MS1=https://secure.sahibinden.com/giris/?return_url=${encoded_url}; vid=695; cdid=9W6qxwbMCJtHVHLc5f888f6b; nwsh=std; showPremiumBanner=false; st=b2a76c4efd13141eda672df769200bab5b34e398a02e35c0e5454f3d3316b45b786f5ba1a9ff5c7223197a6a6b2518c2f7911d00dd420611c; rememberedUserName=kullanici20805807; xsrf-token=6b6900daba5770396cfa9dd5e8f5cea732e0f78a; acc_type=bireysel_uye; kno=a4abEH03lba7JyrDAuAsLKQ; gcd=20201018132857; MDR=20201018; userType=yeni_bireysel; shuid=cvouHgnCSwn1rHvg1hHYrsQ; dopingPurchase=false; geoipCity=frankfurt; getPurchase=false`
    const axiosConfig = {
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:81.0) Gecko/20100101 Firefox/81.0',
            'Cookie': cookie,
            'Host': url_given.hostname,
            'Referer': url_given.href
        }
    };
    return await axios.get(url_given.href, axiosConfig)
    .then(response => {
        if (response.status == 200) {
            var today = getToday();
            let adList = parseHTML(response.data, today, subscription.Id);
            subscription["AdList"] = adList;
            return sqsSendMessage(subscription);
        }
        else {
            console.log("*** response.status: ", response.status);
            return;
        }
    })
    .catch(error => {
        console.log("*** ", error.response)
        return;
    });
}

function parseHTML(html, today, subscriptionId){
    const page_default_size = 20
    var todaysAds = [];
    const $ = cheerio.load(html.toString());
    const items = $('.searchResultsItem');
    if (items.length > 0) {
        items.each(function(i, el){
            const ad_date = $(el).find('.searchResultsDateValue').find('span').text().replace(/\s/g, '');
            // TODO add comparison with Date(), this way is not appropriate, may create bugs!
            //if (!ad_date.includes(today)) { console.log(`ad_date: ${ad_date} is not today. ending iteration...`); return; }
            if (typeof ad_date === undefined || ad_date == '') { return; }
            // console.log(`today:${today} - ad_date: ${ad_date} - typeof ad_date: ${typeof ad_date}`)
            if (ad_date !== today) { 
                //console.log(`ad_date: ${ad_date} is not today. ending iteration...`); 
                return false; 
            }
            let singleAd = {
                AdNo: "",
                AdTtitle: "",
                SubscriptionId: subscriptionId,
                ImageUrl: "",
                Price: 0,
                AdUrl: ""
            };
            const ad_no = $(el).attr('data-id');
            if (typeof ad_no === undefined || ad_no == '') { return; }
            const a_element_first = $(el).find('.searchResultsTitleValue > a[href]').first();
            const ad_url = "https://www.sahibinden.com" + $(a_element_first).attr('href').toString();
            const ad_title = $(a_element_first).attr('title').toString();
            // TODO const ad_title = $(a_element_first).attr('title').toString().toLowerCase();
            const ad_image_url = $(el).find('.searchResultsLargeThumbnail').find('img').attr('src');
            const ad_price = $(el).find('.searchResultsPriceValue').find('div').text().match(/([0-9]*)/g).toString().replace(/[,*|]/g, "")
            singleAd.AdNo = ad_no;
            singleAd.AdTtitle = ad_title;
            singleAd.ImageUrl = ad_image_url;
            singleAd.Price = ad_price;
            singleAd.AdUrl = ad_url;
            todaysAds.push(singleAd);
        });
    }
    return todaysAds;
}

async function sqsSendMessage(event){
    const AWS_ACCESS_KEY_ID = process.env['envAccessKeyId']
    const AWS_SECRET_ACCESS_KEY = process.env['envSecretAccessKey']
    const region = process.env['envRegion']
    AWS.config.update({
      region: region,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    const sqs_queue = process.env['envSqsDailyAds']
    var params = {
  		MessageBody: JSON.stringify(event),
  		QueueUrl: sqs_queue
	};
	var sqs = new AWS.SQS();
	return await sqs.sendMessage(params, function(err, data) {
		if (err) console.log(err, err.stack);
	});
}

function getToday(){
	var aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
	var today = new Date();
	// today.setDate(today.getDate() - 1);
	var yyyy = today.getFullYear().toString();
	var mm = aylar[today.getMonth()].toString();
	var dd = today.getDate().toString();
	return dd + mm + yyyy;
}