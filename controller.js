

angular.module('app', ['onsen']);

angular.module('app').controller('FilterController', function($scope, $http) {

  $scope.records = JSON.parse(localStorage.getItem('records'));

  angular.element(document).ready(function() {

    if ($scope.records.food) {
      foodSlider.setChecked(true);
    }
    if ($scope.records.shops) {
      shopSlider.setChecked(true);
    }
    if ($scope.records.outdoors) {
      outdoorSlider.setChecked(true);
    }

    foodSlider.on('change', function(slider) {
      $scope.records.food = slider.value;
    });

    outdoorSlider.on('change', function(slider) {
      $scope.records.outdoors = slider.value;
    });

    shopSlider.on('change', function(slider) {
      $scope.records.shops = slider.value;
    });

  });

  $scope.cancelClick = function() {
    navi.popPage();
  };

  $scope.applyClick = function() {
    localStorage.setItem('records', JSON.stringify($scope.records));

    var event = new CustomEvent("prepop", {});
    document.dispatchEvent(event);

    navi.popPage();
  };
});


angular.module('app').controller('AppController', function($scope, $http) {
  $scope.obj = {
    searchString: 'shibuya',
    state: 'isLoading',
  };

  $scope.cellClick = function(venueID, event) {
    navi.pushPage('detail.html', {
      venueID: venueID
    });
  };

  $scope.obj = {
    searchString: 'shibuya',
    state: 'isLoading',
  };

  document.addEventListener(
    'prepop',
    function() {
      $scope.search();
    });


  $scope.$on('$routeChangeSuccess', function() {});

  $scope.filterClick = function() {
    navi.pushPage('filter.html', {animation: 'lift' });
  };

  var records = JSON.parse(localStorage.getItem('records'));

  if (records === null) {
    records = {
      food: true,
      shops: false,
      outdoors: false
    };

    localStorage.setItem('records', JSON.stringify(records));
  }

  $scope.search = function() {
    $scope.obj.state = 'isLoading';

    // load filter options from localStorage 
    records = JSON.parse(localStorage.getItem('records'));
    if (records === null) {
      records = {
        food: true,
        shops: false,
        outdoors: false
      };
      localStorage.setItem('records', JSON.stringify(records));
    }

    // create the category object
    var category = [];
    if (records.food) category.push('food');
    if (records.shops) category.push('shops');
    if (records.outdoors) category.push('outdoors');

    var clientID = "YZQZP1Q2HEJWMD5ZVBMIQD3VSZC1W4BQCCQTVFEPJWNHL0RK";
    var clientSecret = "ORHPL2VKKHUTB3KTJVDTB4D20AXBRCFKWVL12EPQNJNDFYBX";

    $http.get("https://api.foursquare.com/v2/venues/explore/?near=" + $scope.obj.searchString + "&venuePhotos=1&section=" + category.join(',') + "&client_id=" + clientID + "&client_secret=" + clientSecret + "&v=20131124")
      .then(function(result, status) {
        var items = result.data.response.groups[0].items;

        var help = [];
        for (var el in items) {
          var place = $scope.parseVenue(items[el]);


          help.push(place);
        }

        $scope.obj.state = 'loaded';
        $scope.venues = help;
      }, function(data, status) {
        $scope.obj.state = 'noResult';
      });
  };

  $scope.parseVenue = function(data) {
  var venue = data.venue;
  var price = '$';

  if (venue.price) {
    var value = venue.price.tier;
    while (value > 1) {
      price += '$';
      value--;
    }
  } else {
    price = '';
  }

  var rating = Math.round(venue.rating) / 2.0;
  var plus = [];
  var minus = [];
  for (var i in [0, 1, 2, 3, 4]) {
    if (rating > 0.5) {
      rating--;
      plus.push(i);
    } else {
      minus.push(i);
    }
  }

  return {
    title: venue.name,
    plus: plus,
    minus: minus,
    venueID: venue.id,
    picture_url: venue.photos.groups[0].items[0].prefix + '100x100' + venue.photos.groups[0].items[0].suffix,
    reviews: venue.ratingSignals + ' reviews',
    price: price,
    place: venue.location.formattedAddress[0] + ',' + venue.location.formattedAddress[1],
    category: venue.categories[0].name
  };
};


  $scope.$watch('obj.searchString', function() {
    $scope.search();
  });
});

angular.module('app').controller('DetailController', function($scope, $http) {
  $scope.mapClick = function() {
    window.location.href = "http://maps.google.com/maps?z=16&t=m&q=loc:" +
      $scope.lat + "+" + $scope.lng;
  };

  $scope.venueID = navi.getCurrentPage().options.venueID;
  $scope.obj = {
    state: 'loading',
  };

  var clientID = "YZQZP1Q2HEJWMD5ZVBMIQD3VSZC1W4BQCCQTVFEPJWNHL0RK";
  var clientSecret = "ORHPL2VKKHUTB3KTJVDTB4D20AXBRCFKWVL12EPQNJNDFYBX";

  $http.get(
    "https://api.foursquare.com/v2/venues/" +
    $scope.venueID +
    "?client_id=" + clientID +
    "&client_secret=" + clientSecret +
    "&v=20131124"
  ).then(function(result, status) {
    $scope.obj.state = 'loaded';
    var venue = result.data.response.venue;
    $scope.title = venue.name;
    $scope.imgSrc = venue.bestPhoto.prefix + '300x300' + venue.bestPhoto.suffix;

    $scope.address = venue.location.formattedAddress[0] + ',' + venue.location.formattedAddress[1];
    $scope.openInfo = $scope.parseOpenInformation(venue.popular);
    $scope.lat = venue.location.lat;
    $scope.lng = venue.location.lng;
  }, function(data, status) {
    $scope.obj.state = 'noResult';
  });

  $scope.backClick = function() {
    navi.popPage();
  };

  $scope.parseOpenInformation = function(data) {
  var info = "";
  if (data && data.timeframes) {
    for (var i in data.timeframes[0].open) {
      if (i !== 0) {
        info += '\n';
      }
      info += data.timeframes[0].open[i].renderedTime;
    }
  }

  return info;
};

});
