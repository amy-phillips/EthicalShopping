var gBestBuys={};
var gSubscription=null;
var gGoAwayUntil=null;

const GO_AWAY_MILLIS=60*60*1000; // go away for one hour if player clicks login later

// listen for requests from unicorn.js 
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request.command + (sender.tab ?
                    " from a content script:" + sender.tab.url :
                    " from the extension"));
        if(request.command == "get_bestbuys") {
            lookupGuides(sendResponse);
            return true; // response will be sent async
        } else if(request.command == "open_tab") {
            openTabToUrl(request.url);
            return true; // response will be sent async
        } else if(request.command == "go_away") {
            gGoAwayUntil=Date.now()+GO_AWAY_MILLIS;
            lookupGuides(sendResponse); // do another lookup, which will not contain the links to subscribe
            return true; // response will be sent async
        }
    }
);

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



function onFoodReceived(foods,sendResponse) {
    // do we have all the foods, if so send the response
    for (let food of foods) {
        if(gBestBuys[food]) {
            continue;
        }

        //console.log("Waiting for data for "+food);
        return;
    }

    // if player has aske us to leave them alone we don't send back a call to subscribe
    // however, we cache the real value(rather than sent back value) in case they subscribe in the meantime!
    var subscription_to_send=null;
    if((gGoAwayUntil==null) || (Date.now()>gGoAwayUntil)) {
        subscription_to_send=gSubscription;
    }

    console.log(gBestBuys);
    sendResponse({"bb":gBestBuys,"subscription":subscription_to_send});
}

function getBestBuys(foods, subscribe, sendResponse) {
    
    var sent_request=false;

    // are there any cached entries that we want to throw away?
    for (let food of foods) {
        if(gBestBuys[food]==null) {
            continue;
        }
        if(gBestBuys[food].error) {
            console.log("Will rerequest "+food+" because error");
            gBestBuys[food]=null;
            continue;
        }
        if(gSubscription!=subscribe) {
            console.log("Will rerequest "+food+" because subscription check change");
            gBestBuys[food]=null;
            continue;
        }
    }
    gSubscription=subscribe;
            
    for (let food of foods) {
        if( gBestBuys[food] ) {
            //console.log("Sending cached data for "+food);
            //console.log(gBestBuys[food]);
            continue;
        }

        sent_request=true;
        $.get("https://www.ethicalconsumer.org"+food,
        function(data,status) {
            //console.log(status);
            if(status=="success") {
                
                var food_title=null;
                var title = /<h1 class="title">\s*([\w\s\&]+?)\s*</.exec(data);
                if(title) {
                    food_title=title[1];
                }

                // parse out best buys - 
                // hmm bit fragile using this regex here, but regex rather than jquery on website means we don't have to load all the dependencies of the page
                // first grab all the <li> entries as a single string
                var bb_ul = /<ul class="links-list links-list-noicon two-columns">(\s*(?:<li>.*?<\/li>\s*)+)<\/ul>/.exec(data);
                //console.log(bb_ul);
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
                        
                        bestbuys.push({'title':m[1],'link':"https://www.ethicalconsumer.org"+food});
                    }

                    //console.log(bestbuys);
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
                    table_entries[rating].push({'title':m[1],'link':"https://www.ethicalconsumer.org"+food});
                }

                //console.log(table_entries);

                // cache results for later
                gBestBuys[food]={'bestbuys':bestbuys,'table':table_entries,'title':food_title};

                // send them back as reply if we have all of them
                onFoodReceived(foods,sendResponse);
            } else {
                gBestBuys[food] = {error:status, data:data};
                onFoodReceived(foods,sendResponse);
            }
        });
    }

    // if we're using entirely cached data, send our response - we have all we need
    if(!sent_request) {
        onFoodReceived(foods,sendResponse);
    }
}

function lookupGuides(sendResponse) {
    // never use cached data for the list of foods - we also use this request to check if the player is subscribed to EC 

    // which guides are available?
    $.get("https://www.ethicalconsumer.org/",
        function(data,status) {
            console.log(status);
            if(status=="success") {
                // is there a call to action to subscribe?
                var subscribe=null;
                var sub = /<button [\.\-"=\/\<>\w\s]*?value="Sign in ">Sign in[-"=\/\<>\w\s]*?<\/button>/.exec(data);
                if(sub) {
                    subscribe="https://www.ethicalconsumer.org/subscribe";
                }
                
                // parse out product guides
                var pg_ul = /<a class="more" href="\/food-drink">Read more about Food &amp; Drink<\/a>.*?<h4>Product Guides<\/h4>.*?<ul>(.*?)<\/ul>/gms.exec(data);
                //console.log(pg_ul);
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

                getBestBuys(foods, subscribe, sendResponse);
                
            } else {
                sendResponse({"error":status,"data":data});
            }
        });
}