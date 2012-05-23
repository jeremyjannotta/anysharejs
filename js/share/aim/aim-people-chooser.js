/**
 * @requires jquery, jquery-ui-autocomplete, jquery-ui-autocomplete-html, aim-buddy-list
 */

(function($){
	
	var defaultOptions = {
		apiBaseUrl: 'http://api.aim.net/',
		authToken: '',
		devId: 'ao1sTjQGziECwN2s',
		pageBaseUrl: location.href.substring(0, location.href.lastIndexOf('/')+1),
		missingIconUrl: ''
	};
	
	var AimPeopleChooser = {
		
		options : null,
			
		init : function(customOptions) {
			AimPeopleChooser.options = $.extend( {}, defaultOptions, customOptions );
			
			var $el = this;
			
			var $inputEl = $el.get(0).nodeName == 'INPUT' 
				? $el
				: $('<input type="text">').appendTo($el);
			$inputEl.addClass('aim-people-chooser-input ui-autocomplete-input');
			
			$el.data('AimPeopleChooser', {
				inputEl: $inputEl,
				menuEl: null
			});
			
		},
		
		updateBuddyList : function() {
			var $this = this;
			
			$.AimBuddyList.init({
				apiBaseUrl: AimPeopleChooser.options.apiBaseUrl,
				authToken: AimPeopleChooser.options.authToken,
				devId: AimPeopleChooser.options.devId
			});
			
			$.AimBuddyList.on('AimBuddyListReceived', {context:$this}, function(event, bl){
				
				AimPeopleChooser.createMenuItems.apply($this, [bl]);
			});
		
			$.AimBuddyList.request();
			
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
			    
			    $(data.inputEl).autocomplete({ 
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
		
		// Initialize for just the first element
		AimPeopleChooser.init.apply(this.first(), [options]);
		
		return this;
	};
	
})(jQuery);