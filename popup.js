

function openTabToUrl(url) {
    // grab cookie from ethical consumer for requests

    chrome.runtime.sendMessage({command:"open_tab", "url":url}, function(response) {
        console.log(response);
        return;
      });
}



// add javascript functionality such as onclick as we are not allowed to put this in popup.html
document.addEventListener('DOMContentLoaded', function() {

    document.querySelector("#loginButton").addEventListener("click", () => {openTabToUrl("https://www.ethicalconsumer.org/");}, false);
    document.querySelector("#loginLink").addEventListener("click", () => {openTabToUrl("https://www.ethicalconsumer.org/");}, false);
    document.querySelector("#subscribeButton").addEventListener("click", () => {openTabToUrl("https://www.ethicalconsumer.org/subscriptions");}, false);
    document.querySelector("#emailLink").addEventListener("click", () => {openTabToUrl("mailto:ethicsinshopping@thinkysaurus.com");}, false);

});
