const s = document.createElement("script");
s.src = chrome.runtime.getURL("rymExtension.js");
s.onload = function () {
	this.remove();
};
(document.head || document.documentElement).appendChild(s);
