



function apply_colour(product_div,colour_div,best_match,link_class) {
    $(colour_div).css('background-color',best_match.colour); 

    // add a button to link to ethical consumer site for moar infos
    var link = document.createElement('a');
    var img=document.createElement('img');
    img.setAttribute("src", chrome.extension.getURL("images/icon32.png"));
    img.setAttribute("alt", "Ethical Shopping Helper Logo");
    img.setAttribute("height", "16");
    link.appendChild(img);
    var linkText = document.createTextNode("More details ("+best_match.bb.title+")");
    if(link_class==null) { // no link class means we have more space so can be more verbose
        linkText = document.createTextNode("More details ("+best_match.bb.title+") at "+best_match.bb.link);
    }
    if(DEBUGGING) {
        linkText = document.createTextNode("More details ("+best_match.bb.title+") ("+best_match.product_name+") ("+best_match.matchiness+") at "+best_match.bb.link);
    } 
    link.appendChild(linkText);
    link.title = "For more details click here to go to the ethical consumer website";
    link.href = best_match.bb.link;
    link.setAttribute('target','_blank');
    if(link_class) {
        link.className=link_class;
    }
    link.id='es-moar-infos';
    var object_for_link_in_link=document.createElement('object');
    object_for_link_in_link.appendChild(link);
    $(product_div).after(object_for_link_in_link);
}

function colour_product(munged_tables, product_div, colour_div, raw_product_name, link_class) {
    // is this a best buy?
    var best_match=get_best_match(munged_tables, raw_product_name);
    if(best_match!=null && best_match.matchiness>FUZZY_MATCH_THRESHOLD) {
        apply_colour(product_div,colour_div,best_match,link_class);
    } else if(DEBUGGING) {
        best_match.colour=DEBUG_COLOUR;
        apply_colour(product_div,colour_div,best_match,link_class);
    }
}   

function ocado_get_product_name(product_div) {
    // first deal with truncated titles as too long:
    if($(product_div).find('abbr').length && $(product_div).find('abbr').attr('title')) {
        return $(product_div).find('abbr').attr('title');
    } 
    if($(product_div).attr('title')) {
        return $(product_div).attr('title'); // search results abbreviated title
    }
    if($(product_div).find('a').length && $(product_div).find('a').attr('title')) {
        return $(product_div).find('a').attr('title'); // rhs abbreviated title
    }

    // don;t need these ones because the strong code covers them
    //if($(product_div).find("[itemprop=name]").length) {
    //   return $(product_div).find("[itemprop=name]").attr('name');
    //} 
    
    // grab the bold bit (to avoid things like Waitrose Celeriac Typically 350g)
    if($(product_div).find("strong").length) {
        return $(product_div).find("strong").text().trim();
    } 

    return $(product_div).text().trim();
}

function colour_page(response) {
    // grab all the tables for all the product types and munge them into a big useful struct
    munged_tables=get_munged_tables(response);

    // find the products
    // search results
    $('.fop-title').each( function( index, product_div ){
        // has it already been coloured?
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, $(product_div).parent().parent().parent().parent(), title, 'es-ocado-search-result');
        }
    });

    //viewing single product
    $('.productTitle').each( function( index, product_div ){
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, $(product_div).parent().parent(), title);
        }
    });

    //shopping basket
    $('.trolleyTextTitle').each( function( index, product_div ){
        if($(product_div).parent().find('#es-moar-infos').length==0) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, $(product_div).parent(), title);
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
    // viewing search results
    if($('#main-content').length) {
        return $('#main-content');
    }
    // viewing one product
    if($('#header').length) {
        return $('#header');
    }
    return $('body');
}