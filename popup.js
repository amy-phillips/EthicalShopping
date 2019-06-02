

function openCookiePage() {
    // grab cookie from ethical consumer for requests
    window.open("https://www.ethicalconsumer.org", '_blank');
    return;
}



// add javascript functionality such as onclick as we are not allowed to put this in popup.html
document.addEventListener('DOMContentLoaded', function() {
 
    $("#getCookieButton").click(openCookiePage);

});
