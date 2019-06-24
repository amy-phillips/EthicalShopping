



function apply_colour(product_div,best_match) {
    product_div.parentNode.style.backgroundColor = best_match.colour;

    // add a button to link to ethical consumer site for moar infos
    var link = document.createElement('a');
    var linkText = document.createTextNode("More details ("+best_match.bb.title+") at "+best_match.bb.link);
    if(DEBUGGING) {
        linkText = document.createTextNode("More details ("+best_match.bb.title+") ("+best_match.product_name+") ("+best_match.matchiness+") at "+best_match.bb.link);
    } 
    link.appendChild(document.createElement("br")); 
    link.appendChild(linkText);
    link.title = "For more details click here to go to the ethical consumer website";
    link.href = best_match.bb.link;
    link.setAttribute('target','_blank');
    link.id='es-moar-infos'
    product_div.parentNode.appendChild(link);
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
    document.querySelectorAll('.productNameAndPromotions h3').forEach( function( product_div ){
        // has it already been coloured?
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.querySelector("a").textContent.trim());
        }
    });

    //viewing single product
    document.querySelectorAll('.productTitleDescriptionContainer h1').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.textContent.trim());
        }
    });

    //shopping basket
    document.querySelectorAll('.productContainer > a').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.textContent.trim());
        }
    });

    //little trolley at the side
    document.querySelectorAll('#trolleyTableBody .product > a').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.textContent.trim());
        }
    });
}

function get_header_location() {
    return document.querySelector('#globalHeaderContainer');
}
