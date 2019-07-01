

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function apply_colour(product_div,colour_div,css_class,best_match) {
    colour_div.style.backgroundColor = best_match.colour;

    // add a button to link to ethical consumer site for moar infos
    var link = document.createElement('a');
    link.appendChild(document.createElement("br")); 
    var img=document.createElement('img');
    img.setAttribute("src", chrome.extension.getURL("images/icon32.png"));
    img.setAttribute("alt", "Ethical Shopping Helper Logo");
    img.className="es-img-16";
    link.appendChild(img);
    var linkText = document.createTextNode("("+best_match.bb.title+")"); // very small space on asda site!
    if(css_class=="asda-single-product") {
        document.createTextNode("More details ("+best_match.bb.title+") at "+best_match.bb.link);
    }
    if(DEBUGGING) {
        linkText = document.createTextNode("More details ("+best_match.bb.title+") ("+best_match.product_name+") ("+best_match.matchiness+") at "+best_match.bb.link);
    } 
    link.appendChild(linkText);
    link.title = "For more details click here to go to the ethical consumer website";
    link.href = best_match.bb.link;
    link.setAttribute('target','_blank');
    link.addEventListener('click', (e) => { e.stopPropagation(); }, false);
    link.id='es-moar-infos';
    link.className=css_class;

    product_div.appendChild(link);

    //var div=document.createElement('div');
    //div.appendChild(link);

    //insertAfter(div, product_div);
}

function colour_product(munged_tables, product_div, colour_div, css_class, raw_product_name) {
    // is this a best buy?
    var best_match=get_best_match(munged_tables, raw_product_name);
    if(best_match!=null && best_match.matchiness>FUZZY_MATCH_THRESHOLD) {
        apply_colour(product_div,colour_div,css_class,best_match);
    } else if(DEBUGGING) {
        best_match.colour=DEBUG_COLOUR;
        apply_colour(product_div,colour_div,css_class,best_match);
    }
}   

function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=get_munged_tables(response);

    // find the products
    // search results
    // and shopping basket small
    document.querySelectorAll('.productTitle').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            // want to colour in the item or product
            var tile_content=product_div.parentNode;
            while(tile_content && !tile_content.classList.contains("item") && !tile_content.classList.contains("product")) {
                tile_content=tile_content.parentNode;
            }
            var css_class="es-asda-search-result";
            if(tile_content) {
                if(tile_content.classList.contains("item")) {
                    css_class="es-asda-mini-trolley";
                }
            } else {
                console.log("Error: failed to find tile_content node for "+product_div.textContent.trim());
                tile_content=product_div.parentNode;
            }
            colour_product(munged_tables, product_div, tile_content, css_class, product_div.textContent.trim());
        }
    });

    //viewing single product
    document.querySelectorAll('.prod-title').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.parentNode, "es-asda-single-product", product_div.textContent.trim());
        }
    });
}

function get_header_location() {
    return document.querySelector('#pageHeaderContainer');
}
