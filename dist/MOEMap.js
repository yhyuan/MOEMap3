/*global document:false */
/*global google:false */
/*global gmaps:false */
/*global LOCATOR:false */
/*global LATLNG_LOCATOR:false */
/*global UTM_LOCATOR:false */
/*global TWP_LOCATOR:false */
/*global ADDRESS_LOCATOR:false */

/*
This module is used to convert the user inputs, such as latitude & longitude, UTM coordinates, 
Geographic Township with/without lot and concession, and address, to decimal laitude and longitude. 

This module requires the following properties are defined in globalConfig.
1) validateLatLngWithRegion method: Give two values, decide which one is latitude and which one is 
longitude. In Ontario, this is determined by the fact that the absoulte value of longitude is always 
larger than the absolute value of latitude. That is the predefined method in globalConfig. Developers
can define their own method with the same name to override this method. 

2) defaultZone: The default UTM zone number. If the users only input the easting and northing, the 
default UTM zone will be used in the UTM search. The predefined UTM zone in globalConfig is 17. 

3) geogTwpService: The URL for Geographic Township with/without lot and concession web service. It contains
the following properties: 
	geogTwpService: {
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",  //URL
		TWPLayerID: 0,   // layer id for Geographic Township layer
		LotLayerID: 1,   // layer id for Geographic Township with lot and concession layer
		outFields: ["CENX", "CENY"],  // output fields for Geographic Township with lot and concession layer
		TWPLayerNameField: "NAME", // Geographic Township Name field inGeographic Township layer
		LotLayerNameFields: {    // Geographic Township Name field, Lot, Concession fields in Geographic Township with lot and concession layer
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	}

4) regionAddressProcess: test whether the input contains province name. In globalConfig, a default method is provided to 
test whether the input contains Ontario or not. If not, Ontario is added to the ending of user input. 

5) regionBoundary: stores the boundary of the province polygon. It is used to test whether a point is within the province or not. 
In globalConfig, the boundary of Ontario is provided. 

6) UTMRange: store the value ranges of easting and northing in UTM coordinates. In globalConfig, the UTM ranges of Ontario is provided as following: 
	UTMRange: {
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	}
7) locatorsAvailable: stores whether specific locator services is available or not. In globalConfig, the default seting makes all four locator services
available. 
	locatorsAvailable: {
		latlng: true,
		utm: true,
		township: true,
		address: true
	}. 

The is an example of configuration in globalConfig:
	regionBoundary: [{x: -95.29920350, y: 48.77505703},	{x: -95.29920350, y: 53.07150598}, 	{x: -89.02502409, y: 56.95876930}, 	{x: -87.42238044, y: 56.34499088}, 	{x: -86.36531760, y: 55.93580527}, 	{x: -84.69447635, y: 55.45842206}, 	{x: -81.89837466, y: 55.35612565}, 	{x: -81.96657226, y: 53.17380238}, 	{x: -80.84131182, y: 52.28723355}, 	{x: -79.98884179, y: 51.80985033}, 	{x: -79.34096457, y: 51.74165273}, 	{x: -79.34096457, y: 47.54750019}, 	{x: -78.55669214, y: 46.49043736}, 	{x: -76.61306048, y: 46.14944935}, 	{x: -75.59009645, y: 45.77436253}, 	{x: -74.12384800, y: 45.91075774}, 	{x: -73.98745279, y: 45.02418891}, 	{x: -75.07861443, y: 44.61500329}, 	{x: -75.86288685, y: 44.03532368}, 	{x: -76.88585089, y: 43.69433566}, 	{x: -79.20, y: 43.450196}, 	{x: -78.62488975, y: 42.94416204}, 	{x: -79.54555738, y: 42.43268002}, 	{x: -81.28459623, y: 42.15988961}, 	{x: -82.54625188, y: 41.58020999}, 	{x: -83.26232670, y: 41.95529681}, 	{x: -83.36462310, y: 42.43268002}, 	{x: -82.61444948, y: 42.73956923}, 	{x: -82.17116506, y: 43.59203926}, 	{x: -82.61444948, y: 45.36517692}, 	{x: -84.08069793, y: 45.91075774}, 	{x: -84.93316796, y: 46.69503016}, 	{x: -88.27485047, y: 48.22947621}, 	{x: -89.33191330, y: 47.78619180}, 	{x: -90.32077854, y: 47.68389540}, 	{x: -92.09391619, y: 47.95668581}, 	{x: -94.07164666, y: 48.33177262}, 	{x: -95.29920350, y: 48.77505703}],
	UTMRange: {
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	},
	locatorsAvailable: {
		latlng: true,
		utm: true,
		township: true,
		address: true
	},
	validateLatLngWithRegion: function(v1, v2){
		var lat = Math.min(v1, v2);
		var lng = -Math.max(v1, v2);
		return {lat: lat, lng: lng};
	},
	regionAddressProcess: function(addressStr){
		var address = addressStr.toUpperCase();
		var regionNames = ["ON", "ONT", "ONTARIO"];
		var res = false;
		for(var i=0; i<regionNames.length; i++){
			if(globalConfig.isAddressEndsWithRegionName(address, regionNames[i])){
				res = true;
			}
		}
		if(!res){
			return addressStr + " Ontario";
		}
		return addressStr;
	},
	defaultZone: 17,
	geogTwpService: {
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
		TWPLayerID: 0,
		LotLayerID: 1,
		outFields: ["CENX", "CENY"],
		TWPLayerNameField: "NAME",
		LotLayerNameFields: {
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	}
*/

var globalConfig = globalConfig || {};
/*globalConfig.informationDivId = globalConfig.informationDivId || 'information';
globalConfig.noResultFound = globalConfig.noResultFound || function(){
	document.getElementById(globalConfig.informationDivId).innerHTML ="<i>" + globalConfig.noResultFoundMsg + "</i>";	
};*/
	/* This the center of Ontario. If the geocoder returns this location as the results, it will be a failure of geocoding. */
	globalConfig.failedLocation = globalConfig.failedLocation || {
		positions: [[51.253775,-85.32321389999998], [42.832714, -80.279923]],
		difference: 0.00001
	};
	/* LOCATOR setting Starts */
	globalConfig.regionBoundary = globalConfig.regionBoundary || [{x: -95.29920350, y: 48.77505703},{x: -95.29920350, y: 53.07150598}, 	{x: -89.02502409, y: 56.95876930}, 	{x: -87.42238044, y: 56.34499088}, 	{x: -86.36531760, y: 55.93580527}, 	{x: -84.69447635, y: 55.45842206}, 	{x: -81.89837466, y: 55.35612565}, 	{x: -81.96657226, y: 53.17380238}, 	{x: -80.84131182, y: 52.28723355}, 	{x: -79.98884179, y: 51.80985033}, 	{x: -79.34096457, y: 51.74165273}, 	{x: -79.34096457, y: 47.54750019}, 	{x: -78.55669214, y: 46.49043736}, 	{x: -76.61306048, y: 46.14944935}, 	{x: -75.59009645, y: 45.77436253}, 	{x: -74.12384800, y: 45.91075774}, 	{x: -73.98745279, y: 45.02418891}, 	{x: -75.07861443, y: 44.61500329}, 	{x: -75.86288685, y: 44.03532368}, 	{x: -76.88585089, y: 43.69433566}, 	{x: -79.20, y: 43.450196}, 	{x: -78.62488975, y: 42.94416204}, 	{x: -79.54555738, y: 42.43268002}, 	{x: -81.28459623, y: 42.15988961}, 	{x: -82.54625188, y: 41.58020999}, 	{x: -83.26232670, y: 41.95529681}, 	{x: -83.36462310, y: 42.43268002}, 	{x: -82.61444948, y: 42.73956923}, 	{x: -82.17116506, y: 43.59203926}, 	{x: -82.61444948, y: 45.36517692}, 	{x: -84.08069793, y: 45.91075774}, 	{x: -84.93316796, y: 46.69503016}, 	{x: -88.27485047, y: 48.22947621}, 	{x: -89.33191330, y: 47.78619180}, 	{x: -90.32077854, y: 47.68389540}, 	{x: -92.09391619, y: 47.95668581}, 	{x: -94.07164666, y: 48.33177262}, 	{x: -95.29920350, y: 48.77505703}];
	globalConfig.TWPSearch = false;  //use to remember whether it is a Township location search. 
	globalConfig.TWPLotConSearch = false; //use to remember whether it is a Township with lot and concession location search.
	globalConfig.UTMRange = globalConfig.UTMRange ||{
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	};
	globalConfig.locatorsAvailable = globalConfig.locatorsAvailable || {
		latlng: true,
		utm: true,
		township: true,
		address: true
	};
	globalConfig.validateLatLngWithRegion = globalConfig.validateLatLngWithRegion  || function(v1, v2){
		var lat = Math.min(v1, v2);
		var lng = -Math.max(v1, v2);
		return {lat: lat, lng: lng};
	};
	//Private method: test whether the input ends keywords
	globalConfig.isAddressEndsWithRegionName = globalConfig.isAddressEndsWithRegionName || function(address, str) {
		if (address.length > str.length + 1) {
			var substr = address.substring(address.length - str.length - 1);
			if (substr === (" " + str) || substr === ("," + str)) {
				return true;
			}
		}
		return false;
	};
	//Private method: test whether the input contains keywords by calling testOntario
	globalConfig.regionAddressProcess = globalConfig.regionAddressProcess || function(addressStr){
		var address = addressStr.toUpperCase();
		var regionNames = ["ON", "ONT", "ONTARIO"];
		var res = false;
		for(var i=0; i<regionNames.length; i++){
			if(globalConfig.isAddressEndsWithRegionName(address, regionNames[i])){
				res = true;
			}
		}
		if(!res){
			return addressStr + " Ontario";
		}
		return addressStr;
	};
	globalConfig.defaultZone = globalConfig.defaultZone || 17;
	globalConfig.geogTwpService = globalConfig.geogTwpService ||{
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
		TWPLayerID: 0,
		LotLayerID: 1,
		latitude: "CENY",
		longitude: "CENX",		
		TWPLayerNameField: "NAME",
		LotLayerNameFields: {
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	};
	/*globalConfig.locationServicesList = globalConfig.locationServicesList || [
		{
			mapService: "http://138.218.29.100/ArcGIS/rest/services/DevJerry/Parcels/MapServer",
			layerID: 0,
			displayPolygon: true,  //For non-polygon layers, it is always false. For polygon layers, you can turn on and off to visualize the polygon.  
			fieldsInInfoWindow: ["ARN"], 
			getInfoWindow: function(attributes){
				return "Assessment Parcel Number: <strong>" + attributes.ARN + "</strong>";
			}, 
			latitude: "Latitude",
			longitude: "Longitude",
			getSearchCondition: function(searchString){
				return "ARN = '" + searchString + "'";
			}, 
			isInputFitRequirements: function(searchString){
				var reg_isInteger = /^\d+$/;
				if ((searchString.length === 20) && (reg_isInteger.test(searchString))) {
					return true;
				}
				return false;				
			}
		},
		{
			mapService: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/permitstotakewater/MapServer",
			layerID: 0,
			displayPolygon: false,  //For non-polygon layers, it is always false. For polygon layers, you can turn on and off to visualize the polygon.  
			fieldsInInfoWindow: ["OFF_NAME"], 
			getInfoWindow: function(attributes){
				return "<strong>" + attributes.OFF_NAME + "</strong>";
			},
			latitude: "LAT_DD",
			longitude: "LONG_DD",
			getSearchCondition: function(searchString){
				return "UPPER(OFF_NAME) = '" + searchString.toUpperCase() + "'";
			}, 
			isInputFitRequirements: function(searchString){
				var coorsArray = searchString.toUpperCase().split(/\s+/);
				if((coorsArray.length <= 1)||(coorsArray.length >= 4)){
					return false;
				}				
				var str = coorsArray[coorsArray.length - 1];		
				if((str === "RIVER") || (str === "CREEK") || (str === "BROOK") || (str === "LAKE") || (str === "HILL")|| (str === "ISLAND")){
					return true;
				}
				return false;
			}
		}		
	];*/
	/* LOCATOR setting Ends */
	
LOCATOR = (function () {
	var regIsFloat = /^(-?\d+)(\.\d+)?$/;
 
	//http://appdelegateinc.com/blog/2010/05/16/point-in-polygon-checking/
	// Ray Cast Point in Polygon extension for Google Maps GPolygon
	// App Delegate Inc <htttp://appdelegateinc.com> 2010
    function isInPolygon(lat, lng1) {
        var lng = lng1;
        if (lng1 > 0) {
            lng = -lng;
        }
        var poly = globalConfig.regionBoundary;
        var numPoints = poly.length;
        var inPoly = false;
        var j = numPoints - 1;
        for (var i = 0; i < numPoints; i++) {
            var vertex1 = poly[i];
            var vertex2 = poly[j];

            if (vertex1.x < lng && vertex2.x >= lng || vertex2.x < lng && vertex1.x >= lng) {
                if (vertex1.y + (lng - vertex1.x) / (vertex2.x - vertex1.x) * (vertex2.y - vertex1.y) < lat) {
                    inPoly = !inPoly;
                }
            }

            j = i;
        }
        return inPoly;
    }
	
   function validateLatLng(lat, lng) {
        if (isInPolygon(lat, lng)) {
            return {
                latLng: new google.maps.LatLng(lat, lng),
                success: true
            };
        }else {
            return {success: false};
        }
    }
		
    function isInPolygonUTM(easting, northing) {
		var UTMRange = globalConfig.UTMRange;
        return ((easting < UTMRange.maxEasting) && (easting > UTMRange.minEasting) && (northing < UTMRange.maxNorthing) && (northing > UTMRange.minNorthing));
    }
	
    function replaceChar(str, charA, charB) {
        var temp = [];
        temp = str.split(charA);
        var result = temp[0];
        if (temp.length >= 2) {
            for (var i = 1; i < temp.length; i++) {
                result = result + charB + temp[i];
            }
        }
        return result;
    }
/*
    function convertUTMtoLatLng(zone, north, east) {
        var pi = 3.14159265358979; //PI
        var a = 6378137; //equatorial radius for WGS 84
        var k0 = 0.9996; //scale factor
        var e = 0.081819191; //eccentricity
        var e_2 = 0.006694380015894481; //e'2
        //var corrNorth = north; //North Hemishpe
        var estPrime = 500000 - east;
        var arcLength = north / k0;
        var e_4 = e_2 * e_2;
        var e_6 = e_4 * e_2;
        var t1 = Math.sqrt(1 - e_2);
        var e1 = (1 - t1) / (1 + t1);
        var e1_2 = e1 * e1;
        var e1_3 = e1_2 * e1;
        var e1_4 = e1_3 * e1;

        var C1 = 3 * e1 / 2 - 27 * e1_3 / 32;
        var C2 = 21 * e1_2 / 16 - 55 * e1_4 / 32;
        var C3 = 151 * e1_3 / 96;
        var C4 = 1097 * e1_4 / 512;

        var mu = arcLength / (a * (1 - e_2 / 4.0 - 3 * e_4 / 64 - 5 * e_6 / 256));
        var FootprintLat = mu + C1 * Math.sin(2 * mu) + C2 * Math.sin(4 * mu) + C3 * Math.sin(6 * mu) + C4 * Math.sin(8 * mu);
        var FpLatCos = Math.cos(FootprintLat);
        //var C1_an = e_2*FpLatCos*FpLatCos;
        var FpLatTan = Math.tan(FootprintLat);
        var T1 = FpLatTan * FpLatTan;
        var FpLatSin = Math.sin(FootprintLat);
        var FpLatSin_e = e * FpLatSin;
        var t2 = 1 - FpLatSin_e * FpLatSin_e;
        var t3 = Math.sqrt(t2);
        var N1 = a / t3;
        var R1 = a * (1 - e_2) / (t2 * t3);
        var D = estPrime / (N1 * k0);
        var D_2 = D * D;
        var D_4 = D_2 * D_2;
        var D_6 = D_4 * D_2;
        var fact1 = N1 * FpLatTan / R1;
        var fact2 = D_2 / 2;
        var fact3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e_2) * D_4 / 24;
        var fact4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e_2 - 3 * C1 * C1) * D_6 / 720;
        var lofact1 = D;
        var lofact2 = (1 + 2 * T1 + C1) * D_2 * D / 6;
        var lofact3 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e_2 + 24 * T1 * T1) * D_4 * D / 120;
        var delta_Long = (lofact1 - lofact2 + lofact3) / FpLatCos;
        var zone_CM = 6 * zone - 183;
        var latitude = 180 * (FootprintLat - fact1 * (fact2 + fact3 + fact4)) / pi;
        var longitude = zone_CM - delta_Long * 180 / pi;
        var res = {
            Latitude: latitude.toFixed(8),
            Longitude: longitude.toFixed(8)
        };
        return res;
    }
	*/
	//Private method: get the centroid and add the polylines

	function returnCentroidAndPolyline(fset, latitude, longitude) {
		var totalX = 0;
		var totalY = 0;
		var totalArea = 0;
		var polylines = [];
		for (var polygonIndex = 0; polygonIndex < fset.features.length; polygonIndex++) {
			var att = fset.features[polygonIndex].attributes;
			var area = 0;
			for (var geometryIndex = 0; geometryIndex < fset.features[polygonIndex].geometry.length; geometryIndex++) {
				var gpolygon = fset.features[polygonIndex].geometry[geometryIndex];
				area = area + google.maps.geometry.spherical.computeArea(gpolygon.getPath());
				polylines.push(gpolygon);
			}
			totalY = totalY + (att[latitude] * area);
			totalX = totalX + (att[longitude] * area);
			totalArea = totalArea + area;
		}
		var gLatLng = new google.maps.LatLng(totalY/totalArea, totalX/totalArea);
		return {
			gLatLng: gLatLng, 
			polylines: polylines
		};
	}
	
	function returnCentroid(fset, latitude, longitude) {
		var totalX = 0;
		var totalY = 0;
		for (var i = 0; i < fset.features.length; i++) {
			var att = fset.features[i].attributes;
			totalY = totalY + att[latitude];
			totalX = totalX + att[longitude];
		}
		var gLatLng = new google.maps.LatLng(totalY/fset.features.length, totalX/fset.features.length);
		return {
			gLatLng: gLatLng
		};
	}
	
	LATLNG_LOCATOR = (function () {

		function processRegionValidation(v1, v2){
			var result = {lat: v1, lng: v2};
			result = globalConfig.validateLatLngWithRegion(v1, v2);
			return result;
		}
		//Private method: parse decimal degree.

		function processDecimalDegree(coorsArray) {
			if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {					
				var v1 = Math.abs(parseFloat(coorsArray[0]));
				var v2 = Math.abs(parseFloat(coorsArray[1]));
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}
		
		//Private method: Parse the string. called by parseLatLng

		function parseDMS(s, unparsed) {
			var res = {
				ParsedNum: 0,
				Unparsed: ""
			};
			if (unparsed.length === 0) {
				return res;
			}
			var arr = unparsed.split(s);
			var result = 0;
			if (arr.length <= 2) {
				if (regIsFloat.test(arr[0])) {						
					result = parseFloat(arr[0]);
				}
				if (arr.length === 2) {
					unparsed = arr[1];
				} else {
					unparsed = "";
				}
			}
			res = {
				ParsedNum: result,
				Unparsed: unparsed
			};
			return res;
		}
		
		//Private method: Parse the string by calling parseDMS. Called by processSymbol and processSymbolDMS

		function parseLatLng(val, s1, s2, s3) {
			var result = 0;
			var parsed = parseDMS(s1, val);
			var deg = parsed.ParsedNum;
			parsed = parseDMS(s2, parsed.Unparsed);
			var min = parsed.ParsedNum;
			parsed = parseDMS(s3, parsed.Unparsed);
			var sec = parsed.ParsedNum;
			if (deg > 0) {
				result = deg + min / 60.0 + sec / 3600.0;
			} else {
				result = deg - min / 60.0 - sec / 3600.0;
			}
			result = Math.abs(result);
			return result;
		}
		
		//Private method: parse symbol degree, minute and second. Need to call parseLatLng method.

		function processSymbol(coorsArray) {
			var degreeSym = String.fromCharCode(176);
			if (((coorsArray[0]).indexOf(degreeSym) > 0) && ((coorsArray[1]).indexOf(degreeSym) > 0)) {
				var v1 = parseLatLng(coorsArray[0], degreeSym, "'", "\"");
				var v2 = parseLatLng(coorsArray[1], degreeSym, "'", "\"");
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}
		
		//Private method: valide whether input contains a number with D. called by processSymbolDMS

		function validateLatLngFormat(str) {
			for (var i = 0; i <= 9; i++) {
				if (str.indexOf(i + "D") > 0) {
					return 1;
				}
			}
			return 0;
		}
		
		//Private method: parse symbol (DMS) degree, minute and second. Need to call parseLatLng and validateLatLngFormat methods.

		function processSymbolDMS(coorsArray) {
			var str1 = (coorsArray[0]).toUpperCase();
			var str2 = (coorsArray[1]).toUpperCase();
			var valid = validateLatLngFormat(str1) * validateLatLngFormat(str2);
			if (valid > 0) {
				var v1 = parseLatLng(str1, "D", "M", "S");
				var v2 = parseLatLng(str2, "D", "M", "S");
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}


		//Public method: use three methods: decimal degree, DMS, and DMS symbols to parse the input
		function process(queryParams, coorsArray) {
			if (coorsArray.length !== 2) {
				return {success:false};
			}
			var res = processDecimalDegree(coorsArray);
			if (!res.success) {
				res = processSymbol(coorsArray);
			}
			if (!res.success) {
				res = processSymbolDMS(coorsArray);
			}
			
			if (res.success) {
				queryParams.gLatLng = res.latLng;
				queryParams.callback(queryParams);
			}
			return res;
		}
				
		var module = {
			process: process
		};
		return module;
	})();

	//Parse the input as UTM
	UTM_LOCATOR = (function () {

		//Private method: Parse default UTM ZONE with only easting and northing

		function processDefaultZone(coorsArray, defaultZone) {
			if (coorsArray.length !== 2) {
				return {success:false};
			}
			if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {			
				var v1 = Math.abs(parseFloat(coorsArray[0]));
				var v2 = Math.abs(parseFloat(coorsArray[1]));
				var v3 = Math.min(v1, v2);
				var v4 = Math.max(v1, v2);
				if (isInPolygonUTM(v3, v4)) {
					var latlng = globalConfig.convertUTMtoLatLng(defaultZone, v4, v3);
					return validateLatLng(latlng.Latitude, latlng.Longitude);
				} else {
					return {success:false};
				}
			} else {
				return {success:false};
			}
		}
		//Private method: Parse general UTM with zone, easting and northing

		function processGeneralUTM(coorsArray) {
			var res = {success:false};
			if (coorsArray.length !== 3) {
				return res;
			}
			var a1 = (coorsArray[0]).replace(",", " ").trim();
			var a2 = (coorsArray[1]).replace(",", " ").trim();
			var a3 = (coorsArray[2]).replace(",", " ").trim();
			if (regIsFloat.test(a1)&&regIsFloat.test(a2)&&regIsFloat.test(a3)) {
				var values = [Math.abs(parseFloat(a1)), Math.abs(parseFloat(a2)), Math.abs(parseFloat(a3))];
				values.sort(function (a, b) {
					return a - b;
				});
				var zoneStr = (values[0]).toString(); //zone
				var reg_isInteger = /^\d+$/;
				if (reg_isInteger.test(zoneStr)) {
					if ((values[0] >= 15) && (values[0] <= 18)) {
						if (isInPolygonUTM(values[1], values[2])) {
							var latlng = globalConfig.convertUTMtoLatLng(values[0], values[2], values[1]); //Zone, Northing, Easting
							return validateLatLng(latlng.Latitude, latlng.Longitude);
						}
					}
				}
			}
			return res;
		}
		function process(queryParams, coorsArray) {
			var res = processDefaultZone(coorsArray, globalConfig.defaultZone);
			if (!res.success) {
				res = processGeneralUTM(coorsArray);
			}
			if (res.success) {
				queryParams.gLatLng = res.latLng;
				queryParams.callback(queryParams);
			}
			return res;
		}		
		var module = {
			process: process
		};
		return module;
	})();

	//Parse the input as Township, Lot, Concession
	TWP_LOCATOR = (function () {


		//Private method: parse the input to get Lot, Concession

		function processLotCon(arr1) {
			if (arr1.length !== 2) {
				return {
					TWP: "",
					Lot: "",
					Con: "",
					isTWPOnly: false,
					success: false
				};
			}
			var TWPname = (arr1[0]).trim().split(/\s+/).join(' '); //replace multiple spaces with one space
			var con = "";
			var lot = "";
			if (((arr1[1]).indexOf("LOT") > 0) && ((arr1[1]).indexOf("CON") > 0)) {
				var arr2 = ((arr1[1]).trim()).split("CON");
				if ((arr2[0]).length === 0) {
					var arr3 = (arr2[1]).split("LOT");
					con = (arr3[0]).trim();
					lot = (arr3[1]).trim();
				} else {
					var arr4 = (arr2[0]).split("LOT");
					con = (arr2[1]).trim();
					lot = (arr4[1]).trim();
				}
			}
			var TWPOnly = false;
			if ((con.length === 0) && (lot.length === 0)) {
				TWPOnly = true;
			}
			return {
				TWP: TWPname,
				Lot: lot,
				Con: con,
				isTWPOnly: TWPOnly,
				success: true
			};
		}
		
		//Private method: parse the input to get Township, Lot, Concession by calling processLotCon

		function preprocessTWP(coors_Up) {
			var res = {
				TWP: "",
				Lot: "",
				Con: "",
				isTWPOnly: false,
				success: false
			};
			if (coors_Up.indexOf(' TWP') > 0) {
				res = processLotCon(coors_Up.split(" TWP"));
			}
			if (!res.success) {
				if (coors_Up.indexOf(' TOWNSHIP') > 0) {
					res = processLotCon(coors_Up.split(" TOWNSHIP"));
				}
			}
			if (!res.success) {
				if (coors_Up.indexOf('CANTON ') === 0) {
					var str = coors_Up.substring(7).trim();
					var lotIndex = str.indexOf(" LOT ");
					var conIndex = str.indexOf(" CON ");
					var index = lotIndex;
					if (conIndex < lotIndex) {
						index = conIndex;
					}
					var parsedList = [];
					if (index === -1) {
						parsedList.push(str);
						parsedList.push("");
					} else {
						parsedList.push(str.substring(0, index));
						parsedList.push(str.substring(index));
					}
					res = processLotCon(parsedList);
				}
			}
			return res;
		}
		
		//Public method: parse the input as Township, Lot, Concession information by calling preprocessTWP, getCentroidAndAddPolylines

		function process(queryParams, coorsArray) {
			var coors_Up = coorsArray.join(' ').toUpperCase();
			var twpInfo = preprocessTWP(coors_Up);

			if (twpInfo.success) {
				var geogTwpService = globalConfig.geogTwpService;								
				var params = {
					returnGeometry: true,
					outFields: [geogTwpService.latitude, geogTwpService.longitude]
				};
				var layerId;
				if (twpInfo.isTWPOnly) {
					params.where = geogTwpService.TWPLayerNameField + " = '" + twpInfo.TWP + "'";
					layerId = geogTwpService.TWPLayerID; //Twp layer
					globalConfig.TWPSearch = true;
				} else {
					params.where = geogTwpService.LotLayerNameFields.TownshipField + " = '" + twpInfo.TWP + "' AND " + geogTwpService.LotLayerNameFields.ConField + " = 'CON " + twpInfo.Con + "' AND " + geogTwpService.LotLayerNameFields.LotField + " = 'LOT " + twpInfo.Lot + "'";
					layerId = geogTwpService.LotLayerID; //Lot Con layer
					globalConfig.TWPLotConSearch = true;
				}
				
				var layer = new gmaps.ags.Layer(geogTwpService.url + "/" + layerId);
				layer.query(params, function (fset) {
					if (fset.features.length > 0) {
						var res = returnCentroidAndPolyline(fset, geogTwpService.latitude, geogTwpService.longitude);
						queryParams.gLatLng = res.gLatLng;
						queryParams.polylines = res.polylines;
						queryParams.zoomlevel = (twpInfo.isTWPOnly) ? globalConfig.twpZoomLevel : globalConfig.lotConcessionZoomLevel;
						queryParams.callback(queryParams);
					} else {
						//console.log("1");
						queryParams.totalCount = 0;
						globalConfig.resultFoundSimple(queryParams);
						//globalConfig.noResultFound();
					}
				});
				return {
					success: true
				};
			} else {
				return {success:false};
			}
		}		
		var module = {
			process: process
		};
		return module;
	})();

	ADDRESS_LOCATOR = (function () {
	    //validate the input is a latitude & longitude. 
		function validateLatLngSearch (coorsArray) {
			if (coorsArray.length === 2) {
				if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {
					return true;
				}
				var degreeSym = String.fromCharCode(176);
				if (((coorsArray[0]).indexOf(degreeSym) > 0) && ((coorsArray[1]).indexOf(degreeSym) > 0)) {
					return true;
				}
				var validateLatLngFormat = function(str) {
					for (var i = 0; i <= 9; i++) {
						if (str.indexOf(i + "D") > 0) {
							return 1;
						}
					}
					return 0;
				};
				var str1 = (coorsArray[0]).toUpperCase();
				var str2 = (coorsArray[1]).toUpperCase();
				var valid = validateLatLngFormat(str1) * validateLatLngFormat(str2);
				if (valid > 0) {
					return true;					
				}
			}
			return false;
		}
		
		//Public method: parse the input as address information by calling isContarionOntario and showRevGeocodeResult		
		function process(queryParams, coorsArray) {
			if (validateLatLngSearch(coorsArray)) {
				queryParams.totalCount = 0;
				globalConfig.resultFoundSimple(queryParams);			
				//globalConfig.noResultFound();
				return;
			}
			
			var geocoder = new google.maps.Geocoder();
			var addressStr = queryParams.address;
			if (addressStr.toUpperCase() === "ONTARIO") {
				queryParams.totalCount = 0;
				globalConfig.resultFoundSimple(queryParams);			
				//globalConfig.noResultFound();
				return;
			}
			addressStr = globalConfig.regionAddressProcess(addressStr);
			geocoder.geocode({
				'address': addressStr
			}, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var max = results.length;
					var notMoved = true;
					for (var i = 0; i < max; i++) {
						var point = results[i].geometry.location;
						var failedPositions = globalConfig.failedLocation.positions;
						var failedDifference = globalConfig.failedLocation.difference;
						var isThisPositionFailed = false;
						for (var j = 0; j < failedPositions.length; j ++) {
							var diff = Math.abs(point.lat() - failedPositions[j][0]) + Math.abs(point.lng() - failedPositions[j][1]);
							if (diff < failedDifference){
								isThisPositionFailed = true;
								break;
							}							
						}
						if (isThisPositionFailed) {
							continue;
						} 
						if (isInPolygon(point.lat(), point.lng())) {
							queryParams.gLatLng = point;
							queryParams.returnedAddress = results[i].formatted_address.toString();
							queryParams.callback(queryParams);
							notMoved = false;
							break;
						}
					}
					if (notMoved) {
						queryParams.totalCount = 0;
						globalConfig.resultFoundSimple(queryParams);					
						//globalConfig.noResultFound();
					}
				} else {
					queryParams.totalCount = 0;
					globalConfig.resultFoundSimple(queryParams);				
					//globalConfig.noResultFound();
				}
			});
		}
		var module = {
			process: process
		};
		return module;
	})();
	

	
    function locate(queryParams) {
        var coors = replaceChar(queryParams.address, ',', ' ').trim();
        var coorsArray = coors.split(/\s+/);
		var res = {success: false};
		/*Use the location service defined in configuration to search the user input. */
		if(typeof(globalConfig.locationServicesList) !== "undefined"){
			for (var i = 0; i < globalConfig.locationServicesList.length; i++) {
				var service = globalConfig.locationServicesList[i];
				if((!res.success)&&service.isInputFitRequirements(coors)){
					res.success = true;
					service.returnGeometry = false;
					if(service.displayPolygon){
						service.returnGeometry = true;
					}
					var outFields2 = service.fieldsInInfoWindow;
					outFields2.push(service.latitude);
					outFields2.push(service.longitude);
					var params = {
						returnGeometry: service.returnGeometry,
						where: service.getSearchCondition(coors),
						outFields: outFields2
					};
					var layer = new gmaps.ags.Layer(service.mapService + "/" +  service.layerID);
					var getInfoWindow = service.getInfoWindow;
					var displayPolygon = service.displayPolygon;
					var latField = service.latitude;
					var lngField = service.longitude;
					layer.query(params, function (fset) {
						var size = 0;
						if(fset){
							size = fset.features.length;
							if (size > 0) {
								queryParams.address = getInfoWindow(fset.features[0].attributes);
								if(displayPolygon){
									var centroid = returnCentroidAndPolyline(fset, latField, lngField);
									queryParams.gLatLng = centroid.gLatLng;
									queryParams.polylines = centroid.polylines;
									queryParams.callback(queryParams);
								}else{
									var centroid2 = returnCentroid(fset, latField, lngField);
									queryParams.gLatLng = centroid2.gLatLng;
									queryParams.callback(queryParams);									
								}
							}else{
								return {success: false};
							}
						}else{
							return {success: false};
						}
					});							
				}
			}
		}
		
		var locatorsAvailable = globalConfig.locatorsAvailable;
		if((!res.success)&&locatorsAvailable.latlng){
			res = LATLNG_LOCATOR.process(queryParams, coorsArray);
		}
        if ((!res.success)&&locatorsAvailable.utm) {
            res = UTM_LOCATOR.process(queryParams, coorsArray);
        }
        if ((!res.success)&&locatorsAvailable.township) {
            res = TWP_LOCATOR.process(queryParams, coorsArray);
        }
        if ((!res.success)&&locatorsAvailable.address) {
            res = ADDRESS_LOCATOR.process(queryParams, coorsArray);
        }
    }
    var module = {
        locate: locate
    };
    return module;
})();
