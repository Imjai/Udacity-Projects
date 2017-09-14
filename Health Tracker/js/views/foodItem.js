/* global Backbone */
var app = app || {};

(function($) {
    'use strict';
    app.FoodRecords = Backbone.View.extend({
        tagName: 'li',
        template: _.template($('.item-template').html()),

        render: function() {
            console.log("inside foodrecord");
            this.$el.html(this.template(this.model.attributes));
            return this;
        },

        initialize: function() {
            this.listenTo(this.model, "destroy", this.remove);
        },

        events: {
            'click .delete': 'clear'
        },

        clear: function() {
            app.appview.foodCollection.remove(this.model);

        }
    });
})(jQuery);
