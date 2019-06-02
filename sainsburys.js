
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

            //hover over to get tooltip
            $(product_div).parent().prop('title',bb.blurb);
            

            //console.log(bb.blurb);
        }
    });
}

function colour_product(response, product_div) {
    // is this a best buy?
    $(product_div).parent().css('background-color','transparent');
    apply_colour(product_div,response.table.bad,'#FF8686'); // light red
    apply_colour(product_div,response.table.average,'#FFCE79'); // light orange
    apply_colour(product_div,response.bestbuys,'#b5ffb6'); // light green
    apply_colour(product_div,response.table.good,'#b5ffb6'); // light green
}   

function colour_page(response) {
    // find the products
    console.log($('.productNameandPromotions'));

    // set them all grey while i think...
    $('.productNameAndPromotions').parent().css('background-color','lightGrey'); 
    $('.productNameAndPromotions').each( function( index, product_div ){
        colour_product(response, product_div);
    });

    $('.productTitleDescriptionContainer').parent().css('background-color','lightGrey'); 
    $('.productTitleDescriptionContainer').each( function( index, product_div ){
        colour_product(response, product_div);
    });
}

function get_bestbuys(food) {
    chrome.runtime.sendMessage({command: "get_bestbuys", food:food}, function(response) {
        if(response.error) {
            console.log(response.error);
            console.log(response.data);
            return;
        } 

        console.log(response.bestbuys);
        console.log(response.table.good);
        console.log(response.table.average);
        console.log(response.table.bad);
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
            setInterval(function(){ 
                get_bestbuys("cooking-oil"); 
                get_bestbuys("butter-spreads"); 
            }, 3000);

            
            
        });
    }

}

waitForReady();

