var Customer = (function () {
    var customerConfig = {
        "id": "customerId",
        "firstname": {
            "name": "firstName",
            "afterDataBind": setFullName
        },
        "lastname": {
            "name": "lastName",
            "afterDataBind": setFullName
        },
        "fullname": {
            "name": "fullName",
            afterDataBind: function(value) {
                var parts = value.split(" ");
                this["firstName"] = parts[0];
                this["lastName"] = parts[1];
            }
        },
        "domains": {
            "name": "domains",
            beforeDataBind: function(value) {
                return value.split(",");
            },
            beforeGetDataCall: function (value) {
                return value.join(",");
            }
        }
    };

    function setFullName() {
        this["fullName"] = this.getFirstName() + " " + this.getLastName();
    }

    return yam.model.create({
        "name": "Customer",
        "variableMap": customerConfig
    });    
})(); 