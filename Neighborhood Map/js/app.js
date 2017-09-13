
// Setting the maximum height of the searchResults box
document.getElementById("searchResults").style.maxHeight = (window.innerHeight-345)+"px";

// Setting the minimum width of the searchField
var width = window.innerWidth;
if(width<500)
    document.getElementById("search-field").style.maxWidth = (width-10)+"px";

// Map class used to create maps
var map = function () {
    var self = this;
    var mapView = document.getElementById('map');
    mapView.style.height = window.innerHeight + "px";
    self.mapOptions = {
        center: {lat: 26.8228575, lng: 75.8434138},
        zoom: 15,
        mapTypeControl: false;
    }
    self.map = new google.maps.Map(mapView, self.mapOptions);
    google.maps.event.addDomListener(window, "resize", function () {
        var center = self.map.getCenter();
        google.maps.event.trigger(self.map, "resize");
        self.map.setCenter(center);
    });
};

function AppViewModel() {
    var self = this;

    // Map instance used to display markers on it
    self.map = new Map();

    // Holds the previous selected marker if any
    var prevMarker;

    /**
     * Class for creating map markers containts all the information about that point
     * @param {string} title [location name or title]
     * @param {string} subtitle [location category or subtitle]
     * @param {number} latitude
     * @param {number} longitude
     * @param {string} streetAddress
     * @param {string} cityAddress
     * @param {string} url
     * @param {string} mobileNumber
     */
    self.marker = function (title, subtitle, latitude, longitude, streetAddress) {
        this.title = title;
        this.subtitle = subtitle;
        this.latitude = latitude;
        this.longitude = longitude;
        this.streetAddress = streetAddress;
        this.name = this.title+" - "+this.subtitle;
        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.latitude, this.longitude),
            animation: google.maps.Animation.DROP,
            map: self.map.map
        });
        google.maps.event.addListener(this.marker, 'click', function() {
            self.showInfoWindow(this);
        }.bind(this));
        google.maps.event.addListener(self.map.map, 'click', function() {
            self.infoWindow.close();
            if (prevMarker)
                prevMarker.setAnimation(null);
        });
    };

    // Content of all the locations
    self.markers = ko.observableArray([
        new self.marker("HARIVILLA", "Hotel & Restaurant", 26.8228995, 75.8280929, "Shivam Nagar, Keshar Vihar"),
        new self.marker("Cheelgadi Veg Restaurant", "Restaurant", 26.8228995, 75.8280929, "Airport Road, Jagatpura"),
        new self.marker("C.M. Bakers", "Bakery", 26.8228575, 75.8434138, "Vidhyadhar Nagar, Keshar Vihar"),
        new self.marker("Disco Fly Bar", "Pubs & Bar", 26.8229345, 75.8105829, "417-B, Sanganer Flyover, Shiv Nagar"),
        new self.marker("Apex Hospital", "Hospital", 26.8521994, 75.8262477, "SP-4 & 6, Malviya Nagar Industrial Area"),
        new self.marker("Brown Sugar", "Cafe` & Bakery", 26.8592906, 75.8065908, "G-1, Svc Vinay Building, Opp. Bharat Petroleum"),
        new self.marker("JTM MALL", "Shopping Center", 26.8372743, 75.8365779, "Near Textile Market, Model Town, Jagatpura"),
        new self.marker("Jain Temple", "Temple", 26.83502, 75.8334671, "A-3, Jagatpura Rd, Mayapuri"),
        new self.marker("Triveni Vivah Palace", "Banquet Hall", 26.827819, 75.8452001, "Brij Vatika, 200 Feet Road, Vidhyadhar Nagar"),
        new self.marker("ICICI Bank", "Bank", 26.8272551, 75.8488425, "Plot No-172, Rohini Nagar"),
    ]);

    // Keep track on search query
    self.query = ko.observable("");

    // Filtering markers array
    self.showMarkers = ko.computed(function () {
        return ko.utils.arrayFilter(self.markers(), function (marker) {
            if (marker.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0)
                return marker.show == true;
            else
                return marker.show == false;
        });
    }, self);

    // Shows the suggestions list
    self.showList=ko.observable(true);

    // Hides the suggestions list
    self.hideList = function () {
        this.showList(false);
    };

    // Hide/show markers based on search query
    self.showMarkers.subscribe(function () {
        self.showList(true);
        for (var i = 0; i < self.markers().length; i++) {
            if (self.markers()[i].show === false)
                self.markers()[i].marker.setVisible(false);
            else
                self.markers()[i].marker.setVisible(true);
        }
    });

    // creates a infoWindow to display marker details
    self.infoWindow = new google.maps.InfoWindow({});

    // displaying infowindow with marker details
    self.showInfoWindow = function (marker) {
        if (prevMarker)
            prevMarker.setAnimation(null);
        prevMarker = marker.marker;
        marker.marker.setAnimation(google.maps.Animation.BOUNCE);
        self.infoWindow.setContent('Loading Data...');
        self.map.map.setCenter(marker.marker.getPosition());
        self.map.map.panBy(0,-200);
        self.infoWindow.open(self.map.map, marker.marker);
        self.getInfo(marker);
        self.showList(false);
    };

    // Get location data from FourSquare
    self.getInfo = function (marker) {
        var clientId = "TPIDDHBKB2QFBWEV2MPDOFGUSWXCXGAA5IVOWEMN5ASR3UJW";
        var clientSecret= "4HB1ZZJBVXC3F0BREBPSGXYK0VZ5ALS4XRNJZSBP1JROG0DE";
        var url = "https://api.foursquare.com/v2/venues/search?client_id="+clientId+"&client_secret="+clientSecret+"&v=20130815&ll="+marker.latitude+","+marker.longitude+"&query="+marker.title+"&limit=1";
        $.getJSON(url)
            .done(function (response) {
                response =  response.response.venues[0];
                var html = "<strong>"+ marker.name +"</strong><br>";
                for(var i=0;i<response.location.formattedAddress.length;i++){
                    html+=response.location.formattedAddress[i]+ " ";
                    if(i%2!==0)
                        html+="<br>";
                }
                if(response.location.formattedAddress.length%2!==0)
                    html+="<br>";
                html+= "Number of CheckIns: "+response.stats.checkinsCount+"<br>";
                html+= "Number of Users: "+response.stats.usersCount+"<br>";
                html+= "Verified Place: "+(response.verified ? 'Yes' : 'No')+"<br>";
                if(response.contact.phone)
                    html+="Contact: "+response.contact.phone;
                self.infoWindow.setContent(html);
                //console.log(response);
            })
            .fail(function () {
                self.infoWindow.setContent('Failed to retrive data from FourSquare');
            });
    };
}

// Calls if the google maps is sucessfully loaded
function googleMapSuccess() {
    ko.applyBindings(new AppViewModel());
}

// Calls if google maps can't be loaded
function googleMapError() {
    document.body.innerHTML = "<center><h5>Please Try again !!<br> Unable to load Google Maps</h5></center>";
}