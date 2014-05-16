if (!window["yam"]) {
    window["yam"] = {};
}

yam.model = (function() {

    var _model = function(inputObj) {
        if(!inputObj["name"] || inputObj["name"].constructor !== String) {
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

        return {
            addChildModel: addChildModel,
            getChildModel: getChildModel
        };

    })();

    function internalConstructor() {
        var args = [].slice.call(arguments, 0);
        this._model = args.pop();
        var dataPosition = 0;
        this._model.config && this._model.config["dataPosition"] && (dataPosition = this._model.config["dataPosition"]);
        var data = args[dataPosition];
        this._model["userConstructor"] && this._model["userConstructor"].apply(this, args);
        data && this.setOriginalData(data);
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
                    var childModel = modelObj.getChildModel(i);
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
        protoObj["getServiceData"] = syncModelToService;
        protoObj["getOriginalData"] = getOriginalData;
        protoObj["setOriginalData"] = setOriginalData;
        protoObj["isModelChanged"] = isModelChanged;
        protoObj["getChildModel"] = getChildModel;
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
            protoObj[getterName] = getGetter(variableName, undefined, config["beforeValueGet"], config["beforeSyncGet"]);
            protoObj[setterName] = getSetter(variableName, undefined, config["afterValueSet"], config["beforeValueSet"]);
            if (config["type"] == "object" || config["type"] == "array") {
                var childModel = oj.utilities.model.create(config);
                modelObj.addChildModel(i, childModel);
            }
        }
        return protoObj;
    }

    function getChildModel(name) {
        return this._model.getChildModel(name);
    }

    function getOriginalData() {
        return this["originalData"];
    }

    function setOriginalData(value) {
        syncServiceToModel(value, this);
        this["originalData"] = value;
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
                    var value = getterValue.getServiceData();
                } else if (config["type"] == "array") {
                    value = [];
                    for (var j = 0; j < getterValue.length; j++) {
                        value.push(getterValue[j].getServiceData());
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
        var originalData = this.getOriginalData();
        var varMap = this["_model"]["variableMap"];
        for (var i in varMap) {
            var config = varMap[i];
            var variableName = config["name"] || config;
            var getterName = getGetterName(variableName, config["type"]);
            var value = this[getterName](true);
            if (config["type"] == "object") {
                isChanged = value.isModelChanged();
            } else if (config["type"] == "array") {
                for (var j = 0; j < value.length; j++) {
                    isChanged = value[j].isModelChanged();
                    if(isChanged) {
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

    function getSetter(variableName, innerObjFn, afterValueSetFn, beforeValueSetFn) {
        return function(value) {
            if (beforeValueSetFn) {
                if (beforeValueSetFn.constructor === Function) {
                    value = beforeValueSetFn.call(this, value, variableName);
                } else if (beforeValueSetFn.constructor === Array) {
                    for (var i = 0; i < beforeValueSetFn.length; i++) {
                        value = beforeValueSetFn[i].call(this, value, variableName);
                    }
                }
            }
            if (innerObjFn) {
                var innerObj = this[innerObjFn]();
                innerObj && (innerObj[variableName] = value);
            } else {
                this[variableName] = value;
            }
            afterValueSetFn && afterValueSetFn.call(this, value, variableName);
        };
    }

    function getGetter(variableName, innerObjFn, beforeValueGetFn, beforeSyncGetFn) {
        return function(isCalledWhileSync) {
            var value;
            if (innerObjFn) {
                var innerObj = this[innerObjFn]();
                value = innerObj[variableName];
            }
            value = this[variableName];
            if (!isCalledWhileSync && beforeValueGetFn) {
                value = beforeValueGetFn.call(this, value, variableName);
                !value && (value = this[variableName]);
            } else if (isCalledWhileSync && beforeSyncGetFn) {
                value = beforeSyncGetFn.call(this, value, variableName);
            }
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

    return {
        create: function(inputObj) {
            var model = new _model(inputObj);
            return model._constructor;
        }
    };

})();
