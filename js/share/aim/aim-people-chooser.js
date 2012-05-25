/**
 * @requires jquery, jquery-ui-autocomplete, jquery-ui-autocomplete-html, aim-buddy-list
 */

(function($){
	
	var defaultOptions = {
		apiBaseUrl: 'http://api.aim.net/',
		authToken: null,
		devId: 'ao1sTjQGziECwN2s',
		pageBaseUrl: location.href.substring(0, location.href.lastIndexOf('/')+1),
		missingIconUrl: '',
		successUrl: null
	};
	
	var AimPeopleChooser = {
		
		options : null,
			
		init : function(options) {
			AimPeopleChooser.options = options;
			var $el = this;
			
			var $inputEl = $el.get(0).nodeName == 'INPUT' 
				? $el
				: $('<input type="text">').appendTo($el);
			$inputEl.addClass('aim-people-chooser-input ui-autocomplete-input');
			
			var $loginLabel = $('<span class="aim-login-label">')
				.insertBefore($inputEl)
				.hide();
			
			var $loginButton = $('<button class="aim-login-button">Login to AIM</button>')
				.insertBefore($inputEl)
				.multiAuth({
					successUrl: AimPeopleChooser.options.successUrl,
					tabs: ['aol','aim'],
					devId: AimPeopleChooser.options.devId,
					getTokenCallback: $.proxy(AimPeopleChooser.onTokenReceived, $el)
				});
			
			$el.data('AimPeopleChooser', {
				inputEl: $inputEl,
				loginButton: $loginButton,
				loginLabel: $loginLabel
			});

			$.AimBuddyList.on('AimBuddyListReceived', {context:$el}, function(event, bl){
				
				AimPeopleChooser.createMenuItems.apply($el, [bl]);
			});
		},
		
		onTokenReceived: function( json ){
			var $button = this.data('AimPeopleChooser').loginButton;
			var $label = this.data('AimPeopleChooser').loginLabel;

			if (json.response.statusCode === 200) {
				$button.html('Logout of AIM');
				$label.html('Welcome ' + json.response.data.userData.attributes.displayName + '!')
					.show();
				
				AimPeopleChooser.options.authToken = json.response.data.token.a;

				$.AimBuddyList.init({
					apiBaseUrl: AimPeopleChooser.options.apiBaseUrl,
					authToken: AimPeopleChooser.options.authToken,
					devId: AimPeopleChooser.options.devId
				});
				
				$.AimBuddyList.request();
				
			} else {
				$button.html('Login to AIM');
				$label.empty().hide();
			}
		},
		
		updateBuddyList : function() {
			var $this = this;

			if (!AimPeopleChooser.options.authToken) {
				$this.data('AimPeopleChooser').loginButton.click();
			} else {
				$.AimBuddyList.request();
			}
			
			return this;
		},
		
		// Convert unique buddy map into a sorted list of combobox menu items
		createMenuItems : function(uniqueBuddyMap) {
		
			var data = this.data('AimPeopleChooser');
			if (data.inputEl) {
			    
				var sortedBuddyList = $.AimBuddyList.getSortedBuddyList(uniqueBuddyMap);
			    var menuSource = [];
			    
			    for (var i=0; i < sortedBuddyList.length; i++) {
			    	var buddyObj = sortedBuddyList[i];
			    	var buddyIcon = buddyObj['buddyIcon'] || AimPeopleChooser.options.missingIconUrl;
			    	var buddyLabel = $.AimBuddyList.getLabelForBuddy(buddyObj, $.AimBuddyList.showAimIdIfFriendly);
			        var buddyTitle = $.AimBuddyList.getLabelForBuddy(buddyObj, true);
			        
			        var iconEl = '<img src="'+buddyIcon+'" class="aim-buddy-icon"/>';
			        
			        menuSource[i] = {
			        	label: iconEl + buddyTitle,
			        	value: buddyLabel
			        };
			    }
			    
			    $(data.inputEl).combobox({ 
			    	source: menuSource,
			    	html: true
			    });
			}
		}
	};
	
	$.fn.AimPeopleChooser = function(options) {

		// Expose methods onto this jq object
		$.extend(this, {
			updateBuddyList: $.proxy(AimPeopleChooser.updateBuddyList, this)
		});

		// Merge default options with custom options
		var customOptions = $.extend( {}, defaultOptions, options );
		
		// Initialize for just the first element
		AimPeopleChooser.init.apply(this.first(), [customOptions]);
		
		return this;
	};
	
})(jQuery);