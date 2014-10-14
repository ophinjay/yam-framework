if (!window["yam"]) {
    window["yam"] = {};
}

if (!window["yam"]["services"]) {
    window["yam"]["services"] = {};
}

if (!window["yam"]["utilities"]) {
    window["yam"]["utilities"] = {};
}

yam.service = (function() {

    var Service = (function() {
        var service = function(configArr, type) {
            this.serviceType = type;
            this["parameters"] = {};
            this["queries"] = {};
            this["headers"] = {};
            this["path"] = "";
            for (var i = configArr.length - 1; i >= 0; i--) {
                var config = configArr[i];
                setSpecificConfig.call(this, config, "model");
                setSpecificConfig.call(this, config, "dataType");
                setSpecificConfig.call(this, config, "type");
                setSpecificConfig.call(this, config, "async");
                addToObject(this["parameters"], config["parameters"]);
                addToObject(this["queries"], config["queries"]);
                addToObject(this["headers"], config["headers"]);
                config["path"] && (this["path"] += config["path"]);
            }
        };

        function setSpecificConfig(config, property) {
            var value = config[property];
            if (!this[property] || isValid(value)) {
                this[property] = value;
            }
        }

        function addToObject(target, src) {
            for (var i in src) {
                target[i] = src[i];
            }
        }

        function isValid(value) {
            return value !== undefined && value !== null;
        }

        service.prototype = (function() {
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
                return resolveUrl(this.path, dataObj);
            };

            var getHeaders = function(dataObj) {
                return resolveObject.call(this, this.headers, dataObj);
            };

            var getParameters = function(dataObj) {
                return resolveObject.call(this, this.parameters, dataObj);
            };

            var getQueries = function(dataObj) {
                return resolveObject.call(this, this.queries, dataObj);
            };

            var isAsync = function() {
                return this.async;
            };

            var getModelName = function() {
                return this.model;
            };

            var getServiceType = function() {
                return this.serviceType;
            };

            function resolveObject(object, dataObj) {
                var hasContent = false;
                if (object) {
                    dataObject = dataObj || this;
                    if (dataObject) {
                        for (var i in object) {
                            object[i] = resolveProperty(object[i], dataObject);
                            hasContent = true;
                        }
                    }
                }
                return hasContent ? object : undefined;
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
                var url = this.getPath(dataObj);
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
                req.onload(function(eventObject) {
                    // body...
                })
                if (method === "POST") {
                    var parameters = this.getParameters(dataObj);
                    var formData = new FormData();
                    for (i in parameters) {
                        formData.append(i, parameters[i]);
                    }
                    req.send(formData);
                } else {
                    req.send();
                }
                return new yam.utilities.Defer();
            };

            return {
                getUrl: getUrl,
                getDataType: getDataType,
                getType: getType,
                getPath: getPath,
                getParameters: getParameters,
                getQueries: getQueries,
                getHeaders: getHeaders,
                getServiceType: getServiceType,
                isAsync: isAsync,
                trigger: trigger,
                getModelName: getModelName
            };

        })();

        return service;
    })();

    var generate = function(servicesConfig) {
        var appConfig = servicesConfig;
        for (var i in servicesConfig["servicegroups"]) {
            var groupConfig = servicesConfig["servicegroups"][i];
            !yam.services[i] && (yam.services[i] = {});
            if (!groupConfig["services"]["instance"] && !groupConfig["services"]["class"]) {
                yam.services[i] = generateServices(groupConfig["services"]);
            } else {
                yam.services[i] = generateServices(groupConfig["services"]["instance"], "instance", groupConfig, appConfig);
                yam.services[i] = generateServices(groupConfig["services"]["class"], "class", groupConfig, appConfig, yam.services[i]);
            }
        }
        return yam.services;
    };

    function generateServices(config, type, groupConfig, appConfig, returnObj) {
        returnObj = returnObj || {};
        for (var i in config) {
            returnObj[i] = new Service([config[i], groupConfig, appConfig], type);
        }
        return returnObj;
    }

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

yam.utilities = (function() {

    var Promise = function() {
        this.successHandlers = [];
        this.errorHandlers = [];
    };

    Promise.prototype = {
        success: function(fn) {
            this.successHandlers.push(fn);
            if (this.data && this.isResolved) {
                setTimeout(fn(data), 0);
            }
            return this;
        },
        error: function(fn) {
            this.errorHandlers.push(fn);
            if (this.data && !this.isResolved) {
                setTimeout(fn(data), 0);
            }
            return this;
        }
    };

    function setPromiseResolution(promise, data, isResolved) {
        $commons.createReadOnlyProperty(promise, "data", data);
        $commons.createReadOnlyProperty(promise, "isResolved", isResolved);
    };

    var Defer = function() {
        this.promise = new Promise();
    };

    Defer.prototype = {
        resolve: function(data) {
            this.promise.successHandlers.forEach(function(successHandler) {
                setTimeout(successHandler(data), 0);
            });
            setPromiseResolution(this.promise, data, true);
        },
        reject: function(data) {
            this.promise.errorHandlers.forEach(function(errorHandler) {
                setTimeout(errorHandler(data), 0);
            });
            setPromiseResolution(this.promise, data, false);
        }
    };

    return {
        Defer: Defer
    };

})();
