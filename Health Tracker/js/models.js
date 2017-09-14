var app = app || {};

(function() {
    'use strict';
    app.FoodItem = Backbone.Model.extend({
        defaults: {
            item_name: '',
            brand_name: '',
            calories: 0,
            item_id: '',
            servings: 0,
            date: '',
            total_calories: ''


        },

    });
})();
