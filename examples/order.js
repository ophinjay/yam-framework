/**
 * Order Service
 *  - Creates a new order for a report
 *  - Acts as data model for the order creation wizard
 */
var OrderLine = (function() {

    var variableMap = {
        "orderid": "orderId",
        "version": "version",
        "theme": "theme",
        "scopebase": {
            "type": "boolean",
            "name": "scopeBaseSelected"
        },
        "scopelegislation": {
            "type": "boolean",
            "name": "scopeLegislationSelected"
        },
        "scopeeconomicsandjustice": {
            "type": "boolean",
            "name": "scopeEcnomicsJusticeSelected"
        },
        "scopetechnics": {
            "type": "boolean",
            "name": "scopeTechniquesSelected"
        },
        "status": "status",
        "ratingvalue": "ratingValue",
        "rating": "rating",
        "advisetext": "adviseText",
        "attachment": "attachment",
        "isReportTextModified": {
            "type": "boolean",
            "name": "reportTextModified"
        },
        "conclusiontext": "conclusionText",
        "dcgroepid": "performanceCardGroupId",
        "dcid": "performanceCardId",
        "dcName": "performanceCardName",
        "dcGroepName": "performanceCardGroupName",
        "ratingunits": {
            "name": "ratingUnits",
            "beforeValueSet": parseRatings,
            "beforeSyncGet": ratingsArrayToString
        },
        "selectedratingunit": "selectedRatingUnit",
        "code": "dcCode",
        "orderLineReportView": {
            "name": "orderLineReport",
            "type": "array",
            "variableMap": {
                "reportid": "reportId",
                "orderid": "orderId",
                "dcgroepid": "performanceCardGroupId",
                "dcid": "performanceCardId",
                "version": "version",
                "sectionname": "sectionName",
                "introtext": "introText",
                "introattachment": "introAttachment",
                "maptext": "mapText",
                "mapattachment": "mapAttachment",
                "metadatatext": "metadataText",
                "metadataattachment": "metadataAttachment",
                "tabletext": "tableText",
                "tableattachment": "tableAttachment",
                "filetext": "fileText",
                "fileattachment": "fileAttachment",
                "attachment": "attachment",
                "isIntroTextSelected": {
                    "type": "boolean",
                    "name": "introTextSelected"
                },
                "isMetadataTextSelected": {
                    "type": "boolean",
                    "name": "metadataTextSelected"
                },
                "isTableTextSelected": {
                    "type": "boolean",
                    "name": "tableTextSelected"
                },
                "isFileTextSelected": {
                    "type": "boolean",
                    "name": "fileTextSelected"
                }
            }
        }
    };

    function parseRatings(value) {
        return value ? value.split(",") : [];
    }

    function ratingsArrayToString(value) {
        return value.length === 0 ? null : value.join(",");
    }

    var scopeMap = {
        "Base": "scopebase",
        "Legislation": "scopelegislation",
        "EcnomicsJustice": "scopeeconomicsandjustice",
        "Techniques": "scopetechnics"
    };

    var extraProtoFns = (function() {

        function getDataToUpdate() {
            var orderLineReport = this.getOrderLineReport();
            var reportId = orderLineReport.getReportId();
            if (!reportId || reportId === "") {
                this.setReportTextModified(orderLineReport.isModelChanged());
            }
            var returnData = this.getServiceData();
            returnData["orderLineReportView"] = orderLineReport.getServiceData();
            return returnData;
        }

        var getLineDetails = function(successHandler, errorHandler) {
            var serviceObj = this;
            $.ajax({
                url: "/Controller",
                type: "POST",
                data: {
                    'OBJECT': 'NotaryReport',
                    'OPERATION': 'getOrderLinesDetails',
                    'orderid': this.getOrderId(),
                    'dcgroepid': this.getPerformanceCardGroupId(),
                    'dcid': this.getPerformanceCardId()
                },
                dataType: "JSON",
                success: function(data, textstatus) {
                    parseServiceData.call(serviceObj, data["orderline"]);
                    successHandler(serviceObj);
                },
                error: fortierra.utilities.Common.getServiceErrorHandler("Exception while fetching order line details from server.", errorHandler)
            });
        };

        var save = function(successHandler, errorHandler) {
            var dataToUpdate = getDataToUpdate.call(this);
            $.ajax({
                url: "/Controller",
                type: "POST",
                data: {
                    'OBJECT': 'NotaryReport',
                    'OPERATION': 'updateOrderLines',
                    'orderline': JSON.stringify(dataToUpdate)
                },
                dataType: "JSON",
                success: function(data, textstatus) {
                    successHandler(data);
                },
                error: fortierra.utilities.Common.getServiceErrorHandler("Exception while saving order line details.", errorHandler)
            });

        };

        return {
            getLineDetails: getLineDetails,
            save: save
        };
    })();

    return yam.model.create({
        "name": "OrderLineModel",
        "variableMap": variableMap,
        "protoFns": extraProtoFns
    });

})();
