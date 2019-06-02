

// listen for requests from unicorn.js 
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.command + (sender.tab ?
                " from a content script:" + sender.tab.url :
                " from the extension"));
  if (request.command == "open_tab") {
        openTabToUrl(request.url).then(sendResponse);
        return true; // response will be sent async
    } else if(request.command == "get_bestbuys") {
        getBestBuys(request.food,sendResponse);
        return true; // response will be sent async
    }
});

function openTabToUrl(_url) {

    chrome.tabs.query({ url: _url }, function (tabs) {
        for (var i = 0; i<tabs.length; i++) {
            tab = tabs[i];
            if (tab.url && tab.url == _url) {
                chrome.tabs.update(tab.id, { selected: true });
                return;
            }
        }
        chrome.tabs.create({ url: _url });
    });
}

var gBestBuys={};

function getBestBuys(food, sendResponse) {
    if(gBestBuys[food]) {
        console.log("Sending cached data for "+food);
        console.log(gBestBuys[food]);
        sendResponse(gBestBuys[food]);
        return;
    }

    $.get("https://www.ethicalconsumer.org/food-drink/shopping-guide/"+food,
        function(data,status) {
            console.log(status);
            if(status=="success") {
                // parse out best buys - 
                // hmm bit fragile using this regex here, but regex rather than jquery on website means we don't have to load all the dependencies of the page
                // first grab all the <li> entries as a single string
                var bb_ul = /<ul class="links-list links-list-noicon two-columns">(\s*(?:<li>.*?<\/li>\s*)+)<\/ul>/.exec(data);
                console.log(bb_ul);
                // then split into each entry (can I do that in regex above? - can't figure it out so KISS)
                var m;
                const bb_regex = /<li>\s*<[^>]+>([^<]+)(?:<[^>]+>)*<\/li>/gm;
                var bestbuys=[];
                while ((m = bb_regex.exec(bb_ul[1])) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === bb_regex.lastIndex) {
                        bb_regex.lastIndex++;
                    }
                    
                    bestbuys.push({'title':m[1],'blurb':m[0]});
                }

                console.log(bestbuys);

                // now parse the score table
                var table = /<table class="table"(.*?)<\/table>/gms.exec(data);
                const te_regex = /<h4>([^<]*)<\/h4>(?:.*?)+?<div class="score (\w+)">(?:.*?)+?/gms;
                var table_entries={'good':[],'average':[],'bad':[]};
                while ((m = te_regex.exec(table[1])) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === te_regex.lastIndex) {
                        te_regex.lastIndex++;
                    }

                    var rating=m[2];
                    table_entries[rating].push({'title':m[1],'blurb':'todo'});
                }

                console.log(table_entries);

                // cache results for later
                gBestBuys[food]={'bestbuys':bestbuys,'table':table_entries};

                // send them back as reply
                sendResponse(gBestBuys[food])
            } else {
                sendResponse({error:status, data:data});
            }
        })

}