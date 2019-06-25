



function apply_colour(product_div,best_match) {
    $(product_div).parent().css('background-color',best_match.colour); 

    // add a button to link to ethical consumer site for moar infos
    var link = document.createElement('a');
    link.appendChild(document.createElement("br")); 
    var img=document.createElement('img');
    img.setAttribute("src", chrome.extension.getURL("images/icon32.png"));
    img.setAttribute("alt", "Ethical Shopping Helper Logo");
    img.setAttribute("height", "16");
    img.setAttribute("width", "16");
    link.appendChild(img);
    var linkText = document.createTextNode("More details ("+best_match.bb.title+") at "+best_match.bb.link);
    if(DEBUGGING) {
        linkText = document.createTextNode("More details ("+best_match.bb.title+") ("+best_match.product_name+") ("+best_match.matchiness+") at "+best_match.bb.link);
    } 
    link.appendChild(linkText);
    link.title = "For more details click here to go to the ethical consumer website";
    link.href = best_match.bb.link;
    link.setAttribute('target','_blank');
    link.id='es-moar-infos'
    $(product_div).parent().append(link);
}

function colour_product(munged_tables, product_div, raw_product_name) {
    // is this a best buy?
    var best_match=get_best_match(munged_tables, raw_product_name);
    if(best_match!=null && best_match.matchiness>FUZZY_MATCH_THRESHOLD) {
        apply_colour(product_div,best_match);
    } else if(DEBUGGING) {
        best_match.colour=DEBUG_COLOUR;
        apply_colour(product_div,best_match);
    }
}   

function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=get_munged_tables(response);

    // find the products
    // search results
    $('.productNameAndPromotions').find("h3").each( function( index, product_div ){
        // has it already been coloured?
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            colour_product(munged_tables, product_div, $(product_div).find("a").text().trim());
        }
    });

    //viewing single product
    $('.productTitleDescriptionContainer').find("h1").each( function( index, product_div ){
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            colour_product(munged_tables, product_div, $(product_div).text().trim());
        }
    });

    //shopping basket
    $('.productContainer').children("a").each( function( index, product_div ){
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            colour_product(munged_tables, product_div, $(product_div).text().trim());
        }
    });

    //little trolley at the side
    $('#trolleyTableBody').find('.product').children("a").each( function( index, product_div ){
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            colour_product(munged_tables, product_div, $(product_div).text().trim());
        }
    });
}

function get_header_location() {
    return $('#globalHeaderContainer');
}
