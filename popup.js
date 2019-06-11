

function openTabToUrl(url) {
    // grab cookie from ethical consumer for requests

    chrome.runtime.sendMessage({command:"open_tab", "url":url}, function(response) {
        console.log(response);
        return;
      });
}



// add javascript functionality such as onclick as we are not allowed to put this in popup.html
document.addEventListener('DOMContentLoaded', function() {
 
    $("#loginButton").click(function() {openTabToUrl("https://www.ethicalconsumer.org/");});
    $("#loginLink").click(function() {openTabToUrl("https://www.ethicalconsumer.org/");});
    $("#subscribeButton").click(function() {openTabToUrl("https://www.ethicalconsumer.org/subscriptions");});

});
