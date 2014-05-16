if (!window["yam"]) {
    window["yam"] = {};
}

yam.service = (function() {

    var generate = function(servicesConfig) {
        var appLevelClass = createClass();
        var appLevelObj = new appLevelClass(servicesConfig);
        for (var i in serviceConfig["modelServices"]) {
            var modelConfig = serviceConfig["modelServices"][i];
            var modelLevelClass = createClass(appLevelObj);
            var modelLevelObj = new modelLevelClass(modelConfig);
            for (var j in modelConfig["services"]) {
                var serviceConfig = modelConfig["services"][j];
                var serviceLevelClass = createClass(modelLevelObj);
                var serviceLevelObj = new serviceLevelClass(serviceConfig[j]);
            }
        }
    };

    function createClass(prototypeObj) {
        var genericService = function(inputObj) {
            this.url = inputObj["url"];
            this.dataType = inputObj["dataType"];
            this.type = inputObj["type"];
            this.parameters = inputObj["parameters"];
            this.queries = inputObj["queries"];
            this.headers = inputObj["headers"];
            this.path = inputObj["path"];
            this.parent = prototypeObj || undefined;
        };

        genericService.prototype = prototypeObj || servicePrototypeFns;

        return genericService;
    }

    var servicePrototypeFns = (function() {
        var getUrl = function() {
            return this.url;
        };

        var getDataType = function() {
            return this.dataType;
        };

        var getType = function() {
            return this.type;
        };

        var getPath = function() {
            var path = "";
            if (this.parent) {
                path += this.parent.getPath();
            }
            if (this.hasOwnProperty("path")) {
                path += this.path;
            }
            return path;
        };

        var getHeaders = function() {
        	return compileObjectFromPrototypeTree.call(this, "headers");
        };

       	var getParameters = function() {
       		return compileObjectFromPrototypeTree.call(this, "parameters");
       	};

       	var getQueries = function() {
       		return compileObjectFromPrototypeTree.call(this, "queries");
       	};

       	function compileObjectFromPrototypeTree(property, getter) {
       		var obj = {};
       		if(this.parent) {
       			obj = this.parent[getter]();
       		}
       		if (this.hasOwnProperty(property)) {
       			var object = this[property];
                for(var i in object) {
                	obj[i] = object[i];
                }
            }
            return obj;
       	}

        return {
            getUrl: getUrl,
            getDataType: getDataType,
            getType: getType,
            getPath: getPath,
			getParameters: getParameters,
			getQueries: getQueries,
			getHeaders: getHeaders
        };

    })();

    return {
        generate: generate
    };
})();
