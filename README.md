YAM Framework
=============

There are a number of JavaScript frameworks that eases the task of UI development. However, most of these frameworks have functionality revolving around the creation of views, wiring views together with event handling and binding these views with data. While the multitude of features supported by these frameworks are sufficient for development of websites, when it comes to single page enterprise applications, the data itself is the most important entity.

YAMF aims at providing a framework to define data entities, like customers, as JavaScript classes in web pages along with their related services. Customer can be registered as a model, which will provide a Customer class that can be used to create instances of customers. Services related to a single customer can be registered as functions on the prototype of this class. Functions that are more suited for the customer class as a whole rather than an individual customer, like fetching all active customers, can be defined as static methods available directly on the Customer class.

The main features of the framework are
	
	
- Enables defining data entities as separate classes in frontend
- Auto generated getters and setters for every data field
- Defining services related to data and attaching them to model class prototype
- Defining static services on the model class
- Complete detachment between model and services so that they can be used independently as well

Developer guide for the frame work can be found [here](http://ophinjay.github.io/yam-framework)
