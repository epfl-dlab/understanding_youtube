(
    async function () {
        console.log("frontpageYouTube.js");
        /** @constant {number} milliseconds */
        const waitMs = 2000;

        browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          if (msg === 'url-update') {
              setTimeout(checkForVideosFromKnownChannels, waitMs);
          }
        });

        function checkForVideosFromKnownChannels() {
            const currentPage = window.location.href;

            // prevents matching in video!
            // console.log(currentPage);
            if (currentPage.match(/watch\?v=/) != null ||
                currentPage.match(/channel/) != null) {
                return;
            }

            const elems = Array.from(document.body
                .querySelectorAll("ytd-rich-item-renderer"));

            function getContent(element) {
                let title = "";
                let channel_link = "";
                let channel_name = "";
                let kind = "";
                try {
                    title = element.querySelector("yt-formatted-string#video-title")
                        .getAttribute("aria-label");
                    const channel = element.querySelector("a#avatar-link");
                    channel_link = channel.getAttribute("href");
                    channel_name = channel.getAttribute("title");
                    kind = "channel";
                } catch (e) {
                    title = element.querySelector("yt-formatted-string#title-text")
                        .getAttribute("title");
                    channel_name = element.querySelector("yt-formatted-string#secondary-text")
                        .getAttribute("title");
                    channel_link = element.querySelector("a.ytd-display-ad-renderer")
                        .getAttribute("href");
                    kind = "ad"
                }

                return {"title": title, "channel_link": channel_link, "channel_name": channel_name, "kind": kind}
            }

            const r = elems.map(x => getContent(x));

            const recs = JSON.stringify(r);
            const loadtime = Date.now();

            sendFrontpageEvent(recs, loadtime)

        }

        function sendFrontpageEvent(recs, loadtime) {
            console.log({
                type: "frontpageYouTube",
                loadTime: loadtime,
                recs: recs
            });
            browser.runtime.sendMessage({
                type: "frontpageYouTube",
                loadTime: loadtime,
                recs: recs
            });
        }
    }()
);
