



function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=get_munged_tables(response);

    // find the products
    // search results
    document.querySelectorAll('.productNameAndPromotions h3').forEach( function( product_div ){
        // has it already been coloured?
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            // find the product div
            var tile_content=product_div.parentNode;
            while(tile_content && !tile_content.classList.contains("product")) {
                tile_content=tile_content.parentNode;
            }
            if(!tile_content) {
                console.log("Error: failed to find tile_content node for "+product_div.textContent.trim());
                tile_content=product_div.parentNode;
            }
            colour_product(munged_tables, product_div, tile_content, "es-sainsbury-search-result", true, product_div.querySelector("a").textContent.trim());
        }
    });

    // "before you go" (as checking out)
    document.querySelectorAll('.productNameAndPromotions').forEach( function( product_div ){
        // has it already been coloured?
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            // find the product div
            var tile_content=product_div.parentNode;
            while(tile_content && !tile_content.classList.contains("productESpot")) {
                tile_content=tile_content.parentNode;
            }
            if(!tile_content) {
                console.log("Error: failed to find tile_content node for "+product_div.textContent.trim());
                tile_content=product_div.parentNode;
            }
            colour_product(munged_tables, product_div, tile_content, "es-sainsbury-search-result", true, product_div.querySelector("a").textContent.trim());
        }
    });

    //viewing single product
    document.querySelectorAll('.productTitleDescriptionContainer h1').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var tile_content=product_div.parentNode;
            while(tile_content && !tile_content.classList.contains("productSummary")) {
                tile_content=tile_content.parentNode;
            }
            if(!tile_content) {
                console.log("Error: failed to find tile_content node for "+product_div.textContent.trim());
                tile_content=product_div.parentNode;
            }
            colour_product(munged_tables, product_div, tile_content, "es-sainsbury-single-product", false, product_div.textContent.trim());
        }
    });

    //shopping basket
    document.querySelectorAll('.productContainer > a').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.parentNode, "es-sainsbury-shopping-basket", true, product_div.textContent.trim());
        }
    });

    //little trolley at the side
    document.querySelectorAll('#trolleyTableBody .product > a').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            colour_product(munged_tables, product_div, product_div.parentNode, "es-sainsbury-mini-trolley", true, product_div.textContent.trim());
        }
    });
}

function get_header_location() {
    return document.querySelector('#globalHeaderContainer');
}
