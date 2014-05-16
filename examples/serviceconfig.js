var restConfig = {
    "url": "/Controller",
    "dataType": "JSON",
    "type": "POST",
    "modelServices": {
        "OrderLineService": {
            "model": "OrderLineModel",
            "params": {
                "OBJECT": "NotaryReport"
            },
            "services": {
                "save": {
                    'OPERATION': 'getOrderLinesDetails',
                    'orderid': "~getOrderId",
                    'dcgroepid': "~getPerformanceCardGroupId",
                    'dcid': "~getPerformanceCardId"
                },
                "getLineDetails": {
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
};
