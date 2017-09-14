var app = app || {};

(function() {
    'use strict';
    app.FoodCollection = Backbone.Firebase.Collection.extend({
        model: app.FoodItem,

        initialize: function(models, params) {
            this.url = params.url;
        },

    });


})();
