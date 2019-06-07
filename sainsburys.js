
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
    Object.values(response).forEach(value => {
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
    for (let value of Object.values(response)) {
        if(value.subscribe) {
            if(value.title) {
                subscribe_fors.push(value.title);
            }
            subscribe_link=value.subscribe;
        }
    }
    if(subscribe_link && $('#es-call_to_login').length==0) {
        // add a button to link to ethical consumer site for login/subscribe
        var linky_p = document.createElement('p');
        linky_p.innerHTML = "Please <a href=\"https://www.ethicalconsumer.org\" target=\"_blank\">login</a> or <a href=\""+subscribe_link+"\" target=\"_blank\">subscribe</a> to Ethical Consumer so I can highlight more products for you from categories such as "+subscribe_fors.join(", ");
        linky_p.id='es-call_to_login';
        linky_p.className="es-login_or_subscribe-block";
        $('#page').prepend(linky_p);
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
            console.log("Ethics in Shopping Extension active - woot!");

            // we run our code periodically to deal with sainsburys nuking my bg colours
            //setInterval(JiraAddButtons, 5000);
            get_bestbuys(); 
            setInterval(function(){ 
                get_bestbuys(); 
            }, 30000);

            
            
        });
    }

}

waitForReady();

