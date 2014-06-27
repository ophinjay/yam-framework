var restConfig = {
    "path": "/Controller",
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
                "instance": {
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
                                "data": "~getDataToUpdate",
                                transformer: function(value) {
                                    return JSON.stringify(value);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

yam.service.generate(restConfig);
