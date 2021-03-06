function elWithText(cursor, idx, tagName, value, classes) {
    cursor = elementStart(cursor, idx, tagName, {'class': classes});
    cursor = text(cursor, 0, value);
    cursor = elementEnd(cursor);

    return cursor;
}

function fareFamilyHeader(cursor, fareFamilies) {
    var fareFamily;

    cursor = elementStart(cursor, 0, 'div', {'class': 'fare-families'});

        cursor = elementStart(cursor, 0, 'div', {'class': 'fare-family-names'});
        for (var i=0; i<fareFamilies.length; i++) {
            fareFamily = fareFamilies[i];
            cursor = elementStart(cursor, 0, 'h4');
            cursor = text(cursor, 0, fareFamily.name);
            cursor = elementEnd(cursor);
        }
        cursor = elementEnd(cursor);

        cursor = elementStart(cursor, 1, 'div', {'class': 'fare-family-description'});
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

function flightDeparture(cursor, idx, city, date) {
    cursor = elementStart(cursor, idx, 'h3', {'class': 'flight-departure'});
        cursor = elementStart(cursor, 0, 'span');
            cursor = text(cursor, 0, city);
        cursor = elementEnd(cursor);
        cursor = text(cursor, 1, date);
    cursor = elementEnd(cursor);

    return cursor;
}

function flightSummary(cursor, segment) {
    cursor = elementStart(cursor, 0, 'div', {'class': 'flight-summary'});

        cursor = elementStart(cursor, 0, 'header');
            cursor = flightDeparture(cursor, 0, segment.beginLocation.cityName, segment.beginDate);
            cursor = flightDeparture(cursor, 1, segment.endLocation.cityName, segment.endDate);
        cursor = elementEnd(cursor);

        cursor = elementStart(cursor, 1, 'footer');
            cursor = elementStart(cursor, 0, 'div', {'class': "flight-number as-link with-icon"});
                cursor = element(cursor, 0, 'img', {'class': 'icon', width: 14, height: 14, src: "assets/airlinesicons/" + segment.airline.code.toLowerCase() + ".png"});
                cursor = text(cursor, 1, segment.airline.code.toUpperCase() + segment.flightNumber);
            cursor = elementEnd(cursor);
            cursor = elementStart(cursor, 1, 'div', {'class': "flight-stops as-link"});
                cursor = text(cursor, 0, '0 stop(s)');
            cursor = elementEnd(cursor);
            cursor = elementStart(cursor, 2, 'div', {'class': "flight-duration"});
                cursor = text(cursor, 0, segment.duration);
            cursor = elementEnd(cursor);
        cursor = elementEnd(cursor);

    cursor = elementEnd(cursor);

    return cursor;
}

function getRecommendation(itinerary, fareCode) {
    return itinerary.flight.listRecommendation[fareCode];
}

function amountForFare(itinerary, fareCode) {
    var recommendation = getRecommendation(itinerary, fareCode);
    return recommendation ? '$' + Math.ceil(recommendation.amountForAll) : '';
}

function lastSeatsAvailable(itinerary, fareFamilly) {
    const recommendation = getRecommendation(itinerary, fareFamilly.code);
    return !fareFamilly.isMarginal && recommendation && recommendation.showLSA;
}

function fare(cursor, data) {
    var fareFamilly = data.fareFamilly;  //TODO: should be able to pass multiple arguments
    var itinerary = data.itinerary;

    cursor = elementStart(cursor, 0, 'div', {'class': 'fare'}, {
        classes: {
          'fare-inactive': fareFamilly.isMarginal,
          'fare-selected': itinerary === selectedItinerary && selectedFare === fareFamilly.code,
        },
        styles: {'border-color': fareFamilly.color}
        },
      {
          'click': function selectFare() {
              selectedItinerary = itinerary;
              selectedFare = fareFamilly.code;
              refresh();
          }
      });
    if (getRecommendation(itinerary, fareFamilly.code)) {

        // JQ icon
        if (itinerary.isJQOnlyFlight && !fareFamilly.isMarginal) {
            cursor = elementStart(cursor, 0, 'span');
            cursor = element(cursor, 0, 'img', {alt: 'JetStar', width: 66, height: 18, src: 'assets/jetstar_66px.png'});
            cursor = elWithText(cursor, 1, 'div', fareFamilly.name, 'jq-fare-name'); //TODO: check if I'm accessing correct fare name
            cursor = elementEnd(cursor);
        }

        //
        if (!(fareFamilly.isBusiness && !itinerary.flight.hasBusinessCabin)) {
            cursor = elementStart(cursor, 1, 'span', {'class': 'fare-amount as-link'});
            if (fareFamilly.isMarginal) {
                cursor = element(cursor, 0, 'img', {src: "assets/award.svg", width:"24", height:"24"});
            } else {
                cursor = text(cursor, 1, amountForFare(itinerary, fareFamilly.code));
            }
            cursor = elementEnd(cursor);

        } else {
            cursor = elWithText(cursor, 2, 'span', 'N/A', 'no-seats');
        }

    } else {
        cursor = elementStart(cursor, 3, 'span', {'class': 'no-seats'});
        cursor = text(cursor, 0, 'No seats');
        cursor = elementEnd(cursor);
    }

    if (lastSeatsAvailable(itinerary, fareFamilly)) {
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
    var operatedSegments =  [];
    var segments = data.itinerary.segments;

    for (var i=0; i < segments.length; i++) {
        if (segments[i].isOperated) {
            operatedSegments.push(segments[i]);
        }
    }

    cursor = elementStart(cursor, 0, 'div', {'class': 'itinerary'});

        cursor = elementStart(cursor, 0, 'div', {'class': 'itinerary-header'});
            cursor = elementStart(cursor, 0, 'div', {'class': 'itinerary-info right-delimiter'});

                for (var i=0; i< segments.length; i++) {
                    var segment = segments[i];
                    cursor = view(cursor, 0, flightSummary, segment);
                }

                cursor = elementStart(cursor, 1, 'strong', {'class': 'total-duration'});
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
            cursor = elementStart(cursor, 2, 'div', {'class': 'flight-operated with-icon'});
            cursor = element(cursor, 0, 'img', {
                'class': 'icon',
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
    cursor = elementStart(cursor, 0, 'div', {'class': 'container availability'});

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