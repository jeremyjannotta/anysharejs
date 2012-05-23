(function($){
	
	var AimBuddyList = {
		
		apiBaseUrl : '',
		authToken : null,
		devId : null,
		
		showOfflineUsers : false,
		showMobileUsers : false,
		showInteropUsers : false,
		showMobileForwardedUsers : false,
		showAimIdIfFriendly : false,
		
		eventTarget: $(document),
		
		jsonpCallback : '_AimBuddyListCallback',
		
		uniqueBuddyMap : null,
		
		init : function(options) {
			$.extend(AimBuddyList, options);
			
			try {
				window[AimBuddyList.jsonpCallback] = $.proxy(AimBuddyList.onBuddyListResponse, AimBuddyList);
			} catch (e) {
				// catch
			}
		},
		
		request : function() {
			var url = AimBuddyList.apiBaseUrl + 'presence/get?a=' + encodeURIComponent(AimBuddyList.authToken) 
				+ '&k=' + encodeURIComponent(AimBuddyList.devId) 
				+ '&bl=1&friendly=1&f=json&cacheDefeat='+(new Date().getTime());
			
			$.ajax({
				url: url,
				dataType: 'jsonp',
				cache: true,
				jsonp: 'c',
				jsonpCallback: AimBuddyList.jsonpCallback,
				complete: function(jqXHR, textStatus) {
					if (textStatus == 'success') {
						
					}
				}
			});
		},
		
		onBuddyListResponse : function(jsonData) {
			if(jsonData && jsonData['response'] && jsonData['response']['statusCode'] == 200) {
		        var blGroups = jsonData['response']['data']['groups'];
		        AimBuddyList.createSearchList(blGroups);
		        
		        AimBuddyList.eventTarget.trigger('AimBuddyListReceived', AimBuddyList.uniqueBuddyMap);
		    } else {
		    	console.log('onBuddyListResponse failed:');
		    	console.log(jsonData);
		    }
		},
		
		createSearchList : function(groups) {
		    if(typeof(groups) == 'undefined' || groups == null) {
		        return;
		    }
		    AimBuddyList.uniqueBuddyMap = {};
		    var numUniqueBuddies = 0;
		    var numDupes = 0; // just curious :)
		    for(var i=0; i<groups.length; i++) {
		        var group = groups[i];
		        if(group['smart'] == 2 || group['smart'] == 5 || group['smart'] == 6 || group['name'] == 'Locations') {
		            continue;
		        }
		        var buddies = group['buddies'];
		        for(var j=0; j<buddies.length; j++) {
		            var buddy = buddies[j];
		            if(buddy['userType'] == 'imserv' ||
		               (!AimBuddyList.showOfflineUsers && buddy['state'] == 'offline') ||
		               (!AimBuddyList.showMobileUsers && buddy['userType'] == 'sms') ||
		               (!AimBuddyList.showInteropUsers && buddy['userType'] == 'interop') ||
		               (!AimBuddyList.showMobileForwardedUsers && buddy['userType'] != 'sms' && buddy['state'] == 'mobile')) {
		                continue;
		            }
		            if(typeof(AimBuddyList.uniqueBuddyMap[buddy['aimId']]) == 'undefined') {
		                // this is a unique buddy, so add it to the map
		            	AimBuddyList.uniqueBuddyMap[buddy['aimId']] = buddy;
		                numUniqueBuddies++;
		            } else {
		                numDupes++;
		            }
		        }
		    }
		    return numUniqueBuddies;
		},
		
		getLabelForBuddy : function(buddyObjOrString, addAimIdSuffixIfFriendly) {
		    var buddyLabel = "";
		    
		    var buddyObj = buddyObjOrString;
		    if(typeof(buddyObjOrString) == 'string') {
		        // look up in our 
		        buddyObj = AimBuddyList.uniqueBuddyMap[buddyObjOrString];
		    }
		    if(buddyObj) {
		        var aimId = buddyObj['aimId'];
		        buddyLabel = aimId;
		        if(typeof(buddyObj['friendly']) != 'undefined') {
		            buddyLabel = buddyObj['friendly'];
		        } else if(typeof(buddyObj['displayId']) != 'undefined') {
		            buddyLabel = buddyObj['displayId'];
		        }
		        if(addAimIdSuffixIfFriendly && buddyLabel != aimId && buddyObj['userType'] != 'interop' && aimId.indexOf("@facebook.aol") == -1) {
		            buddyLabel += " ("+aimId+")";
		        }
		    }
		    return buddyLabel;
		},
		
		getSortedBuddyList : function(map) {
		    var buddyList = [];
		    var i = 0; 
		    for (var key in map) {
		        buddyList[i++] = map[key];
		    }
		    
		    buddyList.sort(function(a, b){
		    	var labelA = AimBuddyList.getLabelForBuddy(a, false).toLowerCase();
		        var labelB = AimBuddyList.getLabelForBuddy(b, false).toLowerCase();
		        
		        if (labelA < labelB) {
		        	return -1;
		        } else if (labelA == labelB) {
		        	return 0;
		        } else {
		        	return 1;
		        }
		    });
		    
		    return buddyList;
		}
	};
	
	$.fn.AimBuddyList = $.extend(AimBuddyList.eventTarget, AimBuddyList);
	
	// {"response":{"statusCode":200, "statusText":"Ok", "requestId":"7", "data":{"offlineGrpCollapsed":0, "apfAutoAcceptBuddy":0, "firstImSoundOnly":0, "blockAIMBulletinFeed":0, "blkSendIMWhileAway":0, "friendGetContactList":0, "catchIMsForClient":0, "reduceIMSound":1, "knockNonAOLIMs":1, "notifyReceivedInvite":1, "noFrequentBuddies":0, "sortBuddyList":0, "acceptSMSLegal":0, "globalOTR":0, "discloseTyping":1, "viewIMTimestamps":1, "blockAIMPagesFeed":0, "buddyInfoOnMouseover":1, "blockPluginsFeed":0, "blockLinksFeed":0, "showMobile":1, "showAwayIdle":1, "showFriendlyName":1, "acceptBgs":1, "discloseIdle":1, "confirmDirectIM":1, "imblastInviteNotify":1, "blockAIMProfileFeed":0, "enterDoesCRLF":0, "logIMs":1, "sortGroup":1, "showGroups":0, "sendBuddyFeed":1, "discloseBuddyMatches":1, "acceptBLSounds":1, "knockNonListIMs":1, "enableBeboAlerts":1, "showBuddyFeed":1, "showBuddyListFilter":1, "acceptNonListBart":1, "imblastInviteFromBuddyOnly":0, "blockUncutFeed":0, "logIMsActivated":1, "saveStatusMsg":1, "expandBuddies":0, "blogNoComments":0, "viewSmilies":1, "displayLogin":1, "apfAutoAccept":0, "noSeeRecentBuddies":0, "blockStickiesFeed":0, "catchIMs":0, "playExit":1, "blockLocationFeed":0, "acceptCustomBart":1, "blockJournalsFeed":0, "blogAwayMessages":0, "newMessageSmallNotification":1, "acceptBLRichText":1, "acceptIMSounds":1, "contactImportDone":0, "blogAIMSigMessages":0, "showOffLineBuddies":1, "compadInit":0, "friendOfFriend":0, "playIMSound":1, "playEnter":1, "showOfflineGrp":1, "acceptOffLineIM":1, "showCapabilities":1, "discloseRadio":1, "acceptSuperIcons":1, "thirdPartyFeeds":0, "noSaveVanityInfo":0, "acceptChromes":1, "displayEBuddy":1, "apfNotifyReceivedInviteByEmail":0, "blockAwayMsgFeed":0, "oneTabbedIMWindow":1, "acceptIcons":1}}}
})(jQuery);