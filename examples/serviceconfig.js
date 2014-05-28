var restConfig = {
    "url": "/Controller",
    "dataType": "JSON",
    "type": "POST",
    "async": true,
    "servicegroups": {
        "OrderLineService": {
            "model": "OrderLineModel",
            "parameters": {
                "OBJECT": "NotaryReport"
            },
            "services": {
                "save": {
                    "parameters": {
                        'OPERATION': 'getOrderLinesDetails',
                        'orderid': "~getOrderId",
                        'dcgroepid': "~getPerformanceCardGroupId",
                        'dcid': "~getPerformanceCardId"
                    }
                },
                "getLineDetails": {
                    "parameters": {
                        'OPERATION': 'updateOrderLines',
                        'orderline': {
                            "fn": "~getDataToUpdate",
                            transformer: function(value) {
                                return JSON.stringify(value);
                            }
                        }
                    }
                }
            }
        }
    }
};
