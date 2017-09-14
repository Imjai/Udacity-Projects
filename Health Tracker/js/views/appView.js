/*global Backbone */
var app = app || {};

(function($) {


app.AppView = Backbone.View.extend({

            el: '.healthtracker',
            //Underscore's template to display the total calories for the day
            template: _.template($('.total-calorie-template').html()),

            initialize: function() {
                var self = this;
                self.date = new Date();
                self.current_date = (self.date.getMonth() + 1 + "/" + self.date.getDate() + "/" + self.date.getFullYear());
                self.$input = self.$('.user-input');
                self.$servings = self.$(".servings");
                self.$list = self.$(".foodRecords");
                self.total_calories = 0;
                self.records;
                $(".date").glDatePicker({
                    onClick: (function(el, cell, date, data) {
                        el.val(date.toLocaleDateString());
                        //every time a new date is chosen from the calendar, updateFoodList function is called to to display records for the chosen date.
                        self.updateFoodList();
                    }),

                });
                //set today's date as the default value for the calendar box
                $(".date").val(self.current_date);
                //once the page loads, call render.
                self.render();

            },

            events: {

                'click .add-food': 'addFood', //call addFood function when "add food" button is clicked
                'click .chart-button': 'calculateChart', //display chart for the week/month when the chart button is clicked
                'keydown .user-input': 'autoSearch', //start search when a character is entered in the input box

            },

            //jQuery's autosearch widget
            autoSearch: function() {
                $(".user-input").autocomplete({
                            delay: 100,
                            source: function(request, response) {

                                // Nutrition URL API call
                                var nutritionURL = "https://api.nutritionix.com/v1_1/search/%QUERY?results=0:10&fields=item_name,brand_name,item_id,nf_calories&appId=41324021&appKey=b16be109bec67fb1282c4b4559e8666f";
                                nutritionURL = nutritionURL.replace('%QUERY', request.term);

                                // JSONP Request
                                $.ajax({
                                    method: 'GET',
                                    dataType: 'json',
                                    url: nutritionURL,
                                    data: JSON.stringify({
                                        item_name: "",
                                        brand_name: "",
                                        item_id: "",
                                        calories: ""

                                    }),
                                    beforeSend: function() {
                                        $(".loading").show();
                                    },
                                }).done(function(data) {
                                    $(".loading").hide();
                                    if (data.hits.length != 0) {
                                        for (i = 0; i < data.hits.length; i++) {
                                            response($.map(data.hits, function(item) {

                                                return {
                                                    value: item.fields.item_name,
                                                    item_name: item.fields.item_name,
                                                    item_id: item.fields.item_id,
                                                    brand_name: item.fields.brand_name,
                                                    calories: item.fields.nf_calories,


                                                }
                                            }));

                                        }
                                    } else {
                                        alert("No records match your search");
                                        response([]);
                                    }
                                }).fail(function() {
                                    alert("Oops, something went wrong with Nutritionix API");
                                });


                    },
                    minLength: 1, //start search with character length 1
                    select: function(event, ui) {
                        //save the item chosen from the API to var records
                        self.records = ui.item;
                    }
            });
    },

    //gets the current date and creates a new collection for the date and add event listeners to the collection
    render: function() {
        var self = this;
        self.$list.html('');
        self.model_date = $(".date").val();
        self.dateUrl = "https://fiery-inferno-4707.firebaseio.com/" + self.model_date.replace(/\//g, '');
        self.foodCollection = new app.FoodCollection([], { url: self.dateUrl });
        self.listenTo(self.foodCollection, 'add', self.displayFood);
        self.listenTo(self.foodCollection, 'remove', self.iterateFood);
        self.renderTotal();
        return self;
    },


    //self function is called every time the add-food button is clicked
    //function creates a new model within the collection
    addFood: function() {
        var self = this;
        if (self.$input.val() == '') {
            return;
        };
        self.foodCollection.create(self.newAttributes());
        self.food = self.foodCollection.models.length;
        self.$input.val('');

    },

    //displays the item added to the collection
    displayFood: function(food) {
        var self = this;
        self.view = new app.FoodRecords({ model: food });
        self.$list.append(self.view.render().el);
        //re-calculate total number of calories
        self.foodCollection.fetch({
            success: function(data) {
                self.renderTotal();
            }
        });

    },

    //function called when a new date is picked
    //uses firebase's promises to check if a collection exists. If no, then call render and instantiate a new collection
    //if collection already exists, then display the data.
    updateFoodList: function() {
        var self = this;
        self.model_date = $(".date").val();
        self.dateUrl = "https://fiery-inferno-4707.firebaseio.com/" + self.model_date.replace(/\//g, '');
        self.ref = new Firebase(self.dateUrl);
        self.ref.once("value", function(snapshot) {
            var a = snapshot.exists();
            if (a === false) {
                self.render();
            } else {
                self.foodCollection = new app.FoodCollection([], { url: self.dateUrl });
                self.iterateFood();

            }
        });
    },

    //display items within a collection
    iterateFood: function() {
        var self = this;
        self.$list.html('');
        self.foodCollection.fetch({
            success: function(data) {
                self.renderTotal();
                data.each(function(food) {
                    var view = new app.FoodRecords({ model: food });
                    $('.foodRecords').append(view.render().el);
                });
            }
        });

    },

    //create data within collection
    newAttributes: function() {
        return {
            item_name: self.records.item_name,
            brand_name: self.records.brand_name,
            calories: self.records.calories,
            item_id: self.records.item_id,
            servings: this.$servings.val(),
            date: self.model_date,
            total_calories: self.records.calories * this.$servings.val()

        }
    },

    //caluclate total calories consumed for the day
    renderTotal: function() {
        var self = this;
        self.cals = 0;
        self.servings = 0;
        self.item_cal = 0;
        self.total_calories = 0;

        self.foodCollection.each(function(model) {

            self.cals = model.get("calories");
            self.num = model.get("servings");
            self.item_cal = self.cals * self.num;
            self.total_calories += self.item_cal;
            return self.total_calories;
        });

        $(".total-calories").html(self.template({ total_cals: self.total_calories }));

    },

    calculateChart: function() {
        var self = this;
        self.date = new Date();
        self.current_date = (self.date.getMonth() + 1) + "-" + self.date.getDate() + "-" + self.date.getFullYear();
        self.curr = new Date(self.current_date);
        self.week = [];

        //week calculator
        for (var i = 0; i < 7; i++) {
            self.first = self.curr.getDate() - self.curr.getDay();
            self.next_day = self.first + i;
            self.calc_date = new Date(self.curr.setDate(self.next_day));
            self.calc_date = (self.calc_date.getMonth() + 1) + "" + self.calc_date.getDate() + "" + self.calc_date.getFullYear();
            self.week.push(self.calc_date);

        }

        self.xaxis = [];
        self.ref = new Firebase("https://fiery-inferno-4707.firebaseio.com/");

        self.ref.once('value').then(function(snapshot) {
            for (var i = 0; i < 7; i++) {
                self.total_day_calories = 0;
                if (snapshot.child(self.week[i]).val() == null) {
                    self.xaxis.push(0);
                } else {
                    snapshot.child(self.week[i]).forEach(function(childSnapshot) {

                        self.childData = childSnapshot.val().total_calories;
                        self.total_day_calories = self.total_day_calories + self.childData;

                    });

                    self.xaxis.push(self.total_day_calories);

                }

            }
            self.displayChart(self.xaxis, self.week);
        }, function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

    },

    displayChart: function(xaxis, week) {
        var self = this;
        $(".chart").animate({ width: 'toggle' });
        $('.closeButton').click(function() {
            this.parentNode.style.display = 'none';
        });
        self.ctx = document.getElementsByClassName("displayChart");
        self.myChart = new Chart(self.ctx, {
            type: 'line',
            data: {
                labels: self.week,
                datasets: [{

                    label: '# of Calories',
                    borderColor: "#1E90FF",
                    data: self.xaxis,

                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });

    }


});

})(jQuery);
