/**
 * Themify Scroll to element based on its class and highlight it when a menu item is clicked.
 * Copyright (c) Themify
 */
themifyScrollHighlight = ( function( $ ) {

	/* Deprecated jQuery plugin. This prevents error. */
	$.fn['themifyScrollHighlight'] = function (options) {};

	return {

	defaults : {
		speed: parseInt(tbScrollHighlight.speed),
		prefix: '.tb_section-',
		navigation: tbScrollHighlight.navigation,
		context: 'body',
		element: '.module_row',
		scrollRate: 250,
		considerHeader: false,
		fixedHeaderHeight: 0,
		updateHash: true,
		scroll: 'internal' // can be 'external' so no scroll is done here but by the theme. Example: Fullpane.
	},
	_opt : {
		$window: $(window),
		$body: $('body'),
		$headerWrap: $('#headerwrap'),
		$pageWrap: $('#pagewrap'),
		hederDiff: 0,
		isReplaceState: ('replaceState' in history),
		isScrolling: false,
		activeSection: null
	},

	cleanupURL : function(url) {
		return url.replace(/#.*$/, '').replace(/\/$/, '');
	},

	requestInterval : function(fn, delay) {
		var start = new Date().getTime(),
			raf = window.requestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame
			|| function (cb) {
				setInterval(cb, 1000 / 60)
			};

		raf(function loop() {
			var current = new Date().getTime();

			if (current - start >= delay) {
				fn.call();
				start = current;
			}

			raf(loop);
		});
	},

	cleanHash : function(hash) {
		return decodeURIComponent(hash instanceof $ ? hash.prop('hash') : hash);
	},
	scrolling: false,
	updateOffset: function (topOffset) {
		return Math.ceil(topOffset - this.options.fixedHeaderHeight + this._opt.hederDiff);
	},
	setHeaderHeight: function () {
		if (this._opt.$body.hasClass('fixed-header') && this._opt.$headerWrap.length) {
			var $fixedheader;

			$fixedheader = $('#headerwrap').clone();
			$fixedheader.find('*').add($fixedheader).css('cssText', 'transition: all 0s ease 0s !important;');

			$fixedheader
					.removeClass('fixed-header')
					.css({visibility: 'hidden', left: '-10000px', marginTop: this._opt.$body.offset().top})
					.appendTo('body');

			this.options.fixedHeaderHeight = $fixedheader.outerHeight(true);

			$fixedheader.addClass('fixed-header');

			// Check if header is transparent
			var bgImage = $fixedheader.css('background-image'),
					bgColor = $fixedheader.css('background-color'),
					isTransparent = false;

			if (bgColor && bgColor.indexOf('rgba') > -1) {
				bgColor = bgColor.replace(/^.*,(.+)\)/, '$1').trim();
				bgColor = parseFloat(bgColor) === 0 ? 'transparent' : 1;
			}

			isTransparent = (!bgImage || bgImage === 'none') && bgColor === 'transparent';

			if (isTransparent) {
				this.options.fixedHeaderHeight = 0;
			}

			this._opt.hederDiff = !isTransparent ? this.options.fixedHeaderHeight - $fixedheader.outerHeight(true) : 0;
			$fixedheader.remove();
		}
	},
	highlightLink: function (hash) {
		var self = this;
		this.dehighlightLinks();

		if ('' != hash) {
			var $linkHash = $(this.options.navigation).find('a[href*="' + hash + '"]');

			if ($linkHash.length) {
				$linkHash.each(function () {
					var $link = $(this);

					if (self.cleanHash($link) === hash) {
						$link.parent().addClass('current_page_item');
						/**
						 * Fires event scrollhighlight.themify
						 * Receives anchor with hash
						 */
						self._opt.$body.trigger('scrollhighlight.themify', [hash]);
						return;
					}
				});
			}
		}
	},
	dehighlightLinks: function () {
		$(this.options.navigation).find('a[href*="#"]').each(function () {
			$(this).parent().removeClass('current_page_item current-menu-item');
		});
	},
	isInViewport: function ($t) {
		if (!($t instanceof $) || !('offset' in $t))
			return false;

		var windowTop = this._opt.$window.scrollTop(),
				// Divided by X to tell it's visible when the section is half way into viewport
				windowBottom = windowTop + (this._opt.$window.height() / 4),
				eleTop = this.updateOffset($t.offset().top),
				eleBottom = eleTop + $t.height();

		return (eleTop <= windowBottom) && (eleBottom >= windowTop);
	},
	isHash: function (hash) {
		return hash && '#' !== hash;
	},
	removeHash: function () {
		if (this.isCorrectHash() && this.isHash(window.top.location.hash)) {
			this._opt.isReplaceState && window.top.history.replaceState('', document.title, window.top.location.pathname + window.top.location.search);
			this.dehighlightLinks();
		}
	},
	changeHash: function (href) {
		if (this._opt.activeSection && ('#' === href || href === this.cleanHash(window.location.hash)))
			return;

		this.highlightLink(href);
		if (this.options.updateHash) {
			if (this._opt.isReplaceState) {
				window.top.history.replaceState(null, null, href);
			} else {
				var section = href.replace(/^.*#/, '');

				if (section) {
					var $elem = $(this.options.prefix + section);

					if ($elem.length) {
						var realID = $elem.prop('id');

						$elem.prop('id', realID + 'tmpobjxyz5783a');
						window.top.location.hash = section;
						$elem.prop('id', realID);
					}
				}
			}
		}
	},
	isCorrectHash: function () {
		var hash = location.hash.slice(1);
		// Compatiblity with Ecwid Plugin
		return !!(hash != '' && hash.indexOf('!') === -1);
	},
	linkScroll: function (obj, href) {
		var self = this,
			hash = obj.replace(self.options.prefix, '#'),
			to, objAnimInit, el;

		obj = $(obj);

		if (obj.length > 1) {
			obj = obj.filter(':visible').first();
			if (obj.length === 0) {
				obj = $(obj).first();
				if (obj.length === 0) {
					return;
				}
			}
		}

		// Set offset from top
		el = obj.get(0);


		/**
		 * Fires event scrollhighlightstart.themify before the scroll begins.
		 * Receives anchor with hash.
		 */
		this._opt.$body.trigger('scrollhighlightstart.themify', [hash]);

		to = el.offsetTop + $(el.offsetParent).offset().top;

		self.scrolling = false;
		this._opt.isScrolling = true;

		if ('internal' === self.options.scroll) {
			// Complete callback
			var completeCallback = function () {
				self._opt.isScrolling = false;
				self.changeHash(href);
			};

			if (this._opt.$body.hasClass('fixed-header') && !this._opt.$body.hasClass('header-bottom')) {
				to = this.updateOffset(to);
			} else {
				to = to - $(el.offsetParent).offset().top;
			}
			// Animate scroll

			$('html, body').stop().animate({
				scrollTop: to
			}, {
				duration: +self.options.speed,
				complete: completeCallback
			});
		} else {
			self.changeHash(href);
		}
	},
	manualScroll: function (elementsToCheck) {
		var self = this;

		self.scrolling = false;

		if (this._opt.$window.scrollTop() < self.options.fixedHeaderHeight) {
			self.removeHash();
		} else {
			for (var i = 0, len = elementsToCheck.length; i < len; ++i) {
				var el = elementsToCheck[i];
				if (el.data('anchor') && self.isInViewport(el)) {
					self.changeHash('#' + el.data('anchor'));
					this._opt.activeSection = el;
					break;
				}
			}
			if (this._opt.activeSection) {
				if (!self.isInViewport(this._opt.activeSection)) {
					self.removeHash();
					this._opt.activeSection = null;
				}
			}
		}
	},
	init: function ( options ) {
		var self = this,
			elementsToCheck = [];
		this.options = $.extend( {}, self.defaults, options );

		if (!Themify.is_builder_active) {
			// Build list of elements to check visibility
			$('div[class*=' + self.options.prefix.replace('.', '') + ']:visible').not(self.options.exclude).each(function () {
				elementsToCheck.push($(this));
			});

			if (!elementsToCheck.length)
				return;

		}
		self.setHeaderHeight();
		// Smooth Scroll and Link Highlight
		$(this.options.context).on('click touchstart', 'a[href*="#"], area[href*="#"]', function (e) {
			// Build class to scroll to
			var href = self.cleanHash( $(this) );

			if ( href === '#'
				// verify the anchor link belongs to the current page
				|| self.cleanupURL( window.location.href ) !== self.cleanupURL( $( this ).prop( 'href' ) )
			) {
				return;
			}

			href = href.indexOf('/') != -1 ? href.substring(0, href.indexOf('/')) : href;
			var classToScroll = href.replace(/#/, self.options.prefix);
			// If the section exists in this page
			if ($(classToScroll).length > 0) {
				e.preventDefault();
				e.stopPropagation();
				self.linkScroll(classToScroll, href);
				if (Themify.is_builder_active) {
					this._opt.activeSection = true;
					self.changeHash('#' + $(classToScroll).data('anchor'));
				}
			}
		})
		//Remove multiple higlighted menu items
		.find('a[href*="#"]').each(function () {
			if ($(this).prop('href') !== '#') {
				var p = $(this).parent();
				if (p[0].classList.contains('current_page_item') && p[0].classList.contains('current-menu-item')) {
					var sub = p.siblings('.current_page_item, .current-menu-item');
					if (sub.length > 0) {
						sub.add(p).removeClass('current_page_item current-menu-item');
					}
				}
			}
		});
		if (!Themify.is_builder_active) {
			// Setup scroll event
			this._opt.$window.scroll(function (e) {
				self.scrolling = true;
			});

			this.requestInterval(function () {
				!self._opt.isScrolling && self.scrolling && self.manualScroll(elementsToCheck);
			}, self.options.scrollRate);

			// Initial section visibility check and link highlight
			this._opt.$window.on('load hashchange', function (e) {
					if (self.isHash(window.location.hash)) {
						// If there's a hash, scroll to it
						var hash = self.cleanHash(window.location.hash),
								found = false,
								current_url = self.cleanupURL(window.location.href),
								$linkHash = $(self.options.context).find('a[href="' + hash + '"], a[href="' + current_url + hash + '"], a[href="' + current_url + '/' + hash + '"]');

						if ($linkHash.length) {
							$linkHash.each(function () {
								var $link = $(this);

								if (self.cleanHash($link) === hash) {
									found = true;
									setTimeout(function () {
										$link.trigger('click');
									}, 600);
									return;
								}
							});
						} else {
							// Build class to scroll to
							var classToScroll = hash.replace(/#/, self.options.prefix);
							// If the section exists in this page
							if (-1 === classToScroll.search('/') && $(classToScroll).length) {
								setTimeout(function () {
									self.linkScroll(classToScroll, hash);
								}, 600);
							}
						}
					} else {
						self.manualScroll(elementsToCheck);
					}
			});
		}
	}
}
} )( jQuery );