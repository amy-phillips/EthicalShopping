



function apply_colour(product_div,colour_div,best_match,link_class) {
    colour_div.style.backgroundColor = best_match.colour; 

    // add a button to link to ethical consumer site for moar infos
    var link = document.createElement('a');
    var img=document.createElement('img');
    img.setAttribute("src", chrome.extension.getURL("images/icon32.png"));
    img.setAttribute("alt", "Ethical Shopping Helper Logo");
    if(link_class==null) { // no link class means we have more space so can be more verbose
        img.className="es-img-32";
    } else {
        img.className="es-img-16";
    }
    link.appendChild(img);
    var linkText = document.createTextNode("("+best_match.bb.title+")");
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
    link.addEventListener('click', (e) => { e.stopPropagation(); }, false);
    if(link_class) {
        link.className=link_class;
    }
    link.id='es-moar-infos';
    product_div.after(link);
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


    // todo try `document.querySelector` and `document.querySelectorAll`
    
    // find the products
    // search results
    document.querySelectorAll('.fop-title').forEach( function( product_div ){
        // has it already been coloured?
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode.parentNode.parentNode.parentNode, title, 'es-ocado-search-result');
        }
    });

    //viewing single product
    document.querySelectorAll('.productTitle').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode.parentNode, title);
        }
    });

    //shopping basket
    document.querySelectorAll('.trolleyTextTitle').forEach( function( product_div ){
        if(!product_div.parentNode.querySelector('#es-moar-infos')) {
            var title=ocado_get_product_name(product_div);
            colour_product(munged_tables, product_div, product_div.parentNode, title);
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