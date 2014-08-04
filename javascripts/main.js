(function() {
    var eventsConfig = {
        "click": {
            "#menu div": function(eventObject) {
                var currentSelected = document.querySelector("#menu div.selected");
                currentSelected.classList.remove("selected");
                eventObject.target.classList.add("selected");

                var currentSection = currentSelected.getAttribute("section");
				document.querySelector("#main_content > div[section=" + currentSection + "]").classList.add("hide");
				
				var newSection = eventObject.target.getAttribute("section");
				document.querySelector("#main_content > div[section=" + newSection + "]").classList.remove("hide");
            }
        }
    };

    (function(eventsConfig) {
        for (var eventName in eventsConfig) {
            var queries = eventsConfig[eventName];
            for (var query in queries) {
                var fn = queries[query];
                var elements = document.querySelectorAll(query);
                for (var i = elements.length - 1; i >= 0; i--) {
                    elements[i].addEventListener(eventName, fn);
                }
            }
        }
    })(eventsConfig);
})();
