

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
        lookupGuides(sendResponse);
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
var gFoods=[];

function onFoodReceived(foods,sendResponse) {
    // do we have all the foods, if so send the response
    for (let food of foods) {
        if(gBestBuys[food]) {
            console.log("Sending cached data for "+food);
            console.log(gBestBuys[food]);
            continue;
        }

        console.log("Waiting for data for "+food);
        return;
    }

    sendResponse(gBestBuys);
}

function getBestBuys(foods, sendResponse) {
    for (let food of foods) {
        if(gBestBuys[food] && gBestBuys[food].error==null) {
            console.log("Sending cached data for "+food);
            console.log(gBestBuys[food]);
            onFoodReceived(foods,sendResponse); //do we have all the foods?
            continue;
        }

        gBestBuys[food]=null; // clear any old errors
        $.get("https://www.ethicalconsumer.org"+food,
        function(data,status) {
            console.log(status);
            if(status=="success") {
                // parse out best buys - 
                // hmm bit fragile using this regex here, but regex rather than jquery on website means we don't have to load all the dependencies of the page
                // first grab all the <li> entries as a single string
                var bb_ul = /<ul class="links-list links-list-noicon two-columns">(\s*(?:<li>.*?<\/li>\s*)+)<\/ul>/.exec(data);
                console.log(bb_ul);
                var bestbuys=[];
                if(bb_ul) {
                    // then split into each entry (can I do that in regex above? - can't figure it out so KISS)
                    var m;
                    const bb_regex = /<li>\s*<[^>]+>([^<]+)(?:<[^>]+>)*<\/li>/gm;
                    
                    while ((m = bb_regex.exec(bb_ul[1])) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === bb_regex.lastIndex) {
                            bb_regex.lastIndex++;
                        }
                        
                        bestbuys.push({'title':m[1],'blurb':m[0]});
                    }

                    console.log(bestbuys);
                } else {
                    console.error("Failed to parse bestbuys from https://www.ethicalconsumer.org"+food+" with regex - skipping");
                }
                
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

                // send them back as reply if we have all of them
                onFoodReceived(foods,sendResponse);
            } else {
                gBestBuys[food] = {error:status, data:data};
                onFoodReceived(foods,sendResponse);
            }
        });
    }
}

function lookupGuides(sendResponse) {
    if(gFoods.length > 0) {
        console.log("Using cached data for "+gFoods);
        getBestBuys(gFoods, sendResponse);
    }

    // which guides are available?
    $.get("https://www.ethicalconsumer.org/",
        function(data,status) {
            console.log(status);
            if(status=="success") {
                // parse out product guides
                var pg_ul = /<a class="more" href="\/food-drink">Read more about Food &amp; Drink<\/a>.*?<h4>Product Guides<\/h4>.*?<ul>(.*?)<\/ul>/gms.exec(data);
                console.log(pg_ul);
                // then split into each entry (can I do that in regex above? - can't figure it out so KISS)
                var m;
                const li_regex = /<a href="([^"]+)"/gm;
                var foods=[];
                while ((m = li_regex.exec(pg_ul[1])) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === li_regex.lastIndex) {
                        li_regex.lastIndex++;
                    }
                    
                    foods.push(m[1]);
                }

                // cache for later
                gFoods=foods;
                console.log(gFoods);

                getBestBuys(gFoods, sendResponse);
                
            } else {
                sendResponse({"error":status,"data":data});
            }
        });
}