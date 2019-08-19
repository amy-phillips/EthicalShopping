var gScoreTables={};
var gSubscription=null;
var gGoAwayUntil=null;

const GO_AWAY_MILLIS=60*60*1000; // go away for one hour if player clicks login later

// listen for requests from unicorn.js 
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request.command + (sender.tab ?
                    " from a content script:" + sender.tab.url :
                    " from the extension"));
        if(request.command == "get_score_tables") {
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

function unescape(string) {
    return new DOMParser().parseFromString(string,'text/html').querySelector('html').textContent;
  }

function onFoodReceived(foods,sendResponse) {
    // do we have all the foods, if so send the response
    for (let food of foods) {
        if(gScoreTables[food]) {
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

    set_done_icon();
    console.log(gScoreTables);
    sendResponse({"scores":gScoreTables,"subscription":subscription_to_send});
}

function fixup_overly_short_titles(title) {
    if(title=="Crunchie") {
        return "Cadbury's Crunchie"; 
    } else if(title=="Double Decker") {
        return "Cadbury's Double Decker"; 
    } else if(title=="Eclairs") {
        return "Cadbury's Eclairs"; 
    } else if(title=="Flake") {
        return "Cadbury's Flake"; 
    } else if(title=="Fudge") {
        return "Cadbury's Fudge"; 
    } else if(title=="Heroes") {
        return "Cadbury's Heroes"; 
    } else if(title=="Picnic") {
        return "Cadbury's Picnic"; 
    } else if(title=="Time Out") {
        return "Cadbury's Timeout"; 
    } else if(title=="Twirl") {
        return "Cadbury's Twirl"; 
    } else if(title=="Wispa") {
        return "Cadbury's Wispa"; 
    } else if(title=="Fab") {
        return "Nestle Fab"; 
    } else if(title=="Zingers") {
        return "James White Zingers"; 
    } 


    if(title.indexOf(' ')<0) {
        console.log("Short title: "+title);
    }
    return title;
}

async function getScoreTables(foods, subscribe, sendResponse) {
    
    var sent_request=false;

    // are there any cached entries that we want to throw away?
    for (let food of foods) {
        if(gScoreTables[food]==null) {
            continue;
        }
        if(gScoreTables[food].error) {
            console.log("Will rerequest "+food+" because error");
            gScoreTables[food]=null;
            continue;
        }
        if(gSubscription!=subscribe) {
            console.log("Will rerequest "+food+" because subscription check change");
            gScoreTables[food]=null;
            continue;
        }
    }
    gSubscription=subscribe;
            
    for (let food of foods) {
        if( gScoreTables[food] ) {
            //console.log("Sending cached data for "+food);
            //console.log(gScoreTables[food]);
            continue;
        }

        sent_request=true;

        try {
            const response = await fetch(`https://www.ethicalconsumer.org${food}`);

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.text();
                
            update_busy_icon();
            var food_title=null;
            var title = /<h1 class="title">\s*([\w\s&;,-]+?)[\s]*</.exec(data);
            if(title) {
                food_title=unescape(title[1]);
            } else{
                console.log(`Failed to parse title for ${food}`);
            }

            // parse the score table
            var table = /<table class="table"(.*?)<\/table>/gms.exec(data);
            const te_regex = /<h4>([^<]*)<\/h4>(?:.*?)+?<div class="score (\w+)">(?:.*?)+?/gms;
            var table_entries={'good':[],'average':[],'bad':[]};
            while ((m = te_regex.exec(table[1])) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === te_regex.lastIndex) {
                    te_regex.lastIndex++;
                }

                var rating=m[2];
                var title=fixup_overly_short_titles(unescape(m[1])); // flake matches too many things - hack it!
                table_entries[rating].push(
                    {'title':title,
                    'preprocessed_title':pre_process(title),
                    'link':"https://www.ethicalconsumer.org"+food+"#score-table"});
            }

            //console.log(table_entries);

            // cache results for later
            gScoreTables[food]={'table':table_entries,'title':food_title};

            // send them back as reply if we have all of them
            onFoodReceived(foods,sendResponse);
        } catch (error) {
            gScoreTables[food] = { error, data: {} };
            update_busy_icon();
            onFoodReceived(foods,sendResponse);
        }
    }

    // if we're using entirely cached data, send our response - we have all we need
    if(!sent_request) {
        onFoodReceived(foods,sendResponse);
    }
}

function parseProductGuides(productselector,page_html) {
    var re = new RegExp(productselector+'.*?<h4>Product Guides<\/h4>.*?<ul>(.*?)<\/ul>',"gms");
    var pg_ul = re.exec(page_html);
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

    return foods;
}

var gBusyStart=-1;
var gIconTime=-1;
const NUM_ICONS=3;
function set_done_icon() {
    gBusyStart=-1;
    chrome.browserAction.setIcon({
        path : "images/icon32.png"
    });
}
function update_busy_icon() {
    if(gBusyStart==-1) {
        gBusyStart=new Date();
    }
    var now=new Date();
    var seconds = Math.floor((now-gBusyStart)/1000);
    console.log(seconds);
    if(seconds!=gIconTime) {
        gIconTime=seconds;
        // swap to a busy icon
        var icon_number=seconds%NUM_ICONS;
        chrome.browserAction.setIcon({
            path : "images/busy"+icon_number+".png"
        });
    }
}

async function lookupGuides(sendResponse) {
    // never use cached data for the list of foods - we also use this request to check if the player is subscribed to EC 
    update_busy_icon();

    // which guides are available?
    try {
        const response = await fetch("https://www.ethicalconsumer.org/");

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.text();

        // is there a call to action to subscribe?
        var subscribe=null;
        var sub = /<button [\.\-"=\/\<>\w\s]*?value="Sign in ">Sign in[-"=\/\<>\w\s]*?<\/button>/.exec(data);
        if(sub) {
            subscribe="https://www.ethicalconsumer.org/subscriptions";
        }
        
        var foods=[];
        // parse out product guides - food and drink
        foods=foods.concat(parseProductGuides('<a class="more" href="\/food-drink">Read more about Food &amp; Drink<\/a>',data));
        //health and beauty
        foods=foods.concat(parseProductGuides('<a class="more" href="/health-beauty">Read more about Health &amp; Beauty</a>',data));

        // some more products that are stocked by supermarkets - don;t want all of home and garden tho
        foods.push('/home-garden/shopping-guide/dishwasher-detergent');
        foods.push('/home-garden/shopping-guide/household-cleaners');
        foods.push('/home-garden/shopping-guide/laundry-detergents');
        foods.push('/home-garden/shopping-guide/toilet-cleaners');
        foods.push('/home-garden/shopping-guide/toilet-paper');
        foods.push('/home-garden/shopping-guide/washing-liquid');

        // strip out perfume shops because it has short names and doesn;t help
        var index = foods.indexOf('/health-beauty/shopping-guide/perfume-shops');
        if (index !== -1) foods.splice(index, 1);

        update_busy_icon();
        getScoreTables(foods, subscribe, sendResponse);                
    }
    catch (error) {
        set_done_icon();
        sendResponse({ error, data: {} });
    }
}
