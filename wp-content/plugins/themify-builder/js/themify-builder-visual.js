(function ($,Themify, window, topWindow,document, api, Common) {
    'use strict';

    var tb_shorcodes = [],
        module_cache = [],
        ThemifyLiveStyling;

    api.mode = 'visual';
    api.iframe = '';
    api.id = '';
    api.is_ajax_call = false;

    api.Mixins.Frontend = {
        render_visual: function (callback) {
            // collect all jobs
            var constructData = {},
                batch = this.el.querySelectorAll('[data-cid]'),
                batch = Array.prototype.slice.call(batch);
            batch.unshift(this.el);
            for (var i = 0, len = batch.length; i < len; ++i) {
                var model = api.Models.Registry.lookup(batch[i].getAttribute('data-cid'));
                if (model) {
                    constructData[model.cid]= model.toJSON();
                }
            }
            api.bootstrap(constructData,callback);
        },
        change_callback: function () {
            var el = this.$el;
            el[0].insertAdjacentHTML('afterbegin', '<span class="sp-preloader tb_preview_component"></span>');
            this.render_visual(function () {
                el.find('.tb_preview_component').remove();
                api.Utils.setCompactMode(el[0].getElementsByClassName('module_column'));
                var cid = api.eventName === 'row' ? el.data('cid') : api.beforeEvent.data('cid');
                api.undoManager.push(cid, api.beforeEvent, el, api.eventName);
                api.Mixins.Builder.update(el);
            });
        },
        createEl: function (markup) {
            var type = this.model.get('elType'),
                    temp = document.createElement('div');
            temp.innerHTML = markup;
            markup = null;
            var item = temp.getElementsByClassName('module_' + type)[0];
            temp = null;
            var cl = item.classList,
                    attr = item.attributes;
            for (var i = 0, len = cl.length; i < len; ++i) {
                this.el.classList.add(cl[i]);
            }
            cl = null;
            for (var i = attr.length-1; i >-1; --i) {
                if (attr[i].name !== 'class') {
                    var n = attr[i].name;
                    this.el.setAttribute(n, attr[i].value);
                    if (n.indexOf('data-') === 0) {
                        this.$el.data(n.replace('data-', ''), attr[i].value);
                    }
                }
            }
            attr = null;
            var cover = item.getElementsByClassName('builder_row_cover')[0],
                    slider = item.getElementsByClassName(type + '-slider')[0],
                    frame = item.getElementsByClassName('tb_row_frame');
            if (frame.length > 0) {
                var fragment = document.createDocumentFragment(),
                        _frame = this.el.getElementsByClassName('tb_row_frame');
                for (var i = 0, len = _frame.length; i < len; ++i) {
                    _frame[i].parentNode.removeChild(_frame[i]);
                }
                _frame = null;

                for (var i = 0, len = frame.length; i < len; ++i) {
                    fragment.appendChild(frame[i].cloneNode());
                }
                this.el.insertBefore(fragment, this.el.firstChild);
                frame = fragment = null;
            }
            if (cover) {
                var _cover = this.el.getElementsByClassName('builder_row_cover')[0];
                if (_cover) {
                    this.el.replaceChild(cover, _cover);
                } else {
                    this.el.insertAdjacentElement('afterbegin', cover);
                }
                _cover = cover = null;
            }
            if (slider) {
                var _slider = this.el.getElementsByClassName(type + '-slider')[0];
                if (_slider) {
                    this.el.replaceChild(slider, _slider);
                } else {
                    this.el.insertAdjacentElement('afterbegin', slider);
                }
            }
        },
        restoreHtml: function (rememberedEl) {
            var tmp = document.createElement('div');
                tmp.innerHTML = rememberedEl;
                rememberedEl = $(tmp.firstChild);
            var $currentEl = api.liveStylingInstance.$liveStyledElmt,
                batch = rememberedEl[0].querySelectorAll('[data-cid]');
                batch = Array.prototype.slice.call(batch);
                batch.unshift(rememberedEl[0]);
                for (var i=batch.length-1; i> -1; --i) {
                    var model = api.Models.Registry.lookup(batch[i].getAttribute('data-cid'));
                    if (model) {
                        model.trigger('change:view', batch[i]);
                    }
                }
                $currentEl.replaceWith(rememberedEl);
                api.Mixins.Builder.update(rememberedEl);
        }
    };


    api.previewVisibility = function () {
        var $el = 'row' === this.model.get('elType') ? this.$el : this.$el.find('.module'),
                visible = 'row' === this.model.get('elType') ? this.model.get('styling') : this.model.get('mod_settings');

        if (api.isPreview) {
            if ('hide_all' === visible['visibility_all']) {
                $el.addClass('hide-all');
            }
            else {
                if ('hide' === visible['visibility_desktop']) {
                    $el.addClass('hide-desktop');
                }

                if ('hide' === visible['visibility_tablet']) {
                    $el.addClass('hide-tablet');
                }

                if ('hide' === visible['visibility_tablet_landscape']) {
                    $el.addClass('hide-tablet_landscape');
                }

                if ('hide' === visible['visibility_mobile']) {
                    $el.addClass('hide-mobile');
                }
            }

            // Rellax initiation
            var init_rellax = false;
            if (!_.isEmpty(visible['custom_parallax_scroll_speed'])) {
                init_rellax = true;
                $el[0].dataset.parallaxElementSpeed = parseInt(visible['custom_parallax_scroll_speed']);
            }

            if (!_.isEmpty(visible['custom_parallax_scroll_reverse'])) {
                $el[0].dataset.parallaxElementReverse = true;
            }

            if (!_.isEmpty(visible['custom_parallax_scroll_fade'])) {
                $el[0].dataset.parallaxFade = true;
            }

            if (!_.isEmpty(visible['custom_parallax_scroll_zindex'])) {
                $el[0].style['zIndex'] = visible['custom_parallax_scroll_zindex'];
            }

            if (init_rellax) {
                ThemifyBuilderModuleJs.parallaxScrollingInit($el, true);
            }

        } else {
            $el.removeClass('hide-desktop hide-tablet hide-tablet_landscape hide-mobile hide-all');
            if (undefined !== typeof Rellax && !_.isEmpty(visible['custom_parallax_scroll_speed'])) {
                Rellax.destroy($el[0].dataset.rellaxIndex);
            }
        }
    };

    _.extend(api.Views.BaseElement.prototype, api.Mixins.Frontend);

    api.Views.register_row({
        initialize: function () {
            this.listenTo(this.model, 'create:element', this.createEl);
            this.listenTo(this.model, 'visual:change', this.change_callback);
            this.listenTo(this.model, 'custom:restorehtml', this.restoreHtml);

            api.vent.on('dom:preview', api.previewVisibility.bind(this));
        }
    });

    api.Views.register_subrow({
        initialize: function () {
            this.listenTo(this.model, 'create:element', this.createEl);
            this.listenTo(this.model, 'visual:change', this.change_callback);
            this.listenTo(this.model, 'custom:restorehtml', this.restoreHtml);
        }
    });

    api.Views.register_column({
        initialize: function () {
            this.listenTo(this.model, 'create:element', this.createEl);
            this.listenTo(this.model, 'visual:change', this.change_callback);
            this.listenTo(this.model, 'custom:restorehtml', this.restoreHtml);
        }
    });

    api.Views.register_module({
        _jqueryXhr: false,
        templateVisual: function (settings) {
            var tpl = wp.template('builder-' + this.model.get('mod_name') + '-content');
            return tpl(settings);
        },
        initialize: function () {
            this.listenTo(this.model, 'create:element', this.createEl);
            this.listenTo(this.model, 'visual:change', this.change_callback);
            this.listenTo(this.model, 'custom:restorehtml', this.restoreHtml);
            this.listenTo(this.model, 'custom:preview:live', this.previewLive);
            this.listenTo(this.model, 'custom:preview:refresh', this.previewReload);

            api.vent.on('dom:preview', api.previewVisibility.bind(this));
        },
        createEl: function (markup) {
            var temp = document.createElement('div'),
                mod_name=document.createElement('div'),
                actionBtn = document.createElement('div'),
                slug=this.model.get('mod_name');
            temp.innerHTML = markup;
            var module = temp.getElementsByClassName('module')[0];
            temp=markup=null;
            if(module===undefined){
                api.Models.Registry.remove(this.model.cid)
                this.model.destroy();
                return false;
            }
            this.el.innerHTML =  module.innerHTML;
            mod_name.className='tb_data_mod_name';
            actionBtn.className='tb_column_btn_plus tb_module_btn_plus tb_disable_sorting';
            mod_name.innerHTML = themifyBuilder.modules[slug].name;
            this.el.appendChild(mod_name);
            this.el.appendChild(actionBtn);
            var attr = module.attributes;
            module=actionBtn =actionBtn= null;
            this.el.className = this.attributes().class;
            var element_id = 'tb_'+this.model.get('element_id');
            for (var i =attr.length-1; i> -1; --i) {
                if (attr[i].name === 'class') {
                    var cl = attr[i].value.split(' ');
                    for(var j=cl.length-1;j>-1;--j){
                        cl[j] = cl[j].trim();
                        if(element_id!==cl[j] && cl[j]!==''){
                            this.el.classList.add(cl[j]);
                        }
                    }
                }
                else {
                    var k = attr[i].name;
                    this.el.setAttribute(k, attr[i].value);
                    if (k.indexOf('data-') === 0) {
                        this.$el.data(k.replace('data-', ''), attr[i].value);
                    }
                }
            }
            if(slug==='image' && Themify.is_builder_loaded===true && api.id===false){
                setTimeout(function(){api.Utils.checkImageSize(this.el);}.bind(this),500);
            }
            attr = null;
        },
        shortcodeToHTML: function (content) {
            var self = this;
            function previewShortcode(shorcodes) {
                if (self._shortcodeXhr !== undefined && 4 !== self._shortcodeXhr) {
                    self._shortcodeXhr.abort();
                }
                self._shortcodeXhr = $.ajax({
                    type: "POST",
                    url: themifyBuilder.ajaxurl,
                    dataType: 'json',
                    data: {
                        action: 'tb_render_element_shortcode',
                        shortcode_data: JSON.stringify(shorcodes),
                        tb_load_nonce: themifyBuilder.tb_load_nonce
                    },
                    success: function (data) {
                        if (data.success) {
                            var shortcodes = data.data.shortcodes,
                                styles = data.data.styles;
                            if (styles) {
                                for (var i = 0, len = styles.length; i < len; ++i) {
                                    Themify.LoadCss(styles[i].s, styles[i].v, null, styles[i].m);
                                }
                            }
                            for (var i = 0, len = shortcodes.length; i < len; ++i) {
                                var k = Themify.hash(shortcodes[i].key);
                                self.$el.find('.tmp' + k).replaceWith(shortcodes[i].html);
                                tb_shorcodes[k] = shortcodes[i].html;
                                if (Themify.is_builder_loaded) {
                                    api.Utils.loadContentJs(self.$el, 'module');
                                }
                            }
                        }
                    }
                });
            }
            var found = [],
                    is_shortcode = false,
                    shorcode_list = themifyBuilder.available_shortcodes;
            for (var i = 0, len = shorcode_list.length; i < len; ++i) {
                content = wp.shortcode.replace(shorcode_list[i], content, function (atts) {
                    var sc_string = wp.shortcode.string(atts),
                            k = Themify.hash(sc_string),
                            replace = '';
                    if (tb_shorcodes[k] === undefined) {
                        found.push(sc_string);
                        replace = '<span class="tmp' + k + '">[loading shortcode...]</span>'
                    }
                    else {
                        replace = tb_shorcodes[k];
                    }
                    is_shortcode = true;
                    return replace;
                });
            }
            if (is_shortcode && found.length > 0) {
                previewShortcode(found);
            }
            return  {'content': content, 'found': is_shortcode};
        },
        previewLive: function (data, is_shortcode, cid, selector, value) {
            api.is_ajax_call = false;
            if (this._jqueryXhr && 4 !== this._jqueryXhr) {
                this._jqueryXhr.abort();
            }
            var is_selector = api.activeModel !== null && selector,
                    tmpl,
                    timer = 300;
            data['cid'] = cid ? cid : api.activeModel.cid;
            if (!is_selector || is_shortcode === true) {
                tmpl = this.templateVisual(data);
                if (api.is_ajax_call) {//if previewReload is calling from visual template 
                    return;
                }
                if (is_shortcode === true) {
                    var shr = this.shortcodeToHTML(tmpl);
                    if (shr.found) {
                        timer = 1000;
                        tmpl = shr.content;
                        is_selector = null;
                    }
                }
            }
            if (is_selector) {
                var len = selector.length;
                if (len === undefined) {
                    selector.innerHTML = value;
                }
                else {
                    for (var i = 0; i < len; ++i) {
                        selector[i].innerHTML = value;
                    }
                }
            }
            else {
                this.createEl(tmpl);
                if (!cid) {
                    api.liveStylingInstance.$liveStyledElmt = this.$el;
                    var self = this;
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                    }
                    this.timeout = setTimeout(function () {
                        api.Utils.loadContentJs(self.$el, 'module');
                    }, timer);
                }
            }
        },
        previewReload: function (settings, selector, value) {
            if (selector && api.activeModel.cid && value) {
                var len = selector.length;
                if (len === undefined) {
                    selector.innerHTML = value;
                }
                else {
                    for (var i = 0; i < len; ++i) {
                        selector[i].innerHTML = value;
                    }
                }
                return;
            }

            var that = this;
            if (this._jqueryXhr && 4 !== this._jqueryXhr) {
                this._jqueryXhr.abort();
            }
            api.is_ajax_call= true;
            function callback(data) {
                that.createEl(data);
                api.liveStylingInstance.$liveStyledElmt = that.$el;
                api.Utils.loadContentJs(that.$el, 'module');
                that.$el.find('.tb_preview_component').remove();
            }

            var name = this.model.get('mod_name'),
                unsetKey = settings['unsetKey'];

            that.el.insertAdjacentHTML('afterbegin', '<span class="tb_preview_component sp-preloader"></span>');
            delete settings['cid'], settings['unsetKey'];
            settings = api.Utils.clear(settings);
            settings['module_' + name + '_slug'] = name; //unique settings
            settings = JSON.stringify(settings);
            var key = Themify.hash(settings);

            if (unsetKey)
                delete module_cache[key];

            if (module_cache[key] !== undefined && module_cache[key]['data'] !== undefined) {
                var old_cid = module_cache[key]['cid'];
                if (this.model.cid !== old_cid) {
                    var replace = name + '-' + old_cid + '-' + old_cid,
                            new_id = name + '-' + this.model.cid + '-' + this.model.cid,
                            re = new RegExp(replace, 'g');
                    module_cache[key]['data'] = module_cache[key]['data'].replace(re, new_id);
                    module_cache[key]['cid'] = this.model.cid;
                }
                callback(module_cache[key]['data']);
                return;
            }
            else {
                module_cache[key] = {};
            }
            this._jqueryXhr = $.ajax({
                type: 'POST',
                url: themifyBuilder.ajaxurl,
                data: {
                    action: 'tb_load_module_partial',
                    tb_post_id: this.$el.closest('.themify_builder_content').data('postid'),
                    tb_cid: this.model.cid,
                    tb_module_slug: name,
                    tb_module_data: settings,
                    tb_load_nonce: themifyBuilder.tb_load_nonce
                },
                success: function (data) {
                    module_cache[key]['data'] = data;
                    module_cache[key]['cid'] = that.model.cid;
                    callback(data);
                    that._jqueryXhr = false;
                    api.is_ajax_call = false;
                },
                error: function () {
                    that.$el.removeClass('tb_preview_loading');
                }
            });
            return this;
        }
    });

    api.bootstrap = function (settings, callback) {
        // collect all jobs
        var jobs = [],
            set_rules = settings ? true : false;
        if (!settings) {
            settings = api.Models.Registry.items;
        }
        for (var cid in settings) {
            var model = api.Models.Registry.items[cid],
                    data = model.toJSON(),
                    type = data.elType,
                    key = type === 'module' ? 'mod_settings' : 'styling',
                    styles = data[key];
            if(styles && Object.keys(styles).length > 0){
                if (set_rules === true) {
                    api.liveStylingInstance.setCss([data],(type === 'module'?data['mod_name']:type));
                }
            }
            else if ('module' !== type  ) {
                continue;
            }
            if ('module' === type && 'tile' !== data['mod_name'] && themifyBuilder.modules[data['mod_name']].type !== 'ajax') {
                var is_shortcode = 'accordion' === data['mod_name'] || 'box' === data['mod_name'] || 'feature' === data['mod_name'] || 'tab' === data['mod_name'] || 'text' === data['mod_name'] || 'plain-text' === data['mod_name'] || 'pointers' === data['mod_name'] || 'pro-image' === data['mod_name'] || 'countdown' === data['mod_name'] || 'button' === data['mod_name'] || 'pro-slider' === data['mod_name'] || 'timeline' === data['mod_name'];

                model.trigger('custom:preview:live', data['mod_settings'], is_shortcode, cid);
                continue;
            }
            if ('column' === type) {
                delete data.modules;
            }
            else if ('row' === type || 'module' === type || type === 'subrow') {
                if(type==='row' && styles['custom_css_row']==='tb-page-break'){
                    continue;
                }
                delete data.cols;
            }
            jobs.push({jobID: cid, data: data});

        }
        settings = null;
        this.batch_rendering(jobs, 0, 360, callback);
    };

    api.batch_rendering = function (jobs, current, size, callback) {
        if (current >= jobs.length) {
            // load callback
            if (typeof callback==='function') {
                callback.call(this);
            }
            api.toolbar.pageBreakModule.countModules();
            return;
        } else {
            var smallerJobs = jobs.slice(current, current + size);
            this.render_element(smallerJobs).done(function () {
                api.batch_rendering(jobs, current += size, size, callback);
               
            });
        }
    };

    api.render_element = function (constructData) {
        return $.ajax({
            type: 'POST',
            url: themifyBuilder.ajaxurl,
            dataType: 'json',
            data: {
                action: 'tb_render_element',
                batch: JSON.stringify(constructData),
                tb_load_nonce: themifyBuilder.tb_load_nonce,
                tb_post_id: themifyBuilder.post_ID
            },
            success: function (data) {
                for (var cid in data) {
                    var model = api.Models.Registry.lookup(cid);
                    model.trigger('create:element', data[cid]);
                }
            }
        });
    };

    function get_visual_templates(callback) {
        if (api.Forms.LayoutPart.init) {
            if (callback) {
                callback();
            }
            return;
        }
        var key = 'tb_visual_templates';
        function getData() {
            if (themifyBuilder.debug) {
                return false;
            }
            try {
                var record = localStorage.getItem(key),
                        m = '';
                if (!record) {
                    return false;
                }
                record = JSON.parse(record);
                for (var s in themifyBuilder.modules) {
                    m += s;
                }
                if (record.ver.toString() !== tbLocalScript.version.toString() || record.h !== Themify.hash(m)) {
                    return false;
                }
                return record.val;
            }
            catch (e) {
                return false;
            }
            return false;
        }
        function setData(value) {
            try {
                var m = '';
                for (var s in themifyBuilder.modules) {
                    m += s;
                }
                var record = {val: value, ver: tbLocalScript.version, h: Themify.hash(m)};
                localStorage.setItem(key, JSON.stringify(record));
                return true;
            }
            catch (e) {
                return false;
            }
        }

        function insert(data) {
            var insert = '';
            for (var i in data) {
                insert += data[i];
            }
            document.body.insertAdjacentHTML('beforeend', insert);
            if (callback) {
                callback();
            }
        }
        var data = getData();
        if (data) {//cache visual templates)
            insert(data);
            return;
        }
        $.ajax({
            type: 'POST',
            url: themifyBuilder.ajaxurl,
            dataType: 'json',
            data: {
                action: 'tb_load_visual_templates',
                tb_load_nonce: themifyBuilder.tb_load_nonce
            },
            success: function (resp) {
                if (resp) {
                    insert(resp);
                    setData(resp);
                }
            }
        });
    };

    api.render = function () {
        get_visual_templates(function () {
            var builder = document.getElementById('themify_builder_content-' + themifyBuilder.post_ID),
                id = builder.getAttribute('data-postid'),
                data = window['builderdata_' + id] ? window['builderdata_' + id].data : [];
                if (!Array.isArray(data) || data.length === 0) {
                    data = {};
                }
                else {
                    data = data.filter(function (e) {
                        return Object.keys(e).length > 0;
                    });
                }
                window['builderdata_' + id] = null;
                api.id = id;
                api.Instances.Builder[api.builderIndex] = new api.Views.Builder({el: '#themify_builder_content-' + id, collection: new api.Collections.Rows(data), type: api.mode});
                api.Instances.Builder[api.builderIndex].render();
                data = null;
                api.bootstrap(null, function () {
                    ThemifyStyles.init(api.Constructor.data,api.Constructor.breakpointsReverse);
                    api.liveStylingInstance = new ThemifyLiveStyling();
                    api.liveStylingInstance.setCss(api.Mixins.Builder.toJSON(api.Instances.Builder[0].el));
                    api.toolbar.el.style.display = 'block';
                    topWindow.jQuery('body').trigger('themify_builder_ready');
                    api.Utils.loadContentJs();
                    topWindow.document.body.insertAdjacentHTML('beforeend', themifyBuilder.data);
                    themifyBuilder.data = null;
                    Themify.is_builder_loaded = true;
                    api.Instances.Builder[api.builderIndex].$el.triggerHandler('tb_init');
                    //TB_Inline.init();		
                    setTimeout(verticalResponsiveBars,2000);
                    api.id = false;
                    setTimeout(function(){api.Utils.checkAllimageSize();},500);
                });
            
        });
    };
    // Initialize Builder
    Themify.body.one('builderiframeloaded.themify', function (e, iframe) {
        
        api.iframe = $(iframe);
        setTimeout(function () {
            Themify.LoadCss(tbLocalScript.builder_url + '/css/animate.min.css');
        }, 1);
        Common.setToolbar();
        api.toolbar = new api.Views.Toolbar({el: '#tb_toolbar'});
        api.toolbar.render();
        api.Constructor.getForms(api.render);
        setTimeout(function () {
            topWindow.Themify.LoadCss(themify_vars.url + '/fontawesome/css/font-awesome.min.css', themify_vars.version);
        }, 10);
    });
    ThemifyLiveStyling = (function ($) {

        function ThemifyLiveStyling() {
            this.$context = $('#tb_lightbox_parent', topWindow.document);
            this.prefix;
            this.type;
            this.group;
            this.styleTab;
            this.styleTabId;
            this.currentField=null;
            this.isChanged=null;
            this.propNames = {};
            this.$liveStyledElmt=null;
            this.module_rules = {};
            this.rulesCache = {};
            this.tempData;
            this.undoData;
            this.currentStyleObj= {};
            this.currentSheet;
        }
        ThemifyLiveStyling.prototype.init = function () {
            this.type = api.Constructor.component;
            this.group = this.type === 'module'?api.activeModel.get('mod_name'):this.type;
            this.prefix = ThemifyStyles.getBaseSelector(this.group,api.activeModel.get('element_id'));
            this.$liveStyledElmt = $(document.querySelector(this.prefix));
            this.currentStyleObj = {};
            this.tempData = {};
            this.undoData = {};
            this.undoData[api.activeBreakPoint] = {};
            this.tempData[api.activeBreakPoint] = {};
            if (!this.rulesCache[api.activeBreakPoint]) {
                this.rulesCache[api.activeBreakPoint] = {};
            }

            this.currentSheet = this.getSheet(api.activeBreakPoint);
            if(this.type!=='column' && this.type!=='subrow'){
                this.bindAnimation();
               
            }
            this.bindTabsSwitch();
            this.initModChange();
        };

        
        ThemifyLiveStyling.prototype.setCss = function (data,type) {
             var css = ThemifyStyles.createCss(data,type),
                fonts =[];
                for(var p in  css){
                    if(p==='fonts'){
                        for(var f in css[p]){
                            var v = f;
                            if(css[p][f].length>0){
                                v+=':'+css[p][f].join(',');
                            }
                            fonts.push(v);
                        }
                    }
                    else{
                        var sheet = this.getSheet(p),
                            rules = sheet.cssRules ? sheet.cssRules : sheet.rules;
                        for(var k in css[p]){
                            if(this.findIndex(rules,k)===false){
                                sheet.insertRule(k + '{' + css[p][k].join('')+ ';}', rules.length);
                            }
                        }
                    }
                }
                api.Constructor.font_select.loadGoogleFonts(fonts.join('|'));
                css =fonts= null;
        };
        
        ThemifyLiveStyling.prototype.findIndex = function(rules, selector){
                for (var i =rules.length-1; i > -1; --i) {
                    if (selector === rules[i].selectorText.replace(/\s*>\s*/g, '>').replace(/\,\s/g, ',')) {
                        return i;
                    }
                }
                return false;
        };
        /**
         * Apply CSS rules to the live styled element.
         *
         * @param {string} containing CSS rules for the live styled element.
         * @param {mixed) 
         * @param {Array} selectors List of selectors to apply the newStyleObj to (e.g., ['', 'h1', 'h2']).
         */
        ThemifyLiveStyling.prototype.setLiveStyle = function (prop, val, selectors) {

            function renameProp(p) {
                if(self.propNames[p]===undefined){
                    var old_p = p;
                    if (p.indexOf('-') !== -1) {
                        var temp = p.toLowerCase().split('-'),
                                p = temp[0] + temp[1].charAt(0).toUpperCase() + temp[1].slice(1);
                        if (temp[2]) {
                            p += temp[2].charAt(0).toUpperCase() + temp[2].slice(1);
                        }
                    }
                    self.propNames[old_p] = p;
                    return p;
                }
                return self.propNames[p];
            }
            if (!selectors) {
                selectors = [''];
            }
            else if (typeof selectors === 'string') {
                selectors = [selectors];
            }
            selectors = ThemifyStyles.getNestedSelector(selectors);
            var fullSelector = '',
                self = this,
                rules = this.currentSheet.cssRules ? this.currentSheet.cssRules : this.currentSheet.rules;
            
            for (var i = 0, len = selectors.length; i < len; ++i) {
                var isPseudo = this.styleTabId==='h'?selectors[i].endsWith(':after')|| selectors[i].endsWith(':before'):true;
                if (isPseudo===false && selectors[i].indexOf(':hover')===-1) {
                    selectors[i]+=':hover';
                } 
                fullSelector += this.prefix + selectors[i];
                if (isPseudo===false){
                    fullSelector+=','+this.prefix + selectors[i].replace(':hover','.tb_visual_hover');
                }
                if (i !== (len - 1)) {
                    fullSelector += ',';
                }
            }
           if(this.isChanged===true){
                 var hover_items;
                if (this.styleTabId==='h') {
                    var hover_selectors = fullSelector.split(',');
                    for(var i=hover_selectors.length-1;i>-1;--i){
                        if(hover_selectors[i].indexOf('tb_visual_hover')===-1){
                            hover_items = document.querySelectorAll(hover_selectors[i].split(':hover')[0]);
                            for(var j=hover_items.length-1;j>-1;--j){
                                hover_items[j].classList.add('tb_visual_hover');
                            }
                        }
                    }
                    hover_selectors = null;
                }
                else{
                    this.$liveStyledElmt[0].classList.remove('tb_visual_hover');
                    hover_items = this.$liveStyledElmt[0].getElementsByClassName('tb_visual_hover');
                    for(var i=hover_items.length-1;i>-1;--i){
                            hover_items[i].classList.remove('tb_visual_hover');
                    }
                }
                hover_items = null;
            }
            fullSelector = fullSelector.replace(/\s{2,}/g, ' ').replace(/\s*>\s*/g, '>').replace(/\,\s/g, ',');
            var hkey = Themify.hash(fullSelector),
                orig_v = val,
                index = this.rulesCache[api.activeBreakPoint][hkey] !== undefined ? this.rulesCache[api.activeBreakPoint][hkey] : this.findIndex(rules, fullSelector);
            if (val === false) {
                val = '';
            }
            var old_prop = prop;
            prop = renameProp(prop);

            if (index === false || !rules[index]) {
                index = rules.length;
                this.currentSheet.insertRule(fullSelector + '{' + old_prop + ':' + val + ';}', index);
                if (this.tempData[api.activeBreakPoint][index] === undefined) {
                    this.tempData[api.activeBreakPoint][index] = {};
                }
                this.tempData[api.activeBreakPoint][index][prop]='';
            }
            else {
                if (this.tempData[api.activeBreakPoint][index] === undefined) {
                    this.tempData[api.activeBreakPoint][index] = {};
                }
                if (this.tempData[api.activeBreakPoint][index][prop] === undefined) {
                    this.tempData[api.activeBreakPoint][index][prop] = rules[index].style[prop];
                }
                rules[index].style[prop] = val;
                
            }
            this.rulesCache[api.activeBreakPoint][hkey] = index;
          
            if (this.undoData[api.activeBreakPoint][index] === undefined) {
                this.undoData[api.activeBreakPoint][index] = {};
            }
            this.undoData[api.activeBreakPoint][index][prop] = {'a':val,'b':this.tempData[api.activeBreakPoint][index][prop]};
            Themify.body.triggerHandler('tb_' + this.type + '_styling', [this.group, prop, val, orig_v, this.$liveStyledElmt]);
          
        };


        ThemifyLiveStyling.prototype.initModChange = function (off) {
            var self = this;
            if(off===true){
                Themify.body.off('themify_builder_change_mode.tb_visual_mode');
                return;
            }
           
            Themify.body.on('themify_builder_change_mode.tb_visual_mode', function (e, prevbreakpoint, breakpoint) {
                    if (self.tempData[breakpoint] === undefined) {
                        self.tempData[breakpoint] = {};
                    }
                    if (self.rulesCache[breakpoint] === undefined) {
                        self.rulesCache[breakpoint] = {};
                    }
                    if (self.undoData[breakpoint] === undefined) {
                        self.undoData[breakpoint] = {};
                    }
                    self.currentSheet = self.getSheet(breakpoint);
                });
        };

        ThemifyLiveStyling.prototype.revertRules = function () {
            for (var points in this.tempData) {
                 var sheet = this.getSheet(points),
                    rules = sheet.cssRules ? sheet.cssRules : sheet.rules;
                for (var i in this.tempData[points]) {
                    if (rules[i]) {
                        for (var j in this.tempData[points][i]) {
                            rules[i].style[j] = this.tempData[points][i][j];
                        }
                    }
                }
            }
            this.undoData = {};
            this.tempData = {};
        };
        ThemifyLiveStyling.prototype.getSheet = function (breakpoint) {
            return  ThemifyStyles.getSheet(breakpoint);
        };

        ThemifyLiveStyling.prototype.reset = function () {
            this.rulesCache = {};
            this.tempData = {};
            this.undoData = {};
            var points = api.Constructor.breakpointsReverse;
            for (var i =points.length-1; i>-1;--i) {
                var sheet = this.getSheet(points[i]),
                    rules = sheet.cssRules;
                for(var j=rules.length-1;j>-1;--j){
                    sheet.deleteRule (j);
                }
            }
        };


        //closing lightbox
        ThemifyLiveStyling.prototype.clear = function () {
            var self = this,
                el = this.$liveStyledElmt[0];
                el.classList.remove('animated');
                el.classList.remove('hover-wow');
                el.classList.remove('tb_visual_hover');
                self.module_rules = {};
                this.styleTab = this.styleTabId=this.currentField=this.isChanged= null;
                if (!api.saving && api.hasChanged) {
                    self.revertRules();
                    if (self.type && self.type !== 'module') {
                        var styling = api.activeModel.get('styling');
                        if (styling && (styling['background_type'] === 'slider' && styling['background_slider'])) {
                            self.bindBackgroundSlider();
                        }
                    }
                }
                else{
                    var hover_items = el.getElementsByClassName('tb_visual_hover');
                    for(var k=hover_items.length-1;k>-1;--k){
                        hover_items[k].classList.remove('tb_visual_hover');
                    }
                }
                self.bindAnimation(true);
                self.bindTabsSwitch(true);
                self.initModChange(true);
                self.undoData = {};
                self.tempData = {};
                this.$liveStyledElmt=this.currentStyleObj=this.currentSheet=null;
        };
        ThemifyLiveStyling.prototype.addOrRemoveFrame = function (_this) {
            var self = this,
                $el = this.$liveStyledElmt,
                $context = this.$context.find(self.styleTab),
                side = _this.closest('.tb_tab').id.split('_').pop(),
                settings = {},
                selector = this.getValue(side + '-frame_type').selector,
                $frame = $el.children('.tb_row_frame_' + side),
                options = ['custom', 'location', 'width', 'height', 'width_unit', 'height_unit', 'repeat','type','layout','color'];
                for(var i=0,len=options.length;i<len;++i){
                    var item = topWindow.document.getElementById(side + '-frame_' + options[i]),
                        v;
                    if(options[i]==='type'){
                        v = item.querySelector('input:checked').value;
                    }
                    else if(options[i]==='layout'){
                        v = item.getElementsByClassName('selected')[0].id;
                    }
                    else if(options[i]==='color'){
                        v = api.Utils.getColor(item);
                        if(v===''){
                            continue;
                        }
                    }
                    else{
                        v = item.value;
                    }
                    settings[options[i]] = v;
                }
            if ((settings.type === side + '-presets' && settings.layout === '') || (settings.type === side + '-custom' && settings.custom === '')) {
                $frame.remove();
                return;
            }
            if ($frame.length===0) {
                $frame = document.createElement('div');
                    $frame.className ='tb_row_frame tb_row_frame_' + side + ' ' + settings.location;
                $el.children('.tb_action_wrap').after($frame);
            }
            else {
                $frame.removeClass('behind_content in_front').addClass(settings.location);
            }
            if (settings.type === side + '-presets') {
                var imageName = (side === 'left' || side === 'right') ? settings.layout + '-l' : settings.layout;
                $.ajax({
                    dataType: 'text',
                    url: tbLocalScript.builder_url + '/img/row-frame/' + imageName + '.svg',
                    success: function (svg) {
                        if (settings.color) {
                            svg = svg.replace(/\#D3D3D3/ig, settings.color);
                        }
                        self.setLiveStyle('backgroundImage', 'url("data:image/svg+xml;base64,' + btoa(svg) + '")', selector);
                    }
                });

            } else {
                self.setLiveStyle('backgroundImage', 'url("' + settings.custom + '")', selector);
            }
            self.setLiveStyle('width', (settings.width ? (settings.width + settings.width_unit) : ''), selector);
            self.setLiveStyle('height', (settings.height ? (settings.height + settings.height_unit) : ''), selector);
            if (settings.repeat) {
                if (side === 'left' || side === 'right') {
                    self.setLiveStyle('backgroundSize', '100% ' + (100 / settings.repeat) + '%', selector);
                } else {
                    self.setLiveStyle('backgroundSize', (100 / settings.repeat) + '% 100%', selector);
                }
            } else {
                self.setLiveStyle('backgroundSize', '', selector);
            }
        };


        ThemifyLiveStyling.prototype.overlayType = function (val) {
            var is_color = val === 'color' || val==='hover_color',
                    cl = is_color ? 'minicolors-input' : 'themify-gradient-type',
                    el = this.styleTab.getElementsByClassName('tb_group_element_' + val)[0].getElementsByClassName(cl)[0];
            if (is_color) {
                var v = el.value;
                if (v) {
                   v = api.Utils.getColor(el);
                }
                Themify.triggerEvent(el, 'themify_builder_color_picker_change', {val: v});
            }
            else {
                Themify.triggerEvent(el, 'change');
                
            }
        };

        ThemifyLiveStyling.prototype.addOrRemoveComponentOverlay = function (type, id, v) {
            var overlayElmt = this.getComponentBgOverlay(),
                    isset = overlayElmt.length !== 0;
            
            var data = this.getValue(id),
                selector = data.selector;
                if(this.styleTabId==='h'){
                    this.$liveStyledElmt[0].classList.add('tb_visual_hover');
                }
                else{
                    this.$liveStyledElmt[0].classList.remove('tb_visual_hover');
                }
            if(v===''){
                this.setLiveStyle('backgroundImage', '', selector);
                this.setLiveStyle('backgroundColor', '', selector);
            }
            else{
                if (!isset) {
                    overlayElmt = document.createElement('div');
                    overlayElmt.className = 'builder_row_cover';
                    this.$liveStyledElmt.children('.tb_action_wrap').before(overlayElmt);
                }
                if (type === 'color') {
                    this.setLiveStyle('backgroundImage', 'none', selector);
                }
                else {
                    this.setLiveStyle('backgroundColor', false, selector);
                }
                this.setLiveStyle(data.prop, v, selector);
            }
        };

        ThemifyLiveStyling.prototype.bindMultiFields = function (_this,data) {
            var self = this;

            function setFullWidth(val, prop) {
                if (!is_border) {
                    if (self.type === 'row' && tbLocalScript.fullwidth_support === '' && ((is_checked && (prop === 'padding' || prop === 'margin' || prop === 'border-radius')) || prop === 'padding-left' || prop === 'padding-right' || prop === 'margin-left' || prop === 'margin-right')) {
                        var type = prop.split('-'),
                                k = api.activeBreakPoint + '-' + type[0];
                        if (is_checked) {
                            val = val + ',' + val;
                        }
                        else {
                            var old_val = self.$liveStyledElmt.data(k);
                            if (!old_val) {
                                old_val = [];
                            }
                            else {
                                old_val = old_val.split(',');
                            }
                            if (type[1] === 'left') {
                                old_val[0] = val;
                            }
                            else {
                                old_val[1] = val;
                            }
                            val = old_val.join(',');
                        }
                        self.$liveStyledElmt.attr('data-' + k, val).data(k, val);
                        ThemifyBuilderModuleJs.setupFullwidthRows(self.$liveStyledElmt);
                    }
                    if ((is_checked && prop === 'padding') || prop.indexOf('padding') === 0) {
                        setTimeout(function () {
                            $(window).triggerHandler('tfsmartresize.tfVideo');
                        }, 600);
                    }
                }
            }

            var prop_id = _this.id,
                data = self.getValue(prop_id);
            
            if (data) {
                var parent = _this.closest('.tb_seperate_items'),
                    prop = (data.prop.indexOf('border-radius')===-1)?data.prop.split('-')[0]:'border-radius',
                    is_border = (prop.indexOf('border')!==-1 && prop.indexOf('border-radius')===-1),
                    is_border_radius = prop.indexOf('border-radius')!==-1,
                    is_checked = parent.getAttribute('data-checked')!== null,
                    items = parent.getElementsByClassName('tb_multi_field'),
                    getCssValue = function (el) {
                        var getBorderValue=function () {
                                var parent = el.closest('li'),
                                    width = parseFloat(parent.getElementsByClassName('border_width')[0].value.trim()),
                                    style = parent.getElementsByClassName('border_style')[0].value,
                                    v = '',
                                    color = parent.getElementsByClassName('minicolors-input')[0],
                                    color_val = api.Utils.getColor(color);
                                if (style === 'none') {
                                    v = style;
                                }
                                else if (isNaN(width) || width === '' || color_val === '') {
                                    v = '';
                                }
                                else {
                                    v = width + 'px ' + style + ' ' + color_val;
                                }
                                return v;
                        },
                        v;
                        if(is_border){
                            v = getBorderValue();
                        }
                        else{
                            v = el.value.trim();
                            if (v !== '') {
                                v = parseFloat(v);
                                if (isNaN(v)) {
                                    v = '';
                                }
                                else{
                                    v += el.closest('.tb_input').querySelector('#' + el.id + '_unit').value;
                                }
                            }
                        }
                        if(is_border_radius && v==''){
                            v = '0'+ el.closest('.tb_input').querySelector('#' + el.id + '_unit').value;
                        }
                        return v;
                    },
                    val=is_checked===true?getCssValue(_this):null;
                if(is_border_radius){
                    if(is_checked===false) {
                        val = '';
                        for (var i = 0;items.length > i; i++) {
                            val += getCssValue(items[i]) +' ';
                        }
                    }
                    self.setLiveStyle('border-radius', val, data.selector);
                }else{
                    for (var i =items.length-1; i >-1; --i) {
                        if(is_checked===false){
                            val = getCssValue(items[i]);
                        }
                        prop = self.getValue(items[i].id).prop;
                        self.setLiveStyle(prop, val, data.selector);
                        setFullWidth(val, prop);
                    }
                }

                items = null;
            }
        };

        ThemifyLiveStyling.prototype.bindRowWidthHeight = function (id,val,el) {
            if(!el){
                el = this.$liveStyledElmt;
            }
            if(id==='row_height'){
                if (val === 'fullheight') {
                    el[0].classList.add(val);
                }
                else {
                    el[0].classList.remove('fullheight');
                }
            }
            else{
                if (val === 'fullwidth') {
                    el.removeClass('fullwidth').addClass('fullwidth_row_container');
                    ThemifyBuilderModuleJs.setupFullwidthRows(el);
                } else if (val === 'fullwidth-content') {
                    el.removeClass('fullwidth_row_container').addClass('fullwidth');
                    ThemifyBuilderModuleJs.setupFullwidthRows(el);
                } else {
                    el.removeClass('fullwidth fullwidth_row_container')
                            .css({
                                'margin-left': '',
                                'margin-right': '',
                                'padding-left': '',
                                'padding-right': '',
                                'width': ''
                            });
                }
            }
            $(window).triggerHandler('tfsmartresize.tfVideo');
        };
        ThemifyLiveStyling.prototype.bindAnimation = function (off) {
            var self = this;
            if(off===true){
                this.$context.off('change.tb_animation');
                return;
            }
            this.$context.on('change.tb_animation', '#animation_effect,#animation_effect_delay,#animation_effect_repeat,#hover_animation_effect',function () { 
                var is_hover = this.id === 'hover_animation_effect',
                        key = is_hover ? 'hover_animation_effect' : 'animation_effect',
                        effect = is_hover ? $(this).val() : self.$context.find('#animation_effect').val(),
                        animationEffect = self.currentStyleObj[key]!==undefined?self.currentStyleObj[key]:api.Constructor.values[key],
                        el = self.$liveStyledElmt;
                if (animationEffect) {
                    if (is_hover) {
                        animationEffect = animationEffect + ' hover-wow hover-animation-' + animationEffect;
                    }
                    el.removeClass(animationEffect + ' wow').css({'animation-name': '', 'animation-delay': '', 'animation-iteration-count': ''});
                }
                el.removeClass('animated tb_hover_animate');
                self.currentStyleObj[key]=effect;
                if (effect) {
                    if (!is_hover) {
                        var delay = parseFloat(self.$context.find('#animation_effect_delay').val()),
                                repeat = parseInt(self.$context.find('#animation_effect_repeat').val());
                        el.css({'animation-delay': delay > 0 && !isNaN(delay) ? delay + 's' : '', 'animation-iteration-count': repeat > 0 && !isNaN(repeat) ? repeat : ''});
                    }
                    else {
                        effect = 'hover-wow hover-animation-' + effect;
                    }
                    setTimeout(function () {
                        el.addClass(effect + ' animated');
                        if (is_hover) {
                            el.trigger('mouseover');
                        }
                    }, 1);
                }
            });
        };
        ThemifyLiveStyling.prototype.getRowAnchorClass = function (rowAnchor) {
            return rowAnchor.length > 0 ? 'tb_section-' + rowAnchor : '';
        };

        ThemifyLiveStyling.prototype.getStylingVal = function (stylingKey) {
            return this.currentStyleObj[stylingKey] !== undefined ? this.currentStyleObj[stylingKey] : '';
        };

        ThemifyLiveStyling.prototype.setStylingVal = function (stylingKey, val) {
            this.currentStyleObj[stylingKey] = val;
        };

        ThemifyLiveStyling.prototype.bindBackgroundMode = function (val, id) {
           
                var bgValues = {
                    'repeat': 'repeat',
                    'repeat-x': 'repeat-x',
                    'repeat-y': 'repeat-y',
                    'repeat-none': 'no-repeat',
                    'no-repeat':'no-repeat',
                    'fullcover': 'cover',
                    'best-fit-image': 'contain',
                    'builder-parallax-scrolling': 'cover',
                    'builder-zoom-scrolling': '100%',
                    'builder-zooming': '100%'
                };
                if (bgValues[val]!==undefined) {
                    var propCSS = {},
                        data = this.getValue(id),
                        item = topWindow.document.getElementById(data.origId);
                    if(item!==null && item.value.trim()===''){
                        val=null;
                        propCSS ={
                            'background-repeat':'',
                            'background-size':'',
                            'background-position':'',
                            'background-attachment':''
                        };
                    }
                    else{
                        if (val.indexOf('repeat') !== -1) {
                            propCSS['background-repeat'] = bgValues[val];
                            propCSS['background-size'] = 'auto';
                        } else {
                            propCSS['background-size'] = bgValues[val];
                            propCSS['background-repeat'] = 'no-repeat';

                            if (bgValues[val] === 'best-fit-image' || bgValues[val] === 'builder-zooming') {
                                propCSS['background-position'] = 'center center';
                            } else if (bgValues[val] === 'builder-zoom-scrolling') {
                                propCSS['background-position'] = '50%';
                            }
                        }
                    }
                    this.$liveStyledElmt[0].classList.remove('builder-parallax-scrolling');
                    this.$liveStyledElmt[0].classList.remove('builder-zooming');
                    this.$liveStyledElmt[0].classList.remove('builder-zoom-scrolling');
                    this.$liveStyledElmt[0].style['backgroundSize']=this.$liveStyledElmt[0].style['backgroundPosition']='';
                    if(val === 'builder-parallax-scrolling'){
                        this.$liveStyledElmt[0].classList.add('builder-parallax-scrolling');
                    }
                    else if(val === 'builder-zooming'){
                        this.$liveStyledElmt[0].classList.add('builder-zooming');
                    }
                    else if(val === 'builder-zoom-scrolling'){
                        this.$liveStyledElmt[0].classList.add('builder-zoom-scrolling');
                    }
                    for (var key in propCSS) {
                        this.setLiveStyle(key, propCSS[key], data.selector);
                    }
                    if (val === 'builder-zoom-scrolling') {
                        ThemifyBuilderModuleJs.backgroundZoom(this.$liveStyledElmt);
                    }
                    else if (val === 'builder-zooming') {
                        ThemifyBuilderModuleJs.backgroundZooming(this.$liveStyledElmt);
                    }
                    else if (val === 'builder-parallax-scrolling') {
                        ThemifyBuilderModuleJs.backgroundScrolling(this.$liveStyledElmt);
                    }
                }
        };

        ThemifyLiveStyling.prototype.bindBackgroundPosition = function (val, id) {
            if (val && val.length > 0) {
                var data = this.getValue(id);
                if (data) {
                    this.setLiveStyle(data.prop, val.replace('-', ' '), data.selector);
                }
            }
        };

        ThemifyLiveStyling.prototype.bindBackgroundSlider = function (data) {
            
            var self = this,
                images = self.$context.find('#' + data.id).val().trim();
            self.removeBgSlider();

            function callback(slider) {
                var $bgSlider = $(slider),
                        bgCover = self.getComponentBgOverlay();
                if (bgCover.length > 0) {
                    bgCover.after($bgSlider);
                } else {
                    self.$liveStyledElmt.prepend($bgSlider);
                }
                ThemifyBuilderModuleJs.backgroundSlider($bgSlider[0].parentNode);
            }
            if (images) {

                if (this.cahce === undefined) {
                    this.cahce = {};
                }
              
               
                var options = {
                    shortcode: encodeURIComponent(images),
                    mode: self.$context.find('#background_slider_mode').val(),
                    speed: self.$context.find('#background_slider_speed').val(),
                    size: self.$context.find('#background_slider_size').val()
                },
                hkey = '';

                for (var i in options) {
                    hkey += Themify.hash(i + options[i]);
                }
                if (this.cahce[hkey] !== undefined) {
                    callback(this.cahce[hkey]);
                    return;
                }
                options['type'] = self.type;

                $.post(themifyBuilder.ajaxurl, {
                    nonce: themifyBuilder.tb_load_nonce,
                    action: 'tb_slider_live_styling',
                    tb_background_slider_data: options
                },
                function (slider) {
                    if (slider.length < 10) {
                        return;
                    }
                    self.cahce[hkey] = slider;
                    callback(slider);
                }
                );
            }
        };
        ThemifyLiveStyling.prototype.VideoOptions = function (item,val) {
                var video = this.$liveStyledElmt.find('.big-video-wrap').first(),
                    el = '',
                    is_checked = item.checked===true,
                    type = '';
                if(video[0]===undefined){
                    return;
                }
                if (video[0].classList.contains('themify_ytb_wrapper')) {
                    el = this.$liveStyledElmt;
                    type = 'ytb';
                }
                else if (video[0].classList.contains('themify-video-vmieo')) {
                    el = $f(video.children('iframe')[0]);
                    if (el) {
                        type = 'vimeo';
                    }
                }
                else {
                    el = this.$liveStyledElmt.data('plugin_ThemifyBgVideo');
                    type = 'local';
                }

                if (val === 'mute') {
                    if (is_checked) {
                        if (type === 'ytb') {
                            el.ThemifyYTBMute();
                        }
                        else if (type === 'vimeo') {
                            el.api('setVolume', 0);
                        }
                        else if (type === 'local') {
                            el.muted(true);
                        }
                        this.$liveStyledElmt.data('mutevideo', 'mute');
                    }
                    else {
                        if (type === 'ytb') {
                            el.ThemifyYTBUnmute();
                        }
                        else if (type === 'vimeo') {
                            el.api('setVolume', 1);
                        }
                        else if (type === 'local') {
                            el.muted(false);
                        }
                        this.$liveStyledElmt.data('mutevideo', '');
                    }
                }
                else if (val === 'unloop') {
                    if (is_checked) {
                        if (type === 'vimeo') {
                            el.api('setLoop', 0);
                        }
                        else if (type === 'local') {
                            el.loop(false);
                        }
                        this.$liveStyledElmt.data('unloopvideo', '');
                    }
                    else {
                        if (type === 'vimeo') {
                            el.api('setLoop', 1);
                        }
                        else if (type === 'local') {
                            el.loop(true);
                        }
                        this.$liveStyledElmt.data('unloopvideo', 'loop');

                    }
                }
        };
        ThemifyLiveStyling.prototype.bindBackgroundTypeRadio = function (bgType) {
            var el = 'tb_uploader_input';
            if (this.type !== 'module') {
                if (bgType !== 'slider') {
                    if(this.styleTabId==='n'){
                        this.removeBgSlider();
                    }
                }
                else {
                    el = 'tb_shortcode_input';
                }
                if (bgType !== 'video' && this.styleTabId==='n') {
                    this.removeBgVideo();
                }
            }
            if (bgType !== 'gradient') {
                this.setLiveStyle('backgroundImage','none');
            }
            else {
                el = 'themify-gradient-type';
            }
            var group = this.styleTab.getElementsByClassName('tb_group_element_' + bgType)[0];
            Themify.triggerEvent(group.getElementsByClassName(el)[0], 'change');
            if(bgType==='image' && this.type === 'module'){
                el = group.getElementsByClassName('minicolors-input')[0];
                if(el!==undefined){
                    Themify.triggerEvent(el, 'themify_builder_color_picker_change',{val: el.value});
                }
            }
        };

        ThemifyLiveStyling.prototype.bindFontColorType = function (v,id,type) {
            if(type==='radio'){
                var is_color = v.indexOf('_solid')!==-1,
                    el=is_color===true?v.replace(/_solid$/ig,''):v.replace(/_gradient$/ig,'-gradient-type');
                    el = topWindow.document.getElementById(el);
                if(is_color===true){
                    var v = api.Utils.getColor(el);
                    if(v===undefined || v===''){
                        v='inherit';
                    }
                    Themify.triggerEvent(el,'themify_builder_color_picker_change',{val:v});
                }
                else{
                    Themify.triggerEvent(el,'change');
                }
                return;
            }
            var prop = type,
                selector = this.getValue(id).selector;
            if (prop==='color') {
                this.setLiveStyle('WebkitBackgroundClip', 'border-box', selector);
                this.setLiveStyle('backgroundClip', 'border-box', selector);
                this.setLiveStyle('backgroundImage', 'none', selector);
               
                if(v===undefined || v===''){
                     v='inherit';
                }
            }
            else if(v!==''){
                prop = 'backgroundImage';
                this.setLiveStyle('color', 'transparent', selector);
                this.setLiveStyle('WebkitBackgroundClip', 'text', selector);
                this.setLiveStyle('backgroundClip', 'text', selector);
            }
            if(v!=='' || prop==='color')
            this.setLiveStyle(prop, v, selector);
        };
                        
        ThemifyLiveStyling.prototype.shadow = function (el,id, prop) {
            var data = this.getValue(id);
            if (data) {
                var items = el.closest('.tb_seperate_items').getElementsByClassName('tb_shadow_field'),
                    inset='',
                    val = '';
                for (var i = 0,len=items.length;i<len; ++i) {
                    if(items[i].classList.contains('tb-checkbox')){
                        inset = items[i].checked?'inset ':'';
                    }
                    else{
                        var v = items[i].value.trim();   
                        if (api.Constructor.styles[items[i].id].type==='color') {
                           v = api.Utils.getColor(items[i]);
                        }
                        else{
                            v = v !== '' ? v : 0;
                            v += items[i].closest('.tb_input').querySelector('#' + items[i].id + '_unit').value;
                        }
                        val += v + ' ';
                    }
                }
                val = inset + val;
                this.setLiveStyle(data.prop, val, data.selector);
            }
        };
        ThemifyLiveStyling.prototype.setData = function (id, prop, val) {
            var data = this.getValue(id);
            
            if (data) {
                if (prop === '') {
                    prop = data.prop;
                }
                this.setLiveStyle(prop, val, data.selector);
            }
        };

        ThemifyLiveStyling.prototype.bindEvents = function (el, data) {
            if(el.classList.contains('style_apply_all')){
                return;
            }
            var self = this;
            function getTab(el){
                if(self.currentField!==el.id){
                    self.currentField =el.type==='radio'?false: el.id;
                    self.isChanged=true;
                    self.styleTab = null;
                    self.styleTabId = 'n';
                    var tab = el.closest('.tb_tab');
                    if (tab === null) {
                        tab = el.closest('.tb_expanded_opttions');
                        if (tab === null) {
                            tab = topWindow.document.getElementById('tb_options_styling');
                        }
                    }
                    else {
                        self.styleTabId = tab.id.split('_').pop();
                    }
                    self.styleTab = tab;
                }
                else{
                    self.isChanged=false;
                }
            }
            (function () {
                var event,
                    type = data.type,
                    prop = data.prop,
                    id = data.id;
                    if (type === 'color') {
                        event = 'themify_builder_color_picker_change';
                    }
                    else if (type === 'gradient') {
                        event = 'themify_builder_gradient_change';
                    }
                    else {
                        event = type === 'text' || type === 'range' ? 'keyup' : 'change';
                    }
                el.addEventListener(event, function (e) {
                    var cl = this.classList,
                        val,
                        is_select = this.tagName === 'SELECT',
                        is_radio = !is_select && this.type === 'radio';
                    getTab(this);
                    api.hasChanged = true;
                    if(e.detail && e.detail.val){
                        val = e.detail.val;
                    }
                    else if(type==='frame'){
                        val = this.id;
                    }
                    else{
                        val = this.value;
                    }
                    val = val!==undefined?val.trim():'';
                    if ((type === 'color' && cl.contains('border_color')) || (is_select===true && cl.contains('border_style')) || (event==='keyup' && (cl.contains('border_width') || cl.contains('tb_multi_field')))) {
                        self.bindMultiFields(this);
                        return;
                    }
                     else if(prop==='frame-custom' || type==='frame' || cl.contains('tb_frame')){
                        self.addOrRemoveFrame(this);
                        return;
                    }
                    else if(cl.contains('tb_shadow_field')) {
                        self.shadow(this,id);
                        return;
                    }
                    if (event === 'keyup') {
                        if (val!=='') {
                            if (prop==='column-rule-width') {
                                val += 'px';
                                var bid = id.replace('_width', '_style'),
                                    border = topWindow.document.getElementById(bid);
                                if (border!==null) {
                                    self.setData(bid, '', border.value);
                                }
                            }
                            else if(prop==='column-gap') {
                                val+= 'px';
                            }
                            else {
                                var unit =topWindow.document.getElementById(id + '_unit');
                                if (unit!==null) {
                                    val += unit.value ? unit.value : 'px';
                                }
                            }
                        }
                        self.setData(id, '', val);
                        return;
                    }
                    if(data.isFontColor===true){
                        self.bindFontColorType(val,id,type);
                        return;
                    }
                    if (is_select===true) {
                        if (prop === 'font-weight') {
                            // load the font variant
                            var font = this.dataset['selected'];
                            if (font!=='' && font !== 'default' && api.Constructor.font_select.safe[font] === undefined) {
                                api.Constructor.font_select.loadGoogleFonts(font + ':' + val);
                            }

                            // if the fontWeight has "italic" style, toggle the font_style option
                            var wrap =  self.styleTab.getElementsByClassName('tb_multi_fonts')[0],
                                el;
                            if (val.indexOf('italic') !== -1) {
                                val = parseInt(val.replace('italic', ''));
                                el= wrap.querySelector('[value="italic"]');
                            } else {
                                el= wrap.querySelector('[value="normal"]');
                            }
                            if(el.checked===false){
                                el.parentNode.click();
                            }
                        }
                        else if (type === 'font_select') {
                            if (val!=='' && val !== 'default' && api.Constructor.font_select.safe[val] === undefined) {
                                var weight = this.closest('.tb_tab').getElementsByClassName('font-weight-select')[0],
                                    request;

                                request = val;
                                if (weight!==undefined) {
                                    request+= ':' + weight.value;
                                }
                                api.Constructor.font_select.loadGoogleFonts(request);
                            } else if (val === 'default') {
                                val = '';
                            }
                            
                        }
                        else if (cl.contains('tb_unit')) {
                            Themify.triggerEvent(self.$context.find('#' + id.replace('_unit', ''))[0], 'keyup');
                            return;
                        }
                        else if (prop === 'background-mode') {
                            self.bindBackgroundMode(val, id);
                            return;
                        }
                        else if (prop === 'background-position') {
                            self.bindBackgroundPosition(val, id);
                            return;
                        }
                        else if(prop==='column-count' && val==0){
                            val='';
                        }
                    }
                    else if (type==='gallery' && self.type !== 'module') {
                        self.bindBackgroundSlider(data);
                        return;
                    }
                    else if (is_radio===true) {
                        id = this.closest('.tb_lb_option').id;
                        if (this.checked === false) {
                            val = '';
                        }
                        if (type === 'imageGradient' || data.is_background === true) {
                            self.bindBackgroundTypeRadio(val);
                            return;
                        }
                        else if (data.is_overlay === true) {
                            self.overlayType(val);
                            return;
                        }
                    }
                    else if (type === 'color' || type === 'gradient') {
                        if(type === 'gradient'){
                            id = this.dataset['id'];
                        }
                        
                        if (data.is_overlay === true) {
                            self.addOrRemoveComponentOverlay(type, id, val);
                            return;
                        }
                        if(type === 'color'){
                            var image =null;
                            //for modules
                            if(self.type==='module' && data.colorId!==undefined && data.origId!==undefined){
                                image = topWindow.document.getElementById(data.origId);
                                if(image!==null && image.closest('.tb_input').querySelector('input:checked').value!=='image'){
                                    image=null;
                                }
                            }//for rows/column
                            else if(self.type!=='module' && self.styleTabId==='h'){
                                image = self.styleTab.getElementsByClassName('tb_uploader_input')[0];
                            }
                            if(image && image.value.trim()===''){
                                self.setLiveStyle('background-image', (val!==''?'none':''), data.selector);
                            }
                        }
                        
                    }
                    else if (type === 'image' || type === 'video') {
                        if (type === 'video') {
                            if (val.length > 0) {
                                self.$liveStyledElmt.data('fullwidthvideo', val).attr('data-fullwidthvideo', val);
                                if (_.isEmpty(self.$liveStyledElmt.data('mutevideo')) && self.$context.find('#background_video_options_mute').is(':checked')) {
                                    self.$liveStyledElmt.data('mutevideo', 'mute');
                                }
                                ThemifyBuilderModuleJs.fullwidthVideo(self.$liveStyledElmt);
                            } else {
                                self.removeBgVideo();
                            }
                            return false;
                        }
                        else {
                            if(val){
                                 val = 'url(' + val + ')';
                            }
                            else {
                                val='';
                                if(data.colorId!==undefined && self.styleTabId==='h'){
                                    var color = topWindow.document.getElementById(data.colorId);
                                    if(color!==null && color.value.trim()!==''){
                                        val='none';
                                    }
                                }
                            }
                            var group = self.styleTab.getElementsByClassName('tb_image_options');
                            for(var i=group.length-1;i>-1;--i){
                                var opt = group[i].getElementsByClassName('tb_lb_option');
                                for(var j=opt.length-1;j>-1;--j){
                                    Themify.triggerEvent(opt[j],'change');

                                }
                            }
                            group=null;   
                        }
                    }
                    else if(type==='checkbox'){
                        if(this.closest('#background_video_options')!==null){
                            self.VideoOptions(this,val);
                            return;
                        }else if(-1 !== id.indexOf('_auto_height') && 'height' === prop){
                            if(this.checked){
                                self.setData(data.heightID, 'height', 'auto');
                            }else{
                                var heightValue = $(self.styleTab).find('#'+ data.heightID).val();
                                if(heightValue!= ''){
                                    self.setData(data.heightID, 'height', heightValue+$(self.styleTab).find('#height_unit').val());
                                }else{
                                    self.setData(data.heightID, 'height', '');
                                }
                            }
                            return;
                        }
                    }
                    self.setData(id, '', val);
                },{passive: true});
            })();
        };

        ThemifyLiveStyling.prototype.getValue = function (id) {
            return this.module_rules[id] !== undefined ? this.module_rules[id] : false;

        };

          ThemifyLiveStyling.prototype.bindTabsSwitch = function (off) {
            var self = this;
                if(off===true){
                    Themify.body.off('themify_builder_tabsactive.hoverTabs');
                    return;
                }
            
                Themify.body.on('themify_builder_tabsactive.hoverTabs',function (e,id,container){
                    if(api.Constructor.clicked==='styling'){
                        var tab_id = id.split('_').pop(),
                            hover_items;
                        if(tab_id!=='h'){
                            self.$liveStyledElmt[0].classList.remove('tb_visual_hover');
                            hover_items = self.$liveStyledElmt[0].getElementsByClassName('tb_visual_hover');
                            for(var i=hover_items.length-1;i>-1;--i){
                                hover_items[i].classList.remove('tb_visual_hover');
                            }
                        }
                        else{
                            if(self.type!=='module'){
                                var radio = container.previousElementSibling.getElementsByClassName('background_type')[0];
                                if(radio!==undefined){
                                    radio = radio.querySelector('input:checked').value;
                                    if(radio==='image' || radio==='gradient'){
                                        container.classList.remove('tb_disable_hover');
                                    }
                                    else{
                                         container.classList.add('tb_disable_hover');
                                    }
                                }
                            }
                            setTimeout(function(){
                                hover_items = container.getElementsByClassName('tb_lb_option');
                                var selectors = [];
                                for(var i=hover_items.length-1;i>-1;--i){
                                    var elId = hover_items[i].id,
                                        is_gradient = hover_items[i].classList.contains('themify-gradient');
                                        if(is_gradient===true){
                                            elId = hover_items[i].dataset['id'];
                                        }
                                    if(self.module_rules[elId]!==undefined && (is_gradient || hover_items[i].offsetParent!==null)){
                                        
                                        var select = Array.isArray(self.module_rules[elId].selector)?self.module_rules[elId].selector:[self.module_rules[elId].selector];
                                        for(var j=select.length-1;j>-1;--j){
                                            var k = select[j].split(':hover')[0];
                                            selectors[k] = 1;
                                        }
                                    }
                                }
                                hover_items = null;
                                selectors = Object.keys(selectors);
                                if(selectors.length>0){
                                    for(var i=selectors.length-1;i>-1;--i){
                                        hover_items = document.querySelectorAll(self.prefix+selectors[i]);
                                        for(var j=hover_items.length-1;j>-1;--j){
                                            hover_items[j].classList.add('tb_visual_hover');
                                        }
                                    }
                                }
                                
                            },10);
                            
                        }
                    }
                });
        };


        /**
         * Returns component's background cover element wrapped in jQuery.
         *
         * @param {jQuery} $component
         * @returns {jQuery}
         */
        ThemifyLiveStyling.prototype.getComponentBgOverlay = function () {
            return this.$liveStyledElmt.children('.builder_row_cover');
        };

        /**
         * Returns component's background slider element wrapped in jQuery.
         *
         * @param {jQuery} $component
         * @returns {jQuery}
         */
        ThemifyLiveStyling.prototype.getComponentBgSlider = function () {
            var type = this.type === 'colum' && api.activeModel.get('component_name') === 'sub-column' ? 'sub-col' : (this.type === 'colum' ? 'col' : this.type);
            return this.$liveStyledElmt.children('.' + type + '-slider');
        };

        /**
         * Removes background slider if there is any in $component.
         *
         * @param {jQuery} $component
         */
        ThemifyLiveStyling.prototype.removeBgSlider = function () {
            this.getComponentBgSlider().add(this.$liveStyledElmt.children('.tb_backstretch')).remove();
            this.$liveStyledElmt.css({
                'position': '',
                'background': '',
                'z-index': ''
            });
        };




        /**
         * Removes background video if there is any in $component.
         *
         * @param {jQuery} $component
         */
        ThemifyLiveStyling.prototype.removeBgVideo = function () {
            this.$liveStyledElmt.removeAttr('data-fullwidthvideo').data('fullwidthvideo', '').children('.big-video-wrap').remove();
        };

        return ThemifyLiveStyling;
    })(jQuery);
    
    
    
    function verticalResponsiveBars() {
            var items = topWindow.document.getElementsByClassName('tb_middle_bar'),
                resizeBarMousedownHandler =function (e) {
                    var start_x = e.clientX,
                        bar = this.id==='tb_right_bar'?'right':'left',
                        breakpoints = tbLocalScript.breakpoints,
                        max_width = api.toolbar.$el.width(),
                        start_with = api.iframe.css('transition','none').width(),
                        tooltip = topWindow.document.getElementsByClassName('tb_vertical_change_tooltip')[0],
                        vertical_bars = topWindow.document.getElementsByClassName('tb_vertical_bars')[0],
                        cover =document.createElement('div');
                        cover.className = 'tb_mousemove_cover';
                    if(tooltip!==undefined){
                        tooltip.parentNode.removeChild(tooltip);
                    }
                    tooltip = document.createElement('div');
                    tooltip.className = 'tb_vertical_change_tooltip';
                    this.appendChild(tooltip);
                    vertical_bars.appendChild(cover);
                    vertical_bars.className+=' tb_resizing_start';
                    api.iframe[0].classList.add('tb_resizing_start');
                    var $window = $(window),
                        _move = function(e){
                            
                     
                            var diff = e.clientX - start_x;
                                diff*= 2;
                            if(bar === 'left'){
                                diff=-diff;
                            }
                            var min_width = 320,
                                breakpoint= api.activeBreakPoint,
                                w = (start_with + diff) < min_width  ? min_width : (start_with + diff),
                                breakpoint;
                                
                            if(w <= breakpoints.mobile )
                                breakpoint = 'mobile';
                            else if(w <= breakpoints.tablet[1] )
                                breakpoint = 'tablet';
                            else if(w <= breakpoints.tablet_landscape[1])
                                breakpoint =  'tablet_landscape';
                            else{
                                breakpoint= 'desktop';
                                if(w>(max_width-17)){
                                    w = max_width;
                                }
                            }
                            tooltip.textContent = w + 'px';
                            api.iframe.css( 'width', w );
                            if(api.activeBreakPoint !== breakpoint){
                                api.Constructor.lightboxSwitch(breakpoint);
                            }
                    };

                    cover.addEventListener('mousemove',_move,{passive: true });
                    cover.addEventListener('mouseup',function _up(e){
                        
                        cover.removeEventListener('mousemove', _move,{passive: true });
                        cover.removeEventListener('mouseup', _up, {once: true,passive: true});

                        cover.parentNode.removeChild(cover);
                        tooltip.parentNode.removeChild(tooltip);

                        api.iframe.css('transition','');
                        vertical_bars.classList.remove('tb_resizing_start');   
                        api.iframe[0].classList.remove('tb_resizing_start');
                        
                        
                        api.Utils._onResize(true);
                        $window.triggerHandler('tfsmartresize.tbfullwidth');
                        $window.triggerHandler('tfsmartresize.tfVideo');

                    },{once:true,passive: true});
                };
            
            for(var i=items.length-1;i>-1;--i){
                items[i].addEventListener('mousedown',resizeBarMousedownHandler,{passive: true});
            } 
            items=null;
        }
}(jQuery,Themify, window,window.top, document, tb_app, ThemifyBuilderCommon));
