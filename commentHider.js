// ==UserScript==
// @name         Funimation Comment Hider
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hides unhelpful comments on Funimation.
// @author       InfexiousBand
// @match        https://www.funimation.com/shows*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    //=================================================================================================================================================
    //=================================================================================================================================================
    //SETTINGS (paired in order of priority, so eg. if BLUR is true, REPLACE won't happen; if LESS_THAN_HALF is true, MAX_RATIO wont even matter, etc)
    //=================================================================================================================================================

    const BLUR = true; //if true, blurs unhelpful comments
    const REPLACE = true; //if true, replaces unhelpful comments (with REPLACE_TEXT)
    //note if both the above are false, this script wont do anything..

    const LESS_THAN_HALF = true; //if true, hide comments where less than half the users found it helpful
    const MAX_RATIO = 10; //comments with at least this many "downvotes" will not be shown

    const REPLACE_TEXT = "[REDACTED] (Click to show)"; //what is shown in place of comment if you chose REPLACE

    const WAIT_TIME = 3; //how many seconds to wait before running script. if you have errors or if you have slow page load times (cause of internet?), try increasing this

    //=================================================================================================================================================
    //=================================================================================================================================================

    /*
     structure:
     div id comments
       div class panel-body
         form name addCommentForm
           div class row          <-- write comment etc
           div class writeComment       <-- same as above etc
           div class comment-results      <-- this is what we want
             div class results all-comments
               div data-reviewid        <-- queryselect find stuff with this

    */

    var TIMER;

    function handleComments() {
        //let mainDiv = document.getElementByID("comments");
        let commentsNodeList = document.querySelectorAll("div[data-reviewid]");

        //let comments = [].slice.call(commentsNodeList);
        let comments = commentsNodeList;
        let originals = []; //store original comments to show if user wants
        //console.log("COMMENTS", comments);
        let commentsToHide = [];

        function hideComment(div) {
            //hide this comment
            //div.setAttribute("censored", "yes");
            div.censored = "yes";
            let parent = div[0].parentElement;
            parent.onclick = function(){showComment(div);}
            parent.title = "Click to show";
            commentsToHide.push(div);
            //console.warn("hiding comment with title " + div[0].innerText);
            let title = div[0];
            let desc = div[1];

            if (BLUR) {
                title.style.color = "transparent"; title.style.textShadow = "0 0 7px rgba(0,0,0,0.5)";
                desc.style.color = "transparent"; desc.style.textShadow = "0 0 7px rgba(0,0,0,0.5)";
            } else if (REPLACE) {
                title.innerText = REPLACE_TEXT; title.style.color = "red";
                desc.innerText = REPLACE_TEXT; desc.style.color = "red";
            } else {
                //should probably warn user the script does nothing cause of their settings..
            }
        }

        function showComment(div) {
            let parent = div[0].parentElement;
            parent.onclick = function(){hideComment(div);}
            parent.title = "Click to hide";
            //div.setAttribute("censored", "no");
            div.censored = "no";
            //console.warn("showing comment with title " + div[0].innerText);
            //let myID = parseInt(div.getAttribute("funi_id"), 10);
            let myID = parseInt(div.funi_id, 10);
            let title = div[0];
            let desc = div[1];
            title.style.color = ""; title.style.textShadow = "";
            desc.style.color = ""; desc.style.textShadow = "";
            title.innerText = originals[myID].title;
            desc.innerText = originals[myID].desc;
        }

        let i = 0;
        let id = 0;
        for (let cc of comments) {
            let whichOne = (i === 0 ? 2 : 1); //so, only the first div in list has an additional <h3> that we want to skip
            //console.log("cc", cc);
            i++;
            let c = cc.children;
            let commentDiv = c[whichOne].children;
            //console.log("commentDiv #" + i, commentDiv);
            if (commentDiv.length === 0) { continue; }
            //console.log("title", commentDiv[0]);
            //console.log("desc", commentDiv[1]);
            //console.log("count", commentDiv[2]);
            //from here we have 0-title, 1-desc, 2-count
            let title = commentDiv[0];
            let desc = commentDiv[1];
            let count = commentDiv[2];

            //first store it in originals
            //commentDiv.id = "funi_" + id;
            //commentDiv.setAttribute("funi_id", id);
            commentDiv.funi_id = "" + id;
            let og = {
                id, title: title.innerText, desc: desc.innerText,
            };
            originals.push(og);
            id++;

            let scoreStr = count.firstElementChild.children[3].firstElementChild.innerText;
            let scoreSplit = scoreStr.split(" ");
            //console.log("scoreStr & split", scoreStr, scoreSplit);
            let votes = parseInt(scoreSplit[0], 10);
            let pool = parseInt(scoreSplit[3], 10);
            let ratio = pool - votes;
            //console.log("ratio", ratio);

            if (pool > 0 && LESS_THAN_HALF) {
                if (votes < (pool / 2)) {
                    //hide this comment
                    hideComment(commentDiv);
                }
            } else if (ratio > MAX_RATIO) {
                //hide this comment
                hideComment(commentDiv);
            }
        }
        clearInterval(TIMER);
    }

    //setTimeout(handleComments(), 3000); //setTimeout here is broken, so use setInterval instead
    window.addEventListener('load', function() {
        TIMER = setInterval(handleComments(), WAIT_TIME * 1000);
    }, false);

})();
