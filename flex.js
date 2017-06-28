function elWithText(cursor, idx, tagName, value, classes) {
    cursor = elementStart(cursor, idx, tagName, {className: classes});
    cursor = text(cursor, 0, value);
    cursor = elementEnd(cursor);

    return cursor;
}

function fareFamilyHeader(cursor, fareFamilies) {
    var fareFamily;

    cursor = elementStart(cursor, 0, 'div', {className: 'fare-families'});

        cursor = elementStart(cursor, 0, 'div', {className: 'fare-family-names'});
        for (var i=0; i<fareFamilies.length; i++) {
            fareFamily = fareFamilies[i];
            cursor = elementStart(cursor, 0, 'h4');
            cursor = text(cursor, 0, fareFamily.name);
            cursor = elementEnd(cursor);
        }
        cursor = elementEnd(cursor);

        cursor = elementStart(cursor, 1, 'div', {className: 'fare-family-description'});
        for (var i=0; i<fareFamilies.length; i++) {
            fareFamily = fareFamilies[i];
            cursor = elementStart(cursor, 0, 'div');
            cursor = text(cursor, 0, fareFamily.shortDescription);
            cursor = elementEnd(cursor);
        }
        cursor = elementEnd(cursor);

    cursor = elementEnd(cursor);

    return cursor;
}

function flightSummary(cursor, segment) {
    cursor = elementStart(cursor, 0, 'div', {className: 'flight-summary'});

        cursor = elementStart(cursor, 0, 'header');
            cursor = elementStart(cursor, 0, 'h3', {className: 'flight-departure'});
                cursor = elementStart(cursor, 0, 'span');
                    cursor = text(cursor, 0, segment.beginLocation.cityName);
                cursor = elementEnd(cursor);
                cursor = text(cursor, 1, segment.beginDate);
            cursor = elementEnd(cursor);

            cursor = elementStart(cursor, 0, 'h3', {className: 'flight-departure'});
                cursor = elementStart(cursor, 0, 'span');
                    cursor = text(cursor, 0, segment.endLocation.cityName);
                cursor = elementEnd(cursor);
                cursor = text(cursor, 1, segment.endDate);
            cursor = elementEnd(cursor);

        cursor = elementEnd(cursor);

        cursor = elementStart(cursor, 1, 'footer');
            cursor = elementStart(cursor, 0, 'div', {className: "flight-number as-link with-icon"});
                cursor = element(cursor, 0, 'img', {className: 'icon', width: 14, height: 14, src: "assets/airlinesicons/" + segment.airline.code.toLowerCase() + ".png"});
                cursor = text(cursor, 1, segment.airline.code.toUpperCase() + segment.flightNumber);
            cursor = elementEnd(cursor);
            cursor = elementStart(cursor, 1, 'div', {className: "flight-stops as-link"});
                cursor = text(cursor, 0, '0 stop(s)');
            cursor = elementEnd(cursor);
            cursor = elementStart(cursor, 2, 'div', {className: "flight-duration"});
                cursor = text(cursor, 0, segment.duration);
            cursor = elementEnd(cursor);
        cursor = elementEnd(cursor);

    cursor = elementEnd(cursor);

    return cursor;
}

function fare(cursor, data) {
    var fareFamilly = data.fareFamilly;  //TODO: should be able to pass multiple arguments
    var itinerary = data.itinerary;

    //TODO: measure cost of closures
    function getRecommendation(fareCode) {
        return itinerary.flight.listRecommendation[fareCode];
    }

    function hasRecommendation() {
        return getRecommendation(fareFamilly.code) !== undefined;
    }

    function amountForFare() {
        var recommendation = getRecommendation(fareFamilly.code);
        return recommendation ? '$' + Math.ceil(recommendation.amountForAll) : '';
    }

    function lastSeatsAvailable(fareFamilly) {
        const recommendation = getRecommendation(fareFamilly.code);
        return !fareFamilly.isMarginal && recommendation && recommendation.showLSA;
    }

    var classes = 'fare';
    if (fareFamilly.isMarginal) {
        classes +=' fare-inactive';
    }
    if (itinerary === selectedItinerary && selectedFare === fareFamilly.code) {
        classes +=' fare-selected';
    }

    cursor = elementStart(cursor, 0, 'div', null, {
          className: classes, //TODO: use class.foo instead
          'style.border-color': fareFamilly.color
      },
      {
          click: function() {
              selectedItinerary = itinerary;
              selectedFare = fareFamilly.code;
              refresh();
          }
      });
    if (hasRecommendation()) {

        // JQ icon
        if (itinerary.isJQOnlyFlight && !fareFamilly.isMarginal) {
            cursor = elementStart(cursor, 0, 'span');
            cursor = element(cursor, 0, 'img', {alt: 'JetStar', width: 66, height: 18, src: 'assets/jetstar_66px.png'});
            cursor = elWithText(cursor, 1, 'div', fareFamilly.name, 'jq-fare-name'); //TODO: check if I'm accessing correct fare name
            cursor = elementEnd(cursor);
        }

        //
        if (!(fareFamilly.isBusiness && !itinerary.flight.hasBusinessCabin)) {
            cursor = elementStart(cursor, 1, 'span', {className: 'fare-amount as-link'});
            if (fareFamilly.isMarginal) {
                cursor = element(cursor, 0, 'img', {src: "assets/award.svg", width:"24", height:"24"});
            } else {
                cursor = text(cursor, 1, amountForFare());
            }
            cursor = elementEnd(cursor);

        } else {
            cursor = elWithText(cursor, 2, 'span', 'N/A', 'no-seats');
        }

    } else {
        cursor = elementStart(cursor, 3, 'span', {className: 'no-seats'});
        cursor = text(cursor, 0, 'No seats');
        cursor = elementEnd(cursor);
    }

    if (lastSeatsAvailable(fareFamilly)) {
        cursor =  elWithText(cursor, 4, 'div', '5 or fewer seats', 'last-seats');
    }

    cursor = elementEnd(cursor);

    return cursor;
}

function fareDetails(cursor, data) {
    cursor = elWithText(cursor, 0, 'div', 'Points', '');
    cursor = elWithText(cursor, 1, 'div', 'Credit', '');

    cursor = elWithText(cursor, 3, 'button', 'Full fare conditions', 'btn-link full-fare');

    return cursor;
}

function itineraryAvail(cursor, data) {
    var operatedSegments =  data.itinerary.segments.filter(function(segment) {
     return segment.isOperated;
    });

    cursor = elementStart(cursor, 0, 'div', {className: 'itinerary'});

        cursor = elementStart(cursor, 0, 'div', {className: 'itinerary-header'});
            cursor = elementStart(cursor, 0, 'div', {className: 'itinerary-info right-delimiter'});

                for (var i=0; i< data.itinerary.segments.length; i++) {
                    var segment =  data.itinerary.segments[i];
                    cursor = view(cursor, 0, flightSummary, segment);
                }

                cursor = elementStart(cursor, 1, 'strong', {className: 'total-duration'});
                cursor = text(cursor, 0, 'Total duration ' + data.itinerary.duration);
                cursor = elementEnd(cursor);
            cursor = elementEnd(cursor);

            for (var j=0; j<data.fareFamilies.length; j++) {
                var  fareFamilly = data.fareFamilies[j];
                cursor = view(cursor, 1, fare, {
                    fareFamilly : fareFamilly, 
                    itinerary: data.itinerary
                });
            }
        cursor = elementEnd(cursor);

    if (data.itinerary === selectedItinerary) {
        cursor = view(cursor, 1, fareDetails, {});
    }

    cursor = elementEnd(cursor);

    if (operatedSegments.length) {
        for (var k=0; k<operatedSegments.length; k++) {
            var segment = operatedSegments[k];
            cursor = elementStart(cursor, 2, 'div', {className: 'flight-operated with-icon'});
            cursor = element(cursor, 0, 'img', {
                className: 'icon',
                src: 'assets/airlinesicons/' + segment.airline.code.toLowerCase() + '.png',
                width: 14,
                height: 14
            });
            cursor = text(cursor, 1, 'Flight ' + segment.airline.code.toUpperCase() + segment.flightNumber + ' is operated by ' + segment.operatedBy.airlineName);
            cursor = elementEnd(cursor);
        }
    }

    return cursor;
}

function app(cursor, data) {
    cursor = elementStart(cursor, 0, 'div', {className: 'container availability'});

    var avail = data.availability;

    for (var i=0; i<avail.bounds.length; i++) {
        var bound = avail.bounds[i];
        cursor = elementStart(cursor, 1, 'div');
        cursor = view(cursor, 0, fareFamilyHeader, avail.fareFamilies);
        for (var j=0; j<bound.itineraries.length; j++) {
            var itinerary = bound.itineraries[j];
            cursor = view(cursor, 1, itineraryAvail, {itinerary: itinerary, fareFamilies: avail.fareFamilies});
        }
        cursor = elementEnd(cursor);
    }

    cursor = elementEnd(cursor);

    return cursor;
}

//TODO: event handlers and refresh (ideas: expose refresh on cursor and keep root cursor around)
//TODO: setting class with class.foo