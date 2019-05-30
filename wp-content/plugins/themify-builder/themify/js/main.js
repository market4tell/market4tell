// tfsmartresize helper
!function (e) {
    var t, i, n = e.event;
    t = n.special.tfsmartresize = {setup: function () {
            e(this).on('resize', t.handler);
        }, teardown: function () {
            e(this).off('resize', t.handler);
        }, handler: function (e, r) {
            var s = this, a = arguments, o = function () {
                e.type = 'tfsmartresize', n.dispatch.apply(s, a);
            };
            i && clearTimeout(i), r ? o() : i = setTimeout(o, t.threshold);
        }, threshold: 150};
}(jQuery);
var Themify, ThemifyGallery;
(function ($, window, document, undefined) {
    'use strict';
    window.addEventListener( 'load', function () {
        window.loaded = true;
        if (!Themify.is_builder_active) {
            Themify.triggerEvent( window, 'resize' );
        }
        Themify.body[0].classList.add( 'page-loaded' );
    },{once:true,passive:true});
    var CustomEvent;
    if ( typeof window.CustomEvent !== 'function' ){
        CustomEvent = function( event, params ) {
          var evt = document.createEvent( 'CustomEvent' ),
            detail = params!==undefined?params.detail:undefined;
            evt.initCustomEvent( event, false, false, detail );
          return evt;
        };
        CustomEvent.prototype = window.Event.prototype;

        window.CustomEvent = CustomEvent;
    }
    Themify = {
        fonts: [],
        cssLazy: [],
        jsLazy: [],
        body:null,
        is_builder_active: false,
        is_builder_loaded:false,
        isLoaded:null,
        triggerEvent: function (target, type, params) {
            var ev;
            try{
                ev=new window.CustomEvent(type,{detail:params});
            }
            catch (e) {
                ev=window.CustomEvent(type,{detail:params});
            }
            target.dispatchEvent(ev);
        },
        UpdateQueryString : function ( a, b, c ) {
                c||(c=window.location.href);var d=RegExp("([?|&])"+a+"=.*?(&|#|$)(.*)","gi");if(d.test(c))return b!==void 0&&null!==b?c.replace(d,"$1"+a+"="+b+"$2$3"):c.replace(d,"$1$3").replace(/(&|\?)$/,"");if(b!==void 0&&null!==b){var e=-1!==c.indexOf("?")?"&":"?",f=c.split("#");return c=f[0]+e+a+"="+b,f[1]&&(c+="#"+f[1]),c}return c;
        },
        Init: function () {
            Themify.body = $('body');//cache body, main.js is loading in the footer
            if (typeof themify_vars !== 'undefined') {
                if (typeof tbLocalScript !== 'undefined' && tbLocalScript !== null) {
                    var self = Themify;
                    self.is_builder_active = document.body.classList.contains('themify_builder_active');
                    if (self.is_builder_active) {
                        window.top.Themify.is_builder_active = true;
                    }
                    var loadBuilder = function (e, el) {
                        if (document.querySelector('.themify_builder_content div:not(.js-turn-on-builder)') !== null) {
                            if (!self.is_builder_active) {
                                if (self.isLoaded === null) {
                                    var st = document.getElementById('builder-styles-css');
                                    if (st !== null && document.getElementById('themify-builder-style') === null) {
                                        var link = document.createElement("link");
                                        link.id = 'themify-builder-style';
                                        link.rel = 'stylesheet';
                                        link.type = 'text/css';
                                        link.href = tbLocalScript.builder_url + '/css/themify-builder-style.css?ver=' + themify_vars.version;
                                        st.insertAdjacentElement('beforebegin', link);
                                        st = null;
                                    }
                                }
                                if (el) {
                                    st = el[0].getElementsByClassName('tb_style_generated');
                                    for (var i = st.length - 1; i > -1; --i) {
                                        self.LoadCss(st[i].getAttribute('data-url'), false);
                                        st[i].parentNode.removeChild(st[i]);
                                    }
                                    if (self.isLoaded === true) {
                                        $(window).triggerHandler('resize');
                                    }
                                }
                            }
                            if (self.isLoaded === null) {

                                self.LoadAsync(tbLocalScript.builder_url + '/js/themify.builder.script.js', function () {
                                    if (el) {
                                        $(window).triggerHandler('resize');
                                    }
                                    self.isLoaded = true;

                                }, null, null, function () {
                                    return typeof ThemifyBuilderModuleJs !== 'undefined';
                                });
                            }
                            return true;
                        }
                        return false;
                    };
                    $(document).ready(function () {
                        tbLocalScript.isTouch = document.body.classList.contains('touch');
                        if (!self.is_builder_active) {
                            if (loadBuilder() === false) {
                                self.body.on('infiniteloaded.themify', loadBuilder);
                            }
                        }
                    });
                }
                this.bindEvents();
            }
        },
        bindEvents: function () {
            var self = Themify;
            if (window.loaded) {
                self.domready();
                self.windowload();
            }
            else {
                $(window).load(self.windowload);
                $(document).ready(self.domready);
            }
        },
        domready: function () {
            setTimeout(Themify.LazyLoad,10);
            if (!Themify.is_builder_active) {
                Themify.InitCarousel();
                Themify.InitMap();
            }
        },
        windowload: function () {
            var items = document.getElementsByClassName('shortcode');
            for(var i=items.length-1;i>-1;--i){
                if(items[i].classList.contains('slider') || items[i].classList.contains('post-slider')){
                    items[i].style['height']='auto';
                    items[i].style['visibility']='visible';
                }
            }
            items = document.getElementsByClassName('slideshow-wrap');
            for(var i=items.length-1;i>-1;--i){
                items[i].style['height']='auto';
                items[i].style['visibility']='visible';
            }
            items=null;
            if (!Themify.is_builder_active) {
                Themify.InitGallery();
            }
        },
        LazyLoad: function () {
            var self = Themify,
                    is_fontawesome = self.is_builder_active || document.getElementsByClassName('fa')[0]!==undefined,
                    is_themify_icons = self.is_builder_active || document.querySelector('.module-menu[data-menu-breakpoint]')!==null;
            if (!is_fontawesome) {
                is_fontawesome = self.checkFont('FontAwesome');
            }
            if(!is_themify_icons){
                is_themify_icons = document.querySelector('span[class*="ti-"]')!==null;
                if(!is_themify_icons){
                    is_themify_icons = document.querySelector('i[class*="ti-"]')!==null;
                }
            }
            if (!is_themify_icons) {
                is_themify_icons = self.checkFont('Themify');
            }
            if (is_fontawesome) {
                self.LoadCss(themify_vars.url + '/fontawesome/css/font-awesome.min.css', themify_vars.version);
            }
            if (is_themify_icons) {
                self.LoadCss(themify_vars.url + '/themify-icons/themify-icons.css', themify_vars.version);
            }
            if (typeof themify_vars.fontello_path === 'string' && document.querySelector('i[class*="icon-"]')!==null) {
                self.LoadCss(themify_vars.fontello_path);
            }
            if (self.is_builder_active || document.getElementsByClassName('shortcode')[0]!==undefined) {
                self.LoadCss(themify_vars.url + '/css/themify.framework.css', null, document.getElementById('themify-framework-css'));
            }
        },
        InitCarousel: function (el) {
            
            var sliders = $('.slides[data-slider]', el);
            function carouselCalback(el) {
                sliders.each(function () {
                    if($(this).closest('.carousel-ready').length>0){
                        return true;
                    }
                    $(this).find('> br, > p').remove();
                    var $this = $(this),
						data = JSON.parse( atob( $(this).data('slider') ) ),
						height = typeof data.height === 'undefined'? 'auto' : data.height,
						slideContainer = undefined !== data.custom_numsldr ? '#' + data.custom_numsldr : '#slider-' + data.numsldr,
						speed = data.speed >= 1000 ? data.speed : 1000 * data.speed,
						args = {
							responsive: true,
							swipe: true,
							circular: data.wrapvar,
							infinite: data.wrapvar,
							auto: {
								play: data.auto != 0,
								timeoutDuration: data.auto >= 1000 ? data.auto : 1000 * data.auto,
								duration: speed,
								pauseOnHover: data.pause_hover
							},
							scroll: {
								items: parseInt(data.scroll),
								duration: speed,
								fx: data.effect
							},
							items: {
								visible: {
									min: 1,
									max: parseInt(data.visible)
								},
								width: 120,
								height: height
							},
							onCreate: function (items) {
								$this.closest('.caroufredsel_wrapper').outerHeight($this.outerHeight(true));
								$(slideContainer).css({'visibility': 'visible', 'height': 'auto'});
								$this.closest( '.carousel-wrap' ).addClass( 'carousel-ready' );
							}
						};

                    if (data.slider_nav) {
                        args.prev = slideContainer + ' .carousel-prev';
                        args.next = slideContainer + ' .carousel-next';
                    }
                    if (data.pager) {
                        args.pagination = slideContainer + ' .carousel-pager';
                    }
                    $this.imagesLoaded().always(function () {
                        $this.carouFredSel(args);
                    });
                });

                $(window).off('tfsmartresize.tfcarousel').on('tfsmartresize.tfcarousel', function () {
                    sliders.each(function () {
                        var heights = [],
                                newHeight,
                                $self = $(this);
                        $self.find('li').each(function () {
                            heights.push($(this).outerHeight(true));
                        });
                        newHeight = Math.max.apply(Math, heights);
                        $self.outerHeight(newHeight);
                        $self.parent().outerHeight(newHeight);
                    });
                });
            }
            if (sliders.length > 0) {
                var self = this;
                self.LoadAsync(themify_vars.includesURL + 'js/imagesloaded.min.js', function () {
                    if ('undefined' === typeof $.fn.carouFredSel) {
                        self.LoadAsync(themify_vars.url + '/js/carousel.min.js', function () {
                            carouselCalback(el);
                        }, null, null, function () {
                            return ('undefined' !== typeof $.fn.carouFredSel);
                        });
                    }
                    else {
                        carouselCalback(el);
                    }
                }, null, null, function () {
                    return ('undefined' !== typeof $.fn.imagesLoaded);
                });
            }
        },
        InitMap: function (el) {
            var self = Themify;
            if ($('.themify_map', el).length > 0) {
                if (typeof google !== 'object' || typeof google.maps !== 'object' || themify_vars.isCached === 'enable') {
                    if(themify_vars.isCached === 'enable'){
                        google.maps = {__gjsload__: function () {
                            return;
                        }};
                    }
                    else if (!themify_vars.map_key) {
                        themify_vars.map_key = '';
                    }
                    self.LoadAsync('//maps.googleapis.com/maps/api/js', self.MapCallback,'v=3.exp&callback=Themify.MapCallback&key=' + themify_vars.map_key,null,function(){
                        return typeof google === 'object' && typeof google.maps === 'object';
                    });
                } else {
                     self.MapCallback(el);
                }
            }
            if ( $('.themify_bing_map',el).length > 0){
                if (typeof Microsoft !== 'object' || typeof Microsoft.Maps !== 'object' || themify_vars.isCached === 'enable') {
                        self.LoadAsync('//www.bing.com/api/maps/mapcontrol?',function(){
                            self.GetMap(el);
                            if (!themify_vars.bing_map_key) {
                                themify_vars.bing_map_key = '';
                            }
                        },null, function(){
                                return typeof Microsoft !== 'object' && typeof Microsoft.Maps !== 'object';
                        });
                } else {
                        self.GetMap(el);
                }
            }
        },
        MapCallback: function (el) {
            $('.themify_map', el).each(function (i) {
                var $this = $( this ),
                    address = $this.data( 'address' ),
                    zoom = parseInt( $this.data( 'zoom' ) ),
                    type = $this.data( 'type' ),
                    scroll = $this.data( 'scroll' ) === 1,
                    dragMe = $this.data( 'drag' ) === 1,
                    controls = $this.data( 'control' ) === 1,
                    delay = i * 1000;
                setTimeout(function () {
                    var geo = new google.maps.Geocoder(),
                            latlng = new google.maps.LatLng(-34.397, 150.644),
                            mapOptions = {
                                zoom: zoom,
                                center: latlng,
                                mapTypeId: google.maps.MapTypeId.ROADMAP,
                                scrollwheel: scroll,
                                draggable: dragMe,
                                disableDefaultUI: controls
                            };
                    switch (type.toUpperCase()) {
                        case 'ROADMAP':
                            mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
                            break;
                        case 'SATELLITE':
                            mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
                            break;
                        case 'HYBRID':
                            mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
                            break;
                        case 'TERRAIN':
                            mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
                            break;
                    }

                    var map = new google.maps.Map( $this[0], mapOptions ),
                        revGeocoding = $this.data( 'reverse-geocoding' ) ? true : false;

                    google.maps.event.addListenerOnce(map, 'idle', function () {
                        Themify.body.trigger('themify_map_loaded', [$this, map]);
                    });

                    /* store a copy of the map object in the dom node, for future reference */
                    $this.data('gmap_object', map);

                    if (revGeocoding) {
                        var latlngStr = address.split(',', 2),
                                lat = parseFloat(latlngStr[0]),
                                lng = parseFloat(latlngStr[1]),
                                geolatlng = new google.maps.LatLng(lat, lng),
                                geoParams = {'latLng': geolatlng};
                    } else {
                        var geoParams = {'address': address};
                    }
                    geo.geocode(geoParams, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            var position = revGeocoding ? geolatlng : results[0].geometry.location;
                            map.setCenter(position);
                            var marker = new google.maps.Marker({
									map: map,
									position: position
								}),
								info = $this.data('info-window');
                            if (undefined !== info) {
                                var contentString = '<div class="themify_builder_map_info_window">' + info + '</div>',
                                        infowindow = new google.maps.InfoWindow({
                                            content: contentString
                                        });

                                google.maps.event.addListener(marker, 'click', function () {
                                    infowindow.open(map, marker);
                                });
                            }
                        }
                    });
                }, delay);
            });
        },
        GetMap :function (el) {
                $('.themify_bing_map',el).each(function (i) {

                    var $this = $( this ),
                            mapArgs ={},
                            address = $this.data( 'address' ),
                            zoom = parseInt( $this.data( 'zoom' ) ),
                        scroll = $this.data( 'scroll' ) !== '1',
                        dragMe = $this.data( 'drag' ) !== '1',
                            type = $this.data( 'type' ),
						controls = $this.data( 'control' ) !== 1 ,
                            delay = i * 1000,
                            map,searchManager;

                    address = address.split(',');
                    setTimeout(function () {
                            mapArgs={
                                    disableBirdseye:true,
                                    disableScrollWheelZoom : scroll,
                            showDashboard :controls,
								    credentials:themify_vars.bing_map_key,
                                    disablePanning :dragMe,
                                    mapTypeId : null,
                                    zoom: zoom
                            };

                            try {
                                    map = new Microsoft.Maps.Map($this[0], mapArgs);
                            }
                            catch(err) {
                                    Themify.GetMap();
                                    return;
                            }

                            function setMapID( mapOption ){
                                    switch (type) {
                                            case 'aerial' :
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                                                    break;
                                            case 'road' :
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.road;
                                                    break;
                                            case 'streetside':
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.streetside;
                                                    break;
                                            case 'canvasDark':
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.canvasDark;
                                                    break;
                                            case 'canvasLight':
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.canvasLight;
                                                    break;
                                            case 'birdseye' :
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.birdseye;
                                                    break;
                                            case 'ordnanceSurvey':
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.ordnanceSurvey;
                                                    break;
                                            case 'grayscale':
                                                    mapOption.mapTypeId = Microsoft.Maps.MapTypeId.grayscale;
                                                    break;
                                    }
                                    return mapOption;
                            }

                            //Make a request to geocode.
                            geocodeQuery(address);

                            function geocodeQuery(query) {
                                    //If search manager is not defined, load the search module.
                                    if (!searchManager) {
                                            //Create an instance of the search manager and call the geocodeQuery function again.
                                            Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
                                                    searchManager = new Microsoft.Maps.Search.SearchManager(map);
                                                    geocodeQuery(query);
                                            });
                                    } else {
                                            var searchRequest = {
                                                    where: query,
                                                    callback: function (r) {
                                                            //Add the first result to the map and zoom into it.
                                                            if (r && r.results && r.results.length > 0) {
                                                                    var args = {
                                                                            center :r.results[0].bestView.center
                                                                    }
                                                                    args = setMapID(args);
                                                                    map.setView(args);

                                                                    var pushpin = new Microsoft.Maps.Pushpin(map.getCenter(),null),
                                                                        info = $this.data('info-window');
                                                                    if (undefined !== info) {

                                                                             var infobox = new Microsoft.Maps.Infobox(map.getCenter(), {
                                                                                    description: info,
                                                                                    visible: false });
                                                                            infobox.setMap(map);
                                                                            //Add a click event handler to the pushpin.
                                                                            Microsoft.Maps.Events.addHandler(pushpin, 'click', function (e) {
                                                                                    infobox.setOptions({ visible: true });
                                                                            });

                                                                    }
                                                                    map.entities.push(pushpin);

                                                            }
                                                    },
                                                    errorCallback: function (e) {
                                                            //If there is an error, alert the user about it.
                                                            console.log("No results found.");
                                                    }
                                            };
                                            //Make the geocode request.
                                            searchManager.geocode(searchRequest);
                                    }
                            }

                            address = encodeURI(address);

                    },delay);
            });

        },
        LoadAsync: function (src, callback, version, defer, test) {
            var id = this.hash(src), // Make script path as ID
                exist = this.jsLazy.indexOf(id) !== -1,
                existElemens = exist || document.getElementById(id);
                if(!exist){ 
                    this.jsLazy.push(id);
                }
            if (existElemens) {
                if (callback) {
                    if (test) {
                        var callbackTimer = setInterval(function () {
                            var call = false;
                            try {
                                call = test.call();
                            } catch (e) {
                            }
                            if (call) {
                                clearInterval(callbackTimer);
                                callback.call();
                            }
                        }, 20);
                    } else {
                        callback();
                    }
                }
                return;
            }
            else if (test) {
                try {
                    if (test.call()) {
                        if (callback) {
                            callback.call();
                        }
                        return;
                    }
                } catch (e) {
                }
            }
            if (src.indexOf('.min.js') === -1 && typeof themify_vars!=='undefined' && themify_vars!==null) {
                var name = src.match(/([^\/]+)(?=\.\w+$)/);
                if (name && name[0]) {
                    name = name[0];
                    if (themify_vars.minify.js[name]) {
                        src = src.replace(name + '.js', name + '.min.js');
                    }
                }
            }
            var s, r, t;
            r = false;
            s = document.createElement('script');
            s.type = 'text/javascript';
            s.id = id;
            if(!version && version!==false && 'undefined' !== typeof tbLocalScript ){
                    version = tbLocalScript.version;
            }
            s.src = version? src + '?ver=' + version : src;
            s.async = true;
            s.onload = s.onreadystatechange = function () {
                if (!r && (!this.readyState || this.readyState === 'complete'))
                {
                    r = true;
                    if (callback) {
                        callback();
                    }
                }
            };
            t = document.getElementsByTagName('script')[0];
            t.parentNode.insertBefore(s, t);
        },
        LoadCss: function (href, version, before, media, callback) {
			if ( typeof href === 'undefined' ) return;
			
            if(!version && version!==false && 'undefined' !== typeof tbLocalScript ){
                    version = tbLocalScript.version;
            }
            var id = this.hash(href),
                exist = this.cssLazy.indexOf(id)  !== -1,
                existElemens =exist || document.getElementById(id),
                fullHref =  version? href + '?ver=' + version : href; 
            if(!exist){
                this.cssLazy.push(id);
            }
            if(existElemens===false){
                var el = document.querySelector("link[href='" + fullHref + "']");
                existElemens=el!==null && el.getAttribute('rel')==='stylesheet';
            }
            if (existElemens) {
                if(callback){
                    callback();
                }
                return false;
            }
            if (href.indexOf('.min.css') === -1 && typeof themify_vars!=='undefined' && themify_vars!==null) {
                var name = href.match(/([^\/]+)(?=\.\w+$)/);
                if (name && name[0]) {
                    name = name[0];
                    if (themify_vars.minify.css[name]) {
                        fullHref = fullHref.replace(name + '.css', name + '.min.css');
                    }
                }
            }
            var doc = window.document,
                    ss = doc.createElement('link'),
                    ref;
            if (before) {
                ref = before;
            }
            else {
                var refs = (doc.body || doc.head).childNodes;
                ref = refs[ refs.length - 1];
            }

            var sheets = doc.styleSheets;
            ss.rel = 'stylesheet';
            ss.href = fullHref;
            // temporarily set media to something inapplicable to ensure it'll fetch without blocking render
            ss.media = 'only x';
            ss.id = id;

            // Inject link
            // Note: `insertBefore` is used instead of `appendChild`, for safety re: http://www.paulirish.com/2011/surefire-dom-element-insertion/
            ref.parentNode.insertBefore(ss, (before ? ref : ref.nextSibling));
            // A method (exposed on return object for external use) that mimics onload by polling document.styleSheets until it includes the new sheet.
            var onloadcssdefined = function (cb) {
                var resolvedHref = ss.href,
                    i = sheets.length;
                while (--i) {
                    if (sheets[ i ].href === resolvedHref) {
                        if (callback) {
                            callback();
                        }
                        return cb();
                    }
                }
                setTimeout(function () {
                    onloadcssdefined(cb);
                });
            };

            // once loaded, set link's media back to `all` so that the stylesheet applies once it loads
            ss.onloadcssdefined = onloadcssdefined;
            onloadcssdefined(function () {
                ss.media = media || 'all';
            });
            return ss;
        },
        checkFont: function (font) {
            // Maakt een lijst met de css van alle @font-face items.
            if (this.fonts.indexOf(font)!==-1) {
                return true;
            }
            if (this.fonts.length === 0) {
                var o = [],
                    sheets = document.styleSheets,
                    i = sheets.length;
                while (0 <= --i) {
                    if(sheets[i].hasOwnProperty('cssRules') || sheets[i].hasOwnProperty('rules')){
                        var rules = sheets[i].cssRules || sheets[i].rules || [],
                            j = rules.length;

                        while (0 <= --j) {
                            if (rules[j].style) {
                                var fontFamily = '';
                                if (rules[j].style.fontFamily) {
                                    fontFamily = rules[j].style.fontFamily;
                                }
                                else {
                                    fontFamily = rules[j].style.cssText.match(/font-family\s*:\s*([^;\}]*)\s*[;}]/i);
                                    if (fontFamily) {
                                        fontFamily = fontFamily[1];
                                    }
                                }
                                if (fontFamily === font) {
                                    this.fonts.push(fontFamily);
                                    return true;
                                }
                                if (fontFamily) {
                                    o[fontFamily]=true;
                                }
                            }
                        }
                    }
                }
                this.fonts = Object.keys(o);
            }
            return false;
        },
        lightboxCallback: function ($el, $args) {
            this.LoadAsync(themify_vars.url + '/js/themify.gallery.js', function () {
                Themify.GalleryCallBack($el, $args);
            }, null, null, function () {
                return ('undefined' !== typeof ThemifyGallery);
            });
        },
        InitGallery: function( $el, $args ) {
			var self = this,
				lightboxConditions = false,
				lbox = typeof themifyScript === 'object' && themifyScript.lightbox;

			if( ! Themify.is_builder_active ) {
				lightboxConditions = lbox && ( ( lbox.lightboxContentImages
					&& $( lbox.contentImagesAreas ).length ) || $( lbox.lightboxSelector ).length );
				
				if( ! lightboxConditions ) {
					lightboxConditions = lbox && lbox.lightboxGalleryOn
						&& ( $( lbox.lightboxContentImagesSelector ).length
						|| ( lbox.gallerySelector && $( lbox.gallerySelector ).length ) );
				}

				if ( lightboxConditions ) {
					this.LoadCss( themify_vars.url + '/css/lightbox.min.css', null );
					this.LoadAsync( themify_vars.url + '/js/lightbox.min.js', function () {
						Themify.lightboxCallback( $el, $args );
					}, null, null, function () {
						return ( 'undefined' !== typeof $.fn.magnificPopup );
					});
				}
			}

			if( ! lightboxConditions ) {
				self.body.addClass( 'themify_lightbox_loaded' ).removeClass( 'themify_lightboxed_images' );
			}
		},
        GalleryCallBack: function ($el, $args) {
            if (!$el) {
                $el = $(themifyScript.lightboxContext);
            }
            $args = !$args && themifyScript.extraLightboxArgs ? themifyScript.extraLightboxArgs : {};
            ThemifyGallery.init({'context': $el, 'extraLightboxArgs': $args});
            Themify.body.addClass('themify_lightbox_loaded').removeClass('themify_lightboxed_images');
        },
        parseVideo: function (url) {
                var m = url.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/i);
                return {
                        type: m!==null?(m[3].indexOf('youtu') > -1?'youtube':(m[3].indexOf('vimeo') > -1?'vimeo':false)):false,
                        id: m!==null?m[6]:false
                };
        },
        hash: function (str) {
            var hash = 0;
            for (var len = str.length,i = len-1; i >-1; --i) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },
        getVendorPrefix:function () {
            if (this.vendor === undefined) {
                var e = document.createElement('div'),
                        prefixes = ['Moz', 'Webkit', 'O', 'ms'];
                for (var i=0,len=prefixes.length;i<len;++i) {
                        if (typeof e.style[prefixes[i] + 'Transform'] !== 'undefined') {
                                this.vendor = prefixes[i].toLowerCase();
                                break;
                        }
                }
                e = null;
                this.vendor = '-'+this.vendor+'-';
            }
            return this.vendor;
        }
    };

    Themify.Init();

}(jQuery, window, document));
