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
        var result = src[property] || defaultValue;
        result && (target[property] = result);
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
            var config = compileObjectFromPrototypeTree.call(this, "headers");
            return resolveObject.call(this, config, dataObj);
        };

        var getParameters = function(dataObj) {
            var config = compileObjectFromPrototypeTree.call(this, "parameters");
            return resolveObject.call(this, config, dataObj);
        };

        var getQueries = function(dataObj) {
            var config = compileObjectFromPrototypeTree.call(this, "queries");
            return resolveObject.call(this, config, dataObj);
        };

        var isAsync = function() {
            return this.async;
        };

        var getModelName = function() {
            return this.model;
        };

        function compileObjectFromPrototypeTree(property) {
            var config;
            if (this.parent) {
                config = arguments.callee.call(this.parent, property);
            }
            if (this.hasOwnProperty(property)) {
                !config && (config = {});
                var object = this[property];
                if (object) {
                    for (var i in object) {
                        config[i] = object[i];
                    }
                }
            }
            return config;
        }

        function resolveObject(object, dataObj) {
            if (object) {
                dataObject = dataObj || this;
                if (dataObject) {
                    for (var i in object) {
                        object[i] = resolveProperty(object[i], dataObject);
                    }
                }
            }
            return object;
        }

        function resolveUrl(url, dataObj) {
            dataObject = dataObj || this;
            var parts = url.split("/");
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] !== "") {
                    parts[i] = resolveProperty(parts[i], dataObject);
                }
            }
            return parts.join("/");
        }

        function resolveProperty(prop, dataObj) {
            if (prop.constuctor === Object) {
                var transformer = prop["transformer"];
                prop = prop["data"];
            }
            if (/^~/.test(prop)) {
                var property = prop.slice(1);
                var resolution = dataObj[property];
                if (resolution.constructor === Function) {
                    prop = dataObj[property]();
                } else {
                    prop = resolution;
                }
            }
            transformer && transformer(prop);
            return prop;
        }

        var trigger = function(dataObj) {
            debugger;
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
            var method = this.getType();
            var headers = this.getHeaders(dataObj);
            if (headers) {
                for (i in headers) {
                    req.setRequestHeaders(i, headers[i]);
                }
            }
            req.open(method, url, this.isAsync());
            if (method === "POST") {
                var parameters = this.getParameters(dataObj);
                var formData = new FormData();
                for(i in parameters) {
                    formData.append(i, parameters[i]);
                }
                req.send(formData);
            } else {
                req.send();                
            }
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
            trigger: trigger,
            getModelName: getModelName
        };

    })();

    return {
        generate: generate,
        getServices: function(serviceGroup) {
            return window["yam"]["services"][serviceGroup] || {};
        },
        getService: function(serviceGroup, service) {
            return window["yam"]["services"][serviceGroup][service];
        }
    };

})();
