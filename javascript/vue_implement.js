debug = false;

if (window.console && debug) console.log('Development mode')
Vue.use(VueI18n)

// set locales
Object.keys(locales).forEach(function(lang) {
  Vue.locale(lang, locales[lang])
});

// Access language from within Vue
// from https://github.com/kazupon/vue-i18n/issues/2#issuecomment-251628016
// and https://jsfiddle.net/pespantelis/4xcuLtur/1/
Vue.prototype.$locale = {
  change: function (lang) {
    Vue.config.lang = lang;
  },
  current: function() {
    return Vue.config.lang;
  }
}

// Old table with stars of parameters
// <td class="center-align">{{$t("results.name_score_1")}}<br><span style="white-space: nowrap;"><component v-bind:is="starspopular"></component></span></td> \
/*                      <table> \
                        <tbody> \
                          <tr> \
                            <td class="center-align">{{$t("results.name_score_2")}}<br><span style="white-space: nowrap;"><component v-bind:is="starsvintage"></component></span></td> \
                            <td class="center-align">{{$t("results.name_score_3")}}<br><span style="white-space: nowrap;"><component v-bind:is="starsclassic"></component></span></td> \
                          </tr> \
                        </tbody> \
                      </table> \*/

/* Method of pulsing the icons:
v-bind:class="{pulse: !$parent.recommended_names.no_name_removed && $parent.recommended_names.no_name_toggled}"
*/


/* OLD KPI on the card: {{number_last_year(ts)}} {{ $t("results.last_year") }} */

/* OLD INFO button
                    <div class="expand animated infinite" v-on:click="toggle_modal(true)"> \
                      <i class="fa fa-info fa-lg" aria-hidden="true"></i>\
                    </div> \
*/

Vue.component('recommended-name-component', {
  template: '<div v-show="!removed">\
                  <div class="name_card" > \
                    <div class="recommended_name" v-on:click="toggle_modal"><i v-show="!show_modal" class="fa fa-caret-right" aria-hidden="true"></i><i v-show="show_modal" class="fa fa-caret-down" aria-hidden="true"></i> {{name}}</div> \
                    <div class="number_last_year">top {{top}} {{$t("results.region")}}</div> \
                    <div class="save_button animated infinite" v-on:click="remove()"> \
                      <i class="fa fa-trash-o" aria-hidden="true"></i> \
                    </div> \
                      <div class="extra_content" v-show="show_modal"> \
                        <div v-show="show_modal" id={{graphidtag}} class="timeseries_graph center-align "></div> \
                        <div class="similar_names_title">{{ $t("results.similar_info") }}</div> \
                        <div class="similar_names">{{similar_names}}</div> \
                        <div class="meaning_title">{{$t("results.meaning_title") }}</div> \
                        <div class="meaning">{{meaning}}</div> \
                      </div> \
                    </div> \
                  </div> \
                </div>',
     props: ['name', 'order', 'starspopular', 'starsoriginal', 'starsvintage', 'starsclassic', 'scoretrend','meaning', 'ts', 'graphidtag', 'similar_names', 'top'] ,
	data: function() {
        
		if( [3, 6, 9, 12, 15].indexOf(this.order) != -1) this.toggle_modal(true);
		return {show_modal: [3, 6, 9, 12, 15].indexOf(this.order) != -1 ? true : false, 
				  removed: false, 
                  saved:false}
	},
 	methods:{
    	toggle_modal: function(initial_case) {
            
			// The annoying thing in this function is that some toggles are by default already open.
			// Hence the initial case tings.
            if(initial_case === undefined){
              initial_case=false;
            }
			this.$parent.recommended_names.no_name_toggled = false;
		 	
			if(initial_case !== false) this.show_modal = !this.show_modal;
		  	ts = JSON.parse(this.ts);
		  	name = this.name;
			
			function waitForElementToDisplay(graphidtag, time, ts, name, parent_object) {
				var selector = '#' + graphidtag
                if(document.querySelector(selector)!=null) {
					if($(selector).width() > 0){
						// Stupid hack to get the width of the graph id tag. He does it the first time, but not afterwards
						// Save the width of the first graph and use it afterwards
						parent_object.recommended_names.width_graph = $(selector).width()
					}
					parent_object.draw_timeseries(graphidtag, ts, name, app._data.multiple_choice.selected_sex, 
												 parent_object.recommended_names.width_graph);
					return;
				}
				else {
					setTimeout(function() {
						waitForElementToDisplay(graphidtag, time, ts, name, parent_object);
					}, time);
				}
			}			
			if(this.show_modal){
				waitForElementToDisplay(this.graphidtag, 5, ts, name, this.$parent)				
			}
		  pass_this = this;
		  // Register that the name info button was clicked
		  if(this.show_modal && initial_case !== false ){
			$.get(
			  url = debug ? 'http://127.0.0.1:5000/toggle_name_info':
					  'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/toggle_name_info',
			  data={
				  'model_ID' : app._data.session_parameters.model_ID,
				  'name_clicked': pass_this.name
			},
			callback=function(return_data){

			}) 
		  }
    },
    number_last_year: function(ts) {
      ts = JSON.parse(ts);
      return Math.round(ts[ts.length - 1]);
      coeff = this.$locale.current() =='nl' ? 0.65 : 0.4;
      if (ts[ts.length - 1] == 0) {
        return "<" + Math.round(5*coeff)+ "k";
      } else {
        return Math.round(ts[ts.length - 1]*coeff) + "k";
      }
    },
	save: function(){
	  // Send to backend that the name was removed
      $.get(
        url = debug ? 'http://127.0.0.1:5000/remove_name_from_suggestions' : 
                'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/remove_name_from_suggestions',
        data={
            'model_ID' : app._data.session_parameters.model_ID,
            'name_to_remove': this.name
      },
      callback=function(return_data){
          
      }) 
	  this.saved = true;
      return false;
		
	},
    remove: function(){
      this.$parent.recommended_names.no_name_removed = false;
      this.removed = true;
//      name_to_remove = this.name
//      // Find the index of the name that has to be removed
//      for (i = 0; i < this.$parent.recommended_names.active_names.length; i++) { 
//          if(this.$parent.recommended_names.active_names[i].name == this.name){
//            index_to_remove = i
//          }
//      }
//      //Delete the name from the active names
//      this.$parent.recommended_names.active_names = this.$parent.recommended_names.active_names.filter(function(card) {
//          return card.name != name_to_remove
//      })
      // Add the first name of the potential names to active names, record this in backend
//      if(this.$parent.recommended_names.names_not_shown.length>0){
//        this.$parent.recommended_names.active_names.splice(index_to_remove,0,this.$parent.recommended_names.names_not_shown[0])
//        $.get(
//          url = debug ? url = 'http://127.0.0.1:5000/name_is_shown_in_suggestions': 
//                              'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/name_is_shown_in_suggestions',
//          data={
//              'model_ID' : app._data.session_parameters.model_ID,
//              'name_to_add': this.$parent.recommended_names.names_not_shown[0].name
//        },
//        callback=function(return_data){
//            
//        })   
//        this.$parent.recommended_names.names_not_shown.splice(0,1)      
      //}
      // Send to backend that the name was removed
      $.get(
        url = debug ? 'http://127.0.0.1:5000/remove_name_from_suggestions' : 
                'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/remove_name_from_suggestions',
        data={
            'model_ID' : app._data.session_parameters.model_ID,
            'name_to_remove': this.name
      },
      callback=function(return_data){
          
      }) 
      return false;
    }
  },
})
//<span class="trending_badge new badge blue lighten-3" v-if="scoretrend>3.5">Trending!</span>
Vue.component('stars_0', {
  template: '<i class="fa fa-star-o" aria-hidden="true"><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_5', {
  template: '<i class="fa fa-star-half-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_10', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_15', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-half-o" aria-hidden="true"></i></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_20', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_25', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-half-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_30', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>',
})
Vue.component('stars_35', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-half-o" aria-hidden="true"></i>',
})
Vue.component('stars_40', {
  template: '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i>',
})

// Ask user his score of the suggested names
Vue.component('modal', {
  template: '#modal-template'
})

var app = new Vue({
  el: '#app',
  data: {
      share_save_button: true,
      active_section:'homepage',
      //recommended_names, homepage, waiting_for_recommendations, searchpage, info
      spinner_active:false,
      recommended_names:{
		waypoint:null,
        width_graph:200,
        all_returned_names:[],
        active_names:{
          part_1:[],
          part_2:[],
          part_3:[],
          part_4:[],
          part_5:[],
          part_6:[],
        },
        removed_names:[],
        names_not_shown:[],
        info_window:false,
        email_button_visible:false,
        no_name_toggled:true,
        no_name_removed:true,
        popup_score_suggestions: false,
        popup_score_suggestions_already_showed: false,
        popup_share: false,
        ask_what_can_we_improve: false,
        user_score:0,
        user_input: '',
        send_by_mail:false,
        user_rated_suggestions: false,
      },
      search_button:{
        search_field_active:false
      },
      searched_name:{
        show: false,
        name_entered_for_search:'',  
        stars_popular:0,  
        stars_vintage:0, 
        stars_classic:0, 
        meaning:'', 
        ts:[],
        similar_names:'',
      },
  	  multiple_choice:{
        names_per_question: 4,
        questions_per_round: 5, // the last questions is the best of round
        total_rounds:4,
        active_question:1,
        active_round:1,
        names_round:[],
        feedback:[],
        best_of_active: false,
  		active_names: ['','','',''],
  		selected_sex: 'F',
        clicked_names:[],
        first_small_info_active:true,
        second_small_info_active:false,
  	 },
     session_parameters:{
        session_ID:'',
        user_ID:'',
        model_ID:'',
        screen_height:'',
        screen_width:'', 
        language:'nl',
     },
     email_form:{
        email_address_1:'',
        email_address_2:'',
        accept_conditions:false,
        keep_me_up_to_date:false,
        show_success: false
     }
  },
  methods: {
    created: function(){
      window.addEventListener('scroll', this.handleScroll);
    },
    destroyed: function(){
      window.removeEventListener('scroll', this.handleScroll);
    },
    handleScroll: function(){
      this.scrolled = window.scrollY > 0;
    },
    navigate: function(go_to){
      // Track with google analytics
      if(!debug) ga('send', {hitType: 'event', eventCategory: 'navigation', eventAction: go_to, eventLabel: ''});  
      // Register click
      this.register_click('navigating_to_' + go_to)
      
      // If homepage, reset a lot of things
      if((go_to=='homepage')||(go_to=='stats')||(go_to=='info')){
        this.multiple_choice.active_names = ['','', '', '', '']
        this.multiple_choice.clicked_names = []
        this.multiple_choice.best_of_active = false
        this.multiple_choice.feedback = []
        this.multiple_choice.names_round = []  
        this.multiple_choice.active_question=1
        this.multiple_choice.active_round=1 
        this.multiple_choice.first_small_info_active=true;
        this.multiple_choice.second_small_info_active=false;
        this.recommended_names.send_by_mail;
        this.recommended_names.popup_score_suggestions_already_showed=false;
        this.recommended_names.popup_score_suggestions=false;
        this.recommended_names.waypoint = null;
        this.spinner_active=false;
        this.searched_name.name_entered_for_search='';
      }
      // Go to page
      this.active_section = go_to;
      
    },
    open_email_popup: function(){
      this.recommended_names.send_by_mail=true  
      if(!debug) ga('send', {hitType: 'event', eventCategory: 'navigation', eventAction: 'open_email_popup', eventLabel: ''});  
    },
    handle_click_to_brand: function(){
      window.open('http://www.mamabaas.be/','_blank');
      this.register_click('click_to_mamabaas')
    },
    send_suggestions_by_mail: function(){
      var valid_1 = validateEmail(this.email_form.email_address_1) || (this.email_form.email_address_1 == '');
      var valid_2 = validateEmail(this.email_form.email_address_2) || (this.email_form.email_address_2 == '');
      if ((this.email_form.email_address_1 == '') && (this.email_form.email_address_2 == '')) {
        alert('Enter at least one email address');
      } else if (!valid_1 & !valid_2) {
        alert('The two email addresses are invalid');
      } else if (valid_1 & !valid_2) {
        alert('Your partner\'s email address is invalid');
      } else if (!valid_1 & valid_2) {
        alert('Your email address is invalid');
      } else if(!this.email_form.accept_conditions){
        alert('Please accept the general conditions')
      }
      else {
        this.recommended_names.send_by_mail = true;  
        var pass_this = this;
        $.get(
          url = debug ? 'http://127.0.0.1:5000/send_suggestions_by_email':
              'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/send_suggestions_by_email',
          data={
              'user_ID': pass_this.session_parameters.user_ID,
              'session_ID': pass_this.session_parameters.session_ID,
              'selected_language' : pass_this.$locale.current(),
              'model_ID': pass_this.session_parameters.model_ID,
              'email_address_1': pass_this.email_form.email_address_1,
              'email_address_2': pass_this.email_form.email_address_2,
              'keep_me_up_to_date' : pass_this.email_form.keep_me_up_to_date,
              'accept_conditions' : pass_this.email_form.accept_conditions
        },
        callback=function(return_data){
        })
      }     
    },
    return_to_results: function(){
      this.recommended_names.send_by_mail = false;
      
    },
    search_by_name: function(){
      if(!debug) ga('send', {hitType: 'event', eventCategory: 'search_by_name', eventAction: 'search_by_name', eventLabel:                 this.searched_name.name_entered_for_search});  
      
      this.spinner_active = true;
      this.searched_name.name_entered_for_search = capitalizeFirstLetter(this.searched_name.name_entered_for_search)

      pass_this = this
      $.get(
        url = debug ? 'http://127.0.0.1:5000/lookup_name_info' : 
                  'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/lookup_name_info',
        data={
            'user_ID': pass_this.session_parameters.user_ID,
            'session_ID': pass_this.session_parameters.session_ID,
            'selected_language' : pass_this.$locale.current(),
            'names_per_question': pass_this.multiple_choice.names_per_question,
            'name_to_lookup' : pass_this.searched_name.name_entered_for_search,
            'screen_height': pass_this.session_parameters.screen_height,
            'screen_width': pass_this.session_parameters.screen_width
      },
      callback=function(return_data){
		  
        pass_this.searched_name.meaning = return_data['meaning']
		pass_this.searched_name.stars_popular = 'stars_' + parseFloat(return_data['score_popular'])*10 
        pass_this.searched_name.stars_vintage = 'stars_' + parseFloat(return_data['score_vintage'])*10 
        pass_this.searched_name.stars_classic = 'stars_' + parseFloat(return_data['score_classic'])*10 
        pass_this.searched_name.ts = return_data['ts'];
        pass_this.searched_name.similar_names = return_data['similar_names'];
        pass_this.draw_timeseries('timeseries_graph_searched_name', pass_this.searched_name.ts,     
                                  pass_this.searched_name.name_entered_for_search, 
								 return_data['sex'])
        // Remove the spinner
        pass_this.spinner_active = false;
        pass_this.searched_name.show = true;
      })
    },
    draw_timeseries:function(graphidtag, timeseries_raw, name_to_plot, sex, width){
		ref_name = {
			Vlaanderen:{ M:{ts: [84, 88, 91, 66, 63, 67, 61, 61, 44, 52, 42, 54, 52, 52, 61, 47, 58, 65, 61, 42, 55],
				   	name: 'Mathieu'},
				F:{ts:[24, 32, 28, 36, 25, 48, 52, 46, 61, 90, 115, 120, 104, 105, 77, 73, 75, 73, 62, 56, 59],
				  name:'Floor'}
				},
            Wallonie:{ M:{ts: [20, 21, 23, 29, 23, 37, 22, 26, 26, 21, 28, 29, 26, 38, 37, 34, 30, 35, 46, 38, 37],
				   	name: 'Charles'},
				F:{ts: [84,102,158,178, 183, 145, 137, 133, 136, 92, 109, 88, 84, 87, 73, 79, 80, 53, 84, 68, 67],
				  name:'Margaux'}
				}
			}
		
        timeseries = {}
        start_year = 1995
        
        for (i = 0; i < timeseries_raw.length; i++) { 
            timeseries[start_year+i] = timeseries_raw[i]
        }
      	
        last_value = timeseries[2016]
        var chart_height = $(window).height() * 0.5 > 500 ? 500 : $(window).height() * 0.5;
        if(width === undefined){
          var chart_width = $(window).width() * 0.7 > 500 ? 500 : $(window).width() * 0.7;
        }else{
          var chart_width = width;
        }
       
		$('#'+graphidtag).highcharts({
            chart: {
                backgroundColor:'transparent',
                style: {
                    fontFamily: "'Josefin Sans', sans-serif",
                    color: "#1C4977"
                },
                height: chart_height,
                width: chart_width,
            },
            title: {
                text: this.$t("graph.title"),
                x: -0 //center
            },
            subtitle: {
                text: this.$t("graph.subtitle"),
                x: -0
            },
            xAxis: {
                lineColor: "#555555",
                tickColor: "#555555",
                max: 2016,
				min: 1995,
				tickInterval: 6,
                labels: {
                    style: {
                        color: "#555555",
                        font: "'Josefin Sans', sans-serif",
                        fontSize:"1.2em"
                    }
                },
            },
            yAxis: {
                title: {
                    text: null
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#1C4977'
                }],
                tickAmount:4,
                gridLineColor:'#555555',
                lineColor: "#555555",
                tickColor: "#555555",
                labels: { style:  { color: "#555555", 
                               font: "'Josefin Sans', sans-serif", 
                               fontSize:"1.1em" 
                          },
                          align: 'left',
                          x: -10,
                          y: -2
                        },
            },
            tooltip: { 
              enabled: false 
            },
            plotOptions:{
              series: {
                  dataLabels: {
                      enabled: true,
                      borderRadius: 2,
					  color:"#4a90e2",
                      formatter: function () {
                          if(this.x==2015){
                              return this.y
                          }else{
                              return ''
                          }
                      }
                },
                events:{
                  click: function(e){
                     return null
                  }
                }
              },
              line:{
                marker: {
                    enabled: false
                }
              }
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0,
                floating: false,
                enabled: false,
                itemStyle:{ font: "'Josefin Sans', sans-serif", fontSize:"1.4em", fontWeight:1 }
            },
            series: [{ name:name_to_plot,
						data: timeseries_raw, 
                        pointStart: start_year,
                        clickable:false,
                        color:"#4a90e2",
					 lineWidth:3}]
//					 { name:ref_name[this.$t("region")][sex]['name'],
//						 data: ref_name[this.$t("region")][sex]['ts'], 
//					  	lineWidth:1,
//                        pointStart: start_year,
//                        clickable:false,
//                        color: "#211551"}
					
        	})
    },
  	init_multiple_choice:function(selected_sex){
      // Reset recommended names (results of previous simulation)
      this.recommended_names.all_returned_names=[],
      this.recommended_names.active_names=[],
      this.recommended_names.names_not_shown=[],
      this.recommended_names.info_window=false,
      this.recommended_names.email_button_visible=false,
      this.recommended_names.no_name_toggled=true,
      this.recommended_names.no_name_removed=true,
      this.recommended_names.popup_score_suggestions=false;
      this.recommended_names.popup_score_suggestions_already_showed=false;
      // Generate a model_ID
      this.session_parameters.model_ID = debug ? 'development' : make_id()
      this.multiple_choice.selected_sex = selected_sex
      this.active_section = 'asking_feedback'
      this.spinner_active = true
      // Track for google analytics
      if(!debug){
        ga('send', {hitType: 'event', eventCategory: 'model_building', 
                    eventAction: 'model_initiated', eventLabel: this.session_parameters.model_ID});  
      }     
      // Hide the share/save mail div, so the transition is activated again when the recommenations are shown
      this.recommended_names.email_button_visible = false
      pass_this = this
  		$.get(
  			url = debug ? 'http://127.0.0.1:5000/req_multiple_choice_names' : 
                  'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/req_multiple_choice_names',
  		 	data={
            'user_ID': pass_this.session_parameters.user_ID,
            'session_ID': pass_this.session_parameters.session_ID,
            'model_ID' : pass_this.session_parameters.model_ID,
  		  		'selected_sex': pass_this.multiple_choice.selected_sex,
            'selected_language' : pass_this.$locale.current(),
  		  		'how_many': (pass_this.multiple_choice.questions_per_round-1)*
                        pass_this.multiple_choice.names_per_question* 
                        pass_this.multiple_choice.total_rounds,
            'names_per_question': pass_this.multiple_choice.names_per_question,
            'screen_height': pass_this.session_parameters.screen_height,
            'screen_width': pass_this.session_parameters.screen_width
  		},
  		callback=function(return_data){
          // Set the active round
          pass_this.multiple_choice.active_round = 1
          // Set active question
          pass_this.multiple_choice.active_question = 1
          // Save the names
          pass_this.multiple_choice.names_round = return_data
          //Show the first 5 names
          pass_this.multiple_choice.active_names = pass_this.multiple_choice.
                      names_round.splice(0,pass_this.multiple_choice.names_per_question)
          // Remove the spinner
          pass_this.spinner_active=false
  		})
  	},
    record_facebook_share: function(facebook_button){
    },
    handle_score_suggestions: function(smiley_clicked){
      
      // Get the score
      if(smiley_clicked == 'frown') this.recommended_names.user_score = 0
      if(smiley_clicked == 'meh') this.recommended_names.user_score = 1
      if(smiley_clicked == 'smile') this.recommended_names.user_score = 2
      
      // Send to backend
      pass_this = this
      $.get(
        url = debug ? 'http://127.0.0.1:5000/register_suggestions_score':
                'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/register_suggestions_score',
        data={
            'model_ID' : app._data.session_parameters.model_ID,
            'user_score': app._data.recommended_names.user_score,
        },
        callback=function(return_data){
          // Remove ask feedback screen and go to share screen    
        }) 
      
      // Close popup
      this.recommended_names.popup_score_suggestions = false
      this.recommended_names.user_rated_suggestions=true
      
      // Remove the smiley buttons and add a title with thank you
      
      //this.recommended_names.popup_share = true   
      
      //if(this.recommended_names.user_score != 2){
      //  console.log('Here')
      //  this.recommended_names.ask_what_can_we_improve = true
      //}else{
      //  this.recommended_names.popup_share = true   
      //}
    },
    
    handle_what_can_we_improve: function(skipped){
      if(skipped || this.recommended_names.ask_what_can_we_improve.user_input === undefined ||              this.recommended_names.ask_what_can_we_improve.user_input === 'undefined'){
        user_input = 'skipped'
      }else{
        user_input = this.recommended_names.ask_what_can_we_improve.user_input
      }
      // Activate next popup
      this.recommended_names.ask_what_can_we_improve = false
      this.recommended_names.popup_share = true 
      // Send to backend
      pass_this = this;
      $.get(
        url = debug ? 'http://127.0.0.1:5000/how_can_we_improve':
                'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/how_can_we_improve',
        data={
            'model_id' : pass_this.session_parameters.model_ID,
            'how_can_we_improve': user_input
      })
    },
    
    handle_skipped: function(){
      // Activate next popup
      this.recommended_names.ask_what_can_we_improve = false
      this.recommended_names.popup_share = true
      // Send to backend
      this.recommended_names.ask_what_can_we_improve.user_input = 'skipped'
      this.session_parameters.model_ID = 'development'
      pass_this = this;
      $.get(
        url = debug ? 'http://127.0.0.1:5000/how_can_we_improve':
                'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/how_can_we_improve',
        data={
            'model_id' : app._data.session_parameters.model_ID,
            'how_can_we_improve': app._data.recommended_names.ask_what_can_we_improve.user_input,
      },
        callback=function(return_data){
          // Remove ask feedback screen and go to share screen    
        })
      
    }, 
  	multiple_choice_click: function(name_clicked){
  		pass_this = this

      // Save the feedback
      name_clicked = name_clicked
      function store_feedback(name , index) {
        feedback = {'q': pass_this.multiple_choice.active_question + 
                        pass_this.multiple_choice.questions_per_round*(
                          pass_this.multiple_choice.active_round-1),
                  'n': name,
                  'f':name==name_clicked ? 'c' : 'nc', 
                  'r': pass_this.multiple_choice.active_round}
        pass_this.multiple_choice.feedback.push(feedback)
      }
      this.multiple_choice.active_names.forEach(store_feedback)

      // Set the new names
      if(this.multiple_choice.active_question % (this.multiple_choice.questions_per_round-1) == 0){
          // If it was the fifth question, ask which of all the likes he likes best
          function return_clicks(feedback){ 
            return ((feedback.f == 'c') && (feedback.r == pass_this.multiple_choice.active_round))
          }
          function return_name(click){  
            return click.n 
          }
          clicked_feedback = this.multiple_choice.feedback.filter(return_clicks)
          clicked_names = clicked_feedback.map(return_name)
          this.multiple_choice.active_names = clicked_names
      }else{
          // Just set the next names
          this.multiple_choice.active_names = this.multiple_choice.names_round.
                splice(0,pass_this.multiple_choice.names_per_question)

      }

      // Increase the counters
      if(this.multiple_choice.active_question == this.multiple_choice.questions_per_round){
        this.multiple_choice.active_round ++
        this.multiple_choice.active_question = 1  

        this.multiple_choice.best_of_active = true
      }else{
        this.multiple_choice.best_of_active = false
        this.multiple_choice.active_question ++
      }

      // The list of names is empty and best of questions is asked, send back the data
      temp_question = pass_this.multiple_choice.active_question + 
                        pass_this.multiple_choice.questions_per_round*(
                          pass_this.multiple_choice.active_round-1)
      temp_total_questions = pass_this.multiple_choice.questions_per_round * 
                                  pass_this.multiple_choice.total_rounds
      
      // After question 1, remove the first info tag
      if(temp_question>1) pass_this.multiple_choice.first_small_info_active=false;
      // On question 3, show the second small info tag
      pass_this.multiple_choice.second_small_info_active = temp_question==2 ? true : false
      
      // If the last question, send back feedback to server
      if(temp_question==temp_total_questions+1){

        this.spinner_active = false
        // Activate the waiting for recommendation page
        this.active_section = 'waiting_for_recommendations';
        // Start filling up the progress bar
        $("#progress_bar_inner").css({"width":"0%", "transition": "0s"});
        $("#progress_bar_inner").css({"width":"100%","transition":"15s"});
        animate_progress_bar();
        // Register that the last question was clicked
        app.register_click('last question clicked')    
        $.ajax({
          url :  "https://x8lmne9u9i.execute-api.eu-west-1.amazonaws.com/vs1/return-multiple-choice-answers",
          type: "POST",
          contentType: "application/json; charset=utf-8",
          dataType:'json',
          data: JSON.stringify({
              'user_ID': pass_this.session_parameters.user_ID,
              'session_ID': pass_this.session_parameters.session_ID,
              'model_ID': pass_this.session_parameters.model_ID,
              'requesting_how_many':30,
              'selected_sex': pass_this.multiple_choice.selected_sex,
              'selected_language' : pass_this.$locale.current(),
              'feedback': JSON.stringify(pass_this.multiple_choice.feedback) ,
              'final_round':'True',
              'algorithm': 'rf'}),
          success:function(return_data){
            pass_this.active_section = 'recommended_names'
            // Track for google analytics
            if(!debug){
              ga('send', {hitType: 'event', eventCategory: 'model_building', 
                          eventAction: 'model_suggestions_returned_to_frontend', eventLabel: pass_this.session_parameters.model_ID});  
            } 
            // Track in our SQL
            app.register_click('recommended names on front end.')
            // Visualise data
            return_data = JSON.parse(return_data)
            pass_this.visualize_recommended_names(return_data)
          }
        })
        return null
      }
  	},
    visualize_recommended_names: function(names){
      
      // Store all names
      this.recommended_names.all_returned_names = names
      // Set the names in the cards. 
      this.recommended_names.active_names.part_1 = names.slice(0,7)
      this.recommended_names.active_names.part_2 = names.slice(7,13)
      this.recommended_names.active_names.part_3 = names.slice(13,16)
      this.recommended_names.active_names.part_4 = names.slice(16,22)
      this.recommended_names.active_names.part_5 = names.slice(22,26)
      this.recommended_names.active_names.part_6 = names.slice(26,30)
      
      // Show popup with user score after 20 seconds
      setTimeout(function() { 
        app.register_click('popup_user_score_is_shown')
        app.recommended_names.popup_score_suggestions_already_showed = true;
        app.recommended_names.popup_score_suggestions = true;
      }, 20000);
      
      // Activate the waypoint. When the user scrolls to this waypoint, as the user his score about the suggestions
      // A bit annoying of Vue is that this element is not yet on the DOM. So wait for it, when it is there, add the waypoint
      // Something weird goes on, the waypoint is triggered when the user presses the home button
      // This never worked unfortunately, locally it did, but on some devices it didn't
//      function waitForWaypointElementToDisplay(){
//        selector = '#waypoint_to_ask_user_score'  
//        safety_selector = '#waypoint_safety' // One more selector, this element needs to be rendered as well, sort of safety
//        if(document.querySelector(selector)!=null && document.querySelector(safety_selector)!=null) { 
//          this.recommended_names.waypoint = new Waypoint({
//                          element: document.getElementById('waypoint_to_ask_user_score'),
//                          handler: function(direction) {
//                            // Only ask the score if the user did not already score
//                            if(!app.recommended_names.popup_score_suggestions_already_showed){
//                              app.register_click('popup_user_score_is_shown')
//                              app.recommended_names.popup_score_suggestions_already_showed = true;
//                              app.recommended_names.popup_score_suggestions = true;
//                            } 
//                          }
//            })
//          }
//          else {
//              setTimeout(function() { waitForWaypointElementToDisplay(); }, 5);
//          }
//      }	
//      waitForWaypointElementToDisplay();	
      
    },
    change_language: function(){
      if (Vue.config.lang==='nl'){
        Vue.config.lang='fr'
        this.session_parameters.language='fr'
      } else {
        Vue.config.lang='nl'
        this.session_parameters.language='nl'
      }
    },
    register_click: function(button){
      $.get(
          url = debug ? 'http://127.0.0.1:5000/register_click':
              'http://namabayi4-env.eu-west-1.elasticbeanstalk.com/register_click',
          data={
              'user_ID': app.session_parameters.user_ID,
              'session_ID': app.session_parameters.session_ID,
              'selected_language' : app.$locale.current(),
              'model_ID': app.session_parameters.model_ID,
              'button': button,
          },
          callback=function(return_data){
            if(debug) console.log('click registered, button: ' + button)
          })
    },
  },
  computed: {
    progress_multiple_choice: function () {
      questions_passed = (this.multiple_choice.active_question + 
                        this.multiple_choice.questions_per_round*(
                          this.multiple_choice.active_round-1))
      total_questions = this.multiple_choice.questions_per_round * this.multiple_choice.total_rounds
      progress =  Math.round((questions_passed-1)*100 / total_questions) 
      progress_str = progress + "%"
      return progress_str
    }
  }
});

Array.prototype.remove = function (target) {
    this.splice(this.indexOf(target), 1);
    return this;
};


function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function capitalizeFirstLetter(string) {
    string = string.toLowerCase()
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function range(start, count) {
    return Array.apply(0, Array(count))
        .map(function (element, index) { 
            return index + start;  
        });
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function animate_progress_bar() {
    var elem = document.getElementById("progress_bar_inner");
    elem.style.width = '0%'
    var width = 1;
    var id = setInterval(frame, 20);
    function frame() {
        if (width >= 100) {
            clearInterval(id);
        } else {
            width++; 
            elem.style.width = width + '%'; 
        }
    }
}

temp_returned_names = JSON.parse("[{\"name\":\"Germain\",\"score_popular\":0.5,\"score_original\":1.5,\"score_vintage\":2.5,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"Twins\",\"ts\":\"[13, 10, 9, 12, 7, 11, 11, 10, 12, 8, 0, 9, 7, 8, 8, 6, 0, 5, 5, 0, 0]\",\"similar_names\":\"Paolo, Karim, Muhammed\"},{\"name\":\"Justin\",\"score_popular\":3.0,\"score_original\":1.0,\"score_vintage\":2.0,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"To be fair or just\",\"ts\":\"[56, 72, 71, 64, 76, 98, 87, 76, 97, 92, 60, 72, 75, 73, 60, 55, 52, 47, 44, 40, 44]\",\"similar_names\":\"Lilian, Antonin, Olivier\"},{\"name\":\"Gianni\",\"score_popular\":1.0,\"score_original\":1.5,\"score_vintage\":1.5,\"score_classic\":3.0,\"score_trend\":2.5,\"meaning\":\"God is merciful\",\"ts\":\"[16, 17, 14, 22, 14, 12, 15, 0, 9, 0, 7, 9, 8, 6, 13, 10, 0, 0, 5, 7, 8]\",\"similar_names\":\"Tiziano, Kevin, Ahmed\"},{\"name\":\"Joey\",\"score_popular\":1.5,\"score_original\":2.0,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.0,\"meaning\":\"God raises\",\"ts\":\"[6, 12, 5, 6, 17, 24, 9, 11, 11, 7, 7, 7, 0, 6, 5, 7, 6, 7, 6, 0, 7]\",\"similar_names\":\"Mayron, Brayan, Amir\"},{\"name\":\"Gabin\",\"score_popular\":2.5,\"score_original\":2.5,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":4.0,\"meaning\":\"Hawk of white\",\"ts\":\"[0, 0, 0, 0, 0, 0, 0, 9, 5, 8, 11, 8, 11, 13, 17, 7, 15, 15, 20, 29, 38]\",\"similar_names\":\"Tobias, Jordy, R\\u00e9gis\"},{\"name\":\"C\\u00e9lestin\",\"score_popular\":2.5,\"score_original\":2.0,\"score_vintage\":4.0,\"score_classic\":2.0,\"score_trend\":3.0,\"meaning\":\"Sublime\",\"ts\":\"[5, 0, 0, 6, 0, 0, 7, 9, 8, 14, 16, 12, 17, 16, 13, 15, 23, 22, 19, 23, 26]\",\"similar_names\":\"Oscar, Marius, Aur\\u00e9lien\"},{\"name\":\"Jonathan\",\"score_popular\":2.0,\"score_original\":0.0,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.0,\"meaning\":\"God gives\",\"ts\":\"[169, 125, 127, 112, 99, 100, 59, 54, 47, 40, 29, 32, 25, 16, 24, 20, 16, 12, 15, 12, 12]\",\"similar_names\":\"James, Steven, Johan\"},{\"name\":\"Adelin\",\"score_popular\":0.5,\"score_original\":2.0,\"score_vintage\":3.0,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"Delicate\",\"ts\":\"[5, 9, 5, 5, 6, 6, 5, 0, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 5, 5]\",\"similar_names\":\"\"},{\"name\":\"Jonas\",\"score_popular\":2.5,\"score_original\":1.5,\"score_vintage\":0.5,\"score_classic\":1.5,\"score_trend\":3.5,\"meaning\":\"Dove\",\"ts\":\"[22, 22, 23, 30, 23, 39, 26, 23, 30, 34, 25, 17, 29, 25, 18, 22, 28, 30, 26, 21, 34]\",\"similar_names\":\"Yannis, Melvin, Mehdi\"},{\"name\":\"Valentin\",\"score_popular\":3.5,\"score_original\":0.5,\"score_vintage\":1.0,\"score_classic\":3.0,\"score_trend\":4.0,\"meaning\":\"Hale and healthy\",\"ts\":\"[156, 184, 163, 157, 173, 162, 134, 115, 110, 119, 91, 66, 87, 89, 81, 74, 113, 80, 90, 99, 97]\",\"similar_names\":\"Arthur, Jules, Robin\"},{\"name\":\"Antonin\",\"score_popular\":2.5,\"score_original\":1.5,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.0,\"meaning\":\"Worthy of admiration or praise\",\"ts\":\"[24, 26, 19, 26, 32, 32, 40, 48, 29, 28, 22, 34, 25, 26, 29, 22, 17, 34, 30, 29, 21]\",\"similar_names\":\"Roman, Marco, Lucien\"},{\"name\":\"James\",\"score_popular\":2.0,\"score_original\":1.5,\"score_vintage\":2.0,\"score_classic\":2.5,\"score_trend\":3.5,\"meaning\":\"Following after\",\"ts\":\"[11, 8, 12, 12, 15, 18, 11, 5, 9, 11, 7, 8, 0, 11, 8, 10, 9, 16, 23, 12, 23]\",\"similar_names\":\"Jonathan, Thibault, Nils\"},{\"name\":\"Elias\",\"score_popular\":2.5,\"score_original\":1.5,\"score_vintage\":1.5,\"score_classic\":1.5,\"score_trend\":0.0,\"meaning\":\"Yahweh is my God\",\"ts\":\"[8, 7, 9, 11, 9, 8, 11, 16, 8, 22, 20, 24, 28, 26, 43, 44, 23, 23, 27, 27, 26]\",\"similar_names\":\"Salvatore, Louka, Eden\"},{\"name\":\"Florentin\",\"score_popular\":0.0,\"score_original\":2.0,\"score_vintage\":2.0,\"score_classic\":1.5,\"score_trend\":0.0,\"meaning\":\"Thriving\",\"ts\":\"[15, 16, 16, 11, 10, 15, 11, 11, 15, 13, 9, 7, 5, 7, 0, 8, 0, 5, 0, 0, 0]\",\"similar_names\":\"\"},{\"name\":\"Augustin\",\"score_popular\":3.0,\"score_original\":1.0,\"score_vintage\":2.5,\"score_classic\":3.0,\"score_trend\":4.0,\"meaning\":\"Exalted\",\"ts\":\"[15, 29, 22, 30, 26, 35, 37, 37, 47, 47, 43, 48, 61, 50, 60, 48, 43, 56, 53, 66, 68]\",\"similar_names\":\"Arthur, Gabriel, Adrien\"},{\"name\":\"Benjamin\",\"score_popular\":3.0,\"score_original\":0.0,\"score_vintage\":0.5,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"Right hand's son\",\"ts\":\"[246, 234, 243, 187, 218, 213, 222, 170, 157, 118, 121, 97, 78, 85, 77, 69, 59, 56, 61, 55, 36]\",\"similar_names\":\"Alexandre, Marc, Augustin\"},{\"name\":\"Jordan\",\"score_popular\":2.0,\"score_original\":0.5,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.0,\"meaning\":\"From a flowing river\",\"ts\":\"[276, 219, 213, 193, 161, 167, 140, 97, 84, 64, 43, 49, 29, 24, 22, 19, 21, 14, 13, 10, 11]\",\"similar_names\":\"Julian, Hamza, Rayane\"},{\"name\":\"Firmin\",\"score_popular\":0.0,\"score_original\":2.0,\"score_vintage\":4.0,\"score_classic\":2.0,\"score_trend\":0.0,\"meaning\":\"Firm or constant\",\"ts\":\"[0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5, 0, 6, 0, 0, 8, 0, 0, 0, 0, 0]\",\"similar_names\":\"\"},{\"name\":\"Joshua\",\"score_popular\":2.5,\"score_original\":1.5,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.5,\"meaning\":\"God is deliverance\",\"ts\":\"[21, 19, 24, 18, 18, 20, 20, 11, 16, 15, 34, 32, 21, 30, 39, 41, 34, 34, 55, 33, 32]\",\"similar_names\":\"Evan, Owen, Yann\"},{\"name\":\"S\\u00e9raphin\",\"score_popular\":0.0,\"score_original\":2.5,\"score_vintage\":3.5,\"score_classic\":1.0,\"score_trend\":0.0,\"meaning\":\"Falcon bird\",\"ts\":\"[0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0]\",\"similar_names\":\"\"},{\"name\":\"Johan\",\"score_popular\":1.5,\"score_original\":0.5,\"score_vintage\":1.0,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"God is merciful\",\"ts\":\"[37, 25, 28, 14, 25, 18, 11, 20, 9, 11, 10, 12, 7, 6, 0, 11, 7, 9, 5, 5, 0]\",\"similar_names\":\"Donovan, Brandon, Kenzo\"},{\"name\":\"Romain\",\"score_popular\":3.5,\"score_original\":0.0,\"score_vintage\":1.0,\"score_classic\":3.5,\"score_trend\":0.0,\"meaning\":\"Coming from Rome\",\"ts\":\"[215, 224, 231, 237, 221, 234, 257, 293, 295, 308, 266, 240, 201, 218, 223, 233, 174, 161, 140, 113, 126]\",\"similar_names\":\"Maxence, Rapha\\u00ebl, Gr\\u00e9goire\"},{\"name\":\"Sylvain\",\"score_popular\":2.0,\"score_original\":0.5,\"score_vintage\":1.0,\"score_classic\":3.5,\"score_trend\":0.0,\"meaning\":\"Man of the forest\",\"ts\":\"[47, 48, 57, 44, 47, 42, 36, 31, 26, 23, 29, 27, 25, 19, 11, 13, 12, 6, 16, 9, 7]\",\"similar_names\":\"Christophe, Yassin, St\\u00e9phane\"},{\"name\":\"Johnny\",\"score_popular\":0.0,\"score_original\":1.0,\"score_vintage\":1.0,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"God is merciful\",\"ts\":\"[18, 18, 25, 19, 8, 20, 13, 7, 9, 9, 0, 14, 6, 0, 0, 0, 0, 0, 0, 0, 0]\",\"similar_names\":\"\"},{\"name\":\"Robin\",\"score_popular\":3.5,\"score_original\":0.5,\"score_vintage\":0.5,\"score_classic\":2.0,\"score_trend\":3.5,\"meaning\":\"Of shining fame\",\"ts\":\"[156, 135, 144, 136, 134, 116, 116, 112, 94, 99, 107, 108, 74, 89, 81, 95, 122, 126, 129, 138, 116]\",\"similar_names\":\"Baptiste, Oscar, Eliott\"},{\"name\":\"Eliot\",\"score_popular\":2.5,\"score_original\":2.0,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":1.0,\"meaning\":\"Yahweh is my God\",\"ts\":\"[0, 0, 5, 9, 0, 11, 9, 19, 22, 11, 30, 23, 31, 29, 25, 25, 27, 23, 31, 21, 28]\",\"similar_names\":\"Jules, Sacha, C\\u00e9lestin\"},{\"name\":\"Juan\",\"score_popular\":1.5,\"score_original\":1.0,\"score_vintage\":1.5,\"score_classic\":3.0,\"score_trend\":0.0,\"meaning\":\"God is merciful\",\"ts\":\"[0, 9, 11, 0, 6, 6, 14, 7, 7, 10, 6, 9, 12, 15, 11, 8, 11, 0, 7, 10, 0]\",\"similar_names\":\"Sandro, Joris, Nils\"},{\"name\":\"Ethan\",\"score_popular\":4.0,\"score_original\":0.5,\"score_vintage\":0.0,\"score_classic\":0.0,\"score_trend\":0.0,\"meaning\":\"Enduring or long lasting\",\"ts\":\"[0, 5, 12, 9, 23, 15, 53, 72, 84, 165, 156, 194, 253, 240, 220, 231, 242, 271, 247, 213, 206]\",\"similar_names\":\"Sean, Sasha, Aaron\"},{\"name\":\"Joachim\",\"score_popular\":2.5,\"score_original\":1.0,\"score_vintage\":1.0,\"score_classic\":2.5,\"score_trend\":3.0,\"meaning\":\"Dove\",\"ts\":\"[43, 56, 38, 28, 31, 37, 38, 27, 29, 25, 22, 27, 16, 25, 23, 13, 24, 15, 27, 18, 24]\",\"similar_names\":\"Livio, David, Ugo\"},{\"name\":\"Elie\",\"score_popular\":2.0,\"score_original\":1.5,\"score_vintage\":2.5,\"score_classic\":3.0,\"score_trend\":3.5,\"meaning\":\"All powerful\",\"ts\":\"[5, 0, 5, 5, 8, 7, 9, 9, 5, 9, 11, 18, 11, 10, 13, 8, 12, 10, 9, 14, 18]\",\"similar_names\":\"Andrea, Matthias, Liam\"}]")


//app.visualize_recommended_names(temp_returned_names)
