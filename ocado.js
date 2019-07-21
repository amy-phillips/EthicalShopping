





function ocado_get_product_name(product_div) {
    let el;
    let title;

    // first deal with truncated titles as too long:
    el = product_div.querySelector('abbr');
    title = el ? el.getAttribute('title') : null;

    if (title) return title;

    title = product_div.getAttribute('title');
    
    if (title) return title;  // search results abbreviated title

    el = product_div.querySelector('a');
    title = el ? el.getAttribute('title') : null;

    if (title) return title; // rhs abbreviated title

    // don;t need these ones because the strong code covers them
    //if($(product_div).find("[itemprop=name]").length) {
    //   return $(product_div).find("[itemprop=name]").attr('name');
    //} 
    
    // grab the bold bit (to avoid things like Waitrose Celeriac Typically 350g)
    el = product_div.querySelector('strong');

    if (el) return el.textContent.trim();

    return product_div.textContent.trim();
}

function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=get_munged_tables(response);

    // find the products
    // search results
    document.querySelectorAll('.fop-title').forEach( function( product_div ){
        // has it already been coloured?
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode.parentNode.parentNode.parentNode, 'es-ocado-search-result', true, title);
        }
    });

    //viewing single product
    document.querySelectorAll('.bop-title').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode.parentNode, 'es-ocado-single-product', true, title);
        }
    });

    // rhs - 'are you sure you don't need?'
    document.querySelectorAll('.productTitle').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode.parentNode, 'es-ocado-single-product', true, title);
        }
    });

    //shopping basket
    document.querySelectorAll('.trolleyTextTitle').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode, 'es-ocado-basket', true, title);
        }
    });

    //don't do the mini trolley at the top - no room for explanations
    //$('.hd-miniTrolley__item').each( function( index, product_div ){
    //    if($(product_div).parent().find('#es-moar-infos').length==0) {
    //        var title=$(product_div).find('img').attr('alt');
    //        colour_product(munged_tables, product_div, title);
    //    }
    //});
}

function get_header_location() {
    const mainContent = document.querySelector('#main-content');

    // viewing search results
    if(mainContent) {
        return mainContent;
    }

    const header = document.querySelector('#header');

    // viewing one product
    if(header) {
        return header;
    }
    return document.querySelector('body');
}