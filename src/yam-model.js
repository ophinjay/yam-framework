if (!window["yam"]) {
    window["yam"] = {};
}

if (!window["yam"]["models"]) {
    window["yam"]["models"] = {};
}

yam.model = (function() {

    var _model = function(inputObj) {
        if (!inputObj["name"] || inputObj["name"].constructor !== String) {
            throw new Error("Please provide a valid string name for the model!!!");
        }
        this.name = inputObj["name"];
        this.variableMap = inputObj["variableMap"];
        this.config = inputObj["config"];
        this.userConstructor = inputObj["constructor"];
        this.extraProtoFns = inputObj["protoFns"];
        this._constructor = curry(internalConstructor, [this]);
        this.childModels = {};
        createPrototype(this, this._constructor.prototype);
    };

    _model.prototype = (function() {
        var addChildModel = function(name, model) {
            this.childModels[name] = model;
        };

        var getChildModel = function(name) {
            return this.childModels[name];
        };

        var getModelName = function() {
            return this.name;
        };

        return {
            addChildModel: addChildModel,
            getChildModel: getChildModel,
            getModelName: getModelName
        };
    })();

    var _callstack = function() {
        this.set = {};
        this.stack = [];
    };

    _callstack.prototype = (function() {
        var push = function(fnName) {
            this.stack.push(fnName);
            if (!this.set[fnName]) {
                this.set[fnName] = true;
            } else {
                var stackStr = this.stack.join(" -> ");
                this.reset();
                throw new Error("Infinite loop!!\nStack trace: " + stackStr);
            }
        };

        var pop = function() {
            var fnName = this.stack.pop();
            this.set[fnName] = false;
        };

        var reset = function() {
            this.set = {};
            this.stack = [];
        };

        return {
            push: push,
            pop: pop,
            reset: reset
        };
    })();

    function internalConstructor() {
        var args = [].slice.call(arguments, 0);
        this._model = args.pop();
        if (this._model["userConstructor"]) {
            var data = this._model["userConstructor"].apply(this, args);
        }
        if (!data) {
            data = args[0];
        }
        this.callRegister = new _callstack();
        data && this.$setOriginalData(data);
    }

    function syncServiceToModel(serviceData, modelObj) {
        for (var i in serviceData) {
            var config = modelObj["_model"]["variableMap"][i];
            if (config) {
                var variableName = config["name"] || config;
                var setterName = getSetterName(variableName);
                if (config["type"] !== "object" && config["type"] !== "array") {
                    modelObj[setterName](serviceData[i]);
                } else {
                    var childModel = modelObj.$getChildModel(i);
                    if (config["type"] == "object") {
                        var value = new childModel(serviceData[i]);
                    } else {
                        value = [];
                        for (var j = 0; j < serviceData[i].length; j++) {
                            value.push(new childModel(serviceData[i][j]));
                        }
                    }
                    modelObj[setterName](value);
                }
            }
        }
    }

    var createPrototype = function(modelObj, protoObj) {
        var variableMap = modelObj["variableMap"];
        var extraProtoFns = modelObj["extraProtoFns"];
        protoObj = addAccessors(modelObj, protoObj);
        protoObj["$getData"] = syncModelToService;
        protoObj["$getOriginalData"] = getOriginalData;
        protoObj["$setOriginalData"] = setOriginalData;
        protoObj["$isModelChanged"] = isModelChanged;
        protoObj["$getChildModel"] = getChildModel;
        if (extraProtoFns) {
            for (var i in extraProtoFns) {
                protoObj[i] = extraProtoFns[i];
            }
        }
        return protoObj;
    };

    function addAccessors(modelObj, protoObj) {
        protoObj = protoObj || {};
        var variableMap = modelObj["variableMap"];
        for (var i in variableMap) {
            var config = variableMap[i];
            var variableName = config["name"] || config;
            var getterName = getGetterName(variableName, config["type"]);
            var setterName = getSetterName(variableName);
            protoObj[getterName] = getGetter(variableName, config);
            protoObj[setterName] = getSetter(variableName, config);
            if (config["type"] == "object" || config["type"] == "array") {
                var childModel = yam.model.create(config);
                modelObj.addChildModel(i, childModel);
            }
        }
        return protoObj;
    }

    function getChildModel(name) {
        return this._model.getChildModel(name);
    }

    function getOriginalData() {
        return this["_originalData"];
    }

    function setOriginalData(value) {
        syncServiceToModel(value, this);
        this["_originalData"] = value;
    }

    function syncModelToService(filterMap) {
        var returnData = {};
        var varMap = this["_model"]["variableMap"];
        var filter = filterMap ? getFilterMap(filterMap) : undefined;
        for (var i in varMap) {
            if (!filter || filter[i]) {
                var config = varMap[i];
                if (config["avoidInSync"]) {
                    continue;
                }
                var variableName = config["name"] || config;
                var getterName = getGetterName(variableName, config["type"]);
                var getterValue = this[getterName](true);
                if (config["type"] == "object") {
                    var value = getterValue.$getData();
                } else if (config["type"] == "array") {
                    value = [];
                    for (var j = 0; j < getterValue.length; j++) {
                        value.push(getterValue[j].$getData());
                    }
                } else {
                    value = getterValue;
                }
                if (config["avoidIfNull"] && (value === "" || value === undefined)) {
                    continue;
                }
                returnData[i] = value;
            }
        }
        return returnData;
    }

    function getFilterMap(filterMap) {
        var returnMap = filterMap;
        if (filterMap.constructor === Array) {
            returnMap = {};
            for (var i = 0; i < filterMap.length; i++) {
                returnMap[filterMap[i]] = true;
            }
        }
        return returnMap;
    }

    function isModelChanged() {
        var isChanged = false;
        var originalData = this.$getOriginalData();
        var varMap = this["_model"]["variableMap"];
        for (var i in varMap) {
            var config = varMap[i];
            var variableName = config["name"] || config;
            var getterName = getGetterName(variableName, config["type"]);
            var value = this[getterName](true);
            if (config["type"] == "object") {
                isChanged = value.$isModelChanged();
            } else if (config["type"] == "array") {
                for (var j = 0; j < value.length; j++) {
                    isChanged = value[j].$isModelChanged();
                    if (isChanged) {
                        return true;
                    }
                }
            } else {
                isChanged = (originalData[i] !== value);
            }
            if (isChanged) {
                return true;
            }
        }
        return false;
    }

    function getSetterName(variableName) {
        var fnSuffix = capitalize(variableName);
        return "set" + fnSuffix;
    }

    function getGetterName(variableName, type) {
        fnSuffix = capitalize(variableName);
        var fnPrefix = "get";
        type && type === "boolean" && (fnPrefix = "is");
        return fnPrefix + fnSuffix;
    }

    function getSetter(variableName, config) {
        var afterDataBindFn = config["afterDataBind"];
        var beforeDataBindFn = config["beforeDataBind"];
        return function(value) {
            this.callRegister.push(getSetterName(variableName));
            if (beforeDataBindFn) {
                if (beforeDataBindFn.constructor === Function) {
                    value = beforeDataBindFn.call(this, value, variableName);
                } else if (beforeDataBindFn.constructor === Array) {
                    for (var i = 0; i < beforeDataBindFn.length; i++) {
                        value = beforeDataBindFn[i].call(this, value, variableName);
                    }
                }
            }
            this[variableName] = value;
            afterDataBindFn && afterDataBindFn.call(this, value, variableName);
            this.callRegister.pop();
        };
    }

    function getGetter(variableName, config) {
        var beforeGetFn = config["beforeGet"];
        var beforeSyncGetFn = config["beforeGetDataCall"];
        var type = config["type"];
        return function(isCalledWhileSync) {
            var value;
            this.callRegister.push(getGetterName(variableName, type));
            value = this[variableName];
            if (!isCalledWhileSync && beforeGetFn) {
                value = beforeGetFn.call(this, value, variableName);
                !value && (value = this[variableName]);
            } else if (isCalledWhileSync && beforeSyncGetFn) {
                value = beforeSyncGetFn.call(this, value, variableName);
            }
            this.callRegister.pop();
            return value;
        };
    }

    //Utilities

    function capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
    }

    function curry(fn, args) {
        args = args || [];
        return function() {
            fn.apply(this, [].slice.call(arguments, 0).concat(args));
        };
    }

    //Library functions
    var create = function(inputObj) {
        var model = new _model(inputObj);
        window["yam"]["models"][model.name] = model;
        if (inputObj["services"]) {
            this.attachServices(model.name, inputObj["services"]);
        }
        return model._constructor;
    };

    var isValidModel = function(modelName) {
        return !!window["yam"]["models"][modelName];
    };

    var getModelClass = function(modelName) {
        return window["yam"]["models"][modelName];
    };

    var attachServices = function(modelName, serviceGroups) {
        var arr = (serviceGroups.constructor === Array ? serviceGroups : [serviceGroups]);
        var model = this.getModelClass(modelName);
        if (!model) {
            throw "Invalid model!!!";
        } else {
            for (var i = 0; i < arr.length; i++) {
                var services = yam.service.getServices(arr[i]);
                for (var j in services) {
                    var service = services[j];
                    var serviceType = service.getServiceType();
                    if (service.getModelName() !== model.name) {
                        throw "Service " + j + " in service group " + arr[i] + " is not applicable for the model " + modelName;
                    } else if (serviceType === "instance") {
                        model._constructor.prototype[j] = getProtoTriggerFn(service);
                    } else if (serviceType === "class") {
                        model._constructor[j] = getClassTriggerFn(service);
                    }
                }
            }
        }
    };

    function getProtoTriggerFn(serviceObj) {
        return function() {
            return serviceObj.trigger(this);
        };
    }

    function getClassTriggerFn(serviceObj) {
        return function(dataObj) {
            return serviceObj.trigger(dataObj);
        };
    }

    return {
        "create": create,
        "isValidModel": isValidModel,
        "getModelClass": getModelClass,
        "attachServices": attachServices
    };

})();
