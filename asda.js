

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
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
            colour_product(munged_tables, product_div, tile_content, css_class, true, product_div.textContent.trim());
        }
    });

    //viewing single product
    document.querySelectorAll('.prod-title').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.parentNode, "es-asda-single-product", false, product_div.textContent.trim());
        }
    });
}

function get_header_location() {
    return document.querySelector('#pageHeaderContainer');
}
