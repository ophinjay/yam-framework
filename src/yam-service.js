if (!window["yam"]) {
    window["yam"] = {};
}

if (!window["yam"]["services"]) {
    window["yam"]["services"] = {};
}

yam.service = (function() {

    var generate = function(servicesConfig) {
        var appLevelClass = createClass();
        var appLevelObj = new appLevelClass(servicesConfig);
        for (var i in servicesConfig["servicegroups"]) {
            var modelConfig = servicesConfig["servicegroups"][i];
            var modelLevelClass = createClass(appLevelObj);
            var modelLevelObj = new modelLevelClass(modelConfig);
            !yam.services[i] && (yam.services[i] = {});
            for (var j in modelConfig["services"]) {
                var serviceConfig = modelConfig["services"][j];
                var serviceLevelClass = createClass(modelLevelObj);
                var serviceLevelObj = new serviceLevelClass(serviceConfig);
                yam.services[i][j] = serviceLevelObj;
            }
        }
        return yam.services;
    };

    function createClass(prototypeObj) {
        var genericService = function(inputObj, serviceGroup) {
            setIfDefined(inputObj, this, "serviceGroup");
            if (inputObj["model"] && !yam.model.isValidModel(inputObj["model"])) {
                throw new Error("The model - " + inputObj["model"] + " - provided for the service group - " + this.serviceGroup + " - has not been registered in the model directory!!!");
            }
            setIfDefined(inputObj, this, "model");
            setIfDefined(inputObj, this, "url");
            setIfDefined(inputObj, this, "dataType");
            setIfDefined(inputObj, this, "type");
            setIfDefined(inputObj, this, "parameters", undefined);
            setIfDefined(inputObj, this, "queries", undefined);
            setIfDefined(inputObj, this, "headers", undefined);
            setIfDefined(inputObj, this, "path", "");
            setIfDefined(inputObj, this, "async", "");
            this.parent = prototypeObj || undefined;
        };

        genericService.prototype = prototypeObj || servicePrototypeFns;
        genericService.prototype.constuctor = genericService;

        return genericService;
    }

    function setIfDefined(src, target, property, defaultValue) {
        target[property] = src[property] || defaultValue;
    }

    var servicePrototypeFns = (function() {
        var getUrl = function(dataObj) {
            return resolveUrl(this.url, dataObj);
        };

        var getDataType = function() {
            return this.dataType;
        };

        var getType = function() {
            return this.type;
        };

        var getPath = function(dataObj) {
            var path = "";
            if (this.parent) {
                path += this.parent.getPath();
            }
            if (this.hasOwnProperty("path")) {
                path += this.path;
            }
            return resolveUrl(path, dataObj);
        };

        var getHeaders = function(dataObj) {
            var config = compileObjectFromPrototypeTree.call(this, "headers", "getHeaders");
            return resolveObject.call(this, config, dataObj);
        };

        var getParameters = function(dataObj) {
            var config = compileObjectFromPrototypeTree.call(this, "parameters", "getParameters");
            return resolveObject.call(this, config, dataObj);
        };

        var getQueries = function(dataObj) {
            var config = compileObjectFromPrototypeTree.call(this, "queries", "getQueries");
            return resolveObject.call(this, config, dataObj);
        };

        var isAsync = function() {
            return this.async;
        };

        function compileObjectFromPrototypeTree(property, getter) {
            var obj;
            if (this.parent) {
                obj = this.parent[getter]();
            }
            if (this.hasOwnProperty(property)) {
                var object = this[property];
                if (object) {
                    for (var i in object) {
                        obj[i] = object[i];
                    }
                }
            }
            return obj;
        }

        function resolveObject(object, dataObj) {
            dataObject = dataObj || this.model;
            var isModel = dataObject && !this.model;
            if(dataObject) {
                for(var i in object) {
                    object[i] = resolveProperty(object[i], dataObject, isModel);
                }
            }
            return object;
        }

        function resolveUrl(url, dataObj) {
            dataObject = dataObj || this.model;
            var isModel = dataObject && !this.model;            
            var parts = url.split("/");
            for (var i = 0; i < parts.length; i++) {
                parts[i] = resolveProperty(parts[i], dataObject, isModel);
            };
            return parts.join("/");
        }

        function resolveProperty(prop, dataObj, isModel) {
            if(/^~/.test(property)) {
                var property = prop.slice(1);
                var resolution = dataObj[property];
                if(resolution.constuctor === Function) {
                    prop = isModel ? dataObj.resolution(property) : resolution(property);
                } else {
                    prop = resolution;
                }
            }
            return prop;
        }

        var trigger = function(dataObj) {
            var url = this.getUrl(dataObj) + this.getPath(dataObj);
            var queries = this.getQueries(dataObj);
            if (queries) {
                var queryString = "?";
                for (var i in queries) {
                    queryString += (i + "=" + queries[i]);
                }
                url += queryString;
            }
            var req = new XMLHttpRequest();
            req.responseType = this.getDataType();
            req.open(this.getType(), url, this.isAsync());
            var headers = this.getHeaders(dataObj);
            if(headers) {
                for(var i in headers) {
                    req.setRequestHeaders(i, headers[i]);
                }
            }
            req.send();
        };

        return {
            getUrl: getUrl,
            getDataType: getDataType,
            getType: getType,
            getPath: getPath,
            getParameters: getParameters,
            getQueries: getQueries,
            getHeaders: getHeaders,
            isAsync: isAsync,
            trigger: trigger
        };

    })();

    return {
        generate: generate
    };

})();
