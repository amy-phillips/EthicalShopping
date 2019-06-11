
// todo - improve fuzzy matching
var FUZZY_MATCH_THRESHOLD=0.57;
const BAD_COLOUR='#FF8686';
const AVG_COLOUR='#FFCE79';
const GOOD_COLOUR='#b5ffb6';
const DEBUG_COLOUR='#FFFF00';

const DEBUGGING=1;

fuzzy.analyzeSubTerms = false; // too slow

function apply_colour(product_div,best_match) {
    $(product_div).parent().css('background-color',best_match.colour); 

    if($(product_div).parent().find('#es-moar-infos').length==0) {
        // add a button to link to ethical consumer site for moar infos
        var link = document.createElement('a');
        var linkText = document.createTextNode("More details ("+best_match.bb.title+") at "+best_match.bb.link);
        if(DEBUGGING) {
            linkText = document.createTextNode("More details ("+best_match.bb.title+") ("+best_match.product_name+") ("+best_match.normalised+") at "+best_match.bb.link);
        } 
        link.appendChild(linkText);
        link.title = "For more details click here to go to the ethical consumer website";
        link.href = best_match.bb.link;
        link.setAttribute('target','_blank');
        link.id='es-moar-infos'
        $(product_div).parent().append(link);
    }
}

function colour_product(munged_tables, product_div) {
    $(product_div).parent().css('background-color','transparent');

    // is this a best buy?
    var product_name=$(product_div).text().trim();
    // strip off (2 pint)
    product_name = product_name.replace(/(?:\(?\d+ ?pint\)?$)/gmi, "");
    product_name=product_name.trim();
    // strip off 400g or 4x180ml or 3kg or x48
    product_name = product_name.replace(/(?:\d+x)*(?:(?:\d+ml$)|(?:(?:\d+\.)?\d+l$)|(?:\d+g$)|(?:(?:\d+\.)?\d+kg$)|(?:x\d+$))/gmi, "");
    product_name=product_name.trim();
    var best_match=null;
    munged_tables.forEach(function (col_tbl, index) {
        col_tbl.table.forEach(function (bb, index) {
            //console.log( item );
            var match = fuzzy(product_name, bb.title);
            // the longer the string the higher the score tends to be, so we want to normalise
            // however shorter strings are often substrings "milka chocolate" is troublesome
            // so divide by the lengths of both strings ???
            match.normalised = match.score/(product_name.length + bb.title.length);
            if(best_match==null || match.normalised > best_match.normalised) {
                best_match=match;
                best_match.bb=bb;
                best_match.colour=col_tbl.colour;
                best_match.product_name=product_name;
            }
        });
    });

    //console.log(best_match.term + " scored "+ best_match.score + "because ["+best_match.highlightedTerm+"]");
    if(best_match!=null && best_match.normalised>FUZZY_MATCH_THRESHOLD) {
        apply_colour(product_div,best_match);
    } else if(DEBUGGING) {
        best_match.colour=DEBUG_COLOUR;
        apply_colour(product_div,best_match);
    }
}   

function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=[]
    Object.values(response.bb).forEach(value => {
        if (typeof(value.error) !== 'undefined') {
            console.log("Skipping due to error: "+value);
            return;
        }

        munged_tables.push({colour:BAD_COLOUR, table:value.table.bad});
        munged_tables.push({colour:AVG_COLOUR, table:value.table.average});
        munged_tables.push({colour:GOOD_COLOUR, table:value.table.good});
        munged_tables.push({colour:GOOD_COLOUR, table:value.bestbuys});
    });

    // find the products
    // set them all grey while i think...
    // search results
    $('.productNameAndPromotions').find("h3").parent().css('background-color','lightGrey'); 
    $('.productNameAndPromotions').find("h3").each( function( index, product_div ){
        colour_product(munged_tables, product_div);
    });

    //viewing single product
    $('.productTitleDescriptionContainer').find("h1").parent().css('background-color','lightGrey'); 
    $('.productTitleDescriptionContainer').find("h1").each( function( index, product_div ){
        colour_product(munged_tables, product_div);
    });

    //shopping basket
    $('.productContainer').children("a").parent().css('background-color','lightGrey'); 
    $('.productContainer').children("a").each( function( index, product_div ){
        colour_product(munged_tables, product_div);
    });

    //little trolley at the side
    $('#trolleyTableBody').find('.product').children("a").parent().css('background-color','lightGrey'); 
    $('#trolleyTableBody').find('.product').children("a").each( function( index, product_div ){
        colour_product(munged_tables, product_div);
    });
}

function display_call_to_login(subscribe_url) {
    console.log("Need to log in to view ")
}

function display_call_to_login_if_necessary(response) {
    subscribe_fors=[];
    subscribe_link=null;
    if(response.subscription) {
        subscribe_link=response.subscription;
        // grab the titles of all the foods with an empty recommendations table (these will be the ones you gain if you subscribe)
        for (let value of Object.values(response.bb)) {
            if(value.table.good.length==0 && value.table.average.length==0 && value.table.bad.length==0) {
                if(value.title) {
                    subscribe_fors.push(value.title);
                }
            }
        }
    }
    
    if(subscribe_link && $('#es-call_to_login').length==0) {
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

        $('#globalHeaderContainer').append(top_bar); // put it on end of body, but css positions it at top of page
    } else if(subscribe_link==null && $('#es-call_to_login').length>0) {
        // remove the prompt button - they logged in!
        $('#es-call_to_login').remove();
    }
}

function get_bestbuys() {
    chrome.runtime.sendMessage({command: "get_bestbuys"}, function(response) {
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

function waitForReady(){
    console.log("waiting...");
    // ensure document readystate is complete before messing with colours
    if( document.readyState !== 'complete'){
        setTimeout(function(){
            waitForReady();
        }, 10 );
    }
    else {
        // wait for the iframe to load
        $("iframe").ready(function (){
            console.log("Ethical Shopping Helper Extension active - woot!");

            // we run our code periodically to check if the go_away timeout has expired, or if the player has subscribed to EC in the meantime, or data has changed
            get_bestbuys(); 
            setInterval(function(){ 
                get_bestbuys(); 
            }, 30000);

            
            
        });
    }

}

waitForReady();

