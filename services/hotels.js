var mysql = require("./mysql");
var fs = require('fs-extra');
var _ = require('lodash');

/**
 *
 * @param filter:{
 *
			@param	"city_id": city_id of city
			@param	"hotel_price": Array with [start, end] for example : [0,150] - to get rooms priced betwwen 0 to 150
			@param	"hotel_ratings": Decimal number for minimum rating for example : 8.60 will give hotels with ratings 8.60 or higher
			@param	"no_rooms" : minimun number of rooms required for example : 3 will return hotels having atleast 3 rooms available with matching criteria

 * }
 *
 *
 * Sample Request:
 * {
        "filter": {
				"city_id": 1,
				"hotel_price": [0,150],
				"hotel_ratings": 8.4,
				"no_rooms" : 3
		}
 * }
 *
 *
 * Sample Response:
 * {
    "message": "Success",
    "data": [
        {
            "hid": 1,
            "hotel_name": "Sheraton San Jose Hotel",
            "hotel_address": "Costa Rica",
            "zip_code": "95112",
            "hotel_stars": 5,
            "hotel_ratings": 8.9,
            "description": "Excellent city hotel. Easily accessible by car and close to shopping areas.",
            "cid": 1,
            "hotel_image": "/files/photos/default_hotel.png",
            "created": "2017-11-17T09:12:55.000Z",
            "modified": "2017-11-17T09:12:55.000Z",
            "rid": 1,
            "price": 100,
            "room_number": "101",
            "room_description": "2 Queen Beds 366-sq-foot (34-sq-meter) room with city views",
            "room_type": "Standard",
            "room_image": "/files/photos/default_room.png"
        },
        {
            "hid": 1,
            "hotel_name": "Sheraton San Jose Hotel",
            "hotel_address": "Costa Rica",
            "zip_code": "95112",
            "hotel_stars": 5,
            "hotel_ratings": 8.9,
            "description": "Excellent city hotel. Easily accessible by car and close to shopping areas.",
            "cid": 1,
            "hotel_image": "/files/photos/default_hotel.png",
            "created": "2017-11-17T09:14:42.000Z",
            "modified": "2017-11-17T09:14:42.000Z",
            "rid": 2,
            "price": 100,
            "room_number": "201",
            "room_description": "2 Queen Beds 366-sq-foot (34-sq-meter) room with city views Internet - Free WiFi and wired Internet access",
            "room_type": "Standard",
            "room_image": "/files/photos/default_room.png"
        },
        {
            "hid": 1,
            "hotel_name": "Sheraton San Jose Hotel",
            "hotel_address": "Costa Rica",
            "zip_code": "95112",
            "hotel_stars": 5,
            "hotel_ratings": 8.9,
            "description": "Excellent city hotel. Easily accessible by car and close to shopping areas.",
            "cid": 1,
            "hotel_image": "/files/photos/default_hotel.png",
            "created": "2017-11-17T09:15:17.000Z",
            "modified": "2017-11-17T09:15:17.000Z",
            "rid": 3,
            "price": 300,
            "room_number": "301",
            "room_description": "2 Queen Beds 366-sq-foot (34-sq-meter) room with city views",
            "room_type": "Premium",
            "room_image": "/files/photos/default_room.png"
        }
    ]
 * }
 *
 */
function handle_search_hotels_request(msg, callback) {
    try {

        var filter = msg.filter;
        
        var Search_SQL = "";

        // formulate Search SQL
        var basic_SQL =                                         "SELECT h.hid as hid, h.hotel_name as hotel_name, h.hotel_address as hotel_address, h.zip_code as zip_code, h.hotel_stars as hotel_stars, h.hotel_ratings as hotel_ratings, h.description as hotel_description, h.cid as cid, h.hotel_image as hotel_image " +
                                                                "FROM hotels h " +
                                                                "INNER JOIN rooms ON rooms.hid = h.hid " +
                                                                "WHERE h.cid in  (select cid from city where city.citY_name like '" +filter.city_name +"') "   ;

        var hotel_stars_filter =  filter.hotel_stars        ?   " AND h.hotel_stars = " +filter.hotel_stars                        : "";
        var room_price_filter = filter.hotel_price          ?   " AND rooms.price BETWEEN " +filter.hotel_price[0] + " AND " +filter.hotel_price[1] : "";
        var hotel_ratings_filter =  filter.hotel_ratings    ?   " AND h.hotel_ratings >= " +filter.hotel_ratings                   : "";
        var no_rooms_filter = filter.no_rooms               ?   "  AND rid IN" +
                                                                "    (SELECT rid" +
                                                                "     FROM rooms" +
                                                                "     INNER JOIN" +
                                                                "       (SELECT count(rid) AS no_rooms" +
                                                                "        FROM rooms" +
                                                                "        HAVING count(rid) >= " +filter.no_rooms + ") AS rooms2) "          : "";

        Search_SQL = basic_SQL + hotel_stars_filter + room_price_filter + hotel_ratings_filter + no_rooms_filter + " group by h.hid";


        mysql.executequery(Search_SQL, function (err, result) {
            if(err){

                console.log(err);
                callback(err, {})
            }
            else{
                var promise_arr = [];
                result.forEach(function(hotel, index){
                    hotel.hid;
                    var roomSQL = "select price, room_number , room_description, room_type ,room_image from rooms where hid = " + hotel.hid;
                    promise_arr.push(new Promise(function(resolve, reject){
                        mysql.executequery(roomSQL, function(err, rooms){
                            console.log(rooms)                          
                            result[index].rooms = rooms;
                            resolve();
                        });

                    }));


                  
                })
                
                Promise.all(promise_arr).then(function(){
                    callback(null, result)
                });

            }
        })
    }
    catch (e) {
        console.log(e);
        callback(e, {});
    }
}


module.exports = {handle_search_hotels_request};