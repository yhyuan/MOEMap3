MOEMAP = (function () {
	GEOCODER = (function () {
		var regIsFloat = /^(-?\d+)(\.\d+)?$/;
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
		//http://appdelegateinc.com/blog/2010/05/16/point-in-polygon-checking/
		// Ray Cast Point in Polygon extension for Google Maps GPolygon
		// App Delegate Inc <htttp://appdelegateinc.com> 2010
		function validateLatLngInPolygon(latlng, poly) {
			var lat = latlng.lat;
			var lng = latlng.lng;

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
		    return {
		    	success: inPoly,
		    	latlng: latlng
		    };
		}

	    function validateUTMInRange(utmCoors, UTMRange) {
	    	var northing = utmCoors.northing;
	    	var easting = utmCoors.easting;
	        return ((easting < UTMRange.maxEasting) && (easting > UTMRange.minEasting) && (northing < UTMRange.maxNorthing) && (northing > UTMRange.minNorthing));
	    }

	    function convertUTMtoLatLng(utmCoors) {
	    	var zone = utmCoors.zone;
	    	var north = utmCoors.northing;
	    	var east = utmCoors.easting;

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
	            lat: latitude.toFixed(8),
	            lng: longitude.toFixed(8)
	        };
	        return res;
	    }

		function parseLatLngSymbols(val, s1, s2, s3) {
			var parseDMS = function (s, unparsed) {
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
			};

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
		
		var geocoderList = {
			"LatLngInDecimalDegree" : {
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					if ((coorsArray.length === 2) && regIsFloat.test(coorsArray[0]) && regIsFloat.test(coorsArray[1])) {
						var v0 = Math.abs(parseFloat(coorsArray[0]));
						var v1 = Math.abs(parseFloat(coorsArray[1]));
						var latlng = params.generateLatLngFromFloats(v0, v1);
						var result = validateLatLngInPolygon(latlng, params.regionBoundary);
						if (result.success) {
							params.latlng = result.latlng;
							params.success = true;
							return true;
						} 
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			},
			"LatLngInSymbols" : {
				"matcher": function (params) {
					var degreeSym = String.fromCharCode(176);
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					if ((coorsArray.length === 2) && ((coorsArray[0]).indexOf(degreeSym) > 0) && ((coorsArray[1]).indexOf(degreeSym) > 0)) {
						var v0 = parseLatLngSymbols(coorsArray[0], degreeSym, "'", "\"");
						var v1 = parseLatLngSymbols(coorsArray[1], degreeSym, "'", "\"");
						var latlng = params.generateLatLngFromFloats(v0, v1);
						var result = validateLatLngInPolygon(latlng, params.regionBoundary);
						if (result.success) {
							params.latlng = result.latlng;
							params.success = true;							
							return true;
						} 
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			},
			"LatLngInDMSSymbols" : {
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					if (coorsArray.length === 2) {
						var str1 = (coorsArray[0]).toUpperCase();
						var str2 = (coorsArray[1]).toUpperCase();
						var validateDMSFormat = function (str) {
							for (var i = 0; i <= 9; i++) {
								if (str.indexOf(i + "D") > 0) {
									return true;
								}
							}
							return false;
						};
						if (validateDMSFormat(str1) && validateDMSFormat (str2)) {
							var v0 = parseLatLngSymbols(str1, "D", "M", "S");
							var v1 = parseLatLngSymbols(str2, "D", "M", "S");
							var latlng = params.generateLatLngFromFloats(v0, v1);
							var result = validateLatLngInPolygon(latlng, params.regionBoundary);
							if (result.success) {
								params.latlng = result.latlng;
								params.success = true;								
								return true;
							}
						}
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			},
			"UTMInDefaultZone" : {
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					if ((coorsArray.length === 2) && regIsFloat.test(coorsArray[0]) && regIsFloat.test(coorsArray[1])) {
						var v1 = Math.abs(parseFloat(coorsArray[0]));
						var v2 = Math.abs(parseFloat(coorsArray[1]));
						var utmCoors = {
							easting: Math.min(v1, v2),
							northing: Math.max(v1, v2)
						};
						if (validateUTMInRange(utmCoors, params.UTMRange)) {
							utmCoors.zone = params.defaultUTMZone;
							var latlng = convertUTMtoLatLng(utmCoors);
							var result = validateLatLngInPolygon(latlng, params.regionBoundary);
							if (result.success) {
								params.latlng = result.latlng;
								params.success = true;								
								return true;
							}
						}
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			},
			"UTM" : {
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					if (coorsArray.length === 3) {
						var coorsArrayNoComma = _.map(coorsArray, function (item) {
							return item.replace(",", " ").trim();
						});
						if (_.every(coorsArrayNoComma, function(item) {return regIsFloat.test(item);})) {
							var values = _.map(coorsArrayNoComma, function (item) {
								return Math.abs(parseFloat(item));
							}).sort(function (a, b) {
								return a - b;
							});
							var reg_isInteger = /^\d+$/;
							if (reg_isInteger.test((values[0]).toString())) {
								if ((values[0] >= 15) && (values[0] <= 18)) {
									var utmCoors = {
										zone: values[0],
										easting: values[1],
										northing: values[2]
									};
									if (validateUTMInRange(utmCoors, params.UTMRange)) {
										var latlng = convertUTMtoLatLng(utmCoors);
										var result = validateLatLngInPolygon(latlng, params.regionBoundary);
										if (result.success) {
											params.latlng = result.latlng;
											params.success = true;								
											return true;
										}
									}
								}
							}
						}
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			},
			"GeographicTownship" : {
				mapService: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
				layerID: 0,
				displayPolygon: true,  
				fieldsInInfoWindow: ["NAME"], 
				getInfoWindow: function(attributes){
					return "<strong>" + attributes.NAME + "</strong>";
				}, 
				latitude: "CENY",
				longitude: "CENX",
				getSearchCondition: function(params){
					return "NAME = '" + params.parsedAddress.geographicTownship + "'";
				}, 				
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					var coors_Up = coorsArray.join(' ').toUpperCase();
					var twpInfo = preprocessTWP(coors_Up);
					if (twpInfo.success && twpInfo.isTWPOnly) {
						params.parsedAddress = {
							geographicTownship: twpInfo.TWP,
						};
						params.success = false;
						return true;						
					}
					return false;
				}, 				
				"geocoder": function (params) {
					return params;					
				}
			},
			"GeographicTownshipWithLotConcession" : {
				mapService: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
				layerID: 1,
				displayPolygon: true,  
				fieldsInInfoWindow: ["OFFICIAL_NAME_UPPER", "LOT_NUM_1", "CONCESSION_NUMBER"], 
				getInfoWindow: function(attributes){
					return "<strong>" + attributes.OFFICIAL_NAME_UPPER + " " + attributes.LOT_NUM_1 + " " + attributes.CONCESSION_NUMBER + "</strong>";
				}, 
				latitude: "CENY",
				longitude: "CENX",
				getSearchCondition: function(params){
					return "OFFICIAL_NAME_UPPER" + " = '" + params.parsedAddress.geographicTownship + "' AND CONCESSION_NUMBER = 'CON " + params.parsedAddress.con + "' AND LOT_NUM_1 = 'LOT " + params.parsedAddress.lot + "'";
				},				
				"matcher": function (params) {
					var coorsArray = replaceChar(params.originalAddress, ',', ' ').trim().split(/\s+/);
					var coors_Up = coorsArray.join(' ').toUpperCase();
					var twpInfo = preprocessTWP(coors_Up);
					if (twpInfo.success && (!twpInfo.isTWPOnly) {
						params.parsedAddress = {
							geographicTownship: twpInfo.TWP,
							lot: twpInfo.Lot,
							con: twpInfo.Con
						};
						params.success = false;								
						return true;						
					}
					return false;
				}, 
				"geocoder": function (params) {
					return params;					
				}
			}
		};
		/**
		 * Creates a geocoding Params object using the default setting in Geocoder.
		 *
		 * @param {string} d The address to be geocoded.
		 * @return {object} An ojbect sendt to geocoder.
		 */
		function createGeocodeParams(originalAddress) {
			return {
				originalAddress: originalAddress, 
				geocoderList: geocoderList, 
				regionBoundary: [{x: -95.29920350, y: 48.77505703},{x: -95.29920350, y: 53.07150598}, 	{x: -89.02502409, y: 56.95876930}, 	{x: -87.42238044, y: 56.34499088}, 	{x: -86.36531760, y: 55.93580527}, 	{x: -84.69447635, y: 55.45842206}, 	{x: -81.89837466, y: 55.35612565}, 	{x: -81.96657226, y: 53.17380238}, 	{x: -80.84131182, y: 52.28723355}, 	{x: -79.98884179, y: 51.80985033}, 	{x: -79.34096457, y: 51.74165273}, 	{x: -79.34096457, y: 47.54750019}, 	{x: -78.55669214, y: 46.49043736}, 	{x: -76.61306048, y: 46.14944935}, 	{x: -75.59009645, y: 45.77436253}, 	{x: -74.12384800, y: 45.91075774}, 	{x: -73.98745279, y: 45.02418891}, 	{x: -75.07861443, y: 44.61500329}, 	{x: -75.86288685, y: 44.03532368}, 	{x: -76.88585089, y: 43.69433566}, 	{x: -79.20, y: 43.450196}, 	{x: -78.62488975, y: 42.94416204}, 	{x: -79.54555738, y: 42.43268002}, 	{x: -81.28459623, y: 42.15988961}, 	{x: -82.54625188, y: 41.58020999}, 	{x: -83.26232670, y: 41.95529681}, 	{x: -83.36462310, y: 42.43268002}, 	{x: -82.61444948, y: 42.73956923}, 	{x: -82.17116506, y: 43.59203926}, 	{x: -82.61444948, y: 45.36517692}, 	{x: -84.08069793, y: 45.91075774}, 	{x: -84.93316796, y: 46.69503016}, 	{x: -88.27485047, y: 48.22947621}, 	{x: -89.33191330, y: 47.78619180}, 	{x: -90.32077854, y: 47.68389540}, 	{x: -92.09391619, y: 47.95668581}, 	{x: -94.07164666, y: 48.33177262}, 	{x: -95.29920350, y: 48.77505703}],
				UTMRange: {
					minEasting: 258030.3,        
					maxEasting: 741969.7,        
					minNorthing: 4614583.73,        
					maxNorthing: 6302884.09
				},
				defaultUTMZone: 17,
				/**
				 * Creates a latlng with two floats. In Ontario, the absolute value of longitude is always larger than the absolute value
				 * of latitude. This knowledge is used to determine which value is latitude and which value is longitude. In other areas, 
				 * this function has to be redefined. 
				 *
				 * @param {float, float} two floats.
				 * @return {object} An ojbect sendt to geocoder.
				 */			
				generateLatLngFromFloats: function (v1, v2) {
					var lat = Math.min(v1, v2);
					var lng = -Math.max(v1, v2);
					return {lat: lat, lng: lng};					
				}


			};
		}

		/**
		 * Geocode an address string or geocoding Params. If it is an address string, createGeocodeParams is Creates a geocoding Params object using the default setting in Geocoder.
		 * called to convert it to geocoding params. 
		 *
		 * @param {string} d The address to be geocoded.
		 * @return {object} An ojbect sendt to geocoder.
		 */
		function geocode(params) {
			if ((typeof params) === "string") {
				geocode(createGeocodeParams(params));
			} else {
				var geocoder = _.find(_.values(params.geocoderList), function(geocoder){ 
					return geocoder.matcher(params);
				});
				if(!!geocoder) {
					if (params.success) {

					} else {
						var layer = new gmaps.ags.Layer(geocoder.mapService + "/" + geocoder.layerID);
						var outFields = geocoder.fieldsInInfoWindow;
						outFields.push(geocoder.latitude);
						outFields.push(geocoder.longitude);					
						var queryParams = {
							returnGeometry: geocoder.displayPolygon,
							where: geocoder.getSearchCondition(params),
							outFields: outFields
						};
						layer.query(queryParams, function (fset) {
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
		}

		/**
		 * Creates a reverse geocoding Params object using the default setting in Geocoder.
		 *
		 * @param {object} d The latitude and longitude to be reverse geocoded.
		 * @return {object} An ojbect sendt to reverse geocoder.
		 */
		function createReverseGeocodeParams(latlng) {
			return {
				latlng: latlng
			};
		}

		/**
		 * Geocode an address string or geocoding Params. If it is an address string, createGeocodeParams is Creates a geocoding Params object using the default setting in Geocoder.
		 * called to convert it to geocoding params. 
		 *
		 * @param {string} d The address to be geocoded.
		 * @return {object} An ojbect sendt to geocoder.
		 */
		function reverseGeocode(params) {
			if ((!!params) && params.hasOwnProperty('lat') && params.hasOwnProperty('lng')) {
				reverseGeocode(createReverseGeocodeParams(params));
			} else {

			}
		}

		var module = {
			createGeocodingParams: createGeocodingParams,
			geocode: geocode,
			reverseGeocode: reverseGeocode
		};
		return module;
	})();

	var module = {
		GEOCODER: GEOCODER
	};
	return module;
})();