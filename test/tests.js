test( "hello test", function() {
  ok( 1 == "1", "Passed!" );
});

asyncTest( "MOEMAP.GEOCODER test: Test whether a decimal based latitude and longitude pair can be parsed successfully!", function() {
  MOEMAP.GEOCODER.geocode("43.710335, -79.541211", function (res) {
  	 ok(Math.abs(res.latlng.lat - 43.710335) < 0.0001, "The latitude in geocoding results is correct");
  	 ok(Math.abs(res.latlng.lng - (-79.541211)) < 0.0001, "The longitude in geocoding results is correct");
  	 start();
  });
});