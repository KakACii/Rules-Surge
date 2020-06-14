/**
 * 名称：Endless Google.user.js
 * 地址：https://greasyfork.org/scripts/4868-endless-google/code/Endless%20Google.user.js
 *
 ******** 以下为 tamperJS 自动生成的 rewrite 相关信息，可能需要根据情况适当调整 ********

[rewrite]
http:\/\/www\.google\..* url script-response-body Endless Google.user.js
https:\/\/www\.google\..* url script-response-body Endless Google.user.js
https:\/\/encrypted\.google\..* url script-response-body Endless Google.user.js

[mitm]
, www.google.*, encrypted.google.*

 ********
 * 工具: tamperJS BY @elecV2
 * 频道: https://t.me/elecV2
 *
**/

let body = $response.body

if (/<\/html>|<\/body>/.test(body)) {
  body = body.replace('</body>', `
<script>
function GM_openInTab(e){return window.open(e)}function GM_addStyle(e){"use strict";let t=document.getElementsByTagName("head")[0];if(t){let s=document.createElement("style");return s.setAttribute("type","text/css"),s.textContent=e,t.appendChild(s),s}return null}const GM_log=console.log;function GM_xmlhttpRequest(e){"use strict";let t=new XMLHttpRequest;if(__setupRequestEvent(e,t,"abort"),__setupRequestEvent(e,t,"error"),__setupRequestEvent(e,t,"load"),__setupRequestEvent(e,t,"progress"),__setupRequestEvent(e,t,"readystatechange"),t.open(e.method,e.url,!e.synchronous,e.user||"",e.password||""),e.overrideMimeType&&t.overrideMimeType(e.overrideMimeType),e.headers)for(let s in e.headers)Object.prototype.hasOwnProperty.call(e.headers,s)&&t.setRequestHeader(s,e.headers[s]);let s=e.data?e.data:null;return e.binary?t.sendAsBinary(s):t.send(s)}function __setupRequestEvent(e,t,s){"use strict";e["on"+s]&&t.addEventListener(s,function(n){let r={responseText:t.responseText,responseXML:t.responseXML,readyState:t.readyState,responseHeaders:null,status:null,statusText:null,finalUrl:null};switch(s){case"progress":r.lengthComputable=n.lengthComputable,r.loaded=n.loaded,r.total=n.total;break;case"error":break;default:if(4!=t.readyState)break;r.responseHeaders=t.getAllResponseHeaders(),r.status=t.status,r.statusText=t.statusText}e["on"+s](r)})}const GM_info={script:{name:"elecV2",namespace:"https://t.me/elecV2"},uuid:"47c23801-2b5c-4dbc-88a0-636297fd6b86"},__GM_STORAGE_PREFIX=["",GM_info.script.namespace,GM_info.script.name,""].join("***");function GM_deleteValue(e){"use strict";localStorage.removeItem(__GM_STORAGE_PREFIX+e)}function GM_getValue(e,t){"use strict";let s=localStorage.getItem(__GM_STORAGE_PREFIX+e);return null===s&&void 0!==t?t:s}function GM_listValues(){"use strict";let e=__GM_STORAGE_PREFIX.length,t=[];for(let s=0;s<localStorage.length;s++){let n=localStorage.key(s);n.substr(0,e)===__GM_STORAGE_PREFIX&&t.push(n.substr(e))}return t}function GM_setValue(e,t){"use strict";localStorage.setItem(__GM_STORAGE_PREFIX+e,t)}function GM_getResourceURL(e){"use strict";return"greasemonkey-script:"+GM_info.uuid+"/"+e}
</script>
<script>const elecJSPack = function(elecV2){

// ==UserScript==
// @name            Endless Google
// @description     Load more results automatically and endlessly.
// @author          tumpio
// @oujs:author     tumpio
// @namespace       tumpio@sci.fi
// @homepageURL     https://openuserjs.org/scripts/tumpio/tumpiosci.fi/Endless_Google
// @supportURL      https://github.com/tumpio/gmscripts
// @icon            https://github.com/tumpio/gmscripts/raw/master/Endless_Google/large.png
// @include         http://www.google.*
// @include         https://www.google.*
// @include         https://encrypted.google.*
// @run-at          document-start
// @grant           GM_xmlhttpRequest
// @version         0.0.4
// ==/UserScript==

// TODO: on page refresh:
//  2: load only the last scrolled page (on refresh, load last requested page) (could be a good default, needs scroll up support)
//      beforeunload -> store last requested page with GM_setVariable() and reload it instead
// TODO: onerror, onabort: show to user "page loading failed", button to retry

// FIXME: bug: Suggested images don't show up on new requested pages
// case: https://www.google.fi/webhp?tab=ww&ei=e0UjU9ynEKqkyAO46YD4DQ&ved=0CBEQ1S4#q=tetsaus
// workaround, hiding now

// FUTURE: Options dialog
// FUTURE: Replace footer with page #no info UI
// FUTURE: Add page up/down and back to top/bottom controls UI + (go to the page #n)?
// FUTURE: Add columns support
// FUTURE: show page loading icon
// FUTURE: show page fav-icons for results
// FUTURE: number results
// FUTURE: option to load static google css
// FUTURE: support scroll up

if (location.href.indexOf("tbm=isch") !== -1) // NOTE: Don't run on image search
    return;
if (window.top !== window.self) // NOTE: Do not run on iframes
    return;

document.addEventListener('DOMContentLoaded', function () {

    // NOTE: Options
    var request_pct = 0.05; // percentage of window height left on document to request next page, value must be between 0-1
    var event_type = "scroll"; // or "wheel"
    var on_page_refresh = 1;
    // 0: reload all previous pages requested
    // 1: load only the first page (prevent restoring the scroll position)
    // 2: load only the last page requested
    var main = document.getElementById("main");
    var rcnt = document.getElementById("rcnt");
    var input = document.getElementById("gbqfq");
    var input_value = input.value;
    var old_scrollY = 0;
    var scroll_events = 0;
    var next_link = null;
    var cols = [];
    var request_offsetHeight = 0;

    input.addEventListener("blur", reset, false); // NOTE: listens for new search input to reset state
    window.addEventListener(event_type, onScroll, false);
    window.addEventListener("beforeunload", function () {
        window.scrollTo(0, 0);
    }, false);

    function requestNextPage(link) {
        console.log("request next");
        console.log(link);
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            onload: function (response) {
                var holder = document.createElement("div");
                holder.innerHTML = response.responseText;
                next_link = holder.querySelector("#pnnext").href;

                var next_col = document.createElement("div");
                next_col.className = "EG_col";
                next_col.appendChild(holder.querySelector("#center_col"));

                var rel_search = next_col.querySelector("#extrares");
                var rel_images = next_col.querySelector("#imagebox_bigimages");
                var rel_ads = next_col.querySelector("#tads");
                if (rel_search)
                    rel_search.style.display = "none"; // NOTE: Hides repeating "related searches"
                if (rel_images)
                    rel_images.style.display = "none"; // NOTE: Hides related images, that are broken (bug)
                if (rel_ads)
                    rel_ads.style.display = "none"; // NOTE: Hides repeating "search results ad"

                cols.push(next_col);
                console.log("Page no: " + cols.length);
                next_col.id = next_col.className + "_" + (cols.length - 1); // NOTE: add unique id for every new col

                if (!rcnt || cols.length === 1) // NOTE: needs to be rechecked on a state reset too, and late insertation of element on google instant
                    rcnt = document.getElementById("rcnt");
                rcnt.appendChild(next_col);
                window.addEventListener(event_type, onScroll, false);
            }
        });

    }

    function onScroll(e) {
        var y = window.scrollY;
        // if (scroll_events === 0) old_scrollY = y; // stops only if scroll position was on 2. page
        var delta = e.deltaY || y - old_scrollY; // NOTE: e.deltaY for "wheel" event
        if (delta > 0 && (window.innerHeight + y) >= (document.body.clientHeight - (window.innerHeight * request_pct))) {
            console.log("scroll end");
            window.removeEventListener(event_type, onScroll, false);

            try {
                requestNextPage(next_link || document.getElementById("pnnext").href);
            } catch (err) {
                console.error(err.name + ": " + err.message);
                // NOTE: recovery unnecessary, input event handles it with reset on new search
            }
        }
        old_scrollY = y;
        scroll_events += 1;
    }

    // NOTE: Resets the script state on a new search
    function reset() {
        if (input.value !== input_value) {
            input_value = input.value;
            window.scrollTo(0, 0);
            for (var i = 0; i < cols.length; i++)
                rcnt.removeChild(cols[i]);
            cols = [];
            next_link = null;
            old_scrollY = 0;
            scroll_events = 0;
            console.log("RESET");
            }
    }

    console.log("egoogle.js initialized");
});
console.log("egoogle.js loaded");
}(console)</script></body>`)

  console.log('添加 tamperJS：Endless Google.user.js')
}

$done({ body })