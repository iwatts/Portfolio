$( document ).ready(function() {
    runcode(numholes);
});

// SET GLOBAL VAR

var numplayers = 6;
var numholes = 18;
var myTime = setInterval(function () { myTimer(), 1000});

var map;

var myLat;
var myLng;
var courseLat = 0;
var courseLng = 0;

var defZoom = 1;
var xmlhttp = new XMLHttpRequest();

var localObj = {latitude:myLat, longitude:myLng, radius:10};
var myCourse = {};
var myCourseSelection = {};

var items = "";
var yards = "";
var choosenCourse = "";


function coursesLoaded() {

    //LOOP THROUGH LOCAL COURSES, RUN AFTER GETTING LOCATION FROM USER

    $.post("https://golf-courses-api.herokuapp.com/courses",localObj, function(data,status) {
        myCourse = JSON.parse(data);
        var listCourses = "<option disabled selected>Select A Course</option>";

        for (var gc in myCourse.courses) {
            listCourses += "<option value='" + myCourse.courses[gc].id + "'>" + myCourse.courses[gc].name + "</option>";
        }

        //OVERWRITE LOADING GIF TO SHOW SELECTION

        $(".courselist #courses").html(listCourses);

    });
}

function filterById(jsonObject, id) {
    return jsonObject.filter(function(jsonObject) {
        return (jsonObject['id'] == id);
    })[0];
}

function courseSelect(courseID) {
    myCourseSelection = filterById(myCourse['courses'], courseID);
    choosenCourse = myCourseSelection.href;

    $(".c-title").html(myCourseSelection.name);

    $.getJSON( myCourseSelection.href, function( data ) {
        numholes = data.course.hole_count;

        var listLevels = "<option disabled selected>Select A Level</option>";

        for (var gc in data.course.tee_types) {
            levelName = data.course.tee_types[gc].tee_type;
            levelName.toUpperCase();
            listLevels += "<option value='" + data.course.tee_types[gc].tee_type + "'>" + levelName + "</option>";
        }
        $(".courselist #level").html(listLevels);
    });

    //SET COURSE VARS TO DISPLAY BASED ON SELECTION

    courseLat = myCourseSelection.location.lat;
    courseLng = myCourseSelection.location.lng;

    //SHOW WEATHER IN SELECTED AREA

    /*var url2 = "http://api.openweathermap.org/data/2.5/weather?lat=" + courseLat + "&lon=" + courseLng + "&appid=20e833c9715665014beb18e4e9f50aa5";
    weatherDisplay(url2);*/


    // SHOW MAP AND COURSE LOCATION

    defZoom = 14;
    $("#map").css("display", "block");
    initMap();
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

function levelSelect(level) {

    $.getJSON( choosenCourse, function( data ) {
        items = "";
        yards = "";
        var hcntr = 1;

        var thisCourse = getObjects(data, 'tee_type', level);

        for (every in thisCourse) {
            items += "<div id='par_hole_" + hcntr + "'>" + thisCourse[every].par + "</div>";
            yards += "<div id='yardage_" + hcntr + "'>" + thisCourse[every].yards + "</div>";
            hcntr++;
        }
        console.log(thisCourse);
    });

    var parTitle = "<div id='par-title'>Par</div>";
    var yardage = "<div id='yardage'>Yards</div>";
    //var parTotalScore = "<div id='par-total'>" + parTotal + "</div>";

    var self = $("#courseinf");
    var Ylisting = $("#yardinf");

    self.html(parTitle).delay(800).queue(function (next) {
        $(this).append(items);
        next();
    });


    Ylisting.html(yardage).delay(800).queue(function (next) {
        $(this).append(yards);
        next();
    });

    // DELAY CARD SO NUMHOLES CAN UPDATE -  FIX WHEN YOU CAN DUMMY

    setTimeout(runcode, 300);
}

function weatherDisplay(url2) {
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var myObj = JSON.parse(xmlhttp.responseText);
            var str = myObj.weather[0].description.toLowerCase().replace(/\b[a-z]/g, function(letter) {
                return letter.toUpperCase();
            });
           $("#weather").html("Weather Conditions in " + myObj.name + ":<br>" + str);
        }
    };
    xmlhttp.open("GET", url2, true);
    xmlhttp.send();
}

function runcode() {
    getLocation();

    // DISPLAY THE SCORECARD

    var titleRow = "<div class='column column-title'><div class='title-players'>Players</div></div>";
    var totalRow = "<div class='column-total'><div class='total-score'>Score</div></div>";
    var holeList = "";
    var scoreTotals = "";


    $("#scorecard").html(titleRow);
    for(var h = 1; h <= numholes; h++) {
        var holeTitle = "<div class='title-hole'>" + h + "</div>";
        holeList += holeTitle;
    }
    $(".column-title").append(holeList);
    for(var p = 1; p <= numplayers; p++ ){
        var playerRow = "<div class='column pc-" + p + "'><input type='text' value='player" + p + "'></div>";
        $("#scorecard").append(playerRow);
        collectholes(p);
        var totalTitle = "<div class='player-total' id='player-" + p + "-total'>0</div>";
        scoreTotals += totalTitle
    }
    $("#scorecard").append(totalRow);
    $("#scorecard .column-total").append(scoreTotals);

    var winHeight = $(document).height();
    $(".mask").css("height", winHeight + "px");
}

function collectholes(player){
    var golfcourse = "";
    for(var h = 1; h <= numholes; h++){
        var hole = "<div class='singlehole' id='player" + player + "hole" + h + "'><input onchange='validate()' type='text' value=''></div>";
        golfcourse += hole;
        var apTo = ".pc-" + player;

    }
    $(apTo).append(golfcourse);

}

function validate() {
    var self = $(event.target);
    var scoreVal = parseInt(self.val());
    var selfId = self.parent().attr('id');
    if(isNaN(scoreVal)){
        alert("Please enter a number");
        self.val("");
    } else {
        updateScore(selfId, scoreVal);
    }

}

function playerCount(numChange) {
    numplayers += numChange;
    $("#scorecard").empty();
    runcode();
}

function updateScore(playerID, scoreImp) {

    var theID = playerID.replace( /(^.+\D)(\d+)(\D.+$)/i,'$2');

    for(var p = 1; p <= numplayers; p++ ){
        var playerRow = "<div class='column pc-" + p + "-total'></div>";
        var item = "#player-" + p + "-total";

        if (theID == p) {
            var scoreUpdating = $(".column-total").find(item);
            var currentScore = parseInt(scoreUpdating.text());

            currentScore = currentScore + scoreImp;
            $(scoreUpdating).text(currentScore);
        }

        $("#scoretotal").append(playerRow);
    }

}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, positionError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    myLat = position.coords.latitude;
    myLng = position.coords.longitude;
    localObj = {latitude:myLat, longitude:myLng, radius:20};
    coursesLoaded();
}

function positionError() {
    alert('Location cannot be found!');
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: courseLat, lng: courseLng},
        zoom: defZoom
    });
    var image = '../src/img/tee-off.png';
    var teeoff = new google.maps.Marker({
        position: {lat: courseLat, lng: courseLng},
        map: map,
        icon: image
    });
}


function myTimer() {
    var d = new Date();
    var t = d.toLocaleTimeString();
    document.getElementById("demo").innerHTML = t;
}

function myStopFunction() {
    clearInterval(myTime);
}
