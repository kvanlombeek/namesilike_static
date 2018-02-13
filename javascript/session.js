
// First get postion, when done register session in backend
app._data.spinner_active = true;
Vue.config.lang = 'nl';
app._data.session_parameters.language = 'nl'
$.ajax({
  dataType: "json",
    url: 'http://ip-api.com/json?',
    success: function(data) {   
        if (debug) console.log(data)
        geocode_position = data
        // Set to Dutch in case of flanders
        if((geocode_position['regionName'] == 'Flanders') || 
		   (geocode_position['countryCode'] == 'NL')){
            	
				app._data.session_parameters.language = 'nl'
                Vue.config.lang = 'nl';  
                if(debug) console.log(app.$locale.current() + ' language selected ')
        }// Set to french in case of Wallonia or France
		else if((geocode_position['regionName'] == 'Brussels Capital') || 
		   (geocode_position['regionName'] == 'Wallonia') || 
		   (geocode_position['countryCode'] == 'FR')){	
                app._data.session_parameters.language = 'fr';
				Vue.config.lang = 'fr';  
                if(debug) console.log(app.$locale.current() + ' language selected ')
		}// Default Flemish version
		else{
            app._data.session_parameters.language = 'nl';
            Vue.config.lang = 'nl';
            if(debug) console.log(app.$locale.current() + ' language selected ')
		}
        // Create session
        create_session_info(geocode_position) 
        // Disable spinner
        app._data.spinner_active = false; 
    },
    timeout: debug ? 1 : 3000, // sets timeout to 3 seconds
    error: function(x, t, m) {
        if(t==="timeout") {
            app._data.spinner_active = false; 
            create_session_info({'status':'geocoding_timeout'}) 
            if(debug) console.log("got geocoding timeout");
        } else {
            app._data.spinner_active = false; 
            create_session_info({'status':'geocoding_error'})  
            if(debug) console.log("error geocoding")
        }
    }
});

function create_session_info(geocode_position){
  
    // User id, check if in coockies first
    user_ID_from_cookie = find_cookie('user_ID')
    if(user_ID_from_cookie != ''){
        app._data.session_parameters.user_ID = debug ? 'development' : user_ID_from_cookie
    }else{
        app._data.session_parameters.user_ID = debug ? 'development' : make_id()
        // register coockie
        set_cookie('user_ID', app._data.session_parameters.user_ID, 30)
    }
    // Register this user id with inspectlet
    if(!debug) __insp.push(['identify', app._data.session_parameters.user_ID]);
    // Make a session ID
    app._data.session_parameters.session_ID = debug ? 'development' : make_id()
    app._data.session_parameters.screen_height = window.innerHeight || $(window).height();
    app._data.session_parameters.screen_width = window.innerWidth || $(window).width();
    // Regsiter session in backend
    $.ajax({
        url: debug ? "http://127.0.0.1:5000/register_session" :
            "http://namabayi4-env.eu-west-1.elasticbeanstalk.com/register_session",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType:'json',
        data: JSON.stringify({
            'user_ID': app._data.session_parameters.user_ID,
            'session_ID': app._data.session_parameters.session_ID,
            'selected_language' : app.$locale.current(),
            'screen_width': app._data.session_parameters.screen_width,
            'screen_height': app._data.session_parameters.screen_height,
            'as': geocode_position['as'],
            'isp': geocode_position['isp'],
            'org': geocode_position['org'],  
            'city': geocode_position['city'],  
            'region': geocode_position['region'],  
            'regionName': geocode_position['regionName'],  
            'timezone': geocode_position['timezone'],
            'lon': geocode_position['lon'],
            'lat': geocode_position['lat'],
            'countryCode': geocode_position['countryCode'],
            'country': geocode_position['country'],
            'zip': geocode_position['zip'],
            'status': geocode_position['status'],
            'query': geocode_position['query'],
            'referrer': document.referrer,
            'current_url': window.location.href,
        }),
        success:function(return_data){
        }
    })
}

function set_cookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}


function find_cookie(cname){
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            cookie_value = c.substring(name.length, c.length);
            return cookie_value
        }
    }
    return ''
}

function make_id(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
