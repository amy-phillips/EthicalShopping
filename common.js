var FUZZY_MATCH_THRESHOLD=0.9;
const BAD_COLOUR='#FF8686';
const AVG_COLOUR='#FFCE79';
const GOOD_COLOUR='#b5ffb6';
const DEBUG_COLOUR='#FFFF00';


const DEBUGGING=0;

function get_best_match(munged_tables, raw_product_name) {
    // strip off (2 pint)
    var product_name = raw_product_name.replace(/\s*(?:\(?\d+ ?pint\)?$)/gmi, "");
    // strip off (Sugar levy applied)
    product_name = product_name.replace(/\s*(?:\(Sugar levy applied\)$)/gmi, "");
    // strip off 400g or 4x180ml or 3kg or x48
    product_name = product_name.replace(/(?:\d+\s*x)*(?:(?:\d+ml$)|(?:(?:\d+\.)?\d+l$)|(?:\d+g$)|(?:(?:\d+\.)?\d+kg$)|(?:x\d+$))/gmi, "");
    product_name=product_name.trim();

    var preprocessed_product_name=pre_process(product_name);
    var best_match=null;
    for(let col_tbl of munged_tables) {
        for(let bb of col_tbl.table) {
            var matchiness = get_matchiness(preprocessed_product_name, bb.preprocessed_title);
            if(best_match==null || matchiness > best_match.matchiness) {
                best_match={};
                best_match.matchiness=matchiness;
                best_match.bb=bb;
                best_match.colour=col_tbl.colour;
                best_match.product_name=product_name; // for debugging
            }
        }
    }

    return best_match;
}

function get_munged_tables(response) {
    munged_tables=[]

    for (let prod_type in response.scores) {
        if (!response.scores.hasOwnProperty(prod_type)) {
            continue;
        }

        munged_tables.push({colour:BAD_COLOUR, table:response.scores[prod_type].table.bad});
        munged_tables.push({colour:AVG_COLOUR, table:response.scores[prod_type].table.average});
        munged_tables.push({colour:GOOD_COLOUR, table:response.scores[prod_type].table.good});
    }

    return munged_tables;
}

function display_call_to_login_if_necessary(response) {
    subscribe_fors=[];
    subscribe_link=null;
    if(response.subscription) {
        subscribe_link=response.subscription;
        // grab the titles of all the foods with an empty recommendations table (these will be the ones you gain if you subscribe)
        for (let value of Object.values(response.scores)) {
            if(value.table.good.length==0 && value.table.average.length==0 && value.table.bad.length==0) {
                if(value.title) {
                    subscribe_fors.push(value.title);
                }
            }
        }
    }
    
    const esCallToLogin = document.querySelector("#es-call_to_login");

    if(subscribe_link && !esCallToLogin) {
        // add a button to link to ethical consumer site for login/subscribe
        var top_bar=document.createElement('table');
        top_bar.className="es-login_or_subscribe-block";
        top_bar.id='es-call_to_login';

        var row = top_bar.insertRow(0);

        var cell1 = row.insertCell(0);
        cell1.setAttribute("width", "40px");
        //cell1.setAttribute("border", "0 !important");

        var img=document.createElement('img');
        img.setAttribute("src", chrome.extension.getURL("images/icon32.png"));
        img.setAttribute("alt", "Ethical Shopping Helper Logo");
        cell1.appendChild(img);
        cell1.className = "es-login_or_subscribe-td";

        var cell2 = row.insertCell(1);
        cell2.className = "es-login_or_subscribe-td";
        cell2.setAttribute("width", "100%"); // this pushes cell3 to the right of the screen
        //cell2.setAttribute("border","0 !important");

        var linky_p = document.createElement('p');
        var last=subscribe_fors.pop();
        var subscr_fors_str=subscribe_fors.join(", ")+" and "+last;
        linky_p.innerHTML = "Please <a href=\"https://www.ethicalconsumer.org\" target=\"_blank\">login</a> or <a href=\""+subscribe_link+"\" target=\"_blank\">subscribe</a> to Ethical Consumer so I can highlight more products for you from categories such as "+subscr_fors_str;
        linky_p.className = "es-login_or_subscribe-p";
        cell2.appendChild(linky_p);

        var cell3 = row.insertCell(2);
        cell3.className = "es-login_or_subscribe-td";
        cell3.setAttribute("width", "100px");
        //cell3.setAttribute("border","0 !important");
        var goaway_linky = document.createElement('p');
        goaway_linky.innerHTML = "<a href=\"javascript:void(0);\">Login Later</a>";
        goaway_linky.onclick = go_away;
        goaway_linky.className = "es-login_or_subscribe-p";
        cell3.appendChild(goaway_linky);

        get_header_location().append(top_bar); // put it on end of body, but css positions it at top of page
    } else if(subscribe_link==null && esCallToLogin) {
        // remove the prompt button - they logged in!
        esCallToLogin.parentNode.removeChild(esCallToLogin);
    }
}


function get_score_tables() {
    chrome.runtime.sendMessage({command: "get_score_tables"}, function(response) {
        if(response.error) {
            console.log(response.error);
            console.log(response.data);
            return;
        } 

        console.log(response);
        display_call_to_login_if_necessary(response);

        colour_page(response);
        return;
        
      });

}

function go_away() {
    chrome.runtime.sendMessage({command: "go_away"}, function(response) {
        if(response.error) {
            console.log(response.error);
            console.log(response.data);
            return;
        } 

        console.log(response);
        display_call_to_login_if_necessary(response);

        colour_page(response);
        return;
        
      });
}

window.addEventListener('load', () => {
    console.log("Ethical Shopping Helper Extension active - woot!");

    // we run our code periodically to check if the go_away timeout has expired, or if the player has subscribed to EC in the meantime, or data has changed
    setTimeout(get_score_tables, 2000); // Delay initial run for client side code to hopefully finish
    setInterval(get_score_tables, 30000);
});
