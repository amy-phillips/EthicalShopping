
// todo - improve fuzzy matching
var FUZZY_MATCH_THRESHOLD=30;

function apply_colour(product_div,bestbuys,colour) {
    var product_name=$(product_div).text();

    bestbuys.forEach(function (bb, index) {
        //console.log( item );
        var match = fuzzy(product_name, bb.title);
        if(match.score > FUZZY_MATCH_THRESHOLD) {
            //console.log(match.term + " scored "+ match.score + "because ["+match.highlightedTerm+"]");

            $(product_div).parent().css('background-color',colour); 

            if($(product_div).parent().find('#es-moar-infos').length==0) {
                // add a button to link to ethical consumer site for moar infos
                var link = document.createElement('a');
                var linkText = document.createTextNode("More details at "+bb.link);
                link.appendChild(linkText);
                link.title = "For more details click here to go to the ethical consumer website";
                link.href = bb.link;
                link.setAttribute('target','_blank');
                link.id='es-moar-infos'
                $(product_div).parent().append(link);
            }
            //console.log(bb.link);
        }
    });
}

function colour_product(response, product_div) {
    // is this a best buy?
    $(product_div).parent().css('background-color','transparent');
    Object.values(response.bb).forEach(value => {
        if (typeof(value.error) !== 'undefined') {
            console.log("Skipping due to error: "+value);
            return;
        }

        apply_colour(product_div,value.table.bad,'#FF8686'); // light red
        apply_colour(product_div,value.table.average,'#FFCE79'); // light orange
        apply_colour(product_div,value.bestbuys,'#b5ffb6'); // light green
        apply_colour(product_div,value.table.good,'#b5ffb6'); // light green
      });
}   

function colour_page(response) {
    // find the products

    // set them all grey while i think...
    // search results
    $('.productNameAndPromotions').parent().css('background-color','lightGrey'); 
    $('.productNameAndPromotions').each( function( index, product_div ){
        colour_product(response, product_div);
    });

    //viewing single product
    $('.productTitleDescriptionContainer').parent().css('background-color','lightGrey'); 
    $('.productTitleDescriptionContainer').each( function( index, product_div ){
        colour_product(response, product_div);
    });

    //shopping basket
    $('.productContainer').parent().css('background-color','lightGrey'); 
    $('.productContainer').each( function( index, product_div ){
        colour_product(response, product_div);
    });

    //little trolley at the side
    
    $('#trolleyTableBody').find('.product').parent().css('background-color','lightGrey'); 
    $('#trolleyTableBody').find('.product').each( function( index, product_div ){
        colour_product(response, product_div);
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

