//STICKY NAV SCRIPT

var stickyNav=(function(){

    //private vars
    var theMobileWidth, stickyElementSelectors;
    var bodEl=jQuery('body:first');
    var windowResize_timeout, windowScroll_timeout;

    //fires only once on page load to init sticky nav
    var initOnceStickyNav=function(){
        var elIndex=0, lowestZindex;
        for(var s=0;s<stickyElementSelectors.length;s++){
            var elemJson=stickyElementSelectors[s];
            var selector=elemJson['selector'];
            var el=jQuery(selector);
            if(el.length>0){
                if(elemJson.hasOwnProperty('zindex')){
                    if(lowestZindex==undefined || elemJson['zindex'] < lowestZindex){
                        lowestZindex=elemJson['zindex'];
                    }
                    el.css('z-index',elemJson['zindex']);
                }
                el.addClass('sticky-element');
                el.attr('data-sticky-index', elIndex);
                if(elIndex===0){
                    el.addClass('first-sticky');
                    el.before('<div class="sticky-placeholder"></div><div class="sticky-bg"></div>');
                }
                elIndex++;
            }
        }

        //if any z-indexes were specified, set the background z-index to be 1 less than the lowest z-index
        if(lowestZindex!=undefined){
            var stickyBg=jQuery('.sticky-bg:first');
            stickyBg.css('z-index', (lowestZindex-1));
        }

        //init the events
        initOnceEvents();
    };

    //detect if the width is in mobile mode
    var isStickyMobileMode=function(){
        var isMobile=false;
        if(window.innerWidth<=theMobileWidth){
            isMobile=true;
        }
        return isMobile;
    };

    //clear cached window width (used to figure out if resizing needs to be calculated on window width updates)
    var clearWindowSizeChangeCache=function(phSticky){
        var cachedWidth=phSticky.attr('data-window-width');
        if(cachedWidth!=undefined) {
            phSticky.removeAttr('data-window-width');
        }
    };

    //detect if the window width has changed since it was last checked
    var isWindowWidthChanged=function(phSticky){
        //cache the window width to decide if it has changed since last time
        var widthHasChanged=false;
        var prevWinWidth=phSticky.attr('data-window-width');
        //if no cached window width
        if(prevWinWidth==undefined){
            phSticky.attr('data-window-width', window.innerWidth);
            widthHasChanged=true;
        }else{
            //if the current window width is different from cached value
            if(prevWinWidth!=window.innerWidth){
                phSticky.attr('data-window-width', window.innerWidth);
                widthHasChanged=true;
            }
        }
        return widthHasChanged;
    };

    //make sure to adjust the sticky nav sizes based on a changing window width
    var updateStickyNavSize=function(stickyEls, phSticky){
        //if the window width has changed since last time
        if(isWindowWidthChanged(phSticky)) {
            //stack up the sticky elements by setting their top value
            stickyEls.css({top: ''});
            var currentTop = 0;
            for (var s = 0; s < stickyEls.length; s++) {
                var el = stickyEls.filter('[data-sticky-index="' + s + '"]');
                el.css({top: currentTop + 'px'}); //adjust top value
                el.attr('data-top',currentTop + 'px');
                currentTop += el.outerHeight();
            }
            //sticky placeholder height
            phSticky.css({height:currentTop+'px'});

            //sticky background height
            var bgSticky=phSticky.next('.sticky-bg:first');
            bgSticky.css({height:currentTop+'px'});
        }
    };

    //make sure sticky nav is enabled for current scroll position
    var turnStickyNavOn=function(stickyEls, phSticky){

        //make sure to adjust the sticky nav sizes based on a changing window width
        updateStickyNavSize(stickyEls, phSticky);

        //sticky nav NOT already on
        if(!bodEl.hasClass('sticky-nav-enabled')) {
            bodEl.addClass('sticky-nav-enabled');
        }
    };

    //make sure sticky nav is disabled for current scroll position
    var turnStickyNavOff=function(stickyEls, phSticky){
        //sticky nav IS already on
        if(bodEl.hasClass('sticky-nav-enabled')) {
            bodEl.removeClass('sticky-nav-enabled');
            stickyEls.css({top:''});
            stickyEls.removeAttr('data-top');

            //sticky placeholder height
            phSticky.css({height:''});

            //sticky background height
            var bgSticky=phSticky.next('.sticky-bg:first');
            bgSticky.css({height:''});

            clearWindowSizeChangeCache(phSticky);
        }
    };

    //decide if the sticky nav should be enabled or disabled depending on scroll position
    var updateStickyNav=function(isInitLoad){

        //decide if the initial init should be fired
        if(isInitLoad==undefined){ isInitLoad=false; }
        if(isInitLoad){
            initOnceStickyNav();
        }

        //get all of the sticky nav elements
        var stickyEls=jQuery('.sticky-element[data-sticky-index]');
        if(stickyEls.length>0){

            //figure out the current scroll position and the position of the sticky elements when they are docked
            var phSticky=jQuery('.sticky-placeholder:first');
            var phOffsetTop=phSticky.offset().top;
            var winScrollTop=jQuery(window).scrollTop();

            //if sticky nav should be on, based on scroll position
            if(winScrollTop>=phOffsetTop){
                //if NOT in mobile mode
                if(!isStickyMobileMode()) {
                    turnStickyNavOn(stickyEls, phSticky);
                }else{ //sticky nav is off in mobile views
                    turnStickyNavOff(stickyEls, phSticky);
                }
            }else{ //sticky nav should be off
                turnStickyNavOff(stickyEls, phSticky);
            }
        }
    };

    //hook up updateStickyNav() to triggering events
    var initOnceEvents=function() {
        jQuery(window).ready(function () {

            jQuery(window).scroll(function () {
                updateStickyNav(); //happens often and rapidly... made this as light as possible
            });

            jQuery(window).resize(function () {
                clearTimeout(windowResize_timeout);
                windowResize_timeout = setTimeout(function () {
                    updateStickyNav();
                }, 100); //can afford to fire this less often
            });
        });
    }

    //public
    return {
        init:function(args){
            var isEnabled=true;
            if(args.hasOwnProperty('is_enabled')){
                isEnabled=args['is_enabled']();
            }
            if(isEnabled) {
                if (args.hasOwnProperty('mobile_width')) {
                    theMobileWidth = args['mobile_width'];
                }
                if (args.hasOwnProperty('sticky_elements')) {
                    stickyElementSelectors = args['sticky_elements'];
                }
                if (theMobileWidth != undefined && stickyElementSelectors != undefined) {
                    jQuery(window).ready(function () {
                        updateStickyNav(true);
                    });
                }
            }
        }
    };
}());
