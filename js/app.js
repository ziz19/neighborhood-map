// ----------------------- Model ---------------------------------
var data = [
  {
    title: 'Cathedral of Learning',
    lat: 40.4443,
    lng: -79.9532
  },
  {
    title: 'Phipps Conservatory and Botanical Gardens',
    lat: 40.4396,
    lng: -79.9468
  },
  {
    title: 'Schenley Park',
    lat: 40.4348,
    lng: -79.9425
  },
  {
    title: 'Apple Store Shadyside',
    lat: 40.4511,
    lng: -79.9333
  },
  {
    title: 'Carnegie Museum of Art',
    lat: 40.4437,
    lng: -79.9490
  }
];

// ----------------------- Google Map functions ---------------------------------
var map;
var markers = [];
var infoWindows = [];
var defaultIcon;  // default icon for markers
var highlightedIcon; // highlighted icon when touched


/** initialize the google map api */
function initMap() {

  // initialize the map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.44, lng: -79.96},
    zoom: 15
  });

  // initialze marker icon
  defaultIcon = makeMarkerIcon('323299');
  highlightedIcon = makeMarkerIcon('FFFF24');

  // initialize markers for all stored data
  for(var i = 0; i < data.length; i++) {
    var marker = createMarker(data[i]);
    appendInfoWindow(marker);
    markers.push(marker);  // store created markers in array
  }
}


/** make a customized marker */
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}


/** create and display a marker for specific location */
function createMarker(location) {
  var marker = new google.maps.Marker({
    position: {lat: location.lat, lng: location.lng},
    map: map,
    icon: defaultIcon,
    animation: google.maps.Animation.DROP,
    title: location.title
  });

  // set bouncing effect when the mouse is on the marker
  marker.addListener('mouseover', function() {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  });
  marker.addListener('mouseout', function() {
    marker.setAnimation(null);
  });
  return marker;  // return new created marker to caller
}


/** append an info window to the marker */
function appendInfoWindow(marker) {

  // iniitalize the info window
  var infoWindow = new google.maps.InfoWindow({
    content: '<p>This is ' + marker.title + '</p>'  // set default display message
  });
  infoWindow.marker = marker;

  // display discription from wikipedia on info window
  var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
    marker.title + '&format=json&callback=wikiCallback';
  $.ajax({
      url: wikiUrl,
      dataType: 'jsonp',
      success: function(response) {
        var description = response[2][0];
        if (description) {
          infoWindow.setContent('<p>' + description + '</p>');
        }
      },
      error: function(response, errorCode) {
        alert('We are having an issue from wikipedia\n' +
          'Don\'t worry! Map still works.\n' +
          'Error Code: ' + errorCode);
  });

  // highlight marker when clicked
  marker.addListener('click', function() {
    hideAllInfoWindows(infoWindows);
    marker.setIcon(highlightedIcon);
    infoWindow.open(map, marker);
  });

  // delete infoWindow when closed
  infoWindow.addListener('closeclick', function(){
    infoWindow.close();
    marker.setIcon(defaultIcon);
  });
  infoWindows.push(infoWindow);

}


/** display a specific marker */
function showMarker(marker) {
  marker.setMap(map);
}


/** hide a specific marker */
function hideMarker(marker) {
  marker.setMap(null);
}


/** display all markers */
function showAllMarkers(markers){
  markers.forEach(function(marker) {
    showMarker(marker);
  });
}


/** hide all markers */
function hideAllMarkers(markers){
  markers.forEach(function(marker) {
    hideMarker(marker);
  });
}


/** hide a specific info window*/
function hideInfoWindow(infoWindow) {
  infoWindow.close();
  infoWindow.marker.setIcon(defaultIcon);
}


/** hide all info windows*/
function hideAllInfoWindows(infoWindows) {
  infoWindows.forEach(function(infoWindow) {
    hideInfoWindow(infoWindow);
  });
}

/** handle errors when google map fail to load */
function googleError() {
  document.getElementById('map').innerHTML = 'Sorry, it seems that there is an error when loading google map<br>' +
    'Please try refresh the page';

}

// -------------------------- ViewModel ------------------------------------------
var ViewModel = function() {
  this.locations = ko.observableArray(data.map(function(location, index) {
    return {location, 'index':index, 'visible':ko.observable(true)}; // add visible flag
  }));
  this.searchBar = ko.observable(''); // input from filter box

  // make search bar immediately respond to text change event
  this.searchBar.subscribe(function(newText) {
    this.showListings(); // reset all locations to visible
    var nameLowerCase = newText.toLowerCase();

    // hide places if its name does not contain what's in the search bar
    for(var i = 0; i < this.locations().length; i++) {
      var titleLowerCase = this.locations()[i].location.title.toLowerCase();
      if (!titleLowerCase.includes(nameLowerCase)) {
        this.locations()[i].visible(false);
        hideMarker(markers[i]);
      }
    }
  }, this);

  /** display all listings and markers */
  this.showListings = function() {
    showAllMarkers(markers); // display all markers

    // set all locations in list to visible
    for(var i = 0; i < this.locations().length; i++) {
      this.locations()[i].visible(true);
    }
  };


  /** hide all listings and markers */
  this.hideListings = function() {
    hideAllInfoWindows(infoWindows); // hide all info windows
    hideAllMarkers(markers); // hide all markers

    // set all locations to invisible
    for(var i = 0; i < this.locations().length; i++) {
      this.locations()[i].visible(false);
    }
  };


  /** clear search bar text */
  this.clearFiltering = function() {
    this.searchBar(''); // reset search bar value
  };


  /** create an info window on the map when a list item is click */
  this.onItemClicked = function(item) {
    hideAllInfoWindows(infoWindows); // hide all info windows
    var marker = markers[item.index]; // locate the marker on the map
    var infoWindow = infoWindows[item.index]; // find the info window
    marker.setIcon(highlightedIcon);
    infoWindow.open(map, marker);
  };
};
ko.applyBindings(new ViewModel());
