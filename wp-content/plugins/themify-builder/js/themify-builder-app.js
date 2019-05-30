var tb_app;
(function ($, Backbone,Themify, window,topWindow, document, Common, undefined) {

    'use strict';

    // Check if drag event is not disabled
    if (typeof topWindow.document.ondragstart === 'function') {
        topWindow.document.ondragstart=window.document.ondragstart  = null;
    }


    // extend jquery-ui sortable with beforeStart event
    var oldMouseStart = $.ui.sortable.prototype._mouseStart,
            is_fullSection = document.body.classList.contains('full-section-scrolling');
    $.ui.sortable.prototype._mouseStart = function (e, overrideHandle, noActivation) {
        if (e.type === 'mousedown' && e.which === 1) {
            var cl = e.target.classList;
            if(cl.contains('tb_subrow_holder') || cl.contains('tb_grid_drag') || (cl.contains('tb_column_action') && e.target.parentNode.classList.contains('sub_column')) ||((api.ActionBar.type==='row' || api.ActionBar.type==='subrow' ) && !cl.contains('ti-move') && e.target.parentNode.closest('.tb_clicked')!==null)){
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }
            this._trigger('beforeStart', e, [this, this._uiHash()]);
        }
        oldMouseStart.apply(this, [e, overrideHandle, noActivation]);
    };
    if (!Element.prototype.closest) {

        Element.prototype.closest = function (cl) {
            var is_class = null,
                    is_id = null,
                    is_tag = null,
                    el = this;
            if (cl.indexOf('.') === 0) {
                is_class = true;
                cl = cl.replace('.', '');
            }
            else if (cl.indexOf('#') === 0) {
                is_id = true;
                cl = cl.replace('#', '');
            }
            else {
                is_tag = true;
            }


            var check = function (item) {
                if ((is_class === true && item.classList.contains(cl)) || (is_id === true && item.id === cl) || (is_tag === true && item.nodeName.toLowerCase() === cl)) {
                    return item;
                }
                return null;
            };

            while (true) {
                var item = check(el);
                if (item !== null) {
                    return item;
                }
                el = el.parentElement;
                if (!el) {
                    return null;
                }
            }
        };
    }
    if (!String.prototype.endsWith) {
        Object.defineProperty(String.prototype, 'endsWith', {
          value: function(searchString, position) {
            var subjectString = this.toString(),
                subLen=subjectString.length;
            if (position === undefined || position > subLen) {
              position = subLen;
            }
            position -= subLen;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
          }
        });
    }
    // Serialize Object Function
    if (undefined === $.fn.themifySerializeObject) {
        $.fn.themifySerializeObject = function () {
            var o = {};
            for (var i = this.length - 1; i > -1; --i) {
                var type = this[i].type;
                if (this[i].classList.contains('wp-editor-area') && tinyMCE !== undefined) {
                    var tiny = tinyMCE.get(this[i].id);
                    if (tiny) {
                        this[i].value = tiny.getContent();
                    }
                }
                if (this[i].value !== '' && (type === 'text' || type === 'number' || type === 'radio' || type === 'checkbox' || type === 'textarea' || type === 'select-one' || type === 'hidden' || type === 'email' || type === 'select' || type === 'select-multiple') && (this[i].name || this[i].id)) {
                    var name = this[i].name ? this[i].name : this[i].id,
                            val = this[i].value;
                    //jQuery returns all selected values for select elements with multi option on
                    if (type === 'radio' || type === 'checkbox') {
                        val = this[i].checked && val;
                    }
                    else if (type === 'select-multiple') {
                        val = $(this[i]).val();
                    }
                    if (o[name] !== undefined && type !== 'radio') {
                        !o[name].push && (o[name] = [o[name]]);
                        val && o[name].push(val);
                    } else {
                        val && (o[name] = val);
                    }
                }
            }
            return o;
        };
    }


    var api = tb_app = {
        activeModel: null,
        Models: {},
        Collections: {},
        Mixins: {},
        Views: {Modules: {}, Rows: {}, SubRows: {}, Columns: {}},
        Forms: {},
        Constructor: {},
        Utils: {},
        Instances: {Builder: {}},
        cache: {},
        Styles: {}
    },
    generatedIds = {};
    api.builderIndex=0;
    api.mode = 'default';
    api.autoSaveCid = null;
    api.hasChanged = null;
    api.editing = false;
    api.scrollTo = false;
    api.eventName = false;
    api.beforeEvent = false;
    api.saving = false;
    api.activeBreakPoint = 'desktop';
    api.zoomMeta = {isActive: false, size: 100};
    api.isPreview = false;
    api.Models.Module = Backbone.Model.extend({
        defaults: {
            element_id: null,
            elType: 'module',
            mod_name: '',
            mod_settings: {}
        },
        initialize: function () {
            api.Models.Registry.register(this.cid, this);
            var id = this.get('element_id');
            if (!id || generatedIds[id] === 1) {
                id = api.Utils.generateUniqueID();
                this.set({element_id: id}, {silent: true});
            }
            generatedIds[id] = 1;
        },
        toRenderData: function () {
            return {
                slug: this.get('mod_name'),
                name: themifyBuilder.modules[this.get('mod_name')].name,
                excerpt: this.getExcerpt()
            };
        },
        getExcerpt: function (settings) {
            var setting = settings || this.get('mod_settings'),
                    excerpt = setting.content_text || setting.content_box || setting.plain_text || '';
            return this.limitString(excerpt, 100);
        },
        limitString: function (str, limit) {
            var new_str = '';
            if (str !== '') {
                str = this.stripHtml(str).toString(); // strip html tags
                new_str = str.length > limit ? str.substr(0, limit) : str;
            }
            return new_str;
        },
        stripHtml: function (html) {
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },
        setData: function (data) {
            api.Utils.clearElementId([data]);
            var model = api.Views.init_module(data);
            model.model.trigger('custom:change', model);
        },
        backendLivePreview: function () {
            $('.tb_element_cid_' + this.cid).find('.module_excerpt').text(this.getExcerpt());
        },
        // for instant live preview
        getPreviewSettings: function () {
            return _.extend({cid: this.cid}, themifyBuilder.modules[ this.get('mod_name') ].defaults);
        },
        getIDattr: function () {
            return this.get('element_id') ? this.get('element_id') : api.Utils.generateUniqueID();
        }
    });

    api.Models.SubRow = Backbone.Model.extend({
        defaults: {
            element_id: null,
            elType: 'subrow',
            gutter: 'gutter-default',
            column_alignment: is_fullSection ? 'col_align_middle' : 'col_align_top',
            column_h: '',
            desktop_dir: 'ltr',
            tablet_dir: 'ltr',
            tablet_landscape_dir: 'ltr',
            mobile_dir: 'ltr',
            col_mobile: '-auto',
            col_tablet_landscape: '-auto',
            col_tablet: '-auto',
            cols: {},
            styling:{}
        },
        initialize: function () {
            api.Models.Registry.register(this.cid, this);
            var id = this.get('element_id');
            if (!id || generatedIds[id] === 1) {
                id = api.Utils.generateUniqueID();
                this.set({element_id: id}, {silent: true});
            }
            generatedIds[id] = 1;
        },
        setData: function (data) {
            api.Utils.clearElementId([data]);
            var model = api.Views.init_subrow(data);
            model.model.trigger('custom:change', model);
        }
    });

    api.Models.Column = Backbone.Model.extend({
        defaults: {
            element_id: null,
            elType: 'column',
            grid_class: '',
            component_name: 'column',
            modules: {},
            styling:{}
        },
        initialize: function () {
            api.Models.Registry.register(this.cid, this);
            var id = this.get('element_id');
            if (!id || generatedIds[id] === 1) {
                id = api.Utils.generateUniqueID();
                this.set({element_id: id}, {silent: true});
            }
            generatedIds[id] = 1;
        },
        setData: function (data) {
            api.Utils.clearElementId([data]);
            var model = api.Views.init_column(data);
            model.model.trigger('custom:change', model);
        }
    });

    api.Models.Row = Backbone.Model.extend({
        defaults: {
            element_id: null,
            elType: 'row',
            gutter: 'gutter-default',
            column_alignment: is_fullSection ? 'col_align_middle' : 'col_align_top',
            column_h: '',
            desktop_dir: 'ltr',
            tablet_dir: 'ltr',
            tablet_landscape_dir: 'ltr',
            mobile_dir: 'ltr',
            col_mobile: '-auto',
            col_tablet_landscape: '-auto',
            col_tablet: '-auto',
            cols: {},
            styling:{}
        },
        initialize: function () {
            api.Models.Registry.register(this.cid, this);
            var id = this.get('element_id');
            if (!id || generatedIds[id] === 1) {
                id = api.Utils.generateUniqueID();
                this.set({element_id: id}, {silent: true});
            }
            generatedIds[id] = 1;
        },
        setData: function (data) {
            api.Utils.clearElementId([data]);
            var model = api.Views.init_row(data);
            model.model.trigger('custom:change', model);
        }
    });

    api.Collections.Rows = Backbone.Collection.extend({
        model: api.Models.Row
    });

    api.Models.Registry = {
        items: {},
        register: function (id, object) {
            this.items[id] = object;
        },
        lookup: function (id) {
            return this.items[id] || null;
        },
        remove: function (id) {
            this.items[id] = null;
            delete this.items[id];
        },
        destroy: function () {
            for (var i in this.items) {
                this.items[i].destroy();
            }
            this.items = {};
        }
    };

    api.Models.setValue = function (cid, data, silent) {
        silent = silent || false;
        var model = api.Models.Registry.lookup(cid);
        model.set(data, {silent: silent});
    };

    api.vent = _.extend({}, Backbone.Events);

    api.Views.register_module = function (args) {
        if ('default' !== api.mode) {
            this.Modules[ api.mode ] = this.Modules.default.extend(args);
        }
    };

    api.Views.init_module = function (args,is_new) {
        if (themifyBuilder.modules[args.mod_name] === undefined) {
            return false;
        }
      
        if (is_new===true && args.mod_settings === undefined && themifyBuilder.modules[ args.mod_name ].defaults !== undefined) {
            args.mod_settings = _.extend({}, themifyBuilder.modules[ args.mod_name ].defaults);
        }

        var model = args instanceof api.Models.Module ? args : new api.Models.Module(args),
                callback = this.get_module(),
                view = new callback({model: model, type: api.mode});

        return {
            model: model,
            view: view
        };
    };

    api.Views.get_module = function () {
        return this.Modules[ api.mode ];
    };

    api.Views.unregister_module = function () {
        if ('default' !== api.mode) {
            this.Modules[ api.mode ] = null;
            delete this.Modules[ api.mode ];
        }
    };

    api.Views.module_exists = function () {
        return this.Modules.hasOwnProperty(api.mode);
    };

    // column
    api.Views.register_column = function (args) {
        if ('default' !== api.mode) {
            this.Columns[ api.mode ] = this.Columns.default.extend(args);
        }
    };

    api.Views.init_column = function (args) {
        var model = args instanceof api.Models.Column ? args : new api.Models.Column(args),
                callback = this.get_column(),
                view = new callback({model: model, type: api.mode});

        return {
            model: model,
            view: view
        };
    };

    api.Views.get_column = function () {
        return this.Columns[api.mode];
    };

    api.Views.unregister_column = function () {
        if ('default' !== api.mode) {
            this.Columns[ api.mode ] = null;
            delete this.Columns[ api.mode ];
        }
    };

    api.Views.column_exists = function () {
        return this.Columns.hasOwnProperty(api.mode);
    };

    // sub-row
    api.Views.register_subrow = function (args) {
        if ('default' !== api.mode) {
            this.SubRows[ api.mode ] = this.SubRows.default.extend(args);
        }
    };

    api.Views.init_subrow = function (args) {
        var model = args instanceof api.Models.SubRow ? args : new api.Models.SubRow(args),
                callback = this.get_subrow(),
                view = new callback({model: model, type: api.mode});

        return {
            model: model,
            view: view
        };
    };

    api.Views.get_subrow = function () {
        return this.SubRows[ api.mode ];
    };

    api.Views.unregister_subrow = function () {
        if ('default' !== api.mode) {
            this.SubRows[ api.mode ] = null;
            delete this.SubRows[ api.mode ];
        }
    };

    api.Views.subrow_exists = function () {
        return this.SubRows.hasOwnProperty(api.mode);
    };

    // Row
    api.Views.register_row = function (args) {
        if ('default' !== api.mode) {
            this.Rows[ api.mode ] = this.Rows.default.extend(args);
        }
    };

    api.Views.init_row = function (args) {
        var attr = args.attributes;
        if (attr === undefined || ((attr.cols !== undefined && (Object.keys(attr.cols).length > 0 || attr.cols.length > 0)) || (attr.styling !== undefined && Object.keys(attr.styling).length > 0))) {
            var model = args instanceof api.Models.Row ? args : new api.Models.Row(args),
                    callback = this.get_row(),
                    view = new callback({model: model, type: api.mode});

            return {
                model: model,
                view: view
            };
        }
        else {
            return false;
        }
    };

    api.Views.get_row = function () {
        return this.Rows[ api.mode ];
    };

    api.Views.unregister_row = function () {
        if ('default' !== api.mode) {
            this.Rows[ api.mode ] = null;
            delete this.Rows[ api.mode ];
        }
    };

    api.Views.row_exists = function () {
        return this.Rows.hasOwnProperty(api.mode);
    };

    api.Constructor = {
        data: null,
        key: 'tb_form_templates_',
        styles: null,
        settings: null,
        editors: null,
        afterRun: null,
        radioChange: null,
        bindings: null,
        stylesData: null,
        values: null,
        clicked: null,
        type: null,
        static: null,
        label: null,
        is_repeat: null,
        is_sort:null,
        is_new: null,
        is_ajax: null,
        breakpointsReverse: Object.keys(themifyBuilder.breakpoints).reverse(),
        set: function (value) {
            try {
                var m = '';
                for (var s in themifyBuilder.modules) {
                    m += s;
                }
                var record = {val: value, ver: tbLocalScript.version, h: Themify.hash(m)};
                localStorage.setItem(this.key, JSON.stringify(record));
                return true;
            }
            catch (e) {
                return false;
            }
        },
        get: function () {

            if (themifyBuilder.debug) {
                return false;
            }
            try {
                localStorage.removeItem('tb_form_templates');//old value is a html,need to be removed
                var record = localStorage.getItem(this.key),
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
        },
        getForms: function (callback) {
            this.breakpointsReverse.push('desktop');
            var self = this,
                    data = self.get(),
                    result = function (resp) {
                        Common.Lightbox.setup();
                        Common.LiteLightbox.modal.on('attach', function () {
                            this.el.classList.add('tb_lite_lightbox_modal');
                        });
                        self.data = resp;
                        if (callback) {
                            callback();
                        }
                    };
            if (data !== false) {//cache visual templates
                result(data);
            }
            else {
                $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    dataType: 'json',
                    data: {
                        action: 'tb_load_form_templates',
                        tb_load_nonce: themifyBuilder.tb_load_nonce
                    },
                    success: function (resp) {
                        if (resp) {
                            result(resp);
                            self.set(resp);
                        }
                    }
                });
            }

            self.static = themifyBuilder.i18n.options;
            themifyBuilder.i18n.options = null;
            this.label = themifyBuilder.i18n.label;
            themifyBuilder.i18n.label = null;
            var fonts = self.static.fonts.safe;
            for (var i = 0, len = fonts.length; i < len; ++i) {
                if ('' !== fonts[i].value && 'default' !== fonts[i].value) {
                    self.font_select.safe[fonts[i].value] = fonts[i].name;
                }
            }
            self.static.fonts.safe = null;
            fonts = self.static.fonts.google;
            for (var i = 0, len = fonts.length; i < len; ++i) {
                if ('' !== fonts[i].value && 'default' !== fonts[i].value) {
                    self.font_select.google[fonts[i].value] = {'n': fonts[i].name, 'v': fonts[i].variant};
                }
            }
            self.static.fonts.google = fonts = null;

        },
        getOptions: function (data) {
            if (data.options !== undefined) {
                return data.options;
            }
            for (var i in this.static) {
                if (data[i] === true) {
                    return this.static[i];
                }
            }
            return false;
        },
        getTitle: function (data) {
            if (data.type === 'custom_css') {
                return this.label.custom_css;
            }
            if (data.type === 'title') {
                return this.label.m_t;
            }
            return data.label !== undefined ? (this.label[data.label] !== undefined ? this.label[data.label] : data.label) : false;
        },
        getSwitcher: function () {
            var f = document.createDocumentFragment(),
                    sw = document.createElement('ul'),
                    breakpoints = this.breakpointsReverse,
                    self = this;
            sw.className = 'tb_lightbox_switcher clearfix';
            for (var i = breakpoints.length - 1; i > -1; --i) {
                var b = breakpoints[i],
                        el = document.createElement('li'),
                        a = document.createElement('a'),
                        icon = document.createElement('i');
                a.href = '#' + b;
                a.className = 'tab_' + b;
                a.title = b === 'tablet_landscape' ? this.label['table_landscape'] : (b.charAt(0).toUpperCase() + b.substr(1));
                icon.className = 'ti-' + b;
                if (b === 'tablet_landscape') {
                    icon.className += ' ti-tablet';
                }
                a.appendChild(icon);
                el.appendChild(a);
                f.appendChild(el);
            }
            sw.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (e.target !== sw) {
                    var a = e.target.closest('a');
                    if (a !== null) {
                        self.lightboxSwitch(a.getAttribute('href'));
                    }
                }
            });
            sw.appendChild(f);
            return sw;
        },
        lightboxSwitch: function (bp) {
            var id = bp.replace('#', '');
            if (id === api.activeBreakPoint) {
                return;
            }
            if (api.activeModel && api.mode === 'visual') {
                api.scrollTo = api.liveStylingInstance.$liveStyledElmt;
            }
            $('.tb_breakpoint_switcher.breakpoint-' + id, topWindow.document).trigger('click');
        },
        binding: function (_this, data, val, context) {
            var logic = false,
                    binding = data['binding'],
                    is_responsive = 'desktop' !== api.activeBreakPoint,
                    type=data['type'];
            if (type === 'select' && val == 0) {
                val = '';
            }
            if (!val && binding['empty'] !== undefined) {
                logic = binding['empty'];
            }
            else if (val && binding[val] !== undefined) {
                if (type === 'radio' || type === 'icon_radio') {
                    logic = _this.checked === true ? binding[val] : false;
                } else {
                    logic = binding[val];
                }
            }
            else if (val && binding['not_empty'] !== undefined) {
                logic = binding['not_empty'];
            }
            else if (binding['select'] !== undefined && val !== binding['select']['value']) {
                logic = binding['select'];
            }
            else if (binding['checked'] !== undefined && _this.checked === true) {
                logic = binding['checked'];
            }
            else if (binding['not_checked'] !== undefined && _this.checked === false) {
                logic = binding['not_checked'];
            }
            if (logic) {
                var items = [];
                if (logic['show'] !== undefined) {
                    items = logic['show'];
                }
                if (logic['hide'] !== undefined) {
                    items += logic['hide'];
                }
                if (context === undefined || context === null || context.length === 0) {
                    context = _this.closest('.tb_tab');
                    if (context === null) {
                        context = _this.closest('.tb_expanded_opttions');
                        if (context === null) {
                            context = topWindow.document.getElementById('tb_lightbox_container');
                        }
                    }

                }
                var hasHide=logic['hide'] !== undefined,
                    hasShow=logic['show'] !== undefined;
                for (var i = 0, len = items.length; i < len; ++i) {
                    if (hasHide===true && logic['hide'][i] !== undefined) {
                        var hides = context.querySelectorAll('.' + logic['hide'][i]);
                        for (var j =hides.length-1; j >-1; --j) {
                            hides[j].classList.add('_tb_hide_binding');
                        }
                        hides=null;
                    }
                    if (hasShow===true && logic['show'][i] !== undefined) {
                        var shows = context.querySelectorAll('.' + logic['show'][i]);
                        for (var j =shows.length-1; j >-1; --j) {
                            shows[j].classList.remove('_tb_hide_binding');
                        }
                        shows=null;
                    }
                }
                if (logic['responsive'] !== undefined && logic['responsive']['disabled'] !== undefined) {
                    var items_disabled = logic['responsive']['disabled'];
                    for (var i =items_disabled.length-1; i>-1; --i) {
                        if (logic['responsive']['disabled'][i] !== undefined) {
                            var resp = context.querySelectorAll('.' + logic['responsive']['disabled'][i]);
                            for (var j=resp.length-1; j >-1; --j) {
                                if (is_responsive === true) {
                                    resp[i].classList.add('responsive_disable');

                                } else {
                                    resp[i].classList.remove('responsive_disable');
                                }
                            }

                        }
                    }
                }
            }
        },
        control: {
            init: function (el, type, args) {
                args.name = type;
                this[type].call(this, el, args);
            },
            preview: function (el, val, args) {
                if (api.mode === 'visual') {
                    var selector = null,
                        self = api.Constructor,
                        repeater=null;
                    if (args.repeat === true) {
                         repeater= el.closest('.tb_sort_fields_parent');
                        if(repeater===null){
                            repeater = el.closest('.tb_row_js_wrapper');
                        }
                    }

                    if (args.selector !== undefined && val) {
                        selector = api.liveStylingInstance.$liveStyledElmt[0].querySelectorAll(args.selector);
                        if (selector.length === 0) {
                            selector = null;
                        }
                        else if (repeater!==null) {
                            
                            var item = el.closest('.tb_repeatable_field'),
                                    rep = Array.prototype.slice.call(repeater.children);
                            selector = selector[rep.indexOf(item)];
                            rep = null;
                        }
                    }
                    if (repeater!==null) {
                        self.settings[ repeater.id ] = api.Utils.clear(api.Forms.parseSettings(repeater).v);
                        repeater = null;
                    }
                    else {
                        self.settings[ args.id ] = val;
                    }
                    if ('refresh' === args.type || self.is_ajax === true) {
                        api.activeModel.trigger('custom:preview:refresh', self.settings, selector, val);
                    }
                    else {
                        api.activeModel.trigger('custom:preview:live', self.settings, args.name === 'wp_editor' || el.tagName === 'TEXTAREA', null, selector, val);
                    }
                }
                else {
                    api.activeModel.backendLivePreview();
                }
                api.hasChanged = true;
            },
            change: function (el, args) {
                var that = this,
                        timer = 'refresh' === args.type && args.selector === undefined ? 1000 : 50,
                        event;
                if (args.event === undefined) {
                    event = 'change';
                    timer = 1;
                }
                else {
                    event = args.event;
                }
                el.addEventListener(event, _.throttle(function (e) {
                    that.preview(e.target, e.target.value, args);
                }, timer), {passive: true });
            },
            wp_editor: function (el, args) {
                var that = this,
                        $el = $(el),
                        timer = 'refresh' === args.type && args.selector === undefined ? 1000 : 50,
                        id = el.id,
                        previous = false,
                        is_widget = false,
                        callback = _.throttle(function (e) {
                            var content = this.type === 'setupeditor' ? this.getContent() : this.value;
                            if (api.activeModel === null || previous === content) {
                                return;
                            }
                            previous = content;
                            if (is_widget !== false) {
                                el.value = content;
                                $el.trigger('change');
                            }
                            else {
                                that.preview(el, content, args);
                            }
                        }, timer);
                api.Utils.initQuickTags(id);
                if (tinyMCE !== undefined) {

                    if (tinymce.editors[ id ] !== undefined) { // clear the prev editor
                        tinyMCE.execCommand('mceRemoveEditor', true, id);
                    }
                    var ed = api.Utils.initNewEditor(id);
                    is_widget = el.classList.contains('wp-editor-area') ? $el.closest('#instance_widget').length > 0 : false;

                    // Backforward compatibility
                    !ed.type && (ed.type = 'setupeditor');

                    ed.on('change keyup', callback);
                }
                $el.on('change keyup', callback);
            },
            layout: function (el, args) {
                if ('visual' === api.mode) {
                    var that = this;
                    el.addEventListener('change', function (e) {
                        var selectedLayout = e.detail.val;
                        if (args['classSelector']!==undefined) {
                            var id = args.id,
                                prevLayout = api.Constructor.settings[id],
                                apllyTo = args['classSelector']!==''? api.liveStylingInstance.$liveStyledElmt.find(args['classSelector']).first():api.liveStylingInstance.$liveStyledElmt;
                                apllyTo.removeClass(prevLayout).addClass(selectedLayout);
                                api.Constructor.settings[id]= selectedLayout;
                                api.Utils.loadContentJs(api.liveStylingInstance.$liveStyledElmt, 'module');

                        } else {
                            that.preview(this, selectedLayout, args);
                        }

                    },{passive: true});
                }
            },
            icon: function (el, args) {
                var that = this;
                el.addEventListener('change', function (e) {
                    var i = e.target.value,
                            prev = this.closest('.tb_input').getElementsByClassName('themify_fa_toggle')[0];
                    if (prev !== undefined) {
                        prev.className = 'tb_plus_btn themify_fa_toggle icon-close';
                         var cl = api.Utils.getIcon(i);
                        if (cl === false) {
                            cl = 'default_icon';
                        }
                        prev.className+=' '+cl;
                    }
                    that.preview(e.target, i, args);
                },{passive: true });
            },
            checkbox: function (el, args) {
                if (api.mode === 'visual') {
                    var that = this;
                    el.addEventListener('change', function () {
                        var checked = [],
                                checkbox = this.closest('.themify-checkbox').getElementsByClassName('tb-checkbox');
                        for (var i = 0, len = checkbox.length; i < len; ++i) {
                            if (checkbox[i].checked) {
                                checked.push(checkbox[i].value);
                            }
                        }
                        that.preview(this, checked.join('|'), args);
                    },{passive: true });
                }
            },
            color: function (el, args) {
                if (api.mode === 'visual') {
                    var that = this;
                    el.addEventListener('themify_builder_color_picker_change', function (e) {
                        that.preview(this, e.detail.val, args);
                    },{passive: true });
                }
            },
            widget_select: function (el, args) {
                this.preview(el, el.find(':input').themifySerializeObject(), args);
            },
            queryPosts: function (el, args) {
                if (api.mode === 'visual') {
                    var that = this;
                    el.addEventListener('queryPosts', function (e) {
                        args['id'] = this.id;
                        api.Constructor.settings = api.Utils.clear(api.Forms.serialize('tb_options_setting'));
                        that.preview(this, api.Constructor.settings[args['id']], args);
                    },{passive: true });
                }
            }
        },
        initControl: function (el, data) {
            if (api.activeModel !== null) {
                if (this.clicked === 'setting' && data.type !== 'custom_css') {
                    if (data.control !== false && this.component === 'module') {
                        var args = data.control || {},
                            type = data['type'];
                        if (args['repeat'] === true) {
                            args['id'] = el.dataset['inputId'];
                        }
                        else {
                            if (this.is_repeat === true) {
                                args['repeat'] = true;
                                args['id'] = el.dataset['inputId'];
                            }
                            else {
                                args['id'] = data.id;
                            }
                        }

                        if (args.control_type === undefined) {
                            if (type === undefined || type === 'text' || type === 'range' || type === 'radio' || type === 'icon_radio' || type === 'select' || type === 'gallery' || type === 'textarea' || type === 'image' || type === 'date' || type === 'audio' || type === 'video' || type === 'select_menu' || type === 'widgetized_select' || type === 'layoutPart' || type === 'selectSearch' || type === 'hidden' || type === 'toggle_switch') {
                                if ((type === 'text' || type === 'textarea') && args.event === undefined) {
                                    args.event = 'keyup';
                                }
                                type = 'change';
                            }
                        }
                        else {
                            type = args.control_type;
                        }
                        this.control.init(el, type, args);
                    }
                }
                else if (api.mode === 'visual' && this.clicked === 'styling') {
                    api.liveStylingInstance.bindEvents(el, data);
                }
                if (data['binding']!== undefined) {
                    var self = this,
                            is_repeat = self.is_repeat === true;
                    if (data.type === 'layout') {
                        el.addEventListener('click', function (e) {
                            var t = e.target.closest('.tfl-icon');
                            if (t !== null) {
                                var context = is_repeat ? this.closest('.tb_repeatable_field_content') : undefined;
                                self.binding(this, data, t.id, context);
                            }
                        },{passive: true});
                    }
                    else {
                        el.addEventListener('change', function (e) {
                            var context = is_repeat ? this.closest('.tb_repeatable_field_content') : undefined;
                            self.binding(this, data, this.value, context);
                        },{passive: true});
                    }
                    this.bindings.push({el: el, data: data, repeat: is_repeat});
                }
            }
            return el;
        },
        callbacks: function () {
            var len = this.afterRun.length;
            if (len > 0) {
                for (var i = 0; i < len; ++i) {
                    this.afterRun[i].call();
                }
                this.afterRun = [];
            }
            len = this.radioChange.length;
            if (len > 0) {
                for (var i = 0; i < len; ++i) {
                    this.radioChange[i].call();
                }
                this.radioChange = [];
            }
            
            len = this.bindings.length;
            if (len > 0) {
                for (var i = len - 1; i > -1; --i) {
                    var el = this.bindings[i].el,
                        context=this.bindings[i].repeat === true?el.closest('.tb_repeatable_field_content'):undefined,
                        v=this.bindings[i].data.type === 'layout'?el.getElementsByClassName('selected')[0].id:el.value;
                    this.binding(el, this.bindings[i].data, v, context);
                }
                this.bindings = [];
            }
        },
        setUpEditors: function () {
            for (var i = this.editors.length - 1; i > -1; --i) {
                this.initControl(this.editors[i].el, this.editors[i].data);
            }
            this.editors = [];
        },
        switchTabs: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var id = this.getAttribute('href'),
                li = this.parentNode,
                container = topWindow.document.getElementById(id.replace('#', ''));
            if (container === null || li.classList.contains('current')) {
                return;
            }
            var p = li.parentNode,
                children = p.children,
                containerChildren = container.parentNode.children;
            for (var i = children.length - 1; i > -1; --i) {
                children[i].classList.remove('current');
            }
            children = null;
            li.classList.add('current');
            for (var i = containerChildren.length - 1; i > -1; --i) {
                if (containerChildren[i].classList.contains('tb_tab')) {
                    containerChildren[i].style['display'] = 'none';
                }
            }
            containerChildren = null;
            container.style['display'] = 'block';
            Themify.body.triggerHandler('themify_builder_tabsactive', [id, container]);
            Themify.triggerEvent(container, 'themify_builder_tabsactive', {'id': id});
            api.Utils.hideOnClick(p);
            if (api.mode === 'visual') {
                $(document).triggerHandler('mouseup');
            }
        },
        run: function (type, save_opt) {
            
            this.styles = {};
            this.settings = {};
            this.editors = [];
            this.afterRun = [];
            this.radioChange = [];
            this.bindings = [];
            this.stylesData = {};
            this.is_repeat = null;
            this.component=null;
            this.type = type;
            this.is_new = null;
            this.is_ajax = null;
            var data,
                is_style=false,
                is_visible=false,
                model=api.activeModel;
            if (model!== null) {
                this.component = model.get('elType');
                var key,
                        item = document.getElementsByClassName('tb_element_cid_' + model.cid)[0];

                if (this.component === 'module') {
                    this.is_ajax = themifyBuilder.modules[type].type === 'ajax';
                    key = 'mod_settings';
                    if (model.get('is_new') !== undefined) {
                        this.is_new = true;
                        item = item.closest('.module_row');
                    }
                }
                else {
                    key = 'styling';
                }
                this.values = $.extend(true, {}, model.get(key));

                api.beforeEvent = Common.clone(item);
                is_visible = model.get('visibileClicked')!==undefined,
                is_style = is_visible===false && (this.component === 'column' || this.component === 'subrow' || model.get('styleClicked')!==undefined),
                data = this.data[type];
            }
            else {
                this.values = {};
                this.component = null;
                data = type;
            }

            var top_bar = document.createDocumentFragment(),
                    container = document.createDocumentFragment(),
                    self = this,
                    rememberedEl,
                    createTab = function (index, options) {

                        var tab_container = document.createElement('div'),
                            fr = document.createDocumentFragment();
                        tab_container.className = 'tb_options_tab_content';
                        if (index === 'visibility' || index === 'animation') {
                            options = self.static[index];
                        }
                        else if (index === 'styling') {
                            fr.appendChild(self.getSwitcher());
                        }
                        // generate html output from the options
                        tab_container.appendChild(self.create(options));
                        fr.appendChild(tab_container);
                        if (index === 'styling') {
                            var reset = document.createElement('a'),
                                    icon = document.createElement('i');
                            reset.href = '#';
                            reset.className = 'reset-styling';
                            icon.className = 'ti-close';
                            reset.appendChild(icon);
                            reset.appendChild(document.createTextNode(self.label.reset_style));
                            reset.addEventListener('click', self.resetStyling.bind(self));
                            fr.appendChild(reset);
                            if (api.mode === 'visual' && model) {
                                setTimeout(function () {
                                    api.liveStylingInstance.module_rules = self.styles;//by reference,will be fill when the option has been viewed
                                }, 600);
                            }
                        }

                        return fr;
                    };

            this.clicked = null;
            for (var k in data) {
                //meneu
                var li = document.createElement('li'),
                        a = document.createElement('a'),
                        tooltip = document.createElement('span'),
                        wrapper = document.createElement('div'),
                        label= data[k].name !== undefined ? data[k].name : this.label[k],
                        tab_id = 'tb_options_' + k;
                a.href = '#' + tab_id;
                a.textContent=label;
                if(k!=='setting'){
                    a.className='tb_tooltip';
                    tooltip.textContent = label;
                    a.appendChild(tooltip);
                }
                wrapper.id = tab_id;
                wrapper.className = 'tb_tab tb_options_tab_wrapper';
                if ((is_style && k === 'styling') || (is_visible && k === 'visibility') ||(!is_style && !is_visible &&  k === 'setting') || (this.component === null)) {
                    li.className = 'current';
                    self.clicked = k;
                    if (data[k].html !== undefined) {
                        wrapper.appendChild(data[k].html);
                    }
                    else {
                        wrapper.appendChild(createTab(k, data[k].options));
                    }

                    wrapper.style['display'] = 'block';
                    new SimpleBar(wrapper);
                    wrapper.dataset['done'] = true;
                }
                wrapper.addEventListener('themify_builder_tabsactive', function (e) {
                    var index = e.detail.id.replace('#tb_options_', '');
                    self.clicked = index;
                    if (this.dataset['done'] === undefined) {
                        this.dataset['done'] = true;
                        this.appendChild(createTab(index, data[index].options));
                        self.callbacks();
                        new SimpleBar(this);
                        if (index === 'setting') {
                            self.setUpEditors();
                        }
                        
                    }
                },{passive: true});
                a.addEventListener('click', this.switchTabs);
                container.appendChild(wrapper);
                li.appendChild(a);
                top_bar.appendChild(li);
            }
            var top = Common.Lightbox.$lightbox[0].getElementsByClassName('tb_options_tab')[0],
                action = Common.Lightbox.$lightbox[0].getElementsByClassName('tb_lightbox_actions_wrap')[0];

            while (top.firstChild) {
                top.removeChild(top.firstChild);
            }
            while (action.firstChild) {
                action.removeChild(action.firstChild);
            }
            top.appendChild(top_bar);
            if (save_opt !== undefined || model) {
                var save = document.createElement('button');
                save.className = 'builder_button builder_save_button';
                save.title = save_opt !== undefined && save_opt.ctr_save !== undefined ? this.label[save_opt.ctr_save] : this.label['ctr_save'];
                save.textContent = save_opt !== undefined && save_opt.done !== undefined ? this.label[save_opt.done] : this.label['done'];
                if (model) {
                    api.autoSaveCid = model.cid;
                    if (api.mode === 'visual') {
                        api.liveStylingInstance.init();
                        if (this.component !== 'subrow' && this.component !== 'column') {
                            rememberedEl = api.liveStylingInstance.$liveStyledElmt[0].outerHTML;
                        }
                    }
                    var _saveClicked = function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        if(self.saveComponent(false)){
                            save.removeEventListener('click', _saveClicked, {once: false});
                            topSave.removeEventListener('click', _saveClicked, {once: true});
                        }
                    };
                    
                    var topSave = document.createElement('a'),
                        li = document.createElement('li'),
                        span = document.createElement('span');
                    li.className='tb_top_save_btn';
                    topSave.className='ti-check tb_tooltip';
                    span.textContent = this.label['done'];
                    topSave.appendChild(span);
                    li.appendChild(topSave);
                    top.appendChild(li);
                    save.addEventListener('click', _saveClicked, {once: false});
                    topSave.addEventListener('click', _saveClicked, {once: true});
                }
                action.appendChild(save);
            }
            Themify.body.one('themify_builder_lightbox_close', function () {

                self.radioChange = self.bindings = self.stylesData = self.is_ajax = self.is_repeat = self.afterRun = self.editors = self.clicked = self.settings = self.styles = null;
                if (model) {
                    if (typeof _saveClicked === 'function') {
                        save.removeEventListener('click', _saveClicked, {once: true});

                    }
                    if (api.saving !== true && rememberedEl !== undefined && api.hasChanged) {

                        var m = api.Models.Registry.lookup(model.cid);
                        if (m) {
                            m.trigger('custom:restorehtml', rememberedEl);
                        }
                        m=null;
                    }
                    if (self.is_new) {
                        model.unset('is_new', {silent: true});
                        if (api.saving !== true) {
                            model.trigger('dom:module:unsaved');
                        }
                    }
                    else {
                        model.unset('styleClicked', {silent: true});
                        model.unset('visibileClicked', {silent: true});
                    }
                    if (tinyMCE !== undefined) {
                        for (var i = tinymce.editors.length - 1; i > -1; --i) {
                            if (tinymce.editors[i].id !== 'content') {
                                tinyMCE.execCommand('mceRemoveEditor', true, tinymce.editors[i].id);
                            }
                        }
                    }
                    if (api.mode === 'visual') {
                        api.liveStylingInstance.clear();
                    }
                    api.activeModel=model= null;
                }
                Themify.body.off('themify_builder_change_mode.updatestyles');
                rememberedEl = self.values = self.type = self.component = self.is_new = null;
                self.tabs.click = 0;

            }).on('themify_builder_change_mode.updatestyles', this.updateStyles.bind(this));

            setTimeout(function () {
                if (self.clicked === 'setting') {
                    self.setUpEditors();
                }
                self.callbacks();
                Themify.triggerEvent( document, 'tb_editing_' + self.type, [self] );
                /**
                 * self.type is the module slug, trigger a separate event for all modules regardless of their slug
                 */
                if ( self.type !== 'row' && self.type !== 'column' && self.type !== 'subrow' ) {
                    Themify.triggerEvent( document, 'tb_editing_module', [self] );
                }
            }, 5);
            if (is_style) {
                model.unset('styleClicked', {silent: true});
            }
            else if (is_visible) {
                model.unset('visibileClicked', {silent: true});
            }
            return container;
        },
        getStyleVal: function (id, breakpoint) {
            if (api.activeModel !== null) {
                if (breakpoint === undefined) {
                    breakpoint = api.activeBreakPoint;
                }
                if (this.clicked !== 'styling' || breakpoint === 'desktop') {
                    return this.values[id] !== '' ? this.values[id] : undefined;
                }
                var breakpoints = this.breakpointsReverse,
                        index = breakpoints.indexOf(breakpoint);
                for (var i = index, len = breakpoints.length; i < len; ++i) {
                    if (breakpoints[i] !== 'desktop') {
                        if (this.values['breakpoint_' + breakpoints[i]] !== undefined && this.values['breakpoint_' + breakpoints[i]][id] !== undefined && this.values['breakpoint_' + breakpoints[i]][id] !== '') {
                            return this.values['breakpoint_' + breakpoints[i]][id];
                        }
                    }
                    else if (this.values[id] !== '') {
                        return this.values[id];
                    }
                }
            }
            return undefined;
        },
        updateStyles: function (e, prevbreakpoint, breakpoint) {

            this.setStylingValues(prevbreakpoint);
            var old_tab = this.clicked;
            this.clicked = 'styling';
            for (var k in this.stylesData) {
                var type = this.stylesData[k].type;
                if (type !== 'video' && type !== 'gallery' && type !== 'custom_css' && type!=='builder' && this.stylesData[k].is_responsive !== false) {
                    if (type === 'icon_radio') {
                        type = 'radio';
                    }
                    else if (type === 'icon_checkbox') {
                        type = 'checkbox';
                    }
                    else if (type === 'textarea' || type === 'icon') {
                        type = 'text';
                    }
                    else if (type === 'image') {
                        type = 'file';
                    }
                    else if (type === 'padding' || type === 'border_radius') {
                        type = 'margin';
                    }
                    else if (type === 'frame') {
                        type = 'layout';
                    }
                    var v = this.getStyleVal(k);
                    this[type].update(k, v, this);
                    if (this.stylesData[k].binding !== undefined) {
                        var items = topWindow.document.getElementById(k),
                                res = [];
                        if (type === 'layout') {
                            res = items.getElementsByClassName('tfl-icon');
                        }
                        else if (type === 'radio' || type === 'checkbox') {
                            res = items.getElementsByTagName('input');
                        }
                        else {
                            res = [items];
                        }
                        var data = this.stylesData[k];
                        for (var i = 0, len = res.length; i < len; ++i) {
                            this.binding(res[i], data, v);
                        }
                        items = res = null;
                    }
                }
            }
            this.clicked = old_tab;
        },
        setStylingValues: function (breakpoint) {
            var data = api.Forms.serialize('tb_options_styling', true),
                isDesktop = breakpoint === 'desktop';
            if (!isDesktop && this.values['breakpoint_' + breakpoint] === undefined) {
                this.values['breakpoint_' + breakpoint] = {};
            }            
            for (var i in data) {
                if (isDesktop===true) {
                    this.values[i] = data[i];
                }
                else {
                    this.values['breakpoint_' + breakpoint][i] = data[i];
                }
            }
           
        },
        saveComponent: function (autoSave) {

            api.saving = true;
            var self = api.Forms,
                is_module = this.component === 'module';
            if ((is_module && !self.isValidate(topWindow.document.getElementById('tb_options_setting'))) || (Common.Lightbox.$lightbox[0].getElementsByClassName('tb_disable_save')[0]!==undefined)){
                api.beforeEvent = null;
                api.saving = false;
                return false;
            }

            Themify.body.triggerHandler('themify_builder_save_component');
            if (api.mode === 'visual') {
                // Trigger parent iframe
                topWindow.jQuery('body').trigger('themify_builder_save_component');
            }
            delete this.values['cid'];

            var column = false, //for the new modules of undo/redo
                before_settings = $.extend(true, {},(this.beforeData?this.beforeData:this.values)),
                k = 'styling',
                elem = document.getElementsByClassName('tb_element_cid_' + api.activeModel.cid)[0];
                if(elem===undefined){
                    elem = document.querySelector('[data-cid="'+api.activeModel.cid+'"]');
                }
                elem=$(elem);
            if (this.component!=='column') {
                if (this.component !== 'subrow') {
                    if (is_module) {
                        k = 'mod_settings';
                    }
                    var options = self.serialize('tb_options_setting', true);
                    for (var i in options) {
                        this.values[i] = options[i];
                    }
                    options = null;
                }
                var animation = self.serialize('tb_options_animation', true);
                for (var i in animation) {
                    this.values[i] = animation[i];
                }
                animation = null;
                var visible = self.serialize('tb_options_visibility', true);
                for (var i in visible) {
                    this.values[i] = visible[i];
                }
                if (api.mode === 'visual') {
                    if (visible['visibility_all'] === 'hide_all' || visible['visibility_desktop'] === 'hide' || visible['visibility_tablet'] === 'hide' || visible['visibility_tablet_landscape'] === 'hide' || visible['visibility_mobile'] === 'hide') {
                        elem[0].classList.add('tb_visibility_hidden');
                    }
                    else {
                        elem[0].classList.remove('tb_visibility_hidden');
                    }
                }
                visible = null;
            }
            this.setStylingValues(api.activeBreakPoint);
            var data = {};
            data[k] = $.extend(true, {}, api.Utils.clear(this.values));

            api.activeModel.set(data, {silent: true});
            if (is_module) {
                if (this.is_new) {
                    column = elem.closest('.module_column');
                    column.closest('.module_row').removeClass('tb_row_empty');
                    column.closest('.module_subrow').removeClass('tb_row_empty');
                    column = Common.clone(column);
                }
                api.Instances.Builder[api.builderIndex].removeLayoutButton();
            }
            var styles;
            if (api.mode === 'visual') {
                styles = $.extend(true, {}, api.liveStylingInstance.undoData);
                elem[0].classList.remove('tb_visual_hover');
                elem.find('.tb_visual_hover').removeClass('tb_visual_hover');
            }
            api.undoManager.push(api.activeModel.cid, api.beforeEvent, elem, 'save', {bsettings: before_settings, asettings: this.values, styles: styles, 'column': column});
            Common.Lightbox.close(autoSave);
            api.beforeEvent = null;
            api.saving = false;
            return true;
        },
        resetStyling: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if(!this.beforeData){
                this.beforeData =  $.extend(true, {}, this.values);
                var self = this;
                Themify.body.one('themify_builder_lightbox_before_close',function(){
                    self.beforeData = null;
                });
            }
            api.hasChanged = true;
            var context = $('#tb_options_styling', ThemifyBuilderCommon.Lightbox.$lightbox)[0],
                items = context.getElementsByClassName('tb_lb_option'),
                type = api.activeModel.get('elType');
                if(type==='module'){
                    type = api.activeModel.get('mod_name');
                }
                var settings = ThemifyStyles.getStyleOptions(type);
               
            if(api.mode==='visual'){
                var data = {},
                    undoData ={},
                    prefix = api.liveStylingInstance.prefix,
                    points = this.breakpointsReverse;
                for(var i=points.length-1;i>-1;--i){
                    var stylesheet =ThemifyStyles.getSheet(points[i]),
                        rules = stylesheet.cssRules ? stylesheet.cssRules : stylesheet.rules;
                    if(rules.length>0){
                        if( data[points[i]]===undefined){
                            data[points[i]] = {};
                            undoData[points[i]] = {};
                             
                        }
                        for(var j=rules.length-1;j>-1;--j){
                            if(rules[j].selectorText.indexOf(prefix)!==-1){
                                var css = rules[j].cssText.split('{')[1].split(';');
                                if(data[points[i]][j]===undefined){
                                    data[points[i]][j]={};
                                    undoData[points[i]][j]={};
                                }
                                
                                for(var k=css.length-2;k>-1;--k){
                                    var prop=css[k].trim().split(': ')[0].trim();
                                    if(rules[j].style[prop]!==undefined){
                                        var val=rules[j].style[prop];
                                            data[points[i]][j][prop]=val;
                                            undoData[points[i]][j][prop]={'a':'','b':val};
                                            rules[j].style[prop]='';
                                    }
                                }
                            }
                        }
                    }
                }
                if(api.activeModel.get('elType')!=='module'){
                    api.liveStylingInstance.removeBgSlider();
                    api.liveStylingInstance.removeBgVideo();
                    api.liveStylingInstance.getComponentBgOverlay().remove();
                    api.liveStylingInstance.bindBackgroundMode('repeat','background_repeat');
                    api.liveStylingInstance.bindBackgroundMode('repeat','b_r_h');
                    api.liveStylingInstance.$liveStyledElmt[0].removeAttribute('data-tb_slider_videos');
                    api.liveStylingInstance.$liveStyledElmt.children('.tb_slider_videos,.tb_row_frame').remove();
                }
            }
             for(var i in this.values){
                var key = i.indexOf('_color') !== -1 ? 'color' : (i.indexOf('_style') !== -1 ? 'style' : false),
                    remove=null;
                if(i.indexOf('breakpoint_')===0 || settings[i]!==undefined ||  i.indexOf('_apply_all') !== -1){
                        remove=true;
                }
                else if (i.indexOf('_unit') !== -1) {//unit
                    key = i.replace(/_unit$/ig, '', '');
                    if (settings[key] !== undefined) {
                        remove=true;
                    }
                }
                else if (i.indexOf('_w') !== -1) {//weight
                    key = i.replace(/_w$/ig, '', '');
                    if (settings[key] !== undefined && settings[key].type === 'font_select') {
                        remove=true;
                    }
                }
                else if (key !== false) {
                    key = i.replace('_' + key, '_width');
                    if (settings[key] !== undefined && settings[key].type === 'border') {
                        remove=true;
                    }
                }
                if(remove===true){
                        delete this.values[i];
                }
            }
            settings=null;
            for(var i=items.length-1;i>-1;--i){
                var v = items[i].value,
                    cl = items[i].classList;
                if (v !== 'px' && v !== 'solid' && v !== 'default' && v !== 'linear' && v !== 'n' && !cl.contains('exclude-from-reset-field')) {
                    var id = items[i].getAttribute('id');
                    if(this.values[id]!==undefined){
                        delete this.values[id];
                    }
                    if (cl.contains('tb_radio_input_container')) {
                        if (cl.contains('tb_icon_radio')) {
                            var checked = context.querySelector('[name="' + id + '"]:checked');
                            if (checked !== null) {
                                checked.parentNode.click();
                            }
                        }
                        else {
                            var r = context.querySelector('[name="' + id + '"]');
                            if (r.checked !== true) {
                                r.checked = true;
                                Themify.triggerEvent(r, 'change');
                            }
                        }
                    } 
                    else if (cl.contains('tb_uploader_input')) {
                        if (v) {
                            items[i].parentNode.getElementsByClassName('tb_delete_thumb')[0].click(e);
                        }
                    }
                    else if (cl.contains('minicolors-input')) {
                        var p = items[i].closest('.minicolors'),
                            clear = p.getElementsByClassName('tb_clear_btn')[0];
                        if (v) {
                            items[i].value='';
                            items[i].removeAttribute('data-opacity');
                          
                            var swatch=p.getElementsByClassName('minicolors-swatch-color')[0];
                            swatch.style['opacity']=swatch.style['backgroundColor']='';
                            p.nextElementSibling.value='';
                        }
                        if(clear!==undefined){
                            clear.style['display']='none';
                        }
                    }
                    else if (v && items[i].tagName === 'SELECT') {
                        if (cl.contains('font-family-select')) {
                            items[i].value = '';
                        }
                        else if (cl.contains('font-weight-select')) {
                            items[i].value = '';
                            while (items[i].firstChild) {
                                items[i].removeChild(items[i].firstChild);
                            }
                            this.font_select.updateFontVariant('', items[i], this);
                        }
                        else if (cl.contains('tb_unit')) {
                            items[i].value = cl.contains('tb_frame_unit') ? '%' : 'px';
                        } else {
                            if ((v === 'repeat' && id === 'background_repeat') || (v === 'scroll' && id === 'background_attachment') || (v === 'left top' && id === 'background_position')) {
                                continue;
                            }
                            items[i].selectedIndex = 0;
                        }
                        if (!cl.contains('themify-gradient-type')) {
                            Themify.triggerEvent(items[i], 'change');
                        }
                    }
                    else if (cl.contains('themify-layout-icon')) {
                        var f = items[i].getElementsByClassName('tfl-icon')[0];
                        if (!f.classList.contains('selected')) {
                            f.click();
                        }
                    }
                    else if(cl.contains('tb_row_js_wrapper')){
                        var repeat = items[i].getElementsByClassName('tb_repeatable_field');
                        for(var j=repeat.length-1;j>-1;--j){
                            repeat[j].parentNode.removeChild(repeat[j]);
                        }
                        items[i].getElementsByClassName('add_new')[0].click();
                    }
                    else {
                        if (!cl.contains('themify-gradient-angle')) {
                           
                            if (cl.contains('themify-gradient')) {
                                items[i].nextElementSibling.click();
                            }
                            else{ 
                                items[i].value = '';
                                var $el = $(items[i]);
                                if ($el.closest('.tb_gradient_container').is(':visible')) {
                                    $el.trigger(cl.contains('tb_range') ? 'keyup' : 'change');
                                }
                                
                            }
                        }   
                        else {
                            items[i].value = '180';
                        }
                    }
                }
            }
            if(api.mode==='visual'){
                api.liveStylingInstance.tempData = data; 
                api.liveStylingInstance.undoData = undoData;
            }
            
        },
        create: function (data) {
            var content = document.createDocumentFragment();
            if (data.type === 'tabs') {
                content.appendChild(this.tabs.render(data, this));
            }
            else {
                for (var i in data) {
                    if (data[i].hide === true) {
                        continue;
                    }
                    var type=data[i].type,
                        res = this[type].render(data[i], this);
                
                    if (type!== 'separator' && type!== 'expand' && type!== 'group') {
                        var id = data[i].id;
                        if (type!== 'tabs' && type!== 'multi') {
                            if (this.clicked === 'styling') {
                                if (api.mode === 'visual' && data[i].prop !== undefined) {
                                    this.styles[id] = $.extend(true, {}, data[i]);
                                }
                                this.stylesData[id] = $.extend(true, {}, data[i]);
                            }
                            else if (api.mode === 'visual' && this.clicked === 'setting' && this.values[id] !== undefined && this.is_repeat !== true) {
                                this.settings[id] = this.values[data[i].id];
                                if (data[i]['units'] !== undefined && this.values[id + '_unit'] !== undefined) {
                                    this.settings[id + '_unit'] = this.values[id + '_unit'];
                                }
                            }

                        }
                        if (type!== 'builder') {
                            var field = document.createElement('div');
                            field.className = 'tb_field';
                            if (id !== undefined) {
                                field.className += ' ' + id;
                            }
                            if (data[i].wrap_class !== undefined) {
                                field.className += ' ' + data[i].wrap_class;
                            }
                            if (type === 'custom_css') {
                                field.appendChild(this.separator.render(data[i], this));
                            }
                            else if(type==='toggle_switch'){
                                field.className+= ' switch-wrapper';
                            }
                            else if (type === 'slider') {
                                field.className += ' tb_slider_options';
                            }
                            else if (type=== 'message' && data[i].hideIf !== undefined && new Function('return ' + data[i].hideIf ) ) {
                                field.className += ' tb_hide_option';
                            }
                            else  if(data[i]['required']!==undefined && this.clicked === 'setting'){// validation rules
                                var rule = data[i].required['rule']!==undefined?data[i].required['rule']:'not_empty',
                                    msg = data[i].required['message']!==undefined?data[i].required['message']:themifyBuilder.i18n.not_empty;
                                field.setAttribute('data-validation',rule);
                                field.setAttribute('data-error-msg',msg);
                                field.className+=' tb_must_validate';
                            }
                            if (this.clicked === 'styling' && data[i].is_responsive === false) {
                                field.className += ' responsive_disable';
                            }
                            
                            var txt = this.getTitle(data[i]);
                            if (txt !== false) {
                                txt = txt.trim();
                                var label = document.createElement('div'),
                                    labelText = document.createElement('span');
                                    label.className = 'tb_label';
                                    labelText.className = 'tb_label_text';
                                    labelText.textContent = txt;
                                    label.appendChild(labelText);
                                if ( txt=== '' ) {
                                    label.className += ' tb_empty_label';
                                }
                                
                                if(data[i]['help']!==undefined && data[i]['label'] !== '' ){
                                    label.classList.add('contains-help');
                                    labelText.appendChild(this.help(data[i]['help']));
                                }
                                field.appendChild(label);
                                if (type !== 'multi') {
                                    var input = document.createElement('div');
                                    input.className = 'tb_input';
                                    input.appendChild(res);
                                    field.appendChild(input);
                                }
                                else {
                                    field.appendChild(res);
                                }
                            }
                            else {
                                field.appendChild(res);
                            }
                            content.appendChild(field);
                        }
                        else {
                            content.appendChild(res);
                        }
                    }
                    else {
                        content.appendChild(res);
                    }
                }
            }
            return content;
        },
        tabs: {
            click: 0,
            render: function (data, self) {
                var items = data.options,
                    f = document.createDocumentFragment(),
                    tabs_container = document.createDocumentFragment(),
                    ul = document.createElement('ul'),
                    isSticky =  self.clicked === 'styling' && this.click===0 && self.component === 'module',
                    stickyWraper=isSticky?document.createElement('div'):null,
                    tabs = document.createElement('div'),
                    first = null;
                tabs.className = 'tb_tabs';
                    ul.className = 'clearfix tb_tab_wrapper';
                ++this.click;
                for (var k in items) {
                    var li = document.createElement('li'),
                        a = document.createElement('a'),
                        div = document.createElement('div'),
                        id = 'tb_' + this.click + '_' + k;

                    div.id = id;
                    div.className = 'tb_tab';
                    a.href = '#' + id;
                    a.textContent = items[k].label !== undefined ? items[k].label : self.label[k];
                    if ( first === null) {
                        first = true;
                        li.className = 'current';
                        div.appendChild(self.create(items[k].options));
                        div.style.display = 'block';

                    }else {
                        (function () {
                            var index = k;
                            div.addEventListener('themify_builder_tabsactive', function _tab(e) {
                                this.appendChild(self.create(items[index].options));
                                if ( self.clicked === 'setting' ) {
                                    self.setUpEditors();
                                }
                                self.callbacks();
                                div.removeEventListener('themify_builder_tabsactive', _tab, { once: true,passive: true});
                                index = null;
                            }, {once: true, passive: true});
                        })();
                    }
                    a.addEventListener('click', self.switchTabs);
                    li.appendChild(a);
                    f.appendChild(li);
                    tabs_container.appendChild(div);
                }
                
                ul.appendChild(f);
                if(stickyWraper!==null){
                    stickyWraper.className='tb_styling_tab_nav';
                    stickyWraper.appendChild(ul);
                    tabs.appendChild(stickyWraper);
                }
                else{
                    tabs.appendChild(ul);
                }
                tabs.appendChild(tabs_container);
                setTimeout(self.callbacks.bind(self), 5);
                return tabs;
            }
        },
        group: {
            render: function (data, self) {
                var wr = document.createElement('div');
                if (data.wrap_class !== undefined) {
                    wr.className += ' ' + data.wrap_class;
                }
                wr.appendChild(self.create(data.options));
                return wr;
            }
        },
        builder: {
            render: function (data, self) {
                self.is_repeat = true;
                var d = document.createDocumentFragment(),
                        wrapper = document.createElement('div'),
                        add_new = document.createElement('a'),
                        _this = this;
                wrapper.className = 'tb_row_js_wrapper tb_lb_option';
                if (data.wrap_class !== undefined) {
                    wrapper.className += ' ' + data.wrap_class;
                }
                wrapper.id = data.id;
                add_new.className = 'add_new tb_icon add';
                add_new.href = '#';
                add_new.textContent = data.new_row !== undefined ? data.new_row : self.label.new_row;
                if (self.values[data.id] !== undefined) {
                    var values = self.values[data.id].slice(),
                            f = document.createDocumentFragment(),
                            orig = $.extend(true, {}, self.values);

                    for (var i = 0, len = values.length; i < len; ++i) {
                        self.values = values[i];
                        f.appendChild(this.builderFields(data, self));
                    }
                    wrapper.appendChild(f);
                    self.values = orig;
                    orig = values = f = null;
                }
                else {
                    wrapper.appendChild(this.builderFields(data, self));
                }
                wrapper.appendChild(add_new);
                d.appendChild(wrapper);
                self.afterRun.push(function () {
                    _this.sortable(wrapper, self);
                    add_new.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.is_repeat = true;
                        add_new.parentNode.insertBefore(_this.builderFields(data, self), add_new);
                        setTimeout(function () {
                            if (self.clicked === 'setting') {
                                self.setUpEditors();
                            }
                            self.callbacks();
                        }, 5);
                        self.control.preview(wrapper, null, {repeat: true});
                        self.is_repeat = null;
                    });
                });
                self.is_repeat = null;
                return d;
            },
            builderFields: function (data, self) {
                var d = document.createDocumentFragment(),
                        repeat = document.createElement('div'),
                        top = document.createElement('div'),
                        menu = document.createElement('div'),
                        icon = document.createElement('div'),
                        ul = document.createElement('ul'),
                        _duplicate = document.createElement('li'),
                        _delete = document.createElement('li'),
                        toggle = document.createElement('div'),
                        content = document.createElement('div'),
                        _this = this;



                repeat.className = 'tb_repeatable_field clearfix';

                top.className = 'tb_repeatable_field_top';
                menu.className = 'row_menu';
                icon.tabIndex='-1';
                icon.className = 'menu_icon';
                ul.className = 'tb_down';
                _duplicate.className = 'tb_duplicate_row';
                _delete.className = 'tb_delete_row';
                _duplicate.textContent = self.label.duplicate;
                _delete.textContent = self.label.delete;
                toggle.className = 'toggle_row';
                content.className = 'tb_repeatable_field_content';
                

                d.appendChild(self.create(data.options));
                content.appendChild(d);
                ul.appendChild(_duplicate);
                ul.appendChild(_delete);
                menu.appendChild(icon);
                menu.appendChild(ul);
                top.appendChild(menu);
                top.appendChild(toggle);
                repeat.appendChild(top);
                repeat.appendChild(content);
                setTimeout(function(){
                    top.addEventListener('click',function(e){
                        e.stopPropagation();
                        e.preventDefault();
                        var cl =  e.target.classList;
                        if(cl.contains('tb_delete_row')){
                            if (confirm(themifyBuilder.i18n.rowDeleteConfirm)) {
                                var  p = e.target.closest('.tb_row_js_wrapper');
                                _this.delete(e.target);
                                self.control.preview(p, null, {repeat: true});
                                Themify.triggerEvent(p, 'delete');
                            }
                        }
                        else if(cl.contains('tb_duplicate_row')){
                            self.is_repeat = true;
                            var orig = $.extend(true, {}, self.values);
                            self.values = api.Forms.serialize(repeat, true, true);
                            repeat.parentNode.insertBefore(_this.builderFields(data, self), repeat.nextElementSibling);
                            self.values = orig;
                            orig = null;
                            setTimeout(function () {
                                if (self.clicked === 'setting') {
                                    self.setUpEditors();
                                }
                                self.callbacks();
                                Themify.triggerEvent(repeat.parentNode, 'duplicate');
                            }, 5);
                            self.control.preview(repeat, null, {repeat: true});
                            self.is_repeat = null;
                        }
                        else if(cl.contains('toggle_row')){
                            _this.toggle(e.target);
                        }
                        if(!cl.contains('menu_icon')){
                            api.Utils.hideOnClick(ul);
                        }
                    });
                }.bind(this),1500);
               
                return repeat;
            },
            sortable: function (el, self) {
                var $el = $(el),
                        toggleCollapse = false,
                        editors = {};
                // sortable accordion builder
                $el.sortable({
                    items: '.tb_repeatable_field',
                    handle: '.tb_repeatable_field_top',
                    axis: 'y',
                    tolerance: 'pointer',
                    cursor: 'move',
                    cancel:'.row_menu',
                    start: _.debounce(function (e, ui) {
                        if (tinyMCE !== undefined) {
                            var items = el.getElementsByClassName('tb_lb_wp_editor');
                            for (var i = items.length - 1; i > -1; --i) {
                                var id = items[i].id;
                                editors[id] = tinymce.get(id).getContent();
                                tinyMCE.execCommand('mceRemoveEditor', false, id);
                            }
                            items = null;
                        }
                    }, 300),
                    stop: _.debounce(function (e, ui) {
                        if (tinyMCE !== undefined) {
                            for (var id in editors) {
                                tinyMCE.execCommand('mceAddEditor', false, id);
                                tinymce.get(id).setContent(editors[id]);
                            }
                            editors = {};
                        }

                        if (toggleCollapse) {
                            ui.item.removeClass('collapsed').find('.tb_repeatable_field_content').show();
                            toggleCollapse = false;
                        }
                        $el.find('.tb_state_highlight').remove();
                        self.control.preview(el, null, {repeat: true});
                        Themify.triggerEvent(el, 'sortable');
                    }, 300),
                    beforeStart: function (event, el, ui) {
                        api.Utils.hideOnClick(ui.item[0].getElementsByClassName('tb_down')[0]);
                        $el.find('.tb_state_highlight').height(30);
                        if (!ui.item[0].classList.contains('collapsed')) {
                            ui.item.addClass('collapsed').find('.tb_repeatable_field_content').hide();
                            toggleCollapse = true;
                            $el.sortable('refresh');
                        }
                    }
                });
            },
            toggle: function (el) {
                $(el).closest('.tb_repeatable_field').toggleClass('collapsed').find('.tb_repeatable_field_content').slideToggle();
            },
            delete: function (el) {
                $(el).closest('.tb_repeatable_field').remove();
            }
        },
        sortable_fields:{
            getDefaults:function(type,self){
                var in_all_types = [
                        {   'id' : 'icon',
                            'type' : 'icon',
                            'label' :self.label['icon']
                        },
                        {
                            'id' : 'before',
                            'type' : 'text',
                            'label' : self.label['b_t']
                        },
                        {
                            'id' : 'after',
                            'type' : 'text',
                            'label' : self.label['a_t']
                        }
                ],
                _defaults = {
                    date:[
                        {
                          'id' : 'format',
                          'type' : 'select',
                          'label' :self.label['d_f'],
                          'options' : {
                              'F j, Y' : self.label['F_j_Y'],
                              'Y-m-d' :self.label['Y_m_d'],
                              'm/d/Y' : self.label['m_d_Y'],
                              'd/m/Y' : self.label['d_m_Y'],
                              'def' : self.label['def'],
                              'custom' : self.label['cus']
                          },
                          'binding' : {
                              'not_empty':{'hide':['custom']},
                              'custom':{'show':['custom']}
                          }
                        },
                        {
                            'id' : 'custom',
                            'type' : 'text',
                            'label' : self.label['cus_f'],
                            'help' :self.label['cus_fd_h']
                        }
                    ],
                    time:[
                        {
                            'id' : 'format',
                            'type' : 'select',
                            'label' : self.label['t_f'],
                            'options' : {
                                'g:i a' :self.label['g_i_a'],
                                'g:i A' :self.label['g_i_A'],
                                'H:i' :self.label['H_i'],
                                'def' : self.label['def'],
                                'custom' : self.label['cus']
                            },
                            'binding' :{
                                'not_empty':{'hide':['custom']},
                                'custom':{'show':['custom']}
                            }
                        },
                        {
                            'id' : 'custom',
                            'type' : 'text',
                            'label' : self.label['cus_f'],
                            'help' :self.label['cus_ft_h']
                        }
                    ],
                    author:[
                        { 
                            'id' : 'l',
                            'type' : 'toggle_switch',
                            'label' : self.label['l']
                        },
                        {
                            'id' : 'a_p',
                            'type' : 'toggle_switch',
                            'label' : self.label['a_p'],
                            'binding' :{
                                'checked':{'hide':['picture_size']},
                                'not_checked':{'show':['picture_size']}
                            }
                        },
                        {
                            'id' : 'p_s',
                            'type' : 'range',
                            'label' : self.label['p_s'],
                            'class' : 'xsmall',
                            'units' : {
                                'px' :{
                                    'min' : 0,
                                    'max' : 96
                                }
                            }
                        }
                    ],
                    comments:[
                        {
                            'id' : 'l',
                            'type' : 'toggle_switch',
                            'label' : self.label['l']
                        },
                        {
                            'id' : 'no',
                            'type' : 'text',
                            'label' : self.label['no_c']
                        },
                        {
                            'id' : 'one',
                            'type' : 'text',
                            'label' : self.label['one_c']
                        },
                        {
                            'id' : 'comments',
                            'type' : 'text',
                            'label' : self.label['comments']
                        }
                    ],
                    terms:[
                        {
                            'id' : 'post_type',
                            'type' : 'query_posts',
                            'tax_id':'taxonomy'
                        },
                        {
                            'id' : 'l',
                            'type' : 'toggle_switch',
                            'label' : self.label['l']
                        }
                    ]
                };
                if(_defaults[type]!==undefined){
                    for(var i=0,len=in_all_types.length;i<len;++i){
                        _defaults[type].push(in_all_types[i]);
                    }
                }
                return _defaults[type];
            },
            create:function(self,data,type,id,isRemovable){
                var li =document.createElement('li'),
                    opt = data['options'][type],
                    pid = data['id'];
                li.textContent = opt['label'];
                li.setAttribute('data-type',type);
                if(isRemovable===true){
                    var remove = document.createElement('span'),
                        input = document.createElement('input');
                    input.type='hidden';
                    if(!id){
                        var wrap = Common.Lightbox.$lightbox[0].getElementsByClassName(pid)[0],
                            i=1;
                        while(true){
                            id = type+'_'+i;
                            if((self.values[pid]===undefined || this.find(self.values[pid],id)===false) && (wrap===undefined || wrap.querySelector('#'+id)===null)){
                                break;
                            }
                            ++i;
                        }
                    }
                    input.id = id;
                    var index = this.find(self.values[pid],id);
                    if(index!==false && self.values[pid][index]['val']!==undefined){
                        input.value=JSON.stringify(self.values[pid][index]['val']);
                    }
                    remove.className='tb_sort_fields_remove';
                    remove.title=self.label['delete'];
                    li.appendChild(input);
                    li.appendChild(remove);
                }
                return li;
            },
            sort:function(el,self){
                var $el = $(el);
                $el.sortable({
                    items: '>li',
                    appendTo: topWindow.document.body,
                    scroll: false,
                    containment:'parent',
                    placeholder: 'tb_state_highlight',
                    cursor: 'move',
                    tolerance: 'pointer',
                    zIndex: 9999,
                    cancel:'.tb_sort_fields_remove,.tb_sort_field_lightbox',
                    stop: _.debounce(function (e, ui) {
                        $el.find('.tb_state_highlight').remove();
                        self.control.preview($el[0], null, {repeat: true});
                        Themify.triggerEvent($el[0], 'sortable');
                    }, 300),
                    start:function(e, ui){
                        var w = Math.floor(ui.item.width()+1);
                        ui.item.width(w);
                        $el.find('.tb_state_highlight').width(w);
                        $el.sortable('refreshPositions');
                    },
                    beforeStart: function (e, el, ui) {
                        ui.item[0].classList.remove('current');
                        $el.sortable('refresh');
                    }
                });
            },
            find:function(values,id){
                for(var i=values.length-1;i>-1;--i){
                    if(values[i].id===id){
                        return i;
                    }
                }
                return false;
            },
            edit:function(data,self,el){
                var type = el.dataset['type'],
                    wrap=el.getElementsByClassName('tb_sort_field_lightbox')[0];
                if(wrap===undefined){
                    wrap=document.createElement('div');
                    wrap.className='tb_sort_field_lightbox tb_sort_field_lightbox_'+type;
                    var options = data['options'][type]['options'],
                        pid=data.id,
                        id=el.getElementsByTagName('input')[0].id,
                        orig=null;
                    if(options===undefined){
                        options = this.getDefaults(type,self);
                    }
                    self.is_repeat = self.is_sort =true;
                    if(self.values[pid]!==undefined){
                        var key= this.find(self.values[pid],id);
                        if(key!==false && self.values[pid][key]['val']!==undefined){
                            orig = $.extend(true, {}, self.values);
                            self.values = self.values[pid][key]['val'];
                        }
                    }
                    wrap.appendChild(self.create(options));
                    el.appendChild(wrap);
                    self.callbacks();
                    if(orig!==null){
                        self.values = orig;
                    }
                    self.is_sort =self.is_repeat=orig = null;
                }
                
                if(!el.classList.contains('current')){
                    el.classList.add('current');
                    var _close = function(e){
                        if(e.which===1){
                            if(e.target===el || el.contains(e.target) || (Themify_Icons.target && el.contains(Themify_Icons.target[0]) && this.getElementById('themify_lightbox_fa').style['display']==='block')){
                                el.classList.add('current');
                            }
                            else{
                                el.classList.remove('current');
                                topWindow.document.removeEventListener('mousedown',_close,{passive:true});
                                el=null;
                            }
                        }
                    };
                    topWindow.document.removeEventListener('mousedown',_close,{passive:true});
                    topWindow.document.addEventListener('mousedown',_close,{passive:true});
                }
            },
            remove:function(data,self,el){
                if(confirm(self.label['rmeta'])){
                    el=el.closest('li');
                    var p = el.parentNode;
                    if(self.values[data.id]!==undefined){
                        var key= this.find(self.values[data.id],el.getElementsByTagName('input')[0].id);
                        if(key!==false){
                            self.values[data.id].splice(key, 1);
                        }
                    }
                    el.parentNode.removeChild(el);
                    self.control.preview(p, null, {repeat: true});
                    Themify.triggerEvent(p, 'delete');
                }
            },
            add:function(data,self,type){
                return this.create(self,data,type,null,true);
            },
            render:function(data,self){
                var _this = this,
                    f = document.createDocumentFragment(),
                    f2 = document.createDocumentFragment(),
                    wrapper = document.createElement('div'),
                    plus = document.createElement('div'),
                    plusWrap=document.createElement('div'),
                    ul = document.createElement('ul'),
                    items = document.createElement('ul'),
                    values = self.values[data.id];
                    wrapper.className='tb_sort_fields_wrap';
                    items.className='tb_sort_fields_parent';
                    if (self.is_repeat === true) {
                        items.dataset['inputId'] = data.id;
                        items.className += ' tb_lb_option_child';
                    }
                    else {
                        items.id = data.id;
                        items.className += ' tb_lb_option';
                    }
                    
                    ul.className='tb_ui_dropdown_items';
                    plus.className='tb_ui_dropdown_label tb_sort_fields_plus';
                    plus.tabIndex='-1';
                    plusWrap.className='tb_sort_fields_plus_wrap';
                    for(var i in data['options']){
                        f.appendChild(this.create(self,data,i));
                    }
                    for(var i=0,len=values.length;i<len;++i){
                        if(self.is_new!==true || values[i].show===true){
                            f2.appendChild(this.create(self,data,values[i].type,values[i].id,true));
                        }
                    }
                    items.appendChild(f2);
                    ul.appendChild(f);
                    plusWrap.appendChild(plus);
                    plusWrap.appendChild(ul);
                    wrapper.appendChild(items);
                    wrapper.appendChild(plusWrap);
                    items.addEventListener('click',function(e){
                        if(e.target.classList.contains('tb_sort_fields_remove')){
                            e.preventDefault();
                            e.stopPropagation();
                            _this.remove(data,self,e.target);
                        }
                        else if(e.target.tagName==='LI'){
                            e.preventDefault();
                            e.stopPropagation();
                            _this.edit(data,self,e.target);
                        }
                    });
                    ul.addEventListener('click',function(e){
                        if(e.target.tagName==='LI'){
                            e.preventDefault();
                            e.stopPropagation();
                            api.Utils.hideOnClick(ul);
                            items.appendChild(_this.add(data,self,e.target.dataset['type']));
                            $(items).sortable('refresh');
                        }
                    });
                    self.afterRun.push(function(){
                        _this.sort(items,self);
                    });
                    return wrapper;
            }
        },
        multi: {
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                    wrapper = document.createElement('div');
                wrapper.className = 'tb_multi_fields tb_fields_count_' + data.options.length;
                d.appendChild(self.create(data.options));
                wrapper.appendChild(d);
                return wrapper;
            }
        },
        color: {
            is_typing: null,
            controlChange: function (el, btn_opacity, data) {
                var that = this,
                        $el = $(el),
                        id = data.id;
                //clear
                var clear = document.createElement('div');
                clear.className = 'tb_clear_btn';
                clear.addEventListener('click', function () {
                    clear.style['display'] = 'none';
                    el.value = '';
                    $el.trigger('keyup');
                },{passive: true});
                $el.minicolors({
                    opacity: 1,
                    changeDelay: 10,
                    beforeShow: function () {
                        var lightbox = Common.Lightbox.$lightbox,
                            p = $el.closest('.minicolors'),
                            panel = p.find('.minicolors-panel');
                        panel.css('visibility', 'hidden').show();//get offset
                        if ((lightbox.offset().left + lightbox.width()) <= panel.offset().left + panel.width()) {
                            p[0].classList.add('tb_minicolors_right');
                        }
                        else {
                            p[0].classList.remove('tb_minicolors_right');
                        }
                        panel.css('visibility', '').hide();
                        api.hasChanged = true;
                    },
                    hide: function () {
                        clear.style['display'] = el.value !== '' ? 'block' : 'none';
                    },
                    change: function (hex, opacity) {
                        if (!hex) {
                            opacity = '';
                        }
                        else if (opacity) {
                            if ('0.99' == opacity) {
                                opacity = 1;
                            }
                            else if (0 >= parseFloat(opacity)) {
                                opacity = 0;
                            }
                        }
                        if (!that.is_typing && opacity !== document.activeElement) {
                            btn_opacity.value = opacity;
                        }
                        if (hex && 0 >= parseFloat($(this).minicolors('opacity'))) {
                            $(this).minicolors('opacity', 0);
                        }

                        if (api.mode === 'visual') {
                            Themify.triggerEvent(this, 'themify_builder_color_picker_change', {id: id, val: (hex ? $(this).minicolors('rgbaString') : '')});
                        }
                    }
                }).minicolors('show');
                //opacity
                var callback = function (e) {
                    var opacity = parseFloat(this.value.trim());
                    if (opacity > 1 || isNaN(opacity) || opacity === '' || opacity < 0) {
                        opacity = !el.value ? '' : 1;
                        if (e.type === 'blur') {
                            this.value = opacity;
                        }
                    }
                    that.is_typing = 'keyup' === e.type;
                    $el.minicolors('opacity', opacity);
                };
                btn_opacity.addEventListener('blur', callback,{passive: true});
                btn_opacity.addEventListener('keyup', callback,{passive: true});
                el.parentNode.appendChild(clear);
                el.setAttribute('data-minicolors-initialized', true);
            },
            setColor: function (input, swatch, opacityItem, val) {
                var color = val,
                        opacity = '';
                if (val !== '') {
                    if (val.indexOf('_') !== -1) {
                        color = api.Utils.toRGBA(val);
                        val = val.split('_');
                        opacity = val[1];
                        if (!opacity) {
                            opacity = 1;
                        } else if (0 >= parseFloat(opacity)) {
                            opacity = 0;
                        }
                        color = val[0];
                    }
                    else {
                        color = val;
                        opacity = 1;
                    }
                    if (color.indexOf('#') === -1) {
                        color = '#' + color;
                    }
                }
                input.value = color;
                input.setAttribute('data-opacity', opacity);
                swatch.style['background'] = color;
                swatch.style['opacity'] = opacity;
                opacityItem.value = opacity;
            },
            update: function (id, v, self) {
                var input = topWindow.document.getElementById(id);
                if (input !== null) {
                    var p = input.parentNode;
                    if (v === undefined) {
                        v = '';
                    }
                    this.setColor(input, p.getElementsByClassName('minicolors-swatch-color')[0], p.nextElementSibling, v);
                }
            },
            render: function (data, self) {
                var f = document.createDocumentFragment(),
                        wrapper = document.createElement('div'),
                        minicolors = document.createElement('div'),
                        input = document.createElement('input'),
                        opacity = document.createElement('input'),
                        swatch = document.createElement('span'),
                        span = document.createElement('span'),
                        v = self.getStyleVal(data.id),
                        that = this;

                wrapper.className = 'minicolors_wrapper';
                minicolors.className = 'minicolors minicolors-theme-default';

                input.type = 'text';
                input.className = 'minicolors-input';
                if (data['class'] !== undefined) {
                    input.className += ' ' + data.class;
                }
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.id = data.id;
                    input.className += ' tb_lb_option';
                }
                swatch.className = 'minicolors-swatch';
                span.className = 'minicolors-swatch-color';

                opacity.type = 'text';
                opacity.className = 'color_opacity';
                swatch.appendChild(span);
                minicolors.appendChild(input);
                minicolors.appendChild(swatch);
                wrapper.appendChild(minicolors);
                wrapper.appendChild(opacity);

                self.initControl(input, data);
                swatch.addEventListener('click', function _click() {
                    wrapper.insertAdjacentElement('afterbegin', input);
                    minicolors.parentNode.removeChild(minicolors);
                    that.controlChange(input, opacity, data);
                    swatch.removeEventListener('click', _click, {once: true,passive: true});
                }, {once: true,passive: true});
                input.addEventListener('focusin', function _focusin() {
                    swatch.click();
                    input.removeEventListener('focusin', _focusin, {once: true,passive: true});
                }, {once: true,passive: true});
                opacity.addEventListener('focusin', function() {
                    if(!input.dataset['minicolorsInitialized']){
                        input.dataset['opacity'] = this.value;
                        swatch.click();
                    }
                    else{
                        input.focus();
                    }
                }, {passive: true});

                if (v !== undefined) {
                    this.setColor(input, span, opacity, v);
                }
                f.appendChild(wrapper);
                if (data['after'] !== undefined) {
                    f.appendChild(self.after(data));
                }
                if (data['description'] !== undefined) {
                    f.appendChild(self.description(data.description));
                }
                if (data['tooltip'] !== undefined) {
                    f.appendChild(self.tooltip(data.tooltip));
                }
                return f;
            }
        },
        text: {
            update: function (id, v, self) {
                var item = topWindow.document.getElementById(id);
                if (item !== null) {
                    item.value = v !== undefined ? v : '';
                }
            },
            render: function (data, self) {
                var f = document.createDocumentFragment(),
                    input = document.createElement('input'),
                    v = self.getStyleVal(data.id);
                    input.type = 'text';
                if (self.is_repeat === true) {
                    input.className = 'tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className = 'tb_lb_option';
                    input.id = data.id;
                }
                if (data['placeholder'] !== undefined) {
                    input.placeholder = data['placeholder'];
                }
                if (v !== undefined) {
                    input.value = v;
                }
                if (data['class'] !== undefined) {
                    input.className += ' ' + data.class;
                }
                f.appendChild(self.initControl(input, data));
                if (data['unit'] !== undefined) {
                    f.appendChild(self.select.render(data.unit, self));
                }
                if (data['after'] !== undefined) {
                    f.appendChild(self.after(data));
                }
                if (data['description'] !== undefined) {
                    f.appendChild(self.description(data.description));
                }
                if (data['tooltip'] !== undefined) {
                    f.appendChild(self.tooltip(data.tooltip));
                }
                return f;
            }
        },
        file: {
            _frames: {},
            clicked:null,
            browse: function (uploader, input,  self, type) {
                var _this = this;
                uploader.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var file_frame,
                            title = self.label.upload_image,
                            text = self.label.insert_image;
                    if (_this._frames[type] !== undefined) {
                        file_frame = _this._frames[type];
                    }
                    else {
                        file_frame = wp.media.frames.file_frame = wp.media({
                            title: title,
                            library: {
                                type: type
                            },
                            button: {
                                text: text
                            },
                            multiple: false
                        });
                        _this._frames[type] = file_frame;
                    }
                    file_frame.off('select').on('select', function () {
                        api.ActionBar.disable=true;
                        var attachment = file_frame.state().get('selection').first().toJSON();
                        input.value = attachment.url;
                        Themify.triggerEvent(input, 'change');
                        api.hasChanged = true;
                        $(input).trigger('change');
                        var attach_id = Common.Lightbox.$lightbox.find('#'+input.id+'_id')[0];
                        if(attach_id!==undefined){
                            attach_id.value=attachment.id;
                        }
                    });
                    file_frame.on('close',function() {
                        api.ActionBar.disable=true;
                        setTimeout(function(){
                            api.ActionBar.disable=null;
                        },5);
                    });
                    // Finally, open the modal
                    file_frame.open();
                });
                if (type === 'image') {
                    input.addEventListener('change', function (e) {
                        api.hasChanged = true;
                        _this.setImage(uploader,this.value.trim());
                    },{passive:true});
                }
            },
            setImage: function (prev, url) {
                while (prev.firstChild) {
                    prev.removeChild(prev.firstChild);
                }
                if (url) {
                    var img = document.createElement('img');
                    img.width =40;
                    img.height = 40;
                    img.src = url;
                    prev.appendChild(img);
                }
            },
            update: function (id, v, self) {
                var item = topWindow.document.getElementById(id);
                if (item !== null) {
                    if (v === undefined) {
                        v = '';
                    }
                    item.value = v;
                    this.setImage(item.parentNode.getElementsByClassName('thumb_preview')[0], v);
                }
            },
            render: function (type, data, self) {
                var wr = document.createElement('div'),
                    input = document.createElement('input'),
                    upload_btn = document.createElement('a'),
                    btn_delete = document.createElement('span'),
                    reg = /.*\S.*/,
                    v = self.getStyleVal(data.id),
                    id;
                input.type = 'text';
                input.className = 'tb_uploader_input';
                input.required=true;
                input.setAttribute('pattern', reg.source);
                input.setAttribute('autocomplete', 'off');
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    id = Math.random().toString(36).substr(2, 7);
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className += ' tb_lb_option';
                    id = data.id;
                }
                input.id = id;

                if (v !== undefined) {
                    input.value = v;
                }
                btn_delete.className = 'tb_clear_input';
                 
                upload_btn.className = 'tb_media_uploader tb_upload_btn thumb_preview tb_plus_btn';
                upload_btn.href = '#';
                upload_btn.dataset['libraryType'] = type;
                upload_btn.title = self.label.browse_image;
                wr.className='tb_uploader_wrapper';
                
                wr.appendChild(self.initControl(input, data));
                wr.appendChild(btn_delete);
                wr.appendChild(upload_btn);
                if (type === 'image') {
                    this.setImage(upload_btn, v);
                }
                this.browse(upload_btn, input,self, type);
                if (data['after'] !== undefined) {
                    wr.appendChild(self.after(data));
                }
                if (data['description'] !== undefined) {
                    wr.appendChild(self.description(data.description));
                }
                if (data['tooltip'] !== undefined) {
                    wr.appendChild(self.tooltip(data.tooltip));
                }
                if (this.clicked===null && self.is_new === true && self.clicked === 'setting' && (self.type === 'image' || self.type === 'pro-image')) {
                    this.clicked = true;
                    var _this = this;
                    self.afterRun.push(function () {
                        upload_btn.click();
                        _this.clicked=null;
                    });
                }
                return wr;
            }
        },
        image: {
            render: function (data, self) {
                return self.file.render('image', data, self);
            }
        },
        video: {
            render: function (data, self) {
                return self.file.render('video', data, self);
            }
        },
        audio: {
            render: function (data, self) {
                return self.file.render('audio', data, self);
            }
        },
        icon_radio: {
            controlChange: function (wrap) {
                wrap.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (e.target !== wrap) {
                        var input = e.target.closest('label').getElementsByTagName('input')[0];
                        if (input.checked === true) {
                            input.checked = false;
                            input.value = undefined;
                        }
                        else {
                            input.checked = true;
                            input.value = input.getAttribute('data-value');
                        }
                        api.hasChanged = true;
                        Themify.triggerEvent(input, 'change');
                    }
                });
            },
            render: function (data, self) {
                return self.radioGenerate('icon_radio', data);
            }
        },
        radio: {
            controlChange: function (item) {
                var context;
                if (item.classList.contains('tb_radio_dnd')) {
                    context = item.closest('.tb_repeatable_field_content');
                }
                else {
                    context = item.closest('.tb_tab');
                    if (context === null) {
                        context = item.closest('.tb_expanded_opttions');
                        if (context === null) {
                            context = Common.Lightbox.$lightbox[0];
                        }
                    }
                }
                var elements = item.parentNode.parentNode.getElementsByTagName('input'),
                        selected = item.value;
                for (var i = elements.length - 1; i > -1; --i) {
                    var v = elements[i].value;
                    if (selected !== v) {
                        var groups = context.getElementsByClassName('tb_group_element_' + v);
                        for (var j = groups.length - 1; j > -1; --j) {
                            groups[j].style['display'] = 'none';
                        }
                    }
                }
                groups = context.getElementsByClassName('tb_group_element_' + selected);
                for (var j = groups.length - 1; j > -1; --j) {
                    groups[j].style['display'] = 'block';
                }
                elements = groups = null;
            },
            update: function (id, v, self) {
                var wrap = topWindow.document.getElementById(id);
                if (wrap !== null) {
                    var items = wrap.getElementsByTagName('input'),
                            is_icon = wrap.classList.contains('tb_icon_radio'),
                            found = null;
                    for (var i = items.length - 1; i > -1; --i) {
                        if (items[i].value === v) {
                            found = items[i];
                            break;
                        }
                    }
                    if (found === null) {
                        var def = wrap.dataset['default'];
                        if (def !== undefined) {
                            found = wrap.querySelector('[value="' + def + '"]');
                        }
                        if (is_icon === false && found === null) {
                            found = items[0];
                        }
                    }

                    if (found !== null) {
                        found.checked = true;
                        items = null;
                        if (is_icon === false && wrap.classList.contains('tb_option_radio_enable')) {
                            this.controlChange(found);
                        }
                    }
                    else if (is_icon === true) {
                        for (var i = items.length - 1; i > -1; --i) {
                            items[i].checked = false;
                        }
                    }
                }
            },
            render: function (data, self) {
                return self.radioGenerate('radio', data);
            }
        },
        icon_checkbox: {
            render: function (data, self) {
                return self.checkboxGenerate('icon_checkbox', data);
            }
        },
        checkbox: {
            update: function (id, v, self) {
                var wrap = topWindow.document.getElementById(id);
                if (wrap !== null) {
                    var items = wrap.getElementsByTagName('input'),
                            js_wrap = wrap.classList.contains('tb_option_checkbox_enable');
                    wrap = null;
                    v = v ? v.split('|') : [];
                    for (var i = items.length - 1; i > -1; --i) {
                        items[i].checked = v.indexOf(items[i].value) !== -1;
                        if (js_wrap === true) {
                            this.controlChange(items[i]);
                        }
                    }
                    items = null;
                }
            },
            controlChange: function (item) {
                var el = item.classList.contains('tb_radio_dnd') ? item.closest('.tb_repeatable_field_content') : Common.Lightbox.$lightbox[0],
                        parent = item.parentNode.parentNode,
                        items = parent.getElementsByTagName('input'),
                        is_revert = parent.classList.contains('tb_option_checkbox_revert');

                parent = null;
                for (var i = items.length - 1; i > -1; --i) {
                    var ch = el.getElementsByClassName('tb-checkbox_element_' + items[i].value),
                            is_checked = items[i].checked;
                    for (var j = ch.length - 1; j > -1; --j) {
                        if ((is_revert === true && is_checked === false) || (is_revert === false && is_checked === true)) {
                            ch[j].classList.remove('_tb_hide_binding');
                        }
                        else {
                            ch[j].classList.add('_tb_hide_binding');
                        }
                    }
                }
            },
            render: function (data, self) {
                return self.checkboxGenerate('checkbox', data);
            }
        },
        radioGenerate: function (type, data) {
            var f = document.createDocumentFragment(),
                d = document.createDocumentFragment(),
                wrapper = document.createElement('div'),
                is_icon = 'icon_radio' === type,
                options = this.getOptions(data),
                _default = data['default'] !== undefined ? data.default : false,
                v = this.getStyleVal(data.id),
                js_wrap = data.option_js === true,
                self = this,
                toggle = null,
                id;
            wrapper.className = 'tb_radio_input_container';
            wrapper.setAttribute('tabIndex','-1');
            if (js_wrap === true) {
                var checked = [];
                wrapper.className += ' tb_option_radio_enable';
            }
            if (is_icon === true) {
                wrapper.className += ' tb_icon_radio';
                toggle = data.no_toggle === undefined;
            }
            if (this.is_repeat === true) {
                wrapper.className += ' tb_lb_option_child';
                id = Math.random().toString(36).substr(2, 7);
                wrapper.dataset['inputId'] = data.id;
            }
            else {
                wrapper.className += ' tb_lb_option';
                wrapper.id = id = data.id;
            }
            if (_default !== false) {
                wrapper.dataset['default'] = _default;
            }
            else if (is_icon === false && v === undefined) {
                _default = options[0].value;
            }
            if (data['before'] !== undefined) {
                d.appendChild(document.createTextNode(data.before));
            }
            for (var i = 0, len = options.length; i < len; ++i) {
                var label = document.createElement('label'),
                    ch = document.createElement('input');
                ch.type = 'radio';
                ch.name = id;
                ch.value = options[i].value;
                if (is_icon === true) {
                    ch.setAttribute( 'data-value', options[i].value );
                }
                if (this.is_repeat === true) {
                    ch.className = 'tb_radio_dnd';
                }
                if (data['class'] !== undefined) {
                    ch.className += this.is_repeat === true ? (' ' + data.class) : data.class;
                }
                if (options[i].disable === true) {
                    ch.disabled = true;
                }
                if (v === options[i].value || (v === undefined && _default === options[i].value)) {
                    ch.checked = true;
                    if (js_wrap === true) {
                        checked.push(ch);
                    }
                }
                label.appendChild(ch);
                if (js_wrap === true) {
                    ch.addEventListener('change', function () {
                        this.parentNode.parentNode.blur();
                        self.radio.controlChange(this);
                    },{passive: true});
                }
                if (is_icon === true) {
                    if (options[i].icon !== undefined) {
                        var icon_wrap = document.createElement('span');
                        icon_wrap.className = 'tb_icon_wrapper';
                        icon_wrap.innerHTML = options[i].icon;
                        label.insertAdjacentElement('beforeend', icon_wrap);
                    }
                    if (options[i]['label_class'] !== undefined) {
                        label.className += options[i]['label_class'];
                    }
                    if (options[i]['name'] !== undefined) {
                        var tooltip = document.createElement('span');
                        tooltip.className = 'themify_tooltip';
                        tooltip.textContent = options[i].name;
                        label.appendChild(tooltip);
                    }

                }
                else if (options[i]['name'] !== undefined) {
                    var label_text = document.createElement( 'span' );
                    label_text.textContent = options[i].name;
                    label.appendChild( label_text );
                }
                f.appendChild(label);
                if (data['new_line'] !== undefined) {
                    f.appendChild(document.createElement('br'));
                }
                this.initControl(ch, data);
            }
            wrapper.appendChild(f);
            d.appendChild(wrapper);
            if (data['after'] !== undefined) {
                d.appendChild(self.after(data));
            }
            if (data['description'] !== undefined) {
                d.appendChild(self.description(data.description));
            }
            if (is_icon === true && toggle === true) {
                self.icon_radio.controlChange(wrapper);
            }
            if (js_wrap === true) {
                this.radioChange.push(function () {
                    for (var i = 0, len = checked.length; i < len; ++i) {
                        self.radio.controlChange(checked[i]);
                    }
                    checked = null;
                });
            }
            return d;
        },
        checkboxGenerate: function (type, data) {
            var f = document.createDocumentFragment(),
                    d = document.createDocumentFragment(),
                    wrapper = document.createElement('div'),
                    options = this.getOptions(data),
                    is_icon = 'icon_checkbox' === type,
                    _default = null,
                    is_array = null,
                    js_wrap = data.option_js === true,
                    new_line = data['new_line'] === undefined,
                    v = this.getStyleVal(data.id);
            wrapper.className = 'themify-checkbox';
            if (js_wrap === true) {
                var self = this,
                        chekboxes = [];
                wrapper.className += ' tb_option_checkbox_enable';
                if (data['reverse'] !== undefined) {
                    wrapper.className += ' tb_option_checkbox_revert';
                }
            }
            if (this.is_repeat === true) {
                wrapper.className += ' tb_lb_option_child';
                wrapper.dataset['inputId'] = data.id;
            }
            else {
                wrapper.className += ' tb_lb_option';
                wrapper.id = data.id;
            }
            if(data['wrap_checkbox']!==undefined){
                wrapper.className += ' '+data['wrap_checkbox'];
            }
            if (v === undefined) {
                if (data['default'] !== undefined) {
                    _default = data['default'];
                    is_array = Array.isArray(_default);
                }
            }
            else {
                v = v !== false ? v.split('|') : undefined;
            }
            if (is_icon === true) {
                wrapper.className += ' tb_icon_checkbox';
            }
            if (data['before'] !== undefined) {
                d.appendChild(document.createTextNode(data.before));
            }
            for (var i = 0, len = options.length; i < len; ++i) {
                var label = document.createElement('label'),
                        ch = document.createElement('input');
                ch.type = 'checkbox';
                ch.className = 'tb-checkbox';
                ch.value = options[i].name;
                if (this.is_repeat === true) {
                    ch.className += ' tb_radio_dnd';
                }
                if (data['class'] !== undefined) {
                    ch.className += ' ' + data.class;
                }
                if ((v !== undefined && v.indexOf(options[i].name) !== -1) || (_default === options[i].name || (is_array === true && _default.indexOf(options[i].name) !== -1))) {
                    ch.checked = true;
                }
                if (js_wrap === true) {
                    ch.addEventListener('change', function () {
                        self.checkbox.controlChange(this);
                    },{passive: true});
                    chekboxes.push(ch);
                }
                if (new_line === false) {
                    label.className = 'pad-right';
                }
                label.appendChild(ch);
                if (is_icon === true) {
                    label.insertAdjacentHTML('beforeend', options[i].icon);
                    if (options[i]['value'] !== undefined) {
                        var tooltip = document.createElement('span');
                        tooltip.className = 'themify_tooltip';
                        tooltip.textContent = options[i].value;
                        label.appendChild(tooltip);
                    }
                }
                else if (options[i]['value'] !== undefined) {
                    label.appendChild(document.createTextNode(options[i].value));
                }
                f.appendChild(label);
                if (options[i].help !== undefined ) {
                        f.appendChild( this.help(options[i].help) );
                }
                if (new_line === true) {
                    f.appendChild(document.createElement('br'));
                }
                this.initControl(ch, data);
            }
            wrapper.appendChild(f);
            d.appendChild(wrapper);
            if (data['after'] !== undefined) {
                if ( ( data['label'] === undefined || data['label'] === '' )&& ( data['help'] !== undefined && data['help'] !== '' ) ){
                        wrapper.classList.add('contains-help');
                        wrapper.appendChild(this.after(data));
                }else {
                    d.appendChild(this.after(data));
                }
            }
            if (data['description'] !== undefined) {
                d.appendChild(this.description(data.description));
            }
            if (js_wrap === true) {
                this.afterRun.push(function () {
                    for (var i = 0, len = chekboxes.length; i < len; ++i) {
                        self.checkbox.controlChange(chekboxes[i]);
                    }
                    chekboxes = null;
                });
            }
            return d;
        },
        date: {
            loaded: null,
            render: function (data, self) {
                var f = document.createDocumentFragment(),
                        input = document.createElement('input'),
                        clear = document.createElement('button'),
                        _self = this,
                        callback = function () {
                            var datePicker = topWindow.$.fn.themifyDatetimepicker
                                    ? topWindow.$.fn.themifyDatetimepicker
                                    : topWindow.$.fn.datetimepicker;

                            if (!datePicker)
                                return;

                            var pickerData = data.picker !== undefined ? data.picker : {};
                            clear.addEventListener('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                input.value = '';
                                input.dispatchEvent(new Event('change'));
                                this.style['display'] = 'none';
                            });
                            datePicker.call($(input), {
                                showButtonPanel: true,
                                changeYear: true,
                                dateFormat: pickerData['dateformat'] || 'yy-mm-dd',
                                timeFormat: pickerData['timeformat'] || 'HH:mm:ss',
                                stepMinute: 5,
                                stepSecond: 5,
                                controlType: pickerData['timecontrol'] || 'select',
                                oneLine: true,
                                separator: pickerData['timeseparator'] || ' ',
                                onSelect: function (v) {
                                    clear.style['display'] = v === '' ? 'none' : 'block';
                                    input.dispatchEvent(new Event('change'));
                                },
                                beforeShow: function () {
                                    topWindow.document.getElementById('ui-datepicker-div').classList.add('themify-datepicket-panel');
                                }
                            });
                        };
                input.type = 'text';
                input.className = 'themify-datepicker';
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className += ' tb_lb_option';
                    input.id = data.id;
                }
                input.readonly = true;

                clear.className = 'themify-datepicker-clear';
                clear.textContent = self.label.clear_date;

                if (self.values[data.id] !== undefined) {
                    input.value = self.values[data.id];
                }
                if (data['class'] !== undefined) {
                    input.className += ' ' + data.class;
                }
                if (!input.value) {
                    clear.style['display'] = 'none';
                }
                f.appendChild(self.initControl(input, data));
                f.appendChild(clear);
                if (data['after'] !== undefined) {
                    f.appendChild(self.after(data));
                }
                if (data['description'] !== undefined) {
                    f.appendChild(self.description(data.description));
                }
                if (this.loaded === null) {
                    var init = function () {
                        topWindow.Themify.LoadCss(themifyBuilder.meta_url + 'css/jquery-ui-timepicker.min.css', tbLocalScript.version);
                        topWindow.Themify.LoadAsync(themifyBuilder.includes_url + 'js/jquery/ui/datepicker.min.js', function () {
                            topWindow.Themify.LoadAsync(themifyBuilder.meta_url + 'js/jquery-ui-timepicker.min.js', function () {
                                _self.loaded = true;
                                callback();
                            }, tbLocalScript.version, null, function () {
                                return topWindow.$.fn.themifyDatetimepicker !== undefined || topWindow.$.fn.datetimepicker!==undefined;
                            });
                        }, tbLocalScript.version, null, function () {
                            return topWindow.$.fn.datepicker !== undefined;
                        });
                    };
                    self.afterRun.push(init);
                }
                else {
                    self.afterRun.push(callback);
                }
                return f;
            }
        },
        gradient: {
            controlChange: function (self, gradient, input, clear, type, angle, circle, text, update) {
                var angleV = self.getStyleVal(angle.id);
                if(angleV===undefined || angleV===''){
                    angleV = 180;
                }
                var is_removed = false,
                        $gradient = $(gradient),
                        id = input.id,
                        value = self.getStyleVal(id),
                        args = {
                            angle: angleV,
                            onChange: function (stringGradient, cssGradient) {
                                if (is_removed) {
                                    stringGradient = cssGradient = '';
                                }
                                if ('visual' === api.mode) {
                                    Themify.triggerEvent(input, 'themify_builder_gradient_change', {val: cssGradient});
                                }
                                input.value = stringGradient;
                                api.hasChanged = true;
                            },
                            onInit: function () {
                                gradient.style['display'] = 'block';
                            }
                        };
                if (value) {
                    args.gradient = value;
                    input.value = value;
                }
                angle.value=angleV;
                if (!update) {
                    $gradient.ThemifyGradient(args);
                }
                var instance = $gradient.data('themifyGradient'),
                        callback = function (val) {
                            var p = angle.parentNode;
                            if (!p.classList.contains('gradient-angle-knob')) {
                                p = angle;
                            }
                            if (val === 'radial') {
                                text.style['display'] = p.style['display'] = 'none';
                                circle.parentNode.style['display'] = 'inline-block';
                            }
                            else {
                                text.style['display'] = p.style['display'] = 'inline-block';
                                circle.parentNode.style['display'] = 'none';
                            }
                        };
                if (update) {
                    instance.settings = $.extend({}, instance.settings, args);
                    instance.settings.type = self.getStyleVal(type.id);
                    instance.settings.circle = circle.checked;
                    instance.isInit = false;
                    instance.update();
                    instance.isInit = true;
                }
                else {
                    clear.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        is_removed = true;
                        instance.settings.gradient = $.ThemifyGradient.default;
                        instance.update();
                        is_removed = false;
                    });

                    type.addEventListener('change', function (e) {
                        var v = this.value;
                        instance.setType(v);
                        callback(v);
                    },{passive: true});

                    circle.addEventListener('change', function () {
                        instance.setRadialCircle(this.checked);
                    },{passive: true});
                    angle.addEventListener('mousedown', function _knob() {

                        $(this).knob({
                            min: 0,
                            max: 360,
                            step: 1,
                            width: 63,
                            height: 63,
                            thickness: .45,
                            cursor: true,
                            lineCap: 'round',
                            change: function (v) {
                                instance.setAngle(Math.round(v));
                            }
                        });
                        this.removeAttribute('style');
                        var p = this.parentNode;
                        p.classList.add('gradient-angle-knob');
                        p.removeAttribute('style');
                        p.insertAdjacentElement('afterbegin', this);

                        this.addEventListener('change', function () {
                            var val = parseInt(this.value);
                            if (!val) {
                                val = 0;
                            }
                            instance.setAngle(val);
                        },{passive: true});
                        angle.removeEventListener('mousedown', _knob, {once: true,passive: true});
                    }, {once: true,passive: true});
                }
                callback(self.getStyleVal(type.id));
            },
            update: function (id, v, self) {
                var nid = id + '-gradient',
                        input = topWindow.document.getElementById(nid);
                if (input !== null) {
                    var angle = topWindow.document.getElementById(nid + '-angle'),
                            type = topWindow.document.getElementById(nid + '-type'),
                            circle = topWindow.document.getElementById(id + '-circle-radial'),
                            gradient = input.previousElementSibling,
                            text = circle.previousElementSibling;
                    this.controlChange(self, gradient, input, null, type, angle, circle.getElementsByClassName('tb-checkbox')[0], text, true);
                }
            },
            render: function (data, self) {
                var wrap = document.createElement('div'),
                        d = document.createDocumentFragment(),
                        selectwrapper = document.createElement('div'),
                        type = document.createElement('select'),
                        options = ['linear', 'radial'],
                        angle = document.createElement('input'),
                        text = document.createElement('span'),
                        gradient = document.createElement('div'),
                        input = document.createElement('input'),
                        clear = document.createElement('a');
                wrap.className = 'themify-gradient-field';
                if (data.option_js !== undefined) {
                    wrap.className += ' tb_group_element_gradient';
                }
                selectwrapper.className = 'selectwrapper';
                type.className = 'tb_lb_option themify-gradient-type';
                type.id = data.id + '-gradient-type';
                angle.type = 'text';
                angle.className = 'xsmall tb_lb_option themify-gradient-angle';
                angle.id = data.id + '-gradient-angle';
                angle.autocomplete = 'off';
                angle.value = 180;
                text.textContent = self.label.rotation;
                gradient.className = 'tb_gradient_container';
                gradient.tabIndex = -1;
                input.type = 'hidden';
                input.className = 'themify-gradient tb_lb_option';
                input.dataset.id = data.id;
                input.id = data.id + '-gradient';
                clear.className = 'tb_clear_gradient ti-close';
                clear.href = '#';
                clear.title = self.label.clear_gradient;

                for (var i = 0; i < 2; ++i) {
                    var opt = document.createElement('option');
                    opt.value = options[i];
                    opt.textContent = self.label[options[i]];
                    type.appendChild(opt);
                }
                selectwrapper.appendChild(type);
                d.appendChild(selectwrapper);
                d.appendChild(angle);
                d.appendChild(text);
                d.appendChild(self.checkboxGenerate('checkbox',
                        {
                            id: data.id + '-circle-radial',
                            options: [{name: '1', value: self.label.circle_radial}]
                        }
                ));

                d.appendChild(gradient);
                d.appendChild(input);
                d.appendChild(clear);
                wrap.appendChild(d);
                var _this = this;
                self.initControl(input, data);
                self.afterRun.push(function () {
                    _this.controlChange(self, gradient, input, clear, type, angle, wrap.getElementsByClassName('tb-checkbox')[0], text);
                });
                return wrap;
            }
        },
        fontColor: {
            update: function (id, v, self) {
                self.radio.update(id, self.getStyleVal(id), self);
            },
            render: function (data, self) {
                data.isFontColor = true;
                var roptions = {
                    id: data.id,
                    type: 'radio',
                    option_js: true,
                    isFontColor: true,
                    options: [
                        {value: data.s + '_solid', name: self.label.solid},
                        {value: data.g + '_gradient', name: self.label.gradient}
                    ]
                };
                var radioWrap = self.radioGenerate('radio', roptions),
                        radio = radioWrap.querySelector('.tb_lb_option'),
                        colorData = $.extend(true, {}, data),
                        color,
                        gradient;
                colorData.label = '';
                colorData.type = 'color';
                colorData.id = data.s;
                colorData.prop = 'color';
                colorData.wrap_class = 'tb_group_element_' + data.s + '_solid';

                color = self.create([colorData]);

                colorData.id = data.g;
                colorData.wrap_class = 'tb_group_element_' + data.g + '_gradient';
                colorData.type = 'gradient';
                colorData.prop = 'background-image';

                gradient = self.create([colorData]);
                colorData = roptions = null;
                self.afterRun.push(function () {
                    var field = radio.parentNode.closest('.tb_field');
                    field.parentNode.insertBefore(color, field.nextElementSibling);
                    field.parentNode.insertBefore(gradient, field.nextElementSibling);
                    field = gradient = color = radio = null;
                });
                return radioWrap;
            }
        },
        imageGradient: {
            update: function (id, v, self) {
                self.radio.update(id + '-type', self.getStyleVal(id + '-type'), self);
                self.file.update(id, v, self);
                self.gradient.update(id, v, self);
                var el = topWindow.document.getElementById(id);
                if (el !== null) {
                    var p = el.closest('.tb_tab'),
                        imageOpt = p.getElementsByClassName('tb_image_options');
                    var eid = p.getElementsByClassName('tb_gradient_image_color')[0].getElementsByClassName('minicolors-input')[0].id;
                    self.color.update(eid, self.getStyleVal(eid), self);
                    for(var i=0;i<imageOpt.length;++i){
                        eid=imageOpt[i].getElementsByClassName('tb_lb_option')[0].id;
                        self.select.update(eid, self.getStyleVal(eid), self);
                    }
                }
            },
            render: function (data, self) {
                var wrap = document.createElement('div'),
                        d = document.createDocumentFragment(),
                        imageWrap = document.createElement('div');
                wrap.className = 'tb_image_gradient_field';
                imageWrap.className = 'tb_group_element_image';
                d.appendChild(self.radioGenerate('radio',
                        {type: data.type,
                            id: data.id + '-type',
                            options: [
                                {name: self.label.image, value: 'image'},
                                {name: self.label.gradient, value: 'gradient'}
                            ],
                            option_js: true
                        }
                ));
                var extend = $.extend(true, {}, data);
                extend.type = 'image';
                extend.class = 'xlarge';
                //image
                imageWrap.appendChild(self.file.render('image', $.extend(true,{}, extend), self));
                d.appendChild(imageWrap);
                //gradient
                extend.type = 'gradient';
                delete extend.class;
                delete extend.binding;
                d.appendChild(self.gradient.render(extend, self));
                self.afterRun.push(function () {
                    var group={
                        'wrap_class':'tb_group_element_image',
                        'type':'group',
                        'options':[]
                    };
                     //color
                    extend.prop='background-color';
                    extend.wrap_class='tb_gradient_image_color';
                    extend.label=self.label['bg_c'];
                    extend.type='color';
                    extend.id=extend.colorId;
                    group.options.push($.extend({}, extend));

                    //repeat
                    extend.prop='background-mode';
                    extend.wrap_class='tb_image_options';
                    extend.label=self.label['b_r'];
                    extend.repeat=true;
                    extend.type='select';
                    extend.id=extend.repeatId;
                    group.options.push($.extend({}, extend));

                    //position
                    extend.prop='background-position';
                    extend.wrap_class='tb_image_options';
                    extend.label=self.label['b_p'];
                    extend.position=true;
                    extend.type='select';
                    extend.id=extend.posId;
                    delete extend.repeat;
                    group.options.push($.extend({}, extend));
                    
                    var field = imageWrap.parentNode.closest('.tb_field');
                    field.parentNode.insertBefore(self.create([group]), field.nextElementSibling);
                    extend=group = null;
                });
                wrap.appendChild(d);
                return wrap;
            }
        },
        layout: {
            controlChange: function (el) {
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.target !== el) {
                        var selected = e.target.closest('a');
                        if (selected !== null) {
                            var items = this.getElementsByClassName('tfl-icon');
                            for (var i = items.length - 1; i > -1; --i) {
                                items[i].classList.remove('selected');
                            }
                            selected.classList.add('selected');
                            api.hasChanged = true;
                            Themify.triggerEvent(this, 'change', {val: selected.id});
                        }
                    }
                });
            },
            update: function (id, v, self) {
                var input = topWindow.document.getElementById(id);
                if (input !== null) {
                    var items = input.getElementsByClassName('tfl-icon');
                    for (var i = items.length - 1; i > -1; --i) {
                        if (v === items[i].id) {
                            items[i].classList.add('selected');
                        }
                        else {
                            items[i].classList.remove('selected');
                        }
                    }
                    if (v === undefined) {
                        var def = input.dataset['default'];
                        if (def === undefined) {
                            def = items[0];
                        }
                        else {
                            def = def.querySelector('#' + def);
                        }
                        def.classList.add('selected');
                    }
                }
            },
            render: function (data, self) {
                var f = document.createDocumentFragment(),
                        p = document.createElement('div'),
                        v = self.getStyleVal(data.id),
                        options = self.getOptions(data);

                if (data.color === true && data.transparent === true) {
                    options = options.slice();
                    options.push({img: 'transparent', value: 'transparent', label: self.label.transparent});
                }
                p.className = 'themify-layout-icon';
                if (self.is_repeat === true) {
                    p.className += ' tb_lb_option_child';
                    p.dataset['inputId'] = data.id;
                }
                else {
                    p.className += ' tb_lb_option';
                    p.id = data.id;
                }
                if (data['class'] !== undefined) {
                    p.className += ' ' + data.class;
                }

                if (v === undefined) {
                    var def = themifyBuilder.modules[ self.type ];
                    if (def !== undefined && def.defaults !== undefined && def.defaults[data.id]) {
                        v = def.defaults[data.id];
                        def = null;
                    }
                    else {
                        v = options[0].value;
                    }
                }
                for (var i = 0, len = options.length; i < len; ++i) {
                    var a = document.createElement('a'),
                            tooltip = document.createElement('span'),
                            sprite;
                    a.href = '#';
                    a.className = 'tfl-icon';
                    a.id = options[i].value;
                    if (v === options[i].value) {
                        a.className += ' selected';
                    }
                    tooltip.className = 'themify_tooltip';
                    tooltip.textContent = options[i].label;

                    if (data.mode === 'sprite' && options[i].img.indexOf('.png') === -1) {
                        sprite = document.createElement('span');
                        sprite.className = 'tb_sprite';
                        if (options[i].img.indexOf('http') !== -1) {
                            sprite.style['backgroundImage'] = 'url(' + options[i].img + ')';
                        }
                        else {
                            sprite.className += ' tb_' + options[i].img;
                        }

                    }
                    else {
                        sprite = document.createElement('img');
                        sprite.alt = options[i].label;
                        sprite.src = options[i].img.indexOf('http') !== -1 ? options[i].img : themifyBuilder.builder_url + '/img/builder/' + options[i].img;
                    }

                    a.appendChild(sprite);
                    a.appendChild(tooltip);
                    f.appendChild(a);
                }

                options = null;
                p.appendChild(f);
                this.controlChange(p);
                if(self.component==='row' && (data.id==='row_width' || data.id==='row_height')){
                    api.Utils.changeOptions(p,data.type);
                }
                else{
                    self.initControl(p, data);
                }
                return p;
            }
        },
        layoutPart: {
            data: [],
            get: function (callback) {
                var self = this;
                $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    dataType: 'json',
                    data: {
                        action: 'tb_get_library_items',
                        nonce: themifyBuilder.tb_load_nonce,
                        pid: themifyBuilder.post_ID
                    },
                    beforeSend: function (xhr) {
                        Common.showLoader('show');
                    },
                    success: function (data) {
                        Common.showLoader('hide');
                        self.data = data;
                        callback();
                    },
                    error: function () {
                        Common.showLoader('error');
                    }
                });
            },
            render: function (data, self) {
                var _this = this,
                        d = document.createDocumentFragment(),
                        selectWrap = self.select.render(data, self),
                        edit = document.createElement('a'),
                        add = document.createElement('a'),
                        add_icon = document.createElement('span'),
                        edit_icon = document.createElement('span'),
                        select = selectWrap.querySelector('select');
                function callback() {
                    var f = document.createDocumentFragment(),
                        s = self.values[data.id],
                        currentLayoutId =api.Forms.LayoutPart.id!==null ?api.Forms.LayoutPart.id.toString():null;
                    f.appendChild(document.createElement('option'));
                    for (var i = 0, len = _this.data.length; i < len; ++i) {
                        if(currentLayoutId!==_this.data[i].id.toString()){
                        var opt = document.createElement('option');
                        opt.value = _this.data[i].post_name;
                        opt.textContent = _this.data[i].post_title;
                        if (s === _this.data[i].post_name) {
                            opt.selected = true;
                        }
                        f.appendChild(opt);
                    }
                    }
                    select.appendChild(f);
                    select = null;
                }
                if (_this.data.length === 0) {
                    _this.get(callback);
                }
                else {
                    callback();
                }
                d.appendChild(selectWrap);
                selectWrap = null;
                edit.target = add.target = '_blank';
                edit.className = add.className = 'add_new';
                edit.href = data.edit_url;
                add.href = data.add_url;
                add_icon.className = 'tb_icon add';
                edit_icon.className = 'tb_icon ti-folder';
                edit.appendChild(edit_icon);
                edit.appendChild(document.createTextNode(self.label['mlayout']));
                add.appendChild(add_icon);
                add.appendChild(document.createTextNode(self.label['nlayout']));
                d.appendChild(document.createElement('br'));
                d.appendChild(add);
                d.appendChild(edit);
                return d;
            }
        },
        separator: {
            render: function (data, self) {
                var seperator,
                        txt = self.label[data.label] !== undefined ? self.label[data.label] : data.label;
                if (txt !== undefined) {
                    seperator = data.wrap_class !== undefined?document.createElement('div'):document.createDocumentFragment();
                    var h4 = document.createElement('h4');
                        h4.textContent  = txt;
                        seperator.appendChild(document.createElement('hr'));
                        seperator.appendChild(h4);
                        if(data.wrap_class!==undefined){
                            seperator.className = data.wrap_class;
                        }
                }
                else if (data.html !== undefined) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = data.html;
                    seperator = tmp.firstChild;
                    if (data.wrap_class !== undefined) {
                        seperator.className = data.wrap_class;
                    }
                }
                else {
                    seperator = document.createElement('hr');
                    if (data.wrap_class !== undefined) {
                            seperator.className = data.wrap_class;
                    }
                }
                return seperator;
            }
        },
        multiColumns: {
            render: function (data, self) {
                var opt = [],
                        columnOptions = [
                            {
                                id: data.id + '_gap',
                                label: self.label['c_g'],
                                type: 'range',
                                prop: 'column-gap',
                                selector: data.selector,
                                wrap_class: 'tb_multi_columns_wrap',
                                units: {
                                    px: {
                                        min: 0,
                                        max: 500
                                    }
                                }
                            },
                            {type: 'multi',
                                wrap_class: 'tb_multi_columns_wrap',
                                label: self.label['c_d'],
                                options: [
                                    {
                                        type: 'color',
                                        id: data.id + '_divider_color',
                                        prop: 'column-rule-color',
                                        selector: data.selector
                                    },
                                    {
                                        type: 'range',
                                        id: data.id + '_divider_width',
                                        class: 'tb_multi_columns_width',
                                        prop: 'column-rule-width',
                                        selector: data.selector,
                                        units: {
                                            px: {
                                                min: 0,
                                                max: 500
                                            }
                                        }
                                    },
                                    {
                                        type: 'select',
                                        id: data.id + '_divider_style',
                                        options: self.static.border,
                                        prop: 'column-rule-style',
                                        selector: data.selector
                                    }
                                ]
                            }


                        ];
                for (var i = 0; i < 7; ++i) {
                    opt[i] = i === 0 ? '' : i;
                }
                data.options = opt;
                opt = null;
                var ndata = $.extend(true, {}, data);
                ndata.type = 'select';
                var wrap = self.select.render(ndata, self),
                        select = wrap.querySelector('select');
                self.afterRun.push(function () {
                    var field = select.closest('.tb_field');
                    field.parentNode.insertBefore(self.create(columnOptions), field.nextElementSibling);

                });
                return wrap;
            }
        },
        expand: {
            render: function (data, self) {
                var wrap = document.createElement('fieldset'),
                        expand = document.createElement('div'),
                        toggle = document.createElement('div'),
                        i = document.createElement('i'),
                        txt = self.label[data.label] !== undefined ? self.label[data.label] : data.label;
                wrap.className = 'tb_expand_wrap';
                toggle.className = 'tb_style_toggle tb_closed';
                expand.className = 'tb_expanded_opttions';
                i.className = 'ti-angle-up';
                toggle.appendChild(document.createTextNode(txt));
                toggle.appendChild(i);
                wrap.appendChild(toggle);
                wrap.appendChild(expand);
                toggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (this.dataset['done'] === undefined) {
                        this.dataset['done'] = true;
                        expand.appendChild(self.create(data.options));
                        if (self.clicked === 'setting') {
                            self.setUpEditors();
                        }
                        self.callbacks();
                    }
                    if (this.classList.contains('tb_closed')) {
                        this.classList.remove('tb_closed');
                    }
                    else {
                        this.classList.add('tb_closed');
                    }
                });
                return wrap;
            }
        },
        gallery: {
            file_frame: null,
            cache: {},
            init: function (btn, input) {
                var clone = wp.media.gallery.shortcode,
                        _this = this,
                        val = input.value.trim(),
                        preview = function (images, is_ajax) {
                            var prewiew_wrap = document.createElement('div'),
                                    f = document.createDocumentFragment(),
                                    parent = input.parentNode,
                                    pw = parent.getElementsByClassName('tb_shortcode_preview')[0];
                            prewiew_wrap.className = 'tb_shortcode_preview';
                            if (pw !== undefined) {
                                pw.parentNode.removeChild(pw);
                            }
                            for (var i = 0, len = images.length; i < len; ++i) {
                                var img = document.createElement('img');
                                img.width = img.height = 50;
                                if (is_ajax === true) {
                                    img.src = images[i];
                                }
                                else {
                                    var attachment = images[i].attributes;
                                    img.src = attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;
                                }
                                f.appendChild(img);
                            }
                            prewiew_wrap.appendChild(f);
                            input.parentNode.insertBefore(prewiew_wrap, input.nextElementSibling);
                        };
                if (val.length > 0) {
                    if (this.cache[val] !== undefined) {
                        preview(this.cache[val], true);
                    }
                    else {
                        $.ajax({
                            type: 'POST',
                            url: themifyBuilder.ajaxurl,
                            dataType: 'json',
                            data: {
                                action: 'tb_load_shortcode_preview',
                                tb_load_nonce: themifyBuilder.tb_load_nonce,
                                shortcode: val
                            },
                            success: function (data) {
                                preview(data, true);
                                _this.cache[val] = data;
                            }
                        });
                    }
                }
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (_this.file_frame === null) {
                        // Create the media frame.
                        _this.file_frame = wp.media.frames.file_frame = wp.media({
                            frame: 'post',
                            state: 'gallery-library',
                            library: {
                                type: 'image'
                            },
                            title: wp.media.view.l10n.editGalleryTitle,
                            editing: true,
                            multiple: true,
                            selection: false
                        });
                        _this.file_frame.el.classList.add('themify_gallery_settings');
                    }
                    else {
                        _this.file_frame.options.selection.reset();
                    }
                    wp.media.gallery.shortcode = function (attachments) {
                        var props = attachments.props.toJSON(),
                                attrs = _.pick(props, 'orderby', 'order');

                        if (attachments.gallery) {
                            _.extend(attrs, attachments.gallery.toJSON());
                        }
                        attrs.ids = attachments.pluck('id');
                        // Copy the `uploadedTo` post ID.
                        if (props.uploadedTo) {
                            attrs.id = props.uploadedTo;
                        }
                        // Check if the gallery is randomly ordered.
                        if (attrs._orderbyRandom) {
                            attrs.orderby = 'rand';
                            delete attrs._orderbyRandom;
                        }
                        // If the `ids` attribute is set and `orderby` attribute
                        // is the default value, clear it for cleaner output.
                        if (attrs.ids && 'post__in' === attrs.orderby) {
                            delete attrs.orderby;
                        }
                        // Remove default attributes from the shortcode.
                        for (var key in wp.media.gallery.defaults) {
                            if (wp.media.gallery.defaults[key] === attrs[key]) {
                                delete attrs[key];
                            }
                        }
                        delete attrs['_orderByField'];
                        var shortcode = new topWindow.wp.shortcode({
                            tag: 'gallery',
                            attrs: attrs,
                            type: 'single'
                        });
                        wp.media.gallery.shortcode = clone;
                        return shortcode;
                    };

                    var v = input.value.trim();
                    if (v.length > 0) {
                        _this.file_frame = wp.media.gallery.edit(v);
                        _this.file_frame.state('gallery-edit');
                    } else {
                        _this.file_frame.state('gallery-library');
                        _this.file_frame.open();
                        _this.file_frame.$el.find('.media-menu .media-menu-item').last().trigger('click');
                    }

                    var setShortcode = function (selection) {
                        var v = wp.media.gallery.shortcode(selection).string().slice(1, -1);
                        input.value = '[' + v + ']';
                        preview(selection.models);
                        Themify.triggerEvent(input, 'change');
                        api.hasChanged = true;
                    };
                    _this.file_frame.off('update', setShortcode).on('update', setShortcode);
                });

            },
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        a = document.createElement('a'),
                        _this = this,
                        cl = data.class !== undefined ? data.class : '';
                cl += ' tb_shortcode_input';

                a.href = '#';
                a.className = 'builder_button tb_gallery_btn';
                a.textContent = self.label.add_gallery;
                data.class = cl;
                d.appendChild(self.textarea.render(data, self));
                d.appendChild(a);

                self.afterRun.push(function () {

                    _this.init(a, a.previousElementSibling);
                    if (self.is_new === true && self.type === 'gallery' && self.clicked === 'setting') {
                        a.click();
                    }
                });
                return d;
            }
        },
        textarea: {
            render: function (data, self) {
                var f = document.createDocumentFragment(),
                        area = document.createElement('textarea'),
                        v = self.getStyleVal(data.id);
                if (self.is_repeat === true) {
                    area.className = 'tb_lb_option_child';
                    area.dataset['inputId'] = data.id;
                }
                else {
                    area.className = 'tb_lb_option';
                    area.id = data.id;
                }
                area.className += ' '+(data['class'] !== undefined?data.class:'xlarge');
                if (v !== undefined) {
                    area.value = v;
                }
                if (data.rows !== undefined) {
                    area.rows = data.rows;
                }
                f.appendChild(self.initControl(area, data));
                if (data['after'] !== undefined) {
					f.appendChild(self.after(data ));
                }
                if (data['description'] !== undefined) {
                    f.appendChild(self.description(data.description));
                }
                return f;
            }
        },
        wp_editor: {
            render: function (data, self) {
                var wrapper = document.createElement('div'),
                        tools = document.createElement('div'),
                        media_buttons = document.createElement('div'),
                        add_media = document.createElement('button'),
                        icon = document.createElement('span'),
                        tabs = document.createElement('div'),
                        switch_tmce = document.createElement('button'),
                        switch_html = document.createElement('button'),
                        container = document.createElement('div'),
                        quicktags = document.createElement('div'),
                        textarea = document.createElement('textarea'),
                        id;

                wrapper.className = 'wp-core-ui wp-editor-wrap tmce-active';
                textarea.className = 'tb_lb_wp_editor fullwidth';
                if (self.is_repeat === true) {
                    id = Math.random().toString(36).substr(2, 7);
                    textarea.className += ' tb_lb_option_child';
                    textarea.dataset['inputId'] = data.id;
                    if (data.control !== false) {
                        if (data.control === undefined) {
                            data.control = {};
                        }
                        data.control.repeat = true;
                    }
                }
                else {
                    textarea.className += ' tb_lb_option';
                    id = data.id;
                }
                textarea.id = id;
                wrapper.id = 'wp-' + id + '-wrap';
                tools.id = 'wp-' + id + '-editor-tools';
                tools.className = 'wp-editor-tools';

                media_buttons.id = 'wp-' + id + '-media-buttons';
                media_buttons.className = 'wp-media-buttons';

                add_media.type = 'button';
                add_media.className = 'button insert-media add_media';
                // add_media.dataset['editor'] = id;
                icon.className = 'wp-media-buttons-icon';

                tabs.className = 'wp-editor-tabs';

                switch_tmce.type = 'button';
                switch_tmce.className = 'wp-switch-editor switch-tmce';
                switch_tmce.id = id + '-tmce';
                switch_tmce.dataset['wpEditorId'] = id;
                switch_tmce.textContent = self.label.visual;

                switch_html.type = 'button';
                switch_html.className = 'wp-switch-editor switch-html';
                switch_html.id = id + '-html';
                switch_html.dataset['wpEditorId'] = id;
                switch_html.textContent = self.label.text;

                container.id = 'wp-' + id + '-editor-container';
                container.className = 'wp-editor-container';

                quicktags.id = 'qt_' + id + '_toolbar';
                quicktags.className = 'quicktags-toolbar';

                if (data['class'] !== undefined) {
                    textarea.className += ' ' + data.class;
                }
                if (self.values[data.id] !== undefined) {
                    textarea.value = self.values[data.id];
                }
                textarea.rows = 12;
                textarea.cols = 40;
                container.appendChild(textarea);
                container.appendChild(quicktags);

                tabs.appendChild(switch_tmce);
                tabs.appendChild(switch_html);

                add_media.appendChild(icon);
                add_media.appendChild(document.createTextNode(self.label.add_media));
                media_buttons.appendChild(add_media);
                tools.appendChild(media_buttons);
                tools.appendChild(tabs);
                wrapper.appendChild(tools);
                wrapper.appendChild(container);
                self.editors.push({'el': textarea, 'data': data});
                return wrapper;
            }
        },
        select: {
            update: function (id, v, self) {
                var item = topWindow.document.getElementById(id);
                if (item !== null) {
                    if (v !== undefined) {
                        item.value = v;
                    }
                    else if (item[0] !== undefined) {
                        item[0].selected = true;
                    }
                }
            },
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        select_wrap = document.createElement('div'),
                        options = self.getOptions(data),
                        select = document.createElement('select'),
                        v = self.getStyleVal(data.id);
                select_wrap.className = 'selectwrapper';
                if (self.is_repeat === true) {
                    select.className = 'tb_lb_option_child';
                    select.dataset['inputId'] = data.id;
                }
                else {
                    select.className = 'tb_lb_option';
                    select.id = data.id;
                }
                if (data['class'] !== undefined) {
                    select.className += ' ' + data.class;
                }
                for (var k in options) {
                    var opt = document.createElement('option');
                    opt.value = k;
                    opt.text = options[k];
                    if (v === k) {
                        opt.selected = true;
                    }
                    else if (v === undefined && k === data.default) {
                        opt.selected = true;
                    }
                    d.appendChild(opt);
                }
                select.appendChild(d);
                select_wrap.appendChild(self.initControl(select, data));
                d = document.createDocumentFragment();
                d.appendChild(select_wrap);
                if (data['after'] !== undefined) {
					d.appendChild(self.after(data ));
                }
                if (data['description'] !== undefined) {
                    d.appendChild(self.description(data.description));
                }
				if (data['tooltip'] !== undefined) {
					d.appendChild(self.tooltip(data.tooltip));
				}
                return d;
            }
        },
        font_select: {
            loaded_fonts: [],
            fonts: [],
            safe: [],
            google: [],
            updateFontVariant: function (value, weight, self) {
                if (!weight) {
                    return;
                }
                if (this.google[value] === undefined || this.google[value].v === undefined) {
                    weight.closest('.tb_field').classList.add('_tb_hide_binding');
                    return;
                }

                var variants = this.google[value].v,
                        selected = self.getStyleVal(weight.id),
                        fr = document.createDocumentFragment();
                if (selected === undefined) {
                    selected = 'regular';
                }
                weight.dataset['selected'] = value;
                for (var i = 0, len = variants.length; i < len; ++i) {
                    var opt = document.createElement('option');
                    opt.value = opt.textContent = variants[i];
                    if (variants[i] === selected) {
                        opt.selected = true;
                    }
                    fr.appendChild(opt);

                }
                while (weight.firstChild) {
                    weight.removeChild(weight.firstChild);
                }
                weight.appendChild(fr);
                weight.closest('.tb_field').classList.remove('_tb_hide_binding');
            },
            loadGoogleFonts: function (fontFamilies, iframe) {
                fontFamilies = $.unique(fontFamilies.split('|'));
                var result = [],
                        loaded = [],
                        self = this;
                for (var i = fontFamilies.length - 1; i > -1; --i) {
                    if (fontFamilies[i] && this.loaded_fonts.indexOf(fontFamilies[i]) === -1 && result.indexOf(fontFamilies[i]) === -1) {
                        var req = fontFamilies[i].split(':'),
                                weight = ('regular' === req[1] || 'italic' === req[1] || parseInt(req[1])) ? req[1] : '400,700',
                                f = req[0].split(' ').join('+') + ':' + weight;
                        if (this.loaded_fonts.indexOf(f) === -1) {
                            result.push(f + ':latin,latin-ext');
                            loaded.push(f);
                        }
                    }
                }
                if (result.length > 0) {

                    fontFamilies = null;
                    var loading = function () {
                        for (var i = loaded.length - 1; i > -1; --i) {
                            if (self.loaded_fonts.indexOf(loaded[i]) === -1) {
                                self.loaded_fonts.push(loaded[i]);
                            }
                        }
                    },
                            fontConfig = {
                                google: {families: result},
                                fontloading: function (familyName, fvd) {
                                    loading();
                                },
                                fontinactive: function (familyName, fvd) {
                                    loading();
                                }
                            };
                    WebFont.load(fontConfig);
                    if (iframe) {
                        fontConfig['context'] = iframe;
                        WebFont.load(fontConfig);
                    }
                }
            },
            controlChange: function (select, preview, pw, self) {
                var _this = this,
                        $combo = $(select).comboSelect({
                    'comboClass': 'themify-combo-select',
                    'comboArrowClass': 'themify-combo-arrow',
                    'comboDropDownClass': 'themify-combo-dropdown',
                    'inputClass': 'themify-combo-input',
                    'disabledClass': 'themify-combo-disabled',
                    'hoverClass': 'themify-combo-hover',
                    'selectedClass': 'themify-combo-selected',
                    'markerClass': 'themify-combo-marker'
                }).parent('div');

                var items = $combo[0].getElementsByClassName('themify-combo-item'),
                        callback = function (value) {
                            _this.fonts.push(value);
                            pw.classList.remove('themify_show_wait');
                        };
                for (var i = items.length - 1; i > -1; --i) {
                    items[i].addEventListener('click', function (e) {
                        var value = this.dataset['value'];
                        api.hasChanged = true;
                        if (value && _this.loaded_fonts.indexOf(value) === -1) {
                            var type = select.querySelector('option[value="' + value + '"]');
                            if (type === null || type.dataset['type'] !== 'webfont') {
                                WebFont.load({
                                    classes: false,
                                    google: {
                                        families: [value]
                                    },
                                    fontloading: function (familyName, fvd) {
                                        _this.loaded_fonts.push(value);
                                    },
                                    fontinactive: function (familyName, fvd) {
                                        _this.loaded_fonts.push(value);
                                    }
                                });

                            }
                        }
                        _this.updateFontVariant(value, select.closest('.tb_tab').getElementsByClassName('font-weight-select')[0], self);
                        setTimeout(function () {
                            Themify.triggerEvent(select, 'change');
                        }, 10);

                    },{passive: true});
                    items[i].addEventListener('mouseenter', function () {
                        var value = this.dataset['value'];
                        if (value) {
                            var $this = $(this);
                            if (!$this.is(':visible')) {
                                return;
                            }
                            if (value === 'default') {
                                value = 'inherit';
                            }
                            preview.style['top'] = $this.position().top + 30 + 'px';
                            preview.style['fontFamily'] = value;
                            preview.style['display'] = 'block';
                            if (value === 'inherit') {
                                return;
                            }
                            if (!this.classList.contains('tb_font_loaded')) {
                                this.classList.add('tb_font_loaded');
                                if (_this.fonts.indexOf(value) === -1) {
                                    pw.classList.add('themify_show_wait');
                                    var type = select.querySelector('option[value="' + value + '"]');
                                    if (type === null || type.dataset['type'] !== 'webfont') {
                                        WebFont.load({
                                            classes: false,
                                            context: topWindow,
                                            google: {
                                                families: [value]
                                            },
                                            fontloading: function (familyName, fvd) {
                                                callback(value);
                                            },
                                            fontinactive: function (familyName, fvd) {
                                                callback(value);
                                            }
                                        });
                                    }
                                    else {
                                        callback(value);
                                    }
                                }
                                this.classList.add('tb_font_loaded');
                                this.style['fontFamily'] = value;
                            }
                        }
                    },{passive: true});
                }
                items = null;
                $combo.trigger('comboselect:open')
                        .on('comboselect:close', function () {
                            preview.style['display'] = 'none';
                        });
                $combo[0].getElementsByClassName('themify-combo-arrow')[0].addEventListener('click', function () {
                    preview.style['display'] = 'none';
                },{passive: true});
            },
            update: function (id, v, self) {
                var select = topWindow.document.getElementById(id);
                if (select !== null) {
                    if (v === undefined) {
                        v = '';
                    }
                    select.value = v;
                    this.updateFontVariant(v, select.closest('.tb_tab').getElementsByClassName('font-weight-select')[0], self);
                    if (select.dataset['init'] === undefined) {
                        var groups = select.getElementsByTagName('optgroup');
                        while (groups[0].firstChild) {
                            groups[0].removeChild(groups[0].firstChild);
                        }
                        while (groups[1].firstChild) {
                            groups[1].removeChild(groups[1].firstChild);
                        }
                        var opt = document.createElement('option');
                        opt.value = v;
                        opt.selected = true;
                        if (this.safe[v] !== undefined) {
                            opt.textContent = this.safe[v];
                            groups[0].appendChild(opt);
                        }
                        else if (this.google[v] !== undefined) {
                            opt.textContent = this.google[v].n;
                            groups[1].appendChild(opt);
                        }
                        else {
                            opt.textContent = v;
                            groups[0].appendChild(opt);
                        }
                    }
                    else {
                        select.parentNode.getElementsByClassName('themify-combo-input')[0].value = v;
                    }
                }
            },
            render: function (data, self) {
                var wrapper = document.createElement('div'),
                        select = document.createElement('select'),
                        preview = document.createElement('span'),
                        pw = document.createElement('span'),
                        d = document.createDocumentFragment(),
                        empty = document.createElement('option'),
                        v = self.getStyleVal(data.id),
                        _this = this,
                        group = [self.label.safe_fonts, self.label.google_fonts];
                wrapper.className = 'tb_font_preview_wrapper';
                select.className = 'tb_lb_option font-family-select';
                select.id = data.id;
                preview.className = 'tb_font_preview';
                pw.textContent = self.label.font_preview;
                empty.value = '';
                empty.textContent = '---';
                d.appendChild(empty);

                if (data['class'] !== undefined) {
                    select.className += ' ' + data.class;
                }

                for (var i = 0; i < 2; ++i) {
                    var optgroup = document.createElement('optgroup');
                    optgroup.label = group[i];
                    if (v !== undefined) {
                        var opt = document.createElement('option');
                        opt.value = v;
                        opt.selected = true;
                        if (i === 0 && this.safe[v] !== undefined) {
                            opt.textContent = this.safe[v];
                        }
                        else if (i === 1 && this.google[v] !== undefined) {
                            opt.textContent = this.google[v].n;
                        }
                        else {
                            opt.textContent = v;
                        }
                        optgroup.appendChild(opt);
                    }
                    d.appendChild(optgroup);
                }
                wrapper.addEventListener('focusin', function _focusin() {
                    var fonts = _this.safe,
                            f = document.createDocumentFragment(),
                            groups = select.getElementsByTagName('optgroup');
                    select.dataset['init'] = true;
                    if (v !== undefined) {
                        while (groups[0].firstChild) {
                            groups[0].removeChild(groups[0].firstChild);
                        }
                        while (groups[1].firstChild) {
                            groups[1].removeChild(groups[1].firstChild);
                        }
                    }
                    for (var i in fonts) {
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.textContent = fonts[i];
                        opt.dataset['type'] = 'webfont';
                        if (v === i) {
                            opt.selected = true;
                        }
                        f.appendChild(opt);
                    }
                    groups[0].appendChild(f);
                    fonts = _this.google;
                    f = document.createDocumentFragment();
                    for (var i in fonts) {
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.textContent = fonts[i].n;
                        if (v === i) {
                            opt.selected = true;
                        }
                        f.appendChild(opt);
                    }
                    groups[1].appendChild(f);
                    fonts = null;
                    _this.controlChange(select, preview, pw, self);
                    wrapper.removeEventListener('focusin', _focusin, {once: true,passive: true});
                }, {once: true,passive: true});

                select.appendChild(d);
                preview.appendChild(pw);
                wrapper.appendChild(self.initControl(select, data));
                wrapper.appendChild(preview);
                self.afterRun.push(function () {
                    var weight = self.create([{type: 'select', label: 'f_w', selector: data.selector, class: 'font-weight-select', id: data.id + '_w', prop: 'font-weight'}]),
                            field = wrapper.closest('.tb_field'),
                            weightParent = weight.querySelector('.tb_field');
                    field.parentNode.insertBefore(weight, field.nextElementSibling);
                    _this.updateFontVariant(v, weightParent.querySelector('.font-weight-select'), self);
                });

                return wrapper;
            }
        },
        animation_select: {
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        select_wrap = document.createElement('div'),
                        options = self.static['preset_animation'],
                        select = document.createElement('select'),
                        v = self.values[data.id];
                select_wrap.className = 'selectwrapper';
                select.className = 'tb_lb_option';
                select.id = data.id;
                d.appendChild(document.createElement('option'));
                for (var k in options) {
                    var group = document.createElement('optgroup'),
                            f = document.createDocumentFragment();
                    group.label = k;
                    for (var i in options[k]) {
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.text = options[k][i];
                        if (v === i) {
                            opt.selected = true;
                        }
                        f.appendChild(opt);
                    }
                    group.appendChild(f);
                    d.appendChild(group);
                }
                select.appendChild(d);
                select_wrap.appendChild(select);
                return select_wrap;
            }
        },
        select_menu: {
            data: null,
            get: function (select, v) {
                var self = this,
                        callback = function () {
                            var d = document.createDocumentFragment();
                            for (var k in self.data) {
                                var opt = document.createElement('option');
                                opt.value = self.data[k].slug;
                                opt.text = self.data[k].name;
                                opt.dataset['termid'] = self.data[k].term_id;
                                if (v === self.data[k].slug) {
                                    opt.selected = true;
                                }
                                d.appendChild(opt);
                            }
                            select.appendChild(d);
                        };
                if (self.data === null) {
                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        dataType: 'json',
                        data: {
                            action: 'tb_get_menu',
                            tb_load_nonce: themifyBuilder.tb_load_nonce
                        },
                        success: function (res) {
                            self.data = res;
                            callback();
                        }
                    });
                }
                else {
                    callback();
                }
            },
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        select_wrap = document.createElement('div'),
                        select = document.createElement('select'),
                        help = document.createElement('small'),
                        v = self.values[data.id];
                select_wrap.className = 'selectwrapper';
                select.className = 'select_menu_field';
                if (self.is_repeat === true) {
                    select.className += ' tb_lb_option_child';
                    select.dataset['inputId'] = data.id;
                }
                else {
                    select.className += ' tb_lb_option';
                    select.id = data.id;
                }
                if (data['class'] !== undefined) {
                    select.className += ' ' + data.class;
                }
                help.innerHTML = self.label.menu_help;
                var def = document.createElement('option');
                def.value = '';
                def.text = self.label.select_menu;
                d.appendChild(def);
                def = null;
                this.get(select, v);

                select_wrap.appendChild(self.initControl(select, data));
                d = document.createDocumentFragment();
                d.appendChild(select_wrap);
                d.appendChild(document.createElement('br'));
                d.appendChild(help);
                return d;
            }
        },
        sticky: {
            render: function (data, self) {
                var unstickOption = {},
                        selectedUID = api.activeModel.get('element_id'),
                        _data = $.extend(true, {}, data),
                        uidList = api.Utils.getUIDList(data.key);
                for (var i = 0, len = uidList.length; i < len; ++i) {
                    if (uidList[i].element_id !== selectedUID) {
                        var uidText = 'row' === uidList[i].elType ? 'Row #' + uidList[i].element_id : uidList[i].mod_name + ' #' + uidList[i].element_id;
                        if ('row' === uidList[i].elType && uidList[i].styling && uidList[i].styling.custom_css_id) {
                            uidText = '#' + uidList[i].styling.custom_css_id;
                        }
                        else if ('module' === uidList[i].elType && uidList[i].mod_settings && uidList[i].mod_settings.custom_css_id) {
                            uidText = '#' + uidList[i].mod_settings.custom_css_id;
                        }
                        unstickOption[uidList[i].element_id] = uidText;
                    }
                }
                uidList = null;
                _data.options = unstickOption;
                return self.select.render(_data, self);
            }
        },
        selectSearch: {
            update: function (val, search, options, self) {
                var f = document.createDocumentFragment(),
                        first = null;
                search.removeAttribute('data-value');
                search.value = '';
                if (options !== undefined) {
                    for (var k in options) {
                        var item = document.createElement('div');
                        if (first === null) {
                            first = k;
                        }
                        item.dataset['value'] = k;
                        item.className = 'tb_search_item';
                        item.textContent = options[k];
                        if (val === k) {
                            item.className += ' selected';
                            search.setAttribute('data-value', k);
                            search.value = options[k];
                        }
                        f.appendChild(item);
                    }

                    if (search.value === '' && first !== null) {
                        search.value = options[first];
                        search.setAttribute('data-value', first);
                    }
                }
                return f;
            },
            events: function (search, container) {
                search.addEventListener('keyup', function (e) {
                    var items = container.getElementsByClassName('tb_search_item'),
                            val = this.value.trim(),
                            r = new RegExp(val, 'i');
                    for (var i = 0, len = items.length; i < len; ++i) {
                        if (val === '' || r.test(items[i].textContent)) {
                            items[i].style['display'] = 'block';
                        }
                        else {
                            items[i].style['display'] = 'none';
                        }
                    }
                },{passive: true});
                container.addEventListener('mousedown', function (e) {
                    if (e.which === 1 && e.target.classList.contains('tb_search_item')) {
                        e.preventDefault();
                        e.stopPropagation();
                        var all_items = this.getElementsByClassName('tb_search_item'),
                                _this = e.target;
                        for (var i = all_items.length - 1; i > -1; --i) {
                            all_items[i].classList.remove('selected');
                        }
                        _this.classList.add('selected');
                        var v = _this.dataset['value'];
                        search.value = _this.textContent;
                        search.dataset['value'] = v;
                        search.blur();
                        search.previousElementSibling.blur();
                        Themify.triggerEvent(search, 'selectElement', {val: v});
                    }
                });
            },
            render: function (data, self) {
                var container = document.createElement('div'),
                        arrow = document.createElement('div'),
                        search = document.createElement('input'),
                        loader = document.createElement('span'),
                        search_container = document.createElement('div');
                container.className = 'tb_search_wrapper';
                search.className = 'tb_search_input';
                search.autocomplete = 'off';
                search_container.className = 'tb_search_container';
                if (self.is_repeat === true) {
                    search.className += ' tb_lb_option_child';
                    search.dataset['inputId'] = data.id;
                }
                else {
                    search.className += ' tb_lb_option';
                    search.id = data.id;
                }
                if (data['class'] !== undefined) {
                    search.className += ' ' + data['class'];
                }
                loader.className = 'fa fa-spin fa-spinner';
                search_container.tabIndex = 1;
                arrow.tabIndex = 1;
                arrow.className = 'tb_search_arrow';
                search.type = 'text';
                search.placeholder = (data.placeholder !== undefined ? data.placeholder : data.label) + '...';
                search_container.appendChild(this.update(self.values[data.id], search, data.options, self));
                arrow.appendChild(loader);
                container.appendChild(arrow);
                container.appendChild(self.initControl(search, data));
                container.appendChild(search_container);
                if (data['after'] !== undefined) {
					container.appendChild(self.after(data ));
                }
                if (data['description'] !== undefined) {
                    container.appendChild(self.description(data.description));
                }
				if (data['tooltip'] !== undefined) {
					container.appendChild(self.tooltip(data.tooltip));
				}
                this.events(search, search_container);
                setTimeout(function () {
                    new SimpleBar(search_container);
                }, 100);

                return container;
            }
        },
        optin_provider : {
                cache:null,
                render : function ( data, self ) {
                        var el = document.createElement( 'div' ),
                            _this = this,
                            callback = function(){
                                  el.appendChild(self.create( _this.cache ));
                            };
                        if(this.cache===null){
                            Common.showLoader( 'show' );
                            $.ajax({
                                    type: 'POST',
                                    url: themifyBuilder.ajaxurl,
                                    dataType: 'json',
                                    data: {
                                            action: 'tb_optin_get_settings',
                                            tb_load_nonce: themifyBuilder.tb_load_nonce
                                    },
                                    success : function( result ) {
                                            Common.showLoader( 'spinhide' );
                                            _this.cache=result;
                                            callback();
                                            self.callbacks();
                                    },
                                    error: function () {
                                            Common.showLoader( 'error' );
                                    }
                            });
                        }
                        else{
                            callback();
                        }
                        return el;
                }
        },
        check_map_api : {
            render : function ( data, self ) {
                if(!themifyBuilder[data.map+'_api']){
                    var errData = {
                        type:'separator',
                        html:'<span>'+themifyBuilder[data.map+'_api_err']+'</span>',
                        wrap_class:'tb_group_element_'+data.map
                    };
                    return self.separator.render(errData, self)
                }else{
                    return document.createElement('span');
                }
            }
        },
        query_posts: {
            cacheTypes: null,
            cacheTerms: [],
            render: function (data, self) {
                var _this = this,
                    tmp_el,
                    desc = data.description,
                    after= data.after,
                    values=self.values,
                    formatData = function (options) {
                        var result = [];
                        for (var k in options) {
                            result[k] = options[k].name;
                        }
                        return result;
                    },
                    update = function (item, val, options) {
                        var container = item.nextElementSibling.getElementsByClassName('simplebar-content')[0];
                        if (container === undefined) {
                            container = item.nextElementSibling;
                        }
                        while (container.firstChild) {
                            container.removeChild(container.firstChild);
                        }
                        container.appendChild(self.selectSearch.update(val, item, options, self));
                    },
                    get = function (wr, val, type) {
                        wr.classList.add('tb_search_wait');
                        return $.ajax({
                            type: 'POST',
                            url: themifyBuilder.ajaxurl,
                            dataType: 'json',
                            data: {
                                action: 'tb_get_post_types',
                                tb_load_nonce: themifyBuilder.tb_load_nonce,
                                type: type,
                                v: val
                            },
                            complete: function () {
                                wr.classList.remove('tb_search_wait');
                            }
                        });
                    };
                (function () {
                    var _data = $.extend(true, {}, data),
                        timeout = null;
                    tmp_el = document.createElement('div');
                    tmp_el.id = data.id ? data.id : data.term_id;

                    self.afterRun.push(function () {
                        var opt = ['id', 'tax_id', 'term_id'],
                                fr = document.createDocumentFragment(),
                                isInit = null,
                                getTerms = function (search, val) {
                                    var termsCallback = function () {
                                        if(data['term_id']===undefined){
                                            return;
                                        }
                                        var term_id = data['term_id'].replace('#tmp_id#', val),
                                                parent = search.closest('.tb_input'),
                                                term_val;
                                        search.id = term_id;
                                        if (isInit === null && values[term_id] !== undefined) {
                                            term_val = values[term_id].split('|')[0];
                                        }
                                        if (!term_val) {
                                            term_val = 0;
                                        }
                                        update(search, term_val, _this.cacheTerms[val]);
                                        if (isInit === null) {
                                            var multiply = document.createElement('input'),
                                                    or = document.createElement('span'),
                                                    wr = document.createElement('div');
                                            or.innerHTML = self.label.or;
                                            multiply.type = 'text';
                                            multiply.className = 'query_category_multiple';
                                            wr.className = 'tb_query_multiple_wrap';
                                            wr.appendChild(or);
                                            wr.appendChild(multiply);
                                            parent.insertBefore(wr, parent.nextSibling);
                                            if (after !== undefined) {
                                                parent.appendChild(self.after(after));
                                            }
                                            if (desc!== undefined) {
                                                parent.appendChild(self.description(desc));
                                            }
                                            if (data['slug_id'] !== undefined) {
                                                var referenceNode = parent.parentNode,
                                                        query_by = self.create([{
                                                                type: 'radio',
                                                                id: 'term_type',
                                                                label: self.label['query_by'],
                                                                default: values['term_type'] === undefined && values[data['tax_id']] === 'post_slug' ? 'post_slug' : false, //backward compatibility
                                                                option_js: true,
                                                                options: [
                                                                    {value: 'category', name: self.label['query_term_id']},
                                                                    {value: 'post_slug', name: self.label['slug_label']}
                                                                ]
                                                            }]),
                                                        slug = self.create([{
                                                                id: data['slug_id'],
                                                                type: 'text',
                                                                'class': 'large',
                                                                wrap_class: 'tb_group_element_post_slug',
                                                                help: self.label['slug_desc'],
                                                                label: self.label['slug_label']
                                                            }]);
                                                referenceNode.parentNode.insertBefore(query_by, referenceNode);
                                                referenceNode.parentNode.appendChild(slug);

                                            }
                                            multiply.addEventListener('change', function (e) {
                                                Themify.triggerEvent(search, 'queryPosts', {val: term_val});
                                            },{passive: true});
                                            if (timeout !== null) {
                                                clearTimeout(timeout);
                                            }
                                            timeout = setTimeout(function () {
                                                self.callbacks();
                                            }, 2);
                                        }
                                        parent.getElementsByClassName('query_category_multiple')[0].value = term_val;

                                        if (isInit === true || self.is_new) {
                                            Themify.triggerEvent(search, 'queryPosts', {val: term_val});
                                        }
                                        else {
                                            api.Constructor.settings = api.Utils.clear(api.Forms.serialize('tb_options_setting'));
                                        }
                                        isInit = true;
                                    };
                                    if (_this.cacheTerms[val] === undefined) {
                                        get(search.parentNode, val, 'terms').done(function (res) {
                                            _this.cacheTerms[val] = res;
                                            termsCallback();
                                        });
                                    }
                                    else {
                                        termsCallback();
                                    }
                                };
                        for (var i = 0, len = opt.length; i < len; ++i) {
                            if (!_data[opt[i]]) {
                                continue;
                            }
                            _data.id = _data[opt[i]];
                            _data.label = self.label['query_' + opt[i]];
                            _data.type = 'selectSearch';
                            if (opt[i] === 'term_id') {
                                _data.wrap_class = 'tb_search_term_wrap tb_group_element_category';
                                _data.class = 'query_category_single';
                                _data.help = self.label['query_desc'];
                                _data['control'] = {control_type: 'queryPosts'};
                            }
                            delete _data.description;
                            delete _data.after;
                            var res = self.create([_data]);
                            (function () {
                                var is_post = opt[i] === 'id',
                                        is_term = opt[i] === 'term_id',
                                        v = is_term ? '' : values[_data.id],
                                        search = res.querySelector('.tb_search_input');
                                search.addEventListener('selectElement', function (e) {
                                    var val = e.detail.val,
                                            nextsearch = this.closest('.tb_field');
                                    if (!is_term) {
                                            nextsearch = nextsearch.nextElementSibling;
                                            if (!is_post && isInit === true && data['slug_id'] !== undefined && nextsearch!==null) {
                                                nextsearch = nextsearch.nextElementSibling;
                                            }
                                            if(nextsearch!==null){
                                                nextsearch = nextsearch.getElementsByClassName('tb_search_input')[0];
                                                if (is_post) {
                                                    if (_this.cacheTypes[val] !== undefined) {
                                                        update(nextsearch, values[data['tax_id']], formatData(_this.cacheTypes[val].options));
                                                        Themify.triggerEvent(nextsearch, 'selectElement', {val: nextsearch.getAttribute('data-value')});
                                                    }
                                                }
                                                else {
                                                    getTerms(nextsearch, val);
                                                }
                                            }
                                    }
                                    else {
                                        nextsearch.getElementsByClassName('query_category_multiple')[0].value = val;
                                        Themify.triggerEvent(nextsearch.getElementsByClassName('tb_search_input')[0], 'queryPosts', {val: val});
                                    }
                                },{passive: true});
                                if (is_post) {
                                    var callback = function () {
                                        if (!v) {
                                            v = 'post';
                                        }
                                        update(search, v, formatData(_this.cacheTypes));
                                        Themify.triggerEvent(search, 'selectElement', {val: v});
                                        search = null;
                                    };
                                    if (_this.cacheTypes === null) {
                                        get(search.parentNode, null, 'post_types').done(function (res) {
                                            _this.cacheTypes = res;
                                            callback();
                                        });
                                    }
                                    else {
                                        setTimeout(callback, 10);
                                    }
                                }
                                else if (is_term && !data['id'] && data['taxonomy'] !== undefined) {
                                    getTerms(search, data['taxonomy']);
                                }
                            })();
                            fr.appendChild(res);
                        }
                        tmp_el.parentNode.replaceChild(fr, tmp_el);
                        _data = tmp_el = null;
                    });
                })();
                return tmp_el;
            }
        },
        range: {
            update: function (id, v, self) {
                var range = topWindow.document.getElementById(id);
                if (range !== null) {
                    range.value = v !== undefined ? v : '';
                    var unit_id = id + '_unit',
                            unit = topWindow.document.getElementById(unit_id);
                    if (unit !== null && unit.tagName === 'SELECT') {
                        var v = self.getStyleVal(unit_id);
                        if (v === undefined) {
                            v = unit[0].value;
                        }
                        unit.value = v;
                        this.setData(range, (unit.selectedIndex !== -1 ? unit[unit.selectedIndex] : unit[0]));
                    }
                }
            },
            setData: function (range, item) {
                range.dataset['min'] = item.dataset['min'];
                range.dataset['max'] = item.dataset['max'];
                range.dataset['increment'] = item.dataset['increment'];
            },
            controlChange: function (range, unit, event) {
                var is_select = unit !== undefined && unit.tagName === 'SELECT',
                        _this = this;
                function changeValue(condition) {
                    var increment = range.dataset['increment'];
                    if (!increment) {
                        return;
                    }
                    var is_increment = increment % 1 !== 0,
                            max = parseFloat(range.dataset['max']),
                            min = parseFloat(range.dataset['min']),
                            cval = range.value,
                            val = !is_increment ? parseInt(cval || 0) : parseFloat(cval || 0);
                    increment = !is_increment ? parseInt(increment) : parseFloat(increment);

                    if ('increase' === condition && val < max) {
                        if (val < min) {
                            range.value = is_increment ? parseFloat(min).toFixed(1) : parseInt(min);
                            return;
                        }
                        range.value = is_increment ? parseFloat(val + increment).toFixed(1) : (val + increment);
                    }
                    else if (val > min) {
                        if (val > max) {
                            range.value = is_increment ? parseFloat(max).toFixed(1) : parseInt(max);
                            return;
                        }
                        range.value = is_increment ? parseFloat(val - increment).toFixed(1) : (val - increment);
                    }
                    if (range.value.trim()) {
                        range.value = is_increment ? parseFloat(range.value).toFixed(1) : parseInt(range.value);
                    }
                }
                range.addEventListener('mousedown', function (e) {
                    if (e.which === 1) {
                        var lastY = e.pageY,
                                that = this,
                                old_v = range.value,
                                callback = function (e) {
                                    if (e.pageY < lastY) {
                                        changeValue('increase');
                                    } else if (e.pageY > lastY) {
                                        changeValue('decrease');
                                    }
                                    lastY = e.pageY;
                                    Themify.triggerEvent(that, event);
                                };
                        topWindow.document.addEventListener('mousemove', callback,{passive: true});
                        topWindow.document.addEventListener('mouseup', function _move() {
                            topWindow.document.removeEventListener('mousemove', callback,{passive: true});
                            if (range.value !== old_v) {
                                Themify.triggerEvent(that, event);
                            }
                            api.hasChanged = true;
                            topWindow.document.removeEventListener('mouseup', _move, {once: true,passive: true});
                        }, {once: true,passive: true});
                    }
                },{passive: true});
                range.addEventListener('keydown', function (e) {
                    if (e.which === 38) {
                        changeValue('increase');
                    } else if (e.which === 40) {
                        changeValue('decrease');
                    }
                    Themify.triggerEvent(this, event);
                },{passive: true});
                if (is_select === true) {
                    unit.addEventListener('change', function (e) {
                        _this.setData(range, unit.options[ unit.selectedIndex ]);
                        Themify.triggerEvent(range, 'change');
                    },{passive: true});
                }
                if (unit !== undefined) {
                    _this.setData(range, is_select ? (unit.selectedIndex !== -1 ? unit[unit.selectedIndex] : unit[0]) : unit);
                }
            },
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        wrapper = document.createElement('div'),
                        range_wrap = document.createElement('span'),
                        input = document.createElement('input'),
                        v = self.getStyleVal(data.id);
                wrapper.className = 'tb_tooltip_container';
                if (data.wrap_class !== undefined) {
                    wrapper.className = ' ' + data.wrap_class;
                }
                range_wrap.className = 'tb_range_input';
                input.autocomplete = 'off';
                input.type = 'text';
                input.className = 'tb_range';
                if (v !== undefined) {
                    input.value = v;
                }
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className += ' tb_lb_option';
                    input.id = data.id;
                }
                if (data.class !== undefined) {
                    input.className += ' ' + data.class;
                }
                range_wrap.appendChild(input);
                if (data.tooltip !== undefined) {
					range_wrap.appendChild(self.tooltip(data.tooltip));
                }
                d.appendChild(range_wrap);
                if (data['units'] === undefined) {
                    input.dataset['min'] = 0;
                    input.dataset['max'] = 500;
                    input.dataset['increment'] = 1;
                }
                else {
                    var select_wrap = document.createElement('div'),
                            keys = Object.keys(data.units),
                            select;
                    select_wrap.className = 'selectwrapper noborder';
                    if (keys.length > 1) {
                        var options = document.createDocumentFragment(),
                                v = self.getStyleVal(data.id + '_unit'),
                                select_id = data.id + '_unit';
                        select = document.createElement('select');
                        select.className = 'tb_unit';

                        if (self.is_repeat === true) {
                            select.className += ' tb_lb_option_child';
                            select.dataset['inputId'] = select_id;
                        }
                        else {
                            select.className += ' tb_lb_option';
                            select.id = select_id;
                        }
                        if (data.select_class !== undefined) {
                            select.className += ' ' + data.select_class;
                        }
                        for (var i in data.units) {
                            var opt = document.createElement('option');
                            opt.value = i;
                            opt.textContent = i;
                            opt.dataset['min'] = data.units[i].min;
                            opt.dataset['max'] = data.units[i].max;
                            opt.dataset['increment'] = data.units[i].increment !== undefined ? data.units[i].increment : (i === 'em' || i === 'em' ? .1 : 1);
                            if (v === i) {
                                opt.selected = true;
                            }
                            options.appendChild(opt);
                        }
                        select.appendChild(options);
                        self.initControl(select, {type: 'select', 'id': select_id, control: data.control});
                    }
                    else {
                        var unit = keys[0];
                        select = document.createElement('span');
                        select.className = 'tb_unit';
                        select.id = data.id + '_unit';
                        select.dataset['min'] = data.units[unit].min;
                        select.dataset['max'] = data.units[unit].max;
                        select.dataset['increment'] = data.units[unit].increment !== undefined ? data.units[unit].increment : (unit === 'em' || unit === 'em' ? .1 : 1);
                        select.textContent = unit;
                    }
                    select_wrap.appendChild(select);
                    d.appendChild(select_wrap);
                }
                if (data.after !== undefined) {
                    d.appendChild(self.after(data.after));
                }
                if (data.description !== undefined) {
                    d.appendChild(self.description(data.description));
                }
                wrapper.appendChild(d);
                this.controlChange(input, select, self.clicked === 'styling' ? 'keyup' : 'change');
                var ndata = $.extend({}, data);
                ndata.type = 'range';
                self.initControl(input, ndata);
                return wrapper;
            }
        },
        icon: {
            render: function (data, self) {
                var wr = document.createElement('div'),
                        input = document.createElement('input'),
                        preview = document.createElement('span'),
                        clear = document.createElement('span'),
                        v = self.getStyleVal(data.id);
                input.type = 'text';
                input.className = 'themify_field_icon';
                preview.className = 'tb_plus_btn themify_fa_toggle icon-close';
                wr.className = 'tb_icon_wrap';
                clear.className='tb_clear_input';
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className += ' tb_lb_option';
                    input.id = data.id;
                }
                if (data.class !== undefined) {
                    input.className += ' ' + data.class;
                }
                if (v !== undefined) {
                    input.value = v;
                    var p = api.Utils.getIcon(v);
                    if (p === false) {
                        p='default_icon';
                    }
                    preview.className += ' ' + p;
                }
                else{
                    preview.className += ' default_icon';
                }
                wr.appendChild(self.initControl(input, data));
                wr.appendChild(preview);
                wr.appendChild(clear);
                return wr;
            }
        },
        createMarginPadding: function (type, data, self) {
            var options = data.options !== undefined ? data.options : [
					{ id: 'top', label : api.Constructor.label.top },
					{ id: 'right', label : api.Constructor.label.right },
					{ id: 'bottom', label : api.Constructor.label.bottom },
					{ id: 'left', label : api.Constructor.label.left },
				],
				d = document.createDocumentFragment(),
				ul = document.createElement('ul'),
				id = data.id,
				range = $.extend(true, {}, data);
            range['class'] = 'tb_multi_field';
            range['units'] = {
                px: {
                    min: (type === 'margin' ? -500 : 0),
                    max: 500
                },
                em: {
                    min: (type === 'margin' ? -10 : 0),
                    max: 10
                },
                '%': {
                    min: (type === 'margin' ? -100 : 0),
                    max: 100
                }
            };
            range.prop = null;
            ul.className = 'tb_seperate_items tb_inline_list';
            for (var i = 0, len = options.length; i < len; ++i) {
                var li = document.createElement('li'),
                        prop_id = id + '_' + options[i].id;
                range.id = prop_id;
                range.tooltip = options[i].label;
                li.appendChild(self.range.render(range, self));
                d.appendChild(li);
                this.styles[prop_id] = {prop: type + '-' + options[i].id, selector: data.selector};
            }

            ul.appendChild(d);
            range = null;
            d = document.createDocumentFragment();
            d.appendChild(ul);
            if (len === 4) {
                var fId = 'checkbox_' + id + '_apply_all';
                d.appendChild(self.checkboxGenerate('icon_checkbox',
                        {
                            id: fId,
                            'class': 'style_apply_all',
                            options: [
                                {name: '1', value: self.label.all, icon: '<span class="apply_all_checkbox_icon"></span>'}
                            ],
                            'default': (this.component === 'module' && this.is_new === true) ||  Object.keys(this.values).length === 0 ? '1' : false,
                            'new_line': false
                        }
                ));
                var apply_all = d.querySelector('.style_apply_all');
                apply_all.addEventListener('change', function (e) {
                    self.margin.apply_all(this, true);
                },{passive: true});
                if (apply_all.checked === true) {
                    self.afterRun.push(function () {
                        self.margin.apply_all(apply_all);
                    });
                }
            }
            return d;
        },
        margin: {
            apply_all: function (item, trigger) {
                var ul = item.closest('.tb_input').getElementsByClassName('tb_seperate_items')[0],
                        first = ul.getElementsByTagName('li')[0],
                        text;
                if (item.checked === true) {
                    ul.setAttribute('data-checked', 1);
                    text = api.Constructor.label.all;

                }
                else {
                    ul.removeAttribute('data-checked');
                    text = api.Constructor.label.top;
                }
                if (trigger === true) {
                    Themify.triggerEvent(first.getElementsByTagName('select')[0], 'change');
                }
                first.getElementsByClassName('tb_tooltip_up')[0].textContent = text;
            },
            update: function (id, v, self) {
                var options = ['top', 'right', 'bottom', 'left'],
                        checkbox_id = 'checkbox_' + id + '_apply_all';
                for (var i = 0; i < 4; ++i) {
                    var nid = id + '_' + options[i],
                            el = topWindow.document.getElementById(nid);
                    if (el !== null) {
                        self.range.update(nid, self.getStyleVal(nid), self);
                    }
                }
                self.checkbox.update(checkbox_id, self.getStyleVal(checkbox_id), self);
                this.apply_all(topWindow.document.getElementById(checkbox_id).getElementsByClassName('style_apply_all')[0]);
            },
            render: function (data, self) {
                return self.createMarginPadding('margin', data, self);
            }
        },
        padding: {
            render: function (data, self) {
                return self.createMarginPadding('padding', data, self);
            }
        },
        box_shadow: {
            update: function (id, v, self) {
                var options = ['hOffset', 'vOffset', 'blur'];
                for (var i = 2;i>-1; --i) {
                    var nid = id + '_' + options[i],
                        el = topWindow.document.getElementById(nid);
                    if (el !== null) {
                        self.range.update(nid, self.getStyleVal(nid), self);
                    }
                }
                var color_id = id + '_color',
                    checkbox_id = id + '_inset';
                self.color.update(color_id, self.getStyleVal(color_id), self);
                self.checkbox.update(checkbox_id, self.getStyleVal(checkbox_id), self);
            },
            render: function (data, self) {
                var ranges = {
                        hOffset: {
                            label: self.label.h_o,
                            units: {px: {min: -200, max: 200}, em: {min: 0, max: 10}}
                        },
                        vOffset: {
                            label: self.label.v_o,
                            units: {px: {min: -200,max: 200},em: {min: 0,max: 10}}
                        },
                        blur: {
                            label: self.label.bl,
                            units: {px: {min: 0, max: 300}, em: {min: 0, max: 10}}
                        }
                    },
                    d = document.createDocumentFragment(),
                    ul = document.createElement('ul'),
                    id = data.id,
                    range = $.extend(true, {}, data);
                range['class'] = 'tb_shadow_field';
                range.prop = null;
                ul.className = 'tb_seperate_items tb_inline_list tb_shadow_inputs';
                for (var rangeField in ranges) {
                    if (ranges[rangeField]!==undefined){
                        var rField = ranges[rangeField],
                            li = document.createElement('li'),
                            prop_id = id + '_' + rangeField;
                        range.id = prop_id;
                        range.tooltip = rField.label;
                        range['units'] = rField.units;
                        range['selector'] = data.selector;
                        li.appendChild(self.range.render(range, self));
                        d.appendChild(li);
                        self.styles[prop_id] = {prop: data.prop, selector: data.selector};
                    }
                }
                // Add color field
                var li = document.createElement('li'),
                    prop_id = id + '_color',
                    color = {id: prop_id, type:'color', class:range['class'], selector: data.selector};
                self.styles[prop_id] = {prop: data.prop, selector: data.selector,type:'color'};
                li.appendChild(self.color.render(color, self));
                d.appendChild(li);
                // Add inset checkbox
                var inset = document.createElement('li'),
                    prop_id = id + '_inset',
                    coptions = {
                    id: prop_id,
                    origID: id,
                    type: 'checkbox',
                    class:range['class'],
                    isBoxShadow: true,
                    prop:data.prop,
                    options: [
                        {value: self.label.in_sh, name: 'inset'}
                    ]
                },
                checkboxWrap = self.checkboxGenerate('checkbox', coptions);
                self.styles[prop_id] = {prop: data.prop, selector: data.selector};
                inset.className='tb_box_shadow_inset';
                inset.appendChild(checkboxWrap);
                d.appendChild(inset);
                ul.appendChild(d);
                return ul;
            }
        },
        text_shadow: {
            update: function (id, v, self) {
                var options = [self.label.h_sh, self.label.v_sh, self.label.bl];
                for (var i = 2; i >-1; --i) {
                    var nid = id + '_' + options[i],
                        el = topWindow.document.getElementById(nid);
                    if (el !== null) {
                        self.range.update(nid, self.getStyleVal(nid), self);
                    }
                }
                var color_id = id + '_color';
                self.color.update(color_id, self.getStyleVal(color_id), self);
            },
            render: function (data, self) {
                var ranges = {
                        hShadow: {
                            label: self.label.h_sh,
                            units: {px: {min: -200, max: 200}, em: {min: 0, max: 10}}
                        },
                        vShadow: {
                            label: self.label.v_sh,
                            units: {px: {min: -200, max: 200}, em: {min: 0, max: 10}}
                        },
                        blur: {
                            label: self.label.bl,
                            units: {px: {min: 0, max: 300}, em: {min: 0, max: 10}}
                        }
                    },
                    d = document.createDocumentFragment(),
                    ul = document.createElement('ul'),
                    id = data.id,
                    range = $.extend(true, {}, data);
                range['class'] = 'tb_shadow_field';
                range.prop = null;
                ul.className = 'tb_seperate_items tb_inline_list tb_shadow_inputs';
                for (var rangeField in ranges) {
                    if (!ranges.hasOwnProperty(rangeField)) continue;

                    var rField = ranges[rangeField],
                        li = document.createElement('li'),
                        prop_id = id + '_' + rangeField;
                    range.id = prop_id;
                    range.tooltip = rField.label;
                    range['units'] = rField.units;
                    li.appendChild(self.range.render(range, self));
                    d.appendChild(li);
                    self.styles[prop_id] = {prop: data.prop, selector: data.selector};
                }
                // Add color field
                var li = document.createElement('li'),
                    prop_id = id + '_color',
                    color = {id: prop_id, type:'color', class: range['class'],selector:data.selector};
                self.styles[prop_id] = {prop: data.prop, selector: data.selector,type:'color'};
                li.appendChild(self.color.render(color, self));
                d.appendChild(li);
                ul.appendChild(d);
                return ul;
            }
        },
        border_radius: {
            render: function (data, self) {
                return self.createMarginPadding(data.prop, data, self);
            }
        },
        border: {
            changeControl: function (item) {
                var p = item.parentNode,
                        v = item.value,
                        items = p.parentNode.children;
                for (var i = items.length - 1; i > -1; --i) {
                    if (items[i] !== p) {
                        if (v === 'none') {
                            items[i].classList.add('_tb_hide_binding');
                        }
                        else {
                            items[i].classList.remove('_tb_hide_binding');
                        }
                    }
                }
            },
            apply_all: function (border, item) {
                var items = item.getElementsByTagName('input'),
                        disable = function (is_all, event) {
                            for (var i = items.length - 1; i > 0; --i) {
                                var p = items[i].parentNode;
                                if (is_all === true) {
                                    p.classList.add('_tb_disable');
                                }
                                else {
                                    p.classList.remove('_tb_disable');
                                }
                            }
                            if (is_all === true) {
                                border.dataset['checked'] = 1;
                            }
                            else {
                                border.removeAttribute('data-checked');
                            }
                            if (event === true) {
                                Themify.triggerEvent(border.children[0].getElementsByTagName('select')[0], 'change');
                            }
                        };
                for (var i = items.length - 1; i > -1; --i) {
                    items[i].addEventListener('change', function () {
                        disable(this.value === 'all', true);
                    },{passive: true});
                    if (items[i].checked === true && items[i].value === 'all') {
                        disable(true, null);
                    }
                }
            },
            update: function (id, v, self) {
                var options = ['top', 'right', 'bottom', 'left'],
                        radio_id = id + '-type';
                for (var i = 0; i < 4; ++i) {
                    var nid = id + '_' + options[i],
                            color_id = nid + '_color',
                            style_id = nid + '_style',
                            range_id = nid + '_width';
                    self.color.update(color_id, self.getStyleVal(color_id), self);
                    self.select.update(style_id, self.getStyleVal(style_id), self);
                    this.changeControl(topWindow.document.getElementById(style_id));
                    self.range.update(range_id, self.getStyleVal(range_id), self);
                }
                self.radio.update(radio_id, self.getStyleVal(radio_id), self);
            },
            render: function (data, self) {
                var options = ['top', 'right', 'bottom', 'left'],
                        ul = document.createElement('ul'),
                        d = document.createDocumentFragment(),
                        f = document.createDocumentFragment(),
                        orig_id = data.id,
                        select = $.extend(true, {}, data),
                        _this = this,
                        radio = $.extend(true, {}, data);
                radio['options'] = [
                    {value: 'all', name: self.label.all, 'class': 'style_apply_all', icon: '<i class="tic-border-all"></i>', label_class: 'tb_radio_label_borders'}
                ];
                radio['option_js'] = true;
                radio.id = orig_id + '-type';
                radio.no_toggle = true;
                radio['default'] = 'top';
                radio.prop = null;

                select['options'] = self.static['border'];
                select.prop = null;

                ul.className = 'tb_seperate_items tb_borders tb_group_element_border';
                for (var i = 0; i < 4; ++i) {
                    var li = document.createElement('li'),
                            id = orig_id + '_' + options[i];
                    radio['options'].push({value: options[i], name: self.label[options[i]], icon: '<i class="tic-border-' + options[i] + '"></i>', label_class: 'tb_radio_label_borders'});

                    li.className = 'tb_group_element_' + options[i];
                    if (options[i] === 'top') {
                        li.className += ' tb_group_element_all';
                    }
                    self.styles[id + '_color'] = {prop: 'border-' + options[i], selector: data.selector};
                    select.id = id + '_color';
                    select.type = 'color';
                    select.class = 'border_color';
                    d.appendChild(self.color.render(select, self));

                    self.styles[id + '_width'] = {prop: 'border-' + options[i], selector: data.selector};
                    select.id = id + '_width';
                    select.type = 'range';
                    select.class = 'border_width';
                    select.wrap_class = 'range_wrapper';
                    select.units = {px: {min: 0, max: 300}};
                    d.appendChild(self.range.render(select, self));

                    self.styles[id + '_style'] = {prop: 'border-' + options[i], selector: data.selector};
                    select.id = id + '_style';
                    select.type = 'select';
                    select.class = 'border_style tb_multi_field';
                    var border_select = self.select.render(select, self),
                            select_item = border_select.querySelector('select');
                    d.appendChild(border_select);

                    li.appendChild(d);
                    f.appendChild(li);
                    select_item.addEventListener('change', function (e) {
                        _this.changeControl(this);
                    },{passive: true});
                    if (select_item.value === 'none') {
                        _this.changeControl(select_item);
                    }

                }
                ul.appendChild(f);
                d = document.createDocumentFragment();
                d.appendChild(self.radioGenerate('icon_radio', radio, self));
                _this.apply_all(ul, d.querySelector('#' + radio.id));
                d.appendChild(ul);

                return d;
            }
        },
        slider: {
            render: function (data, self) {
                return self.create(self.getOptions(data));
            }
        },
        custom_css: {
            render: function (data, self) {
                data.class = 'large';
                data.control = false;
                data.help=self.label.custom_css_help;
                var el = self.text.render(data, self);
                api.Utils.changeOptions(el.querySelector('#'+data.id),data.type);
                return el;
            }
        },
        custom_css_id: {
            render: function (data, self) {
                var el= self.create([{
                    id: 'custom_css_id',
                    type: 'text',
                    label:self.label.id_name,
                    help: self.label.id_help,
                    control: false,
                    'class': 'large'
                }], self);
                api.Utils.changeOptions(el.querySelector('#custom_css_id'),data.type);
                return el;
            }
        },
        hidden: {
            render: function (data, self) {
                var input = document.createElement('input'),
                        v = self.getStyleVal(data.id);
                input.type = 'hidden';
                if (self.is_repeat === true) {
                    input.className += ' tb_lb_option_child';
                    input.dataset['inputId'] = data.id;
                }
                else {
                    input.className += ' tb_lb_option';
                    input.id = data.id;
                }
                if (data.class !== undefined) {
                    input.className += ' ' + data.class;
                }
                if (v !== undefined) {
                    input.value = v;
                }
                else if (data.value !== undefined) {
                    input.value = data.value;
                }
                return self.initControl(input, data);
            }
        },
        frame: {
            render: function (data, self) {
                data.options = self.static['frame'];
                data.class = 'tb_frame';
                return self.layout.render(data, self);
            }
        },
        title: {
            render: function (data, self) {
                data.class = 'large';
                data.control = {event: 'keyup', control_type: 'change', selector: '.module-title'};
                return self.text.render(data, self);
            }
        },
        button: {
            render: function (data, self) {
                var btn = document.createElement('button');
                btn.className = 'builder_button';
                btn.id = data.id;
                if (data.class !== undefined) {
                    btn.className += ' ' + data.class;
                }
                btn.textContent = data.name;
                return self.initControl(btn, data);
            }
        },
        row_anchor: {
            render: function (data, self) {
                data.control = false;
                var el = self.text.render(data, self);
                api.Utils.changeOptions(el.querySelector('#'+data.id),data.type);
                return el;
            }
        },
        widget_form: {
            render: function (data, self) {
                var container = document.createElement('div');
                container.id = data.id;
                container.className = 'module-widget-form-container wp-core-ui tb_lb_option';
                return container;
            }
        },
        widget_select: {
            data: null,
            el: null,
            cache: [],
            mediaInit: null,
            textInit: null,
            render: function (data, self) {
                var d = document.createDocumentFragment(),
                        filter = document.createElement('div'),
                        loader = document.createElement('i'),
                        search = document.createElement('input'),
                        available = document.createElement('div'),
                        select = document.createElement('div');

                filter.id = 'available-widgets-filter';
                loader.className = 'fa fa-spin fa-spinner tb_loading_widgets';
                search.type = 'text';
                search.id = 'widgets-search';
                search.dataset.validation = 'not_empty';
                search.dataset.errorMsg = self.label.widget_validate;
                search.autocomplete = 'off';
                search.placeholder = self.label.search_widget;

                available.id = 'available-widgets';
                available.tabIndex = 1;

                select.id = data.id;
                select.className = 'tb_lb_option tb_widget_select';

                this.el = select;
                filter.appendChild(loader);
                filter.appendChild(search);
                available.appendChild(select);
                d.appendChild(filter);
                d.appendChild(available);

                var _this = this,
                        val = self.values[data.id],
                        callback = function () {

                            var f = document.createDocumentFragment(),
                                    all_items = [],
                                    select_widget = function (item, instance_widget) {
                                        for (var i = all_items.length - 1; i > -1; --i) {
                                            all_items[i].classList.remove('selected');
                                        }
                                        item.classList.add('selected');
                                        var v = item.dataset['value'];
                                        search.value = item.getElementsByClassName('widget-title')[0].textContent;
                                        available.style['display'] = 'none';

                                        _this.select(v, _this.data[v].b, instance_widget, data);

                                    };
                            for (var i in _this.data) {
                                var w = document.createElement('div'),
                                        title = document.createElement('div'),
                                        h3 = document.createElement('h3');
                                w.className = 'widget-tpl ' + _this.data[i].b;
                                w.dataset['value'] = i;
                                title.className = 'widget-title';
                                h3.textContent = _this.data[i].n;
                                title.appendChild(h3);
                                w.appendChild(title);
                                w.addEventListener('click', function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    self.settings[data.id] = this.dataset['value'];
                                    select_widget(this, null);
                                });
                                all_items.push(w);
                                if (_this.data[i].d !== undefined) {
                                    var desc = document.createElement('div');
                                    desc.className = 'widget-description';
                                    desc.innerHTML = _this.data[i].d;
                                    w.appendChild(desc);
                                }
                                f.appendChild(w);
                                if (val === i) {
                                    select_widget(w, self.values['instance_widget']);
                                }
                            }
                            select.appendChild(f);

                            if (!val) {
                                new SimpleBar(select);
                            }
                            _this.search(search, available);
                            loader.parentNode.removeChild(loader);
                            loader = null;
                            api.hasChanged = true;
                        };
                if (_this.data === null) {

                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        dataType: 'json',
                        data: {
                            action: 'tb_get_widget_items',
                            nonce: themifyBuilder.tb_load_nonce
                        },
                        success: function (data) {
                            _this.data = data;
                            callback();
                        }
                    });

                    for (var i in themifyBuilder.widget_css) {
                        topWindow.Themify.LoadCss(themifyBuilder.widget_css[i], tbLocalScript.version);
                    }
                    themifyBuilder.widget_css = null;

                }
                else {
                    setTimeout(callback, 5);
                }
                return d;
            },
            search: function (search, available) {
                var _this = this;
                search.addEventListener('focus', this.show.bind(this),{passive: true});
                search.addEventListener('blur', function (e) {
                    if (!e.relatedTarget || e.relatedTarget.id !== 'available-widgets') {
                        available.style['display'] = 'none';
                    }
                },{passive: true});
                search.addEventListener('keyup', function (e) {
                    _this.show();
                    var val = this.value.trim(),
                            r = new RegExp(val, 'i'),
                            items = _this.el.getElementsByClassName('widget-tpl');
                    for (var i = 0, len = items.length; i < len; ++i) {
                        if (val === '') {
                            items[i].style['display'] = 'block';
                        }
                        else {
                            var title = items[i].getElementsByTagName('h3')[0];
                            title = title.textContent || title.innerText;
                            if (r.test(title)) {
                                items[i].style['display'] = 'block';
                            }
                            else {
                                items[i].style['display'] = 'none';
                            }
                        }
                    }

                },{passive: true});
            },
            show: function () {
                //this.$el.next('.tb_field_error_msg').remove();
                this.el.closest('#available-widgets').style['display'] = 'block';
            },
            hide: function () {
                this.el.closest('#available-widgets').style['display'] = 'none';
            },
            select: function (val, base, settings_instance, args) {
                var _this = this,
                        instance = $('#instance_widget', Common.Lightbox.$lightbox),
                        callback = function (data) {
                            var initjJS = function () {
                                var form = $(data.form);
                                instance.addClass('open').html(form.html());
                                if (settings_instance) {
                                    for (var i in settings_instance) {
                                        form.find('[name="' + i + '"]').val(settings_instance[i]);
                                    }
                                }
                                form = null;
                                if (base === 'text') {
                                    if (wp.textWidgets) {
                                        if (!_this.textInit) {
                                            _this.textInit = true;
                                            wp.textWidgets.init();
                                        }
                                        if (settings_instance) {
                                            delete wp.textWidgets.widgetControls[settings_instance['widget-id']];
                                        }
                                    }

                                } else if (wp.mediaWidgets) {
                                    if (!_this.mediaInit) {
                                        wp.mediaWidgets.init();
                                        _this.mediaInit = true;
                                    }
                                    if (settings_instance) {
                                        delete wp.mediaWidgets.widgetControls[settings_instance['widget-id']];
                                    }
                                }
                                $(document).trigger('widget-added', [instance]);
                                base === 'text' && api.Constructor.initControl(instance.find('.wp-editor-area')[0], {control: {control_type: 'wp_editor', type: 'refresh'}});

                                if (settings_instance) {
                                    setTimeout(function () {
                                        new SimpleBar(topWindow.document.getElementById('tb_options_setting'));
                                        new SimpleBar(_this.el);
                                    }, 100);//widget animation delay is 50
                                }
                                if (api.mode === 'visual') {
                                    var settings = $.extend(true, {}, args);
                                    settings.id = instance[0].id;
                                    instance.on('change', ':input', function () {
                                        if (api.is_ajax_call === false) {
                                            api.Constructor.control.widget_select(instance, settings);
                                        }
                                    });
                                    if (val) {
                                        api.Constructor.control.widget_select(instance, settings);
                                    }
                                }
                                instance.removeClass('tb_loading_widgets_form').find('select').wrap('<span class="selectwrapper"/>');
                            },
                                    extra = function (data) {
                                        var str = '';
                                        if (typeof data === 'object') {
                                            for (var i in data) {
                                                if (data[i]) {
                                                    str += data[i];
                                                }
                                            }
                                        }
                                        if (str !== '') {
                                            var s = document.createElement('script');
                                            s.type = 'text/javascript';
                                            s.text = str;
                                            var t = document.getElementsByTagName('script')[0];
                                            t.parentNode.insertBefore(s, t);
                                        }
                                    },
                                    recurisveLoader = function (js, i) {
                                        var len = js.length,
                                                loadJS = function (src, callback) {
                                                    Themify.LoadAsync(src, callback, data.v);
                                                };
                                        loadJS(js[i].src, function () {
                                            if (js[i].extra && js[i].extra.after) {
                                                extra(js[i].extra.after);
                                            }
                                            ++i;
                                            i < len ? recurisveLoader(js, i) : initjJS();
                                        });
                                    };


                            if (_this.cache[base] === undefined) {
                                data.template && document.body.insertAdjacentHTML('beforeend', data.template);
                                data.src.length > 0 ? recurisveLoader(data.src, 0) : initjJS();
                            } else {
                                initjJS();
                            }
                        };

                instance.addClass('tb_loading_widgets_form').html('<i class="fa fa-refresh fa-spin"></i>');

                // backward compatibility with how Widget module used to save data
                if (settings_instance) {
                    $.each(settings_instance, function (i, v) {
                        var old_pattern = i.match(/.*\[\d\]\[(.*)\]/);
                        if ($.isArray(old_pattern) && old_pattern[1] !== 'undefined') {
                            delete settings_instance[ i ];
                            settings_instance[ old_pattern[1] ] = v;
                        }
                    });
                }

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: themifyBuilder.ajaxurl,
                    data: {
                        action: 'module_widget_get_form',
                        tb_load_nonce: themifyBuilder.tb_load_nonce,
                        load_class: val,
                        tpl_loaded: _this.cache[base] === 1 ? 1 : 0,
                        id_base: base,
                        widget_instance: settings_instance
                    },
                    success: function (data) {
                        if (data && data.form) {
                            callback(data);
                            _this.cache[base] = 1;
                        }
                    }
                });
            }
        },
        message:{
            render: function (data, self) {
                    var d = document.createElement('div');
                    if( data.class !== undefined ){
                        d.className += data.class;
                    }
                    d.innerHTML = data.comment;
                    return d;
            }
        },
        help: function (text) {
            var help = document.createElement('div'),
                    helpContent = document.createElement('div'),
                    icon = document.createElement('i');
            help.className = 'tb_help';
            icon.className = 'icon ti-help';
            helpContent.className = 'tb_help_content';
            icon.tabIndex = -1;
            helpContent.innerHTML = text;
            help.appendChild(icon);
            help.appendChild(helpContent);
            return help;
        },
        tooltip: function (text){
            var tooltip = document.createElement('span');
            tooltip.className = 'tb_tooltip_up';
            tooltip.textContent = text;
            return tooltip;
        },
        description: function (text) {
            var d = document.createElement('small');
                d.innerHTML = text;
            return d;
        },
        after:function( data ){
            var afterElem = document.createElement('span');
            afterElem.className = 'tb_input_after';
            afterElem.textContent = data.after;
            if ( ( data['label'] === undefined || data['label'] === '' )
                    && ( data['help'] !== undefined && data['help'] !== '' ) ){
                    afterElem.appendChild(this.help(data['help']));
            }
            return afterElem;
        },
        height: {
            update: function (id, v, self) {
                self.checkbox.update(id, self.getStyleVal(id), self);
            },
            render: function (data, self) {
                data.isHeight = true;
                var coptions = {
                    id: data.id + '_auto_height',
                    heightID: data.id,
                    type: 'checkbox',
                    isHeight: true,
                    prop: 'height',
                    options: [
                        {value: self.label.a_ht, name: 'auto'}
                    ]
                };
                var checkboxWrap = self.checkboxGenerate('checkbox', coptions),
                    checkbox = checkboxWrap.querySelector('.tb_lb_option'),
                    checkboxInput = checkboxWrap.querySelector('input'),
                    height,
                    heightData = $.extend(true, {}, data);
                checkboxInput.addEventListener('change',function(e){
                    var heightField = topWindow.document.getElementsByClassName('tb_group_element_' + data.id + '_height')[0];
                    if(e.target.checked){
                        heightField.classList.add('hide-auto-height');
                    }else{
                        heightField.classList.remove('hide-auto-height');
                    }
                });
                heightData.label = 'ht';
                heightData.type = 'range';
                heightData.id = data.id;
                heightData.prop = 'height';
                heightData.wrap_class = 'tb_group_element_' + data.id + '_height';
                if('auto' === self.values[data.id + '_auto_height']){
                    heightData.wrap_class += ' hide-auto-height';
                }
                heightData.units = {
                        px: {
                            min: 0,
                            max: 1200
                        },
                        vh: {
                            min: 0,
                            max: 100
                        },
                        '%':  {
                            min: 0,
                            max: 100
                        },
                        em: {
                            min: 0,
                            max: 200
                        }
                };

                height = self.create([heightData]);

                heightData = coptions = null;
                self.afterRun.push(function () {
                    var field = checkbox.parentNode.closest('.tb_field');
                    field.parentNode.insertBefore(height, field);
                    field = height = checkbox = null;
                });
                return checkboxWrap;
            }
        },
        toggle_switch:{
            update: function (id, v, self) {
                self.checkbox.update(id, self.getStyleVal(id), self);
            },
            controlChange:function(el,args){
                el.addEventListener('change', function () {
                    var v=this.checked===true?args['on'].name:(args['off']!==undefined?args['off'].name:'');
                    this.value=v;
                },{passive: true });
            },
             render : function ( data, self ) {
                var clone = $.extend(true,{},data),
                    orig = {},
                    label = document.createElement('div'),
                    state = 'off',
                    v = self.getStyleVal(data.id);
                clone['control']=false;
                if(clone['class']===undefined){
                    clone['class']='toggle_switch';
                }
                else{
                    clone['class']+=' toggle_switch';
                }
                var options = clone['options'];
                if(options===undefined || options==='simple'){
                        if(options==='simple'){
                            options = {
                                'on':{
                                    'name':'yes',
                                    'value' : self.label['y']
                                },
                                'off':{
                                    'name':'no',
                                    'value' : self.label['no']
                                }
                            };
                        }
                        else{
                            options = {
                                'on':{
                                    'name':'no',
                                    'value' : self.label['s']
                                },
                                'off':{
                                    'name':'yes',
                                    'value' :self.label['hi']
                                }
                            };
                            if(clone['default']===undefined){
                                clone['default']='on';
                            }
                        }
                } 
                if ( v === undefined ){
                    if(clone['default'] === 'on'){
                        state ='on';
                    }
                    v = state==='on'?options['on'].name:(options['off']!==undefined?options['off'].name:'');
                }
                else{
                    if(v===false){
                        v = '';
                    }
                    state=options['on'].name===v?'on':'off';
                }
                for(var i in options){
                    if ( clone['after'] === undefined && options[i]['value']!==undefined) {
                        label.setAttribute('data-'+i, self.label[options[i]['value']]!==undefined?self.label[options[i]['value']]:options[i]['value']);
                    }
                    orig[i] = options[i];
                }
                var k = Object.keys( options )[0];
                delete clone['binding'];
                delete options[k]['value'];
                delete clone['default'];
                clone['options'] = [options[k]];
                if(clone['wrap_checkbox']===undefined){
                    clone['wrap_checkbox'] = '';
                }
                clone['wrap_checkbox']+=' tb_switcher';
                label.className = 'switch_label';
                var checkBox = self.checkboxGenerate('checkbox',clone),
                    sw = checkBox.querySelector('.toggle_switch');
                    clone=null;
                    sw.value=v;
                    sw.checked=state==='on';
                    this.controlChange(sw,orig);
                    options=orig=null;
                sw.parentNode.appendChild(label);
                self.initControl(sw, data);
                return checkBox;
            }
        }

    };


    api.Views.BaseElement = Backbone.View.extend({
        type: 'default',
        initialize: function () {
            this.listenTo(this.model, 'custom:change', this.modelChange);
            this.listenTo(this.model, 'destroy', this.remove);
            this.listenTo(this.model, 'edit', this.edit);
            this.listenTo(this.model, 'duplicate', this.duplicate);
            this.listenTo(this.model, 'save', this.save);
            this.listenTo(this.model, 'importExport', this.importExport);
            this.listenTo(this.model, 'delete', this.delete);
            this.listenTo(this.model, 'copy', this.copy);
            this.listenTo(this.model, 'paste', this.paste);
            this.listenTo(this.model, 'change:view', this.setView);
        },
        setView: function (node) {
            this.setElement(node);
        },
        modelChange: function () {
            
            this.$el.attr(_.extend({}, _.result(this, 'attributes')));
            var el = this.render(),
                cid = api.beforeEvent.data('cid'),
                item =document.getElementsByClassName('tb_element_cid_' + cid)[0];
            item.parentNode.replaceChild(el.el,item);
            if (api.mode === 'visual') {
                this.model.trigger('visual:change');
            }
            else {
                if (api.eventName === 'row') {
                    cid = this.$el.data('cid');
                }
                api.undoManager.push(cid, api.beforeEvent, this.$el, api.eventName);
                api.Mixins.Builder.update(this.$el);
            }
        },
        remove: function () {
            this.$el.remove();
        },
        copy: function (e,target) {
            var $selected = this.$el,
                    model = this.model;
            var component = model.get('elType');
            if (component === 'column') {
                component = model.get('component_name');
            }
            var data = this.getData($selected, component);
            api.Utils.clearElementId([data]);
            model = null;
            if (component === 'sub-column') {
                component = 'column';
            } 
            Common.Clipboard.set(component, data);
        },
        paste: function (e,target) {
            var $el =this.$el,
                model = this.model;
            var component = model.get('elType'),
                mod_name=null;
            if (component === 'column') {
                component = model.get('component_name');
            }
            else if(component==='module'){
                mod_name=model.get('mod_name');
            }
            if (component === 'sub-column') {
                component = 'column';
            }
            var is_style = target.classList.contains('tb_paste_style'),
                data = Common.Clipboard.get(component);
            if (data === false || (is_style===true && component==='module' && mod_name!==data['mod_name'])) {
                Common.alertWrongPaste();
                return;
            }
            api.eventName = 'row';
            if (is_style === true) {
                var stOptions = ThemifyStyles.getStyleOptions((component==='module' ? mod_name : component)),
                    k = component === 'module' ? 'mod_settings' : 'styling',
                    res = this.getData($el, (component === 'column'?model.get('component_name'):component)),
                    checkIsStyle = function(i){
                        var key = i.indexOf('_color') !== -1 ? 'color' : (i.indexOf('_style') !== -1 ? 'style' : false),
                            add=false;
                        if(i.indexOf('breakpoint_') !== -1 && i.indexOf('_apply_all') !== -1){
                                add=true;
                        }
                        else if (key !== false) {
                            key = i.replace('_' + key, '_width');
                            if (stOptions[key] !== undefined && stOptions[key].type === 'border') {
                                add=true;
                            }
                        }
                        else if (i.indexOf('_unit') !== -1) {//unit
                            key = i.replace(/_unit$/ig, '', '');
                            if (stOptions[key] !== undefined) {
                                add=true;
                            }
                        }
                        else if (i.indexOf('_w') !== -1) {//weight
                            key = i.replace(/_w$/ig, '', '');
                            if (stOptions[key] !== undefined && stOptions[key].type === 'font_select') {
                                add=true;
                            }
                        }
                        else if (stOptions[i] !== undefined && stOptions[i].type === 'radio') {
                            add=true;
                        }
                        return add;
                    };
                    if(res[k]===undefined){
                        res[k] = {};
                    }
                    for (var i in data[k]) {
                        if (stOptions[i] === undefined && !checkIsStyle(i)) {
                            delete data[k][i];
                        }
                        else{
                            res[k][i] = data[k][i];
                            if(stOptions[i]!==undefined){
                                if(stOptions[i].isFontColor===true && data[k][stOptions[i].g+'-gradient']!==undefined){
                                    res[k][stOptions[i].g+'-gradient'] = data[k][stOptions[i].g+'-gradient'];
                                }
                                else {
                                    if(stOptions[i].posId!==undefined && data[k][stOptions[i].posId]!==undefined){
                                        res[k][stOptions[i].posId] = data[k][stOptions[i].posId];
                                    }
                                    if(stOptions[i].repeatId!==undefined && data[k][stOptions[i].repeatId]!==undefined){
                                        res[k][stOptions[i].repeatId] = data[k][stOptions[i].repeatId];
                                    }
                                }
                            }
                        }
                    }
                    
                stOptions=null;
                data = res;
                delete data['element_id'];
            }
            if (component === 'column') {
                data['grid_class'] = api.Utils.filterClass($el.prop('class'));
                if ($el.hasClass('first')) {
                    data['grid_class'] += ' first';
                }
                else if ($el.hasClass('last')) {
                    data['grid_class'] += ' last';
                }
                var width = $el[0].style['width'];
                if (width) {
                    data['grid_width'] = width.replace('%', '');
                }
                else {
                    data['grid_width'] = null;
                }
                data['component_name'] = model.get('component_name');
            }
            if (is_style === false) {
                api.Utils.clearElementId([data]);
            }

            api.hasChanged = true;
            api.beforeEvent = Common.clone($el);  
            model.setData(data);
        },
        importExport: function (e,target) {
            var type = target.classList.contains('ti-import') ? 'import' : 'export',
                self = this,
                el = this.$el,
                model = this.model,
                component = model.get('elType'),
                name = component.charAt(0).toUpperCase() + component.slice(1),
                label = component === 'subrow' ? 'Sub-Row' : (component === 'sub-column' ? 'Sub-Column' : name),
                options = {
                    contructor: true,
                    loadMethod: 'html',
                    data: {
                        component_form: {
                            name: api.Constructor.label[type + '_tab'].replace('%s', name),
                            options: [
                                {
                                    id: 'tb_data_field',
                                    type: 'textarea',
                                    label: api.Constructor.label['import_label'].replace('%s', label),
                                    help: api.Constructor.label[type + '_data'].replace('%s', name),
                                    'class':'fullwidth',
                                    rows: 13
                                }
                            ]
                        }
                    }
                };
            if (type === 'import') {
                options.save = {};
            }
            Common.Lightbox.$lightbox[0].style['display']='none';
            Common.Lightbox.open(options,function(){
                topWindow.document.body.classList.add('tb_standalone_lightbox');
            }, function () {
                var $lightbox = this.$lightbox;
                $lightbox.addClass('tb_import_export_lightbox');
                this.setStandAlone(e.clientX,e.clientY);
                if (type === 'import') {
                    $lightbox.find('.builder_save_button').on('click.tb_import',function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var $dataField = $lightbox.find('#tb_data_field'),
                                dataPlainObject = JSON.parse($dataField.val());
                        if ((component === 'column' && dataPlainObject['component_name'] === 'sub-column') || (component === 'sub-column' && dataPlainObject['component_name'] === 'column')) {
                            dataPlainObject['component_name'] = component;
                            dataPlainObject['grid_class'] = el.closest('.module_column').prop('class');
                        }
                        if (dataPlainObject['component_name'] === undefined || dataPlainObject['component_name'] !== component) {
                            Common.alertWrongPaste();
                            return;
                        }
                        dataPlainObject = api.Utils.clear(dataPlainObject);
                        api.eventName = 'row';
                        api.beforeEvent = Common.clone(el);
                        api.hasChanged = true;
                        model.setData(dataPlainObject);
                        Common.Lightbox.close();
                    } );
                }
                else {
                    var data = self.getData(el, component);
                    data['component_name'] = component;
                    data = JSON.stringify(data);
                    $lightbox.find('#tb_data_field').val(data).on('click', function () {
                        $(this).trigger('focus').trigger('select');
                    });
                }
                
                Themify.body.one('themify_builder_lightbox_close', function () {
                    $lightbox.removeClass('tb_import_export_lightbox');
                    topWindow.document.body.classList.remove('tb_standalone_lightbox');
                    if (type === 'import') {
                        $lightbox.find('.builder_save_button').off('click.tb_import');
                    }
                });
            });
        },
        getData: function (el, type) {
            var data = {};
            switch (type) {
                case 'row':
                case 'subrow':
                    data = api.Utils._getRowSettings(el.closest('.module_' + type)[0], type);
                    break;
                case 'module':
                    data = api.Models.Registry.lookup(el.closest('.active_module').data('cid')).attributes;
                    break;
                case 'column':
                case 'sub-column':
                    var $selectedCol = el.closest('.module_column'),
                        $selectedRow = $selectedCol.closest('column' === type ? '.module_row' : '.module_subrow'),
                        rowData = api.Utils._getRowSettings($selectedRow[0], 'column' === type ? 'row' : 'subrow');
                        data = rowData.cols[ $selectedCol.index() ];
                    break;
            }
            return api.Utils.clear(data);
        },
        duplicate: function () {
            var current = this.$el,
                el = Common.clone(current);
         
            if (api.activeModel && Common.Lightbox.$lightbox.is(':visible')) {
                api.Constructor.saveComponent();
            }
            current.removeClass('tb_element_cid_' + this.model.cid);
            el.hide().insertAfter(current);
            var data = this.getData(el, this.model.get('elType'));
            api.eventName = 'duplicate';
            api.beforeEvent = el;
            api.hasChanged = true;
            this.model.setData(data);
            current.addClass('tb_element_cid_' + this.model.cid);
        },
        edit:function(e,target){
            if (api.isPreview) {
                return true;
            }
            api.hasChanged = false;
            var isStyle = false,
                isVisible=false,
                lightbox = Common.Lightbox.$lightbox,
                component = this.model.get('elType'),
                template = component === 'module' ? this.model.get('mod_name') : component; 
            if (e !== null) {
                if(e.type==='dblclick' && this.model.cid !== api.autoSaveCid){
                    api.ActionBar.clear();
                }
                var cl = target.classList,
                    isStyle = cl.contains('tb_styling');
                if (api.mode === 'visual'&& template === 'layout-part'  && !api.Forms.LayoutPart.id && !cl.contains('tb_swap') && (e.type === 'dblclick' || cl.contains('tb_edit'))) {
                    api.activeModel = this.model;
                    api.Forms.LayoutPart.edit(this.el);
                    return;
                }
                if (isStyle===true) {
                    this.model.set({styleClicked: true}, {silent: true});
                }
                else if (cl.contains('tb_visibility_component')) {
                    isVisible=true;
                    this.model.set({visibileClicked: true}, {silent: true});
                }
            }

            if (api.activeModel !== null && api.autoSaveCid !== null && this.model.cid !== api.autoSaveCid ) {
                api.Constructor.saveComponent(true);
            }
            
            api.activeModel = this.model;
            if (api.autoSaveCid === this.model.cid) {
                var clicked = null;
                if (isStyle===true) {
                    clicked = lightbox.find('a[href="#tb_options_styling"]');
                    this.model.unset('styleClicked', {silent: true});
                }
                else if (isVisible===true) {
                    clicked = lightbox.find('a[href="#tb_options_visibility"]');
                    this.model.unset('visibileClicked', {silent: true});
                }
                else if (component === 'module' || component === 'row') {
                    clicked = lightbox.find('a[href="#tb_options_setting"]');
                }
                if (clicked !== null && clicked.length > 0) {
                    clicked[0].click();
                }
                return;
            }
            Common.Lightbox.open({loadMethod: 'inline', templateID: template}, false, false);
        },
        delete: function () {
            var item = this.$el,
                model = this.model,
                cid =model.cid,
                component = model.get('elType');
            if (!confirm(themifyBuilder.i18n[component + 'DeleteConfirm'])) {
                return;
            }
            var before = item.closest('.module_row'),
                    type = 'row',
                    after = '',
                    data = {},
                    origCid= cid;
            if (component === 'row') {
                data['pos_cid'] = before.next('.module_row');
                data['pos'] = 'before';
                if (data['pos_cid'].length === 0) {
                    data['pos'] = 'after';
                    data['pos_cid'] = before.prev('.module_row');
                }
                type = 'delete_row';
                data['pos_cid'] = data['pos_cid'].data('cid');
            }
            else {
                cid = before.data('cid');
            }
            before = Common.clone(before);
            if (component !== 'row') {
                var r = item.closest('.module_subrow');
            }
            model.destroy();
            if (component !== 'row' && r.length > 0 && r.find('.active_module').length === 0) {
                r.addClass('tb_row_empty');
            }
            if (component !== 'row') {
                after = $('.tb_element_cid_' + cid);
                var r = after.closest('.module_row');
                if (r.find('.active_module').length === 0) {
                    r.addClass('tb_row_empty');
                }
                r = null;
            }
            api.hasChanged = true;
            api.undoManager.push(cid, before, after, type, data);
            if (api.activeModel!==null && api.activeModel.cid === origCid){
                Common.Lightbox.$lightbox.find('.tb_close_lightbox')[0].click();
            }
            api.toolbar.pageBreakModule.countModules();
        },
        save: function (e) {
            var component = this.model.get('elType'),
                options = {
                    contructor: true,
                    loadMethod: 'html',
                    save: {done: 'save'},
                    data: {}
            },
            cid = this.model.cid;
            options['data']['s' + component] = {
                options: [
                    {
                        id: 'item_title_field',
                        type: 'text',
                        label: api.Constructor.label.title
                    }, {
                        id: 'item_layout_save',
                        type: 'checkbox',
                        label: '',
                        options: [
                            {name: 'layout_part', value: api.Constructor.label.slayout_part}
                        ],
                        new_line: false,
                        after:'',
                        help: 'The Layout Parts are re-usable layout parts that can be included into Builder content or anywhere (<a href="https://themify.me/docs/builder#layout-parts" target="_blank">learn more</a>)'
                    }
                ]
            };
            Common.Lightbox.$lightbox[0].style['display']='none';
            Common.Lightbox.open(options,function(){
                topWindow.document.body.classList.add('tb_standalone_lightbox');
            }, function (container) {
                var $container = this.$lightbox,
                saveAsLibraryItem = function (e) {
                    if ('keypress' === e.type && e.keyCode !== 13) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    Common.showLoader('show');
                    var model = api.Models.Registry.lookup(cid),
                            settings,
                            is_layout,
                            type;
                    switch (component) {
                        case 'row':
                            type = component;
                            settings = api.Utils._getRowSettings($('.tb_element_cid_' + cid)[0]);
                            api.Utils.clearElementId([settings],true);
                            break;

                        case 'module':
                            type = model.get('mod_name');
                            settings = {'mod_name': type, element_id: api.Utils.generateUniqueID(), 'mod_settings': model.get('mod_settings')};
                            break;
                    }
                    var css = ThemifyStyles.createCss([settings], type);
                    settings = api.Utils.clear(settings);
                    
                    var request = $.extend(api.Forms.serialize(container), {
                        action: 'tb_save_custom_item',
                        item: JSON.stringify(settings),
                        css: JSON.stringify(css),
                        tb_load_nonce: themifyBuilder.tb_load_nonce,
                        postid: themifyBuilder.post_ID,
                        type: component
                    });
                    is_layout=request['item_layout_save'];
                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        dataType: 'json',
                        data: request,
                        success: function (data) {

                            settings = null;
                            if (data.status === 'success') {
                                $('#tb_module_panel', topWindow.document).find('.tb_module_panel_search_text').val('');
                                if(is_layout){
                                    api.hasChanged = true;
                                    var args = {
                                        'mod_name':'layout-part',
                                        'mod_settings':{
                                            'selected_layout_part':data.post_name
                                        }
                                    };
                                    delete data['status'];
                                    if(api.Constructor.layoutPart.data.length>0){
                                        api.Constructor.layoutPart.data.push(data);
                                    }
                                    var elm = $('.tb_element_cid_' + cid),
                                        module,
                                        after,
                                        before = Common.clone(elm);
                                    if (component === 'row') {
                                            var row = api.Views.init_row({
                                                    cols:[{
                                                        'grid_class':'col-full first last',
                                                        'element_id':api.Utils.generateUniqueID(),
                                                        'modules':[args]
                                                    }]
                                                }),
                                            $Elem = row.view.render();
                                            module = api.Models.Registry.lookup($Elem.$el.find('.active_module').data('cid'));
                                    } else {
                                        module = api.Views.init_module(args),
                                        $Elem = module.view.render();
                                        module = module.model;
                                    }
                                    elm.replaceWith($Elem.el);
                                    if (api.mode === 'visual') {
                                        $(document).ajaxComplete(function Refresh(e, xhr, args) {
                                            if (args.data.indexOf('tb_load_module_partial', 3) !== -1) {
                                                $(this).off('ajaxComplete', Refresh);
                                                if (component === 'row') {
                                                    after = api.liveStylingInstance.$liveStyledElmt.closest('.module_row');
                                                }
                                                else {
                                                    after = api.liveStylingInstance.$liveStyledElmt;
                                                }
                                                api.undoManager.push($Elem.$el.data('cid'), before, after, 'row');
                                            }
                                        });
                                        module.trigger('custom:preview:refresh', module.get('mod_settings'));
                                    }
                                    else {
                                        after = $Elem.el;
                                        api.Mixins.Builder.updateModuleSort($Elem.$el);
                                        api.undoManager.push($Elem.$el.data('cid'), before, after, 'row');
                                    }
                                }
                                var libraryItems = $('.tb_library_item_list'),
                                        html = api.toolbar.libraryItems.template([data]);
                                if (api.mode === 'visual') {
                                    libraryItems = libraryItems.add(api.toolbar.$el.find('.tb_library_item_list'));
                                }
                                libraryItems = libraryItems.get();
                                for (var i = 0, len = libraryItems.length; i < len; ++i) {
                                    var item = libraryItems[i].getElementsByClassName('simplebar-content');
                                    if (item.length > 0) {
                                        item[0].insertAdjacentHTML('afterbegin', html);
                                    }else{
                                    libraryItems[i].insertAdjacentHTML('afterbegin', html);
                                    }
                                    libraryItems[i].previousElementSibling.getElementsByClassName('current')[0].click();
                                }
                                api.toolbar.libraryItems.bindEvents(true);
                                Common.showLoader('hide');
                                Common.Lightbox.close();
                            } else {
                                alert(data.msg);
                            }
                        }
                    });
                };
                $container.addClass('tb_save_module_lightbox');
                this.setStandAlone(e.clientX,e.clientY);
                $container.on('click.saveLayout', '.builder_save_button', saveAsLibraryItem)
                        .on('keypress.saveLayout', 'input', saveAsLibraryItem);
                Themify.body.one('themify_builder_lightbox_close', function () {
                    $container.removeClass('tb_save_module_lightbox').off('.saveLayout');
                    topWindow.document.body.classList.remove('tb_standalone_lightbox');
                });
            });
        }

    });

    api.Views.BaseElement.extend = function (child) {
        var self = this,
                view = Backbone.View.extend.apply(this, arguments);
        view.prototype.events = _.extend({}, this.prototype.events, child.events);
        view.prototype.initialize = function () {
            if ('function' === typeof self.prototype.initialize)
                self.prototype.initialize.apply(this, arguments);
            if ('function' === typeof child.initialize)
                child.initialize.apply(this, arguments);
        };
        return view;
    };

    api.Views.Modules['default'] = api.Views.BaseElement.extend({
        tagName: 'div',
        attributes: function () {
            var data = this.model.get('mod_settings'),
                args = {'data-cid':this.model.cid,'class':'active_module module-' + this.model.get('mod_name')+' tb_' + this.model.get('element_id')+' tb_element_cid_'+ this.model.cid};
            if(api.mode==='visual'){
                args['class']+=' tb_module_front';
                if(data['visibility_all'] === 'hide_all' || data['visibility_desktop'] === 'hide' || data['visibility_tablet'] === 'hide' || data['visibility_tablet_landscape'] === 'hide' || data['visibility_mobile'] === 'hide'){
                    args['class']+=' tb_visibility_hidden';
                }
            }
            else{
                args['class']+=' tb_module';
            }
            if(data['custom_css_id']!==undefined && data['custom_css_id']!==''){
                args['id']=data['custom_css_id'];
            }
            return args;
        },
        template: api.mode === 'visual' ? null : wp.template('builder_module_item'),
        initialize: function () {
            this.listenTo(this.model, 'dom:module:unsaved', this.removeUnsaved);
        },
        removeUnsaved: function () {
            this.model.destroy();
        },
        render: function () {
            if (api.mode !== 'visual') {
                this.el.innerHTML = this.template(this.model.toRenderData());
            }
            return this;
        }
    });

    api.Views.Columns['default'] = api.Views.BaseElement.extend({
        tagName: 'div',
        attributes: function () {
            var attr = {
                    'class': 'module_column tb-column tb_element_cid_' + this.model.cid + ' tb_' + this.model.get('element_id') + ' ' + this.model.get('grid_class'),
                        'data-cid': this.model.cid
                    };
            if (this.model.get('grid_width')) {
                attr['style'] = 'width:' + this.model.get('grid_width') + '%';
            }
            if('column' !== this.model.get('component_name') ){
                attr['class']+=' sub_column';
            }
            return attr;
        },
        render: function () {
            var component = this.model.get('component_name');
            this.el.innerHTML = Common.templateCache.get('tmpl-builder_column_item');
            var modules = this.model.get('modules');
            // check if it has module
            if (modules) {
                var container = document.createDocumentFragment();
                for (var i in modules) {
                    if (modules[i] !== undefined && modules[i] !== null) {
                        var m = modules[i],
                            moduleView = m.cols === undefined ? api.Views.init_module(m) : api.Views.init_subrow(m);
                        if (moduleView) {
                            container.appendChild(moduleView.view.render().el);
                        }
                    }
                }
                var holder = this.el.getElementsByClassName('tb_holder')[0];
                holder.appendChild(container);
                if (component === 'sub-column') {
                    holder.classList.add('tb_subrow_holder');
                }
            }
            return this;
        }
    });

    // SubRow view share same model as ModuleView
    api.Views.SubRows['default'] = api.Views.BaseElement.extend({
        tagName: 'div',
        attributes: function () {
            return {
                'class': 'themify_builder_sub_row module_subrow active_module clearfix tb_element_cid_' + this.model.cid + ' tb_' + this.model.get('element_id'),
                'data-cid': this.model.cid
            };
        },
        render: function () {
            var cols = this.model.get('cols'),
                    len = Object.keys(cols).length;
            this.el.innerHTML = Common.templateCache.get('tmpl-builder_subrow_item');
            if (len > 0) {
                var container = document.createDocumentFragment(),
                        not_empty = false;
                for (var i = 0; i <= len; ++i) {
                    if (cols[i] !== undefined) {
                        cols[i].component_name = 'sub-column';
                        container.appendChild(api.Views.init_column(cols[i]).view.render().el);
                        if (not_empty === false && cols[i].modules !== undefined && cols[i].modules.length > 0) {
                            not_empty = true;
                        }
                    }
                }
                if (not_empty === false) {
                    this.el.classList.add('tb_row_empty');
                }
                this.el.getElementsByClassName('subrow_inner')[0].appendChild(container);
            }
            api.Utils.selectedGridMenu(this.el,'subrow');
            return this;
        }
    });

    api.Views.Rows['default'] = api.Views.BaseElement.extend({
        tagName: 'div',
        attributes: function () {
            var data = this.model.get('styling'),
                attr = {
                'class': 'themify_builder_row module_row clearfix tb_element_cid_' + this.model.cid + ' tb_' + this.model.get('element_id'),
                'data-cid': this.model.cid
            };
            if(data['custom_css_row']!==undefined && data['custom_css_row']!==''){
                attr['class']+=' '+data['custom_css_row'];
            }
            if(data['custom_css_id']!==undefined && data['custom_css_id']!==''){
                attr['id']=data['custom_css_id'];
            }
            return attr;
        },
        render: function () {
            var cols = this.model.get('cols'),
                len = Object.keys(cols).length,
                not_empty = false;
            this.el.innerHTML = Common.templateCache.get('tmpl-builder_row_item');
            if (len > 0) {
                var container = document.createDocumentFragment();
                for (var i = 0; i <= len; ++i) {
                    if (cols[i] !== undefined) {
                        cols[i].component_name = 'column';
                        container.appendChild(api.Views.init_column(cols[i]).view.render().el);
                        if (not_empty === false && cols[i].modules !== undefined && (cols[i].modules.length > 0 || (typeof cols[i].modules==='object' && Object.keys(cols[i].modules).length>0))) {
                            not_empty = true;
                        }
                    }
                }
                this.el.getElementsByClassName('row_inner')[0].appendChild(container);
            } else {
                // Add column
                api.Utils._addNewColumn({
                    newclass: 'col-full',
                    component: 'column'
                }, this.el.getElementsByClassName('row_inner')[0]);
            }
            
            if (not_empty === false) {
                this.el.classList.add('tb_row_empty');
            }
            api.Utils.selectedGridMenu(this.el,'row');
            return this;
        }
    });

    api.Views.Builder = Backbone.View.extend({
        type: 'default',
        lastRow:null,
        events: {
            'click .tb_import_layout_button': 'importLayoutButton'
        },
        initialize: function () {
            this.$el.off('tb_init tb_new_row')
                .on('tb_init',this.init.bind(this))
                .on('tb_init',this.newRowAvailable.bind(this));
        },
        init: function (e) {
            api.Mixins.Builder.rowSort(this.$el);
            if (api.mode === 'visual') {
                api.Mixins.Builder.updateModuleSort(this.$el);
                setTimeout(function () {
                    api.Utils._onResize(true);
                }, 1500);
            }
            else {
                api.Mixins.Builder.updateModuleSort(this.$el);
                api.Mixins.Builder.initModuleDraggable(api.toolbar.$el.find('.tb_module_panel_modules_wrap').first(), '.tb_module');
                api.Mixins.Builder.initModuleDraggable(api.toolbar.$el, '.tb_row_grid');
            }
            var self = this;
            setTimeout(function () {
                api.ActionBar.init();
                api.Mixins.Builder.columnHover(self.$el);
                api.Utils.setCompactMode(self.el.getElementsByClassName('module_column'));
                self.insertLayoutButton();
            }, 1000);
            generatedIds = {}; 
        },
        render: function () {
            var container = document.createDocumentFragment(),
                    rows = this.collection;
                api.Utils.clearLastEmptyRow(rows.models);
                for (var i = 0; i < rows.models.length; ++i) {
                    var rowView = api.Views.init_row(rows.models[i]);
                    if (rowView !== false) {
                        container.appendChild(rowView.view.render().el);
                    }
                }
            this.el.appendChild(container);
            api.Utils.columnDrag(false, false);
            return this;
        },
        insertLayoutButton: function () {
            this.removeLayoutButton();
            this.lastRowAddBtn();
            var row=this.el.getElementsByClassName('module_row');
            if (row.length < 2 && row[0]!==undefined && row[0].classList.contains('tb_row_empty')) {
                var importBtn =  document.createElement('a');
                    importBtn.className='tb_import_layout_button';
                    importBtn.href='#';
                    importBtn.textContent=themifyBuilder.i18n.text_import_layout_button;
                    this.el.appendChild(importBtn);
            }
            
        },
        removeLayoutButton: function () {
            var importBtn = this.el.getElementsByClassName('tb_import_layout_button');
            for(var i=importBtn.length-1;i>-1;--i){
                importBtn[i].parentNode.removeChild(importBtn[i]);
            }
        },
        importLayoutButton: function (e) {
            api.Views.Toolbar.prototype.loadLayout(e);
        },
        newRowAvailable: function (col,force) {
            var child = this.el.children,
                isEmpty=true,
                len =child.length;
                col = col || 1;
                if(len!==0 && force!==true){
                    for(var i=len-1;i>-1;--i){
                        if(child[i].classList.contains('module_row')){
                            isEmpty=false;
                            break;
                        }
                    }
                }
            if (isEmpty===true) {
                var el = api.Views.init_row(api.Utils.grid(col)[0]).view.render().$el;
                this.el.insertBefore(el[0],this.lastRow);
                api.Utils.setCompactMode(el[0].getElementsByClassName('module_column'));
                api.Mixins.Builder.update(el);
                if (api.mode === 'visual' && api.activeBreakPoint !== 'desktop') {
                    $('body', topWindow.document).height(document.body.scrollHeight);
                }
                return el;
            }
        },
        lastRowShowHide:function(show){
            if(this.lastRow){
                if(show){
                    this.lastRow.classList.remove('hide');
                }
                else{
                    this.lastRow.classList.remove('expanded');
                    this.lastRow.classList.add('hide');
                }
            }
        },
        lastRowAddBtn:function(){
            var el = document.getElementById('tb_add_container');
            if(el!==null){
                el.parentNode.removeChild(el);
            }
            this.lastRow = document.createElement('div');
            var btn = document.createElement('div'),
                isInit = null;
            this.lastRow.id='tb_add_container';
            btn.className = 'tb_last_add_btn';
            btn.textContent = '+';
            this.lastRow.appendChild(btn);
            this.lastRow.addEventListener('click',function(e){
                e.preventDefault();
                var target = e.target,
                    grid = target.closest('.tb_row_grid');
                if (grid !== null) {
                    this.classList.remove('expanded');
                    api.Mixins.Builder.rowDrop(api.Utils.grid(grid.dataset['col']), $('<div>').insertBefore(this), true,true);
                }
                else if (target.classList.contains('tb_add_blocks')) {
                    this.classList.remove('expanded');
                    api.toolbar.common.show(e, $(this).find('.tb_last_add_btn'));
                    api.toolbar.common.clicked = this.previousElementSibling?$(this.previousElementSibling):null;
                    api.toolbar.common.btn[0].querySelector('[data-target="tb_module_panel_rows_wrap"]').click();
                }
                else if (target.classList.contains('tb_last_add_btn')) {
                    if (isInit === null) {
                        isInit = true;
                        var tpl_id = 'tmpl-last_row_add_btn',
                            t = Common.is_template_support ? document.getElementById(tpl_id).content.cloneNode(true) : Common.templateCache.get(tpl_id);
                        Common.is_template_support ? this.appendChild(t) : this.insertAdjacentHTML('beforeend', t);
                    }
                    this.classList.add('expanded');
                }  
            });
            btn=null;
            this.el.appendChild(this.lastRow);
        }
    });

    api.Mixins.Builder = {
        before: null,
        zindex: null,
        r: null,
        w: null,
        h: null,
        type: null,
        moduleHolderArgs: null,
        update: function (el) {
            if (api.mode === 'visual') {
                var type = api.activeModel !== null ? api.activeModel.get('elType') : api.Models.Registry.lookup(el.data('cid')).get('elType');
                api.Utils.loadContentJs(el, type);
            }
            // api.Mixins.Builder.columnSort(el);
            var row = el.closest('.module_row');
            api.Utils.columnDrag(row.find('.row_inner'), false);
            api.Utils.columnDrag(row.find('.subrow_inner'), false);
            api.Mixins.Builder.updateModuleSort(row);
            api.Mixins.Builder.columnHover(row);
        },
        dragScroll: function (type, off) {
            var body = $('body', topWindow.document);
            if (api.mode === 'visual') {
                body = body.add(Themify.body);
            }
            if (this.top === undefined) {
                this.top = api.toolbar.$el;
                this.top = this.top.add($('#tb_fixed_bottom_scroll', topWindow.document));
                if (api.mode !== 'visual') {
                    this.top = this.top.add('#wpadminbar');
                }
            }
            if (off === true) {
                this.top.off('mouseenter mouseleave');
                if (type === 'row' && api.mode === 'visual') {
                    api.toolbar.$el.find('.tb_zoom[data-zoom="100"]').trigger('click');
                }
                body.removeClass('tb_drag_start tb_drag_' + type);
                return;
            }
            var scrollEl=null,
                step =50,
                isScrol=null,
                move=true,
                k=1;
            if(api.mode!=='visual'){
                scrollEl= $('.edit-post-layout__content').first();
                if(scrollEl.length===0){
                    scrollEl=null;
                }
                else{
                    step/=2;
                }
            }
            if(scrollEl===null){
                scrollEl = api.activeBreakPoint === 'desktop' ? $('body,html') : $('body,html', topWindow.document);
            }
            function onDragScroll(e,id) {
                move=true;
                if(isScrol===null){
                    isScrol=true;
                    var scrolId=this!==undefined?this.id:null;
                    if(!scrolId){
                        scrolId=id;
                    }
                    var scroll = scrolId === 'tb_toolbar' || scrolId === 'wpadminbar' ? '-' : '+';
                        scroll += '=' + step*k + 'px';
                    scrollEl.stop().animate({
                        scrollTop: scroll
                    },{
                        duration:500,
                        complete:function(){
                            if(move===true){
                                if(k<10){
                                    ++k;
                                }
                                isScrol=null;
                                onDragScroll(null,scrolId);
                            }
                        }
                    }); 
                }
            }
            body.addClass('tb_drag_start tb_drag_' + type);
            if (type === 'row' && api.mode === 'visual') {
                api.toolbar.$el.find('.tb_zoom[data-zoom="50"]').trigger('click');
            }
            if (step > 0) {
                this.top.off('mouseenter').on('mouseenter', onDragScroll).off('mouseleave').on('mouseleave', function(){
                    k=1;
                    isScrol=move=null;
                    scrollEl.stop();
                });
            }
        },
        columnSort: function (el) {
            var before,
                    colums;
            el.find('.row_inner, .subrow_inner').sortable({
                items: '> .module_column',
                handle: '> .tb_column_action .tb_column_dragger',
                axis: 'x',
                placeholder: 'tb_state_highlight',
                tolerance: 'pointer',
                cursorAt: {
                    top: 20,
                    left: 20
                },
                beforeStart: function (e, el, ui) {
                    Themify.body.addClass('tb_drag_start');
                    before = Common.clone(ui.item.closest('.module_row'));
                    colums = ui.item.siblings();
                    colums.css('marginLeft', 0);
                },
                start: function (e, ui) {
                    $('.tb_state_highlight').width(ui.item.width());
                },
                stop: function (e, ui) {
                    Themify.body.removeClass('tb_drag_start');
                    colums.css('marginLeft', '');
                },
                update: function (e, ui) {
                    var inner = ui.item.closest('.ui-sortable'),
                            children = inner.children('.module_column');
                    children.removeClass('first last');
                    if (inner[0].classList.contains('direction-rtl')) {
                        children.last().addClass('first');
                        children.first().addClass('last');
                    }
                    else {
                        children.first().addClass('first');
                        children.last().addClass('last');
                    }
                    api.Utils.columnDrag(inner, false);
                    api.Utils.setCompactMode(children);
                    var row = inner.closest('.module_row');
                    api.undoManager.push(row.data('cid'), before, row, 'row');
                }
            });
        },
        rowSort: function ($el) {
            var self = this,
                    before_next,
                    rowSortable = {
                        items: '>.module_row',
                        handle: '>.tb_row_action',
                        axis: 'y',
                        placeholder: 'tb_state_highlight',
                        containment: api.mode==='visual'?'parent':'body',
                        tolerance: 'pointer',
                        forceHelperSize: true,
                        forcePlaceholderSize: true,
                        scroll: false,
                        beforeStart: function (e, el, ui) {
                            if (!self.before) {
                                before_next = true;
                                self.before = ui.item.next('.module_row');
                                if (self.before.length === 0) {
                                    self.before = ui.item.prev('.module_row');
                                    before_next = false;
                                }
                                self.before = self.before.data('cid');
                                self.dragScroll('row');
                            }
                        },
                        start:function(){
                            $el.sortable('refreshPositions');
                        },
                        stop: function (e, ui) {
                            self.before = before_next = null;
                            self.dragScroll('row', true);
                        },
                        update: function (e, ui) {
                            if (api.mode === 'visual' && !ui.item[0].classList.contains('tb_row_grid')) {
                                var body = api.activeBreakPoint === 'desktop' ? $('html,body') : $('body', topWindow.document);
                                body.scrollTop(ui.item.offset().top);
                                body = null;
                            }
                            if (e.type === 'sortupdate' && self.before) {
                                api.hasChanged = true;
                                var after = ui.item.next('.module_row'),
                                        after_next = true;
                                if (after.length === 0) {
                                    after = ui.item.prev('.module_row');
                                    before_next = after_next = false;
                                }
                                after = after.data('cid');
                                api.undoManager.push(ui.item.data('cid'), null, null, 'row_sort', {bnext: before_next, 'before': self.before, 'anext': after_next, 'after': after});
                            }
                            else if (ui.item[0].classList.contains('predesigned_row') || ui.item[0].classList.contains('tb_page_break_module') || ui.item.data('type') === 'row') {
                                if (ui.item.data('type') === 'row') {
                                    api.toolbar.libraryItems.get(ui.item.data('id'), 'row', function ($row) {
                                        if (!Array.isArray($row)) {
                                            $row = new Array($row);
                                        }
                                        self.rowDrop($row, ui.item);
                                    });
                                } else if (ui.item[0].classList.contains('tb_page_break_module')) {
                                    self.rowDrop(api.toolbar.pageBreakModule.get(), ui.item);
                                    api.toolbar.pageBreakModule.countModules();
                                }
                                else {
                                    api.toolbar.preDesignedRows.get(ui.item.data('slug'), function (data) {
                                        self.rowDrop(data, ui.item);
                                    });
                                }
                            }
                            else if (ui.item[0].classList.contains('tb_row_grid')) {
                                self.subRowDrop(ui.item.data('slug'), ui.item);
                            }
                        }
                    };
            if ('visual' === api.mode) {
                rowSortable.helper = function () {
                    return $('<div class="tb_sortable_helper"/>');
                };
            }
            
            $el.sortable(rowSortable);
            //this.columnSort(this.$el);
        },
        updateModuleSort: function (context, disable) {
            var items = $('.tb_holder', context),
                self = this;
            if (disable) {
                items.sortable(disable);
                return false;
            }
            items.each(function () {
                $(this).data({uiSortable: null, sortable: null});
            });
            this.moduleHolderArgs = {
                placeholder: 'tb_state_highlight',
                items: '>.active_module,>div>.active_module',
                connectWith: '.tb_holder',
                revert: 100,
                scroll: false,
                cancel: '.tb_disable_sorting',
                cursorAt: {
                    top: 10,
                    left: 90
                },
                beforeStart: function (e, el, ui) {
                    if (!self.before) {
                        self.r = ui.item.closest('.module_row');
                        if (self.r.length > 0) {
                            self.before = Common.clone(self.r);
                            self.zindex = self.r.css('zIndex');
                            if (self.zindex === 'auto') {
                                self.zindex = '';
                            }
                            self.r.css('zIndex', 2);
                        }
                        else {
                            self.r = null;
                        }
                        self.w = ui.item[0].style['width'];
                        self.h = ui.item[0].style['height'];
                        ui.item.css({'width': 180,'height': 30});
                        self.type = 'module';
                        if (ui.item[0].classList.contains('module_subrow')){
                           self.type+=' tb_drag_subrow'; 
                        }
                        else if(ui.item[0].classList.contains('tb_row_grid')){
                            self.type= 'column';
                        }
                        self.dragScroll(self.type);
                    }
                },
                start:function(e, ui){
                    if(ui.item[0].classList.contains('module_subrow') || ui.item[0].classList.contains('tb_row_grid')){
                        $('.tb_subrow_holder').sortable('disable');
                        $('.tb_holder').sortable('refresh');
                    }
                },
                stop: function (e, ui) {
                    api.ActionBar.clear();
                    if ('visual' === api.mode && ui.helper) {
                        $(ui.helper).remove();
                    }
                    ui.item.css({width: self.w, height: self.h});
                    self.dragScroll(self.type, true);
                    if (self.r) {
                        self.r.css('zIndex', self.zindex);
                    }
                    if(ui.item[0].classList.contains('module_subrow') || ui.item[0].classList.contains('tb_row_grid')){
                        $('.tb_subrow_holder').sortable('enable');
                        $('.tb_holder').sortable('refresh');
                    }
                    self.before = self.w = self.h = self.r = self.zindex = self.type = null;
                },
                update: function (e, ui) {
                    ui.item.css({width: self.w, height: self.h});
                    if (ui.item[0].classList.contains('tb_module_dragging_helper')) {
                        var item = $(ui.item.clone(false));
                        if (ui.item.data('id')) {
                            var r = ui.item.closest('.module_row');
                            if (r.length > 0) {
                                self.before = Common.clone(r);
                                self.before.find('.tb_module_dragging_helper').remove();
                            }
                            r = null;
                        }
                        ui.item.after(item);
                        self.moduleDrop(item, null, self.before);
                    }
                    else {
                        if (ui.sender) {
                            var row = ui.sender.closest('.module_row');
                            ui.sender.closest('.module_row').toggleClass('tb_row_empty', row.find('.active_module').length === 0);
                            row = null;
                            var sub = ui.sender.closest('.module_subrow');
                            if (sub.length > 0) {
                                sub.toggleClass('tb_row_empty', sub.find('.active_module').length === 0);
                            }
                            sub = null;
                            // Make sub_row only can nested one level
                            if (ui.item[0].classList.contains('module_subrow') && ui.item.parent().closest('.module_subrow').length > 0) {
                                items.sortable('cancel');
                                return;
                            }
                        }
                        if (self.before) {
                            api.hasChanged = true;
                            if (!ui.item[0].classList.contains('module_subrow')) {
                                ui.item.closest('.module_subrow').removeClass('tb_row_empty');
                            }
                            var moved_row = ui.item.closest('.module_row');
                            moved_row.removeClass('tb_row_empty');
                            api.undoManager.push(ui.item.data('cid'), self.before, moved_row, 'sort', {'before': self.before.data('cid'), 'after': moved_row.data('cid')});
                            self.before = null;
                            Themify.body.triggerHandler('tb_' + self.type + '_sort', [ui.item]);
                        }
                    }

                }
            };
            if ('visual' === api.mode) {
                this.moduleHolderArgs.helper = function () {
                    return $('<div class="tb_sortable_helper"/>');
                };
            }
             items.sortable(this.moduleHolderArgs);
        },
        initModuleDraggable: function (parent, cl) {
            var self = this,
                    args = $.extend(true, {}, this.moduleHolderArgs);
            args['update'] = false;
            args['appendTo'] = document.body;
            args['items'] = cl;
            if (cl === '.tb_row_grid') {
                args['connectWith'] = [args['connectWith'], (api.mode === 'visual' ? '#themify_builder_content-' + themifyBuilder.post_ID : '#tb_row_wrapper')];
            }
            args['stop'] = function (e, ui) {
                $(this).sortable('cancel');
                ui.item.removeClass('tb_sortable_helper tb_module_dragging_helper');
                self.moduleHolderArgs.stop(e, ui);
                if(ui.item[0].classList.contains('tb_row_grid')){
                    parent.sortable('refresh');
                }
            };
            args['start'] = function (e, ui) {
                ui.item.addClass('tb_sortable_helper tb_module_dragging_helper');
                self.moduleHolderArgs.start(e, ui);
                if(ui.item[0].classList.contains('tb_row_grid')){
                    parent.sortable('refresh');
                } 
            };
            args['helper'] = function (e, ui) {
                return $('<div class="tb_sortable_helper tb_module_dragging_helper">' + ui.text() + '</div>');
            };
            parent.sortable(args);
        },
        initRowDraggable: function (parent, cl) {
            var self = this;
            parent.find(cl).draggable({
                appendTo: Themify.body,
                helper: 'clone',
                revert: 'invalid',
                connectToSortable: api.mode === 'visual' ? '#themify_builder_content-' + themifyBuilder.post_ID : '#tb_row_wrapper',
                cursorAt: {
                    top: 10,
                    left: 40
                },
                start: function (e, ui) {
                    self.dragScroll('row');
                    ui.helper.addClass('tb_module_dragging_helper tb_sortable_helper').find('.tb_predesigned_rows_image').remove();
                },
                stop: function (e, ui) {
                    self.dragScroll('row', true);
                }
            });
        },
        initModuleVisualDrag: function (cl) {
            var self = this;
            api.toolbar.$el.find(cl).ThemifyDraggable({
                iframe: '#tb_iframe',
                dropitems: '.tb_holder',
                elements: '.active_module',
                type: 'module',
                onDrop: function (e, drag, drop) {
                    self.moduleDrop(drag, false, Common.clone(drop.closest('.module_row')));
                }
            });
        },
        initRowGridVisualDrag: function () {
            var self = this;
            api.toolbar.$el.find('.tb_row_grid').ThemifyDraggable({
                iframe: '#tb_iframe',
                dropitems: ".tb_holder:not('.tb_subrow_holder'),.themify_builder_content:not('.not_editable_builder')>.module_row",
                elements: '.active_module',
                cancel: '.tb_subrow_holder',
                append: false,
                type: 'column',
                onDrop: function (e, drag, drop) {
                    self.subRowDrop(drag.data('slug'), drag);
                }
            });
        },
        initRowVisualDrag: function (cl) {
            var self = this;
            api.toolbar.$el.find(cl).ThemifyDraggable({
                iframe: '#tb_iframe',
                dropitems: ".themify_builder_content:not('.not_editable_builder')>.module_row",
                append: false,
                type: 'row',
                onDragBefore:function(e,drag){
                     api.toolbar.$el.find('.tb_zoom[data-zoom="50"]').click();
                },
                onDrop: function (e, drag, drop) {
                    drag.addClass('tb_state_highlight').find('.tb_predesigned_rows_image').remove();
                    drag.show();
                    api.Utils.setCompactMode(drag.offset().top);
                    if (drag.data('type') === 'row') {
                        api.toolbar.libraryItems.get(drag.data('id'), 'row', function ($row) {
                            if (!Array.isArray($row)) {
                                $row = new Array($row);
                            }
                            self.rowDrop($row, drag);
                        });
                    } else if (drag[0].classList.contains('tb_page_break_module')) {
                        self.rowDrop(api.toolbar.pageBreakModule.get(), drag);
                        api.toolbar.pageBreakModule.countModules();
                    } else {
                        api.toolbar.preDesignedRows.get(drag.data('slug'), function (data) {
                            self.rowDrop(data, drag);
                        });
                    }
                }
            });
        },
        subRowDrop: function (data, drag) {
            api.ActionBar.clear();
            var is_row = drag.parent('.themify_builder_content,#tb_row_wrapper').length > 0;
            if (is_row || drag.closest('.sub_column').length === 0) {
                data = api.Utils.grid(data);
                var before,
                        type,
                        is_next;
                if (!is_row) {
                    before = Common.clone(drag.closest('.module_row'));
                    before.find('.tb_row_grid').remove();
                    type = 'row';
                }
                var row = is_row ? api.Views.init_row({cols: data[0].cols}) : api.Views.init_subrow({cols: data[0].cols}),
                    el = row.view.render().$el;
                if (is_row || drag[0].parentNode.classList.contains('tb_holder') || drag[0].parentNode.parentNode.classList.contains('tb_holder')) {
                    drag[0].parentNode.replaceChild(el[0], drag[0]);
                    el[0].className += ' tb_element_selected';
                    api.ActionBar.type = 'subrow';
                } else {
                    var holder = drag.next('.tb_holder');
                    if (holder.length > 0) {
                        holder.prepend(el);
                    } else {
                        holder = drag.prev('.tb_holder');
                        holder.append(el);
                    }
                }
                if (is_row) {
                    before = el.next('.module_row');
                    is_next = true;
                    if (before.length === 0) {
                        is_next = false;
                        before = el.prev('.module_row');
                    }
                    before = before.data('cid');
                    type = 'grid_sort';
                }
                api.Utils.setCompactMode(el[0].getElementsByClassName('module_column'));
                api.Mixins.Builder.update(el);
                drag.remove();
                api.hasChanged = true;
                var after = el.closest('.module_row');
                if (!is_row) {
                    after.removeClass('tb_row_empty');
                }
                after.find('.tb_row_grid').remove();
                api.Utils.scrollToDropped(el[0]);
                api.undoManager.push(after.data('cid'), before, after, type, {next: is_next});
            }
            else {
                drag.remove();
            }
        },
        rowDrop: function (data, drag,force,isEmpty) {
                api.ActionBar.clear();
                function callback() {
                    var prev_row_id = drag.prev('.module_row'),
                        bid;
                    if (prev_row_id.length === 0) {
                        bid = api.mode === 'visual' ? drag.closest('.themify_builder_content').data('postid') : null;
                        prev_row_id = false;
                    }
                    else {
                        prev_row_id = prev_row_id.data('cid');
                    }
                    drag[0].innerHTML = '';
                    api.ActionBar.type = 'row';
                    drag[0].parentNode.replaceChild(fragment, drag[0]);
                    api.hasChanged = true;
                    api.Instances.Builder[api.builderIndex].removeLayoutButton();
                    api.undoManager.push('', '', '', 'predesign', {'prev': prev_row_id, 'rows': rows, 'bid': bid});
                    for (var i = 0, len = rows.length; i < len; ++i) {
                        var col = rows[i][0].getElementsByClassName('module_column');
                        if(i===0){
                            rows[i][0].classList.add('tb_element_selected');
                        }
                        api.Utils.setCompactMode(col);
                        api.Mixins.Builder.update(rows[i]);
                    }
                    api.Utils.scrollToDropped(rows[0][0]);
                    Common.showLoader('hide');
                }
                var checkEmpty = function (cols) {
                    for (var i in cols) {
                        if ((cols[i].styling && Object.keys(cols[i].styling).length > 0) || (cols[i].modules && Object.keys(cols[i].modules).length > 0)) {
                            return true;
                        }
                    }
                    return false;
                },
                fragment = document.createDocumentFragment(),
                rows = [],
                styles = [];
                if(!isEmpty){
                    api.Utils.clearLastEmptyRow(data);
                }
            for (var i = 0, len = data.length; i < len; ++i) {
                if (force===true || ((data[i].styling && Object.keys(data[i].styling).length > 0) || (data[i].cols && checkEmpty(data[i].cols)))) {
                    var row = api.Views.init_row(data[i]);
                    if (row !== false) {
                        var r = row.view.render();
                        fragment.appendChild(r.el);
                        if (api.mode === 'visual') {
                            var items = r.el.querySelectorAll('[data-cid]');
                            styles[r.el.dataset.cid] = 1;
                            for (var i = 0, len = items.length; i < len; ++i) {
                                styles[items[i].dataset.cid] = 1;
                            }
                        }
                        rows.push(r.$el);
                    }
                }
            }
            if (api.mode === 'visual') {
                api.bootstrap(styles, callback);
                styles = null;
            }
            else {
                callback();
            }
        },
        moduleDrop: function (drag, drop, before) {
            api.ActionBar.clear();
            var self = this;
            if (drag[0].classList.contains('tb_row_grid')) {
                self.subRowDrop(drag.data('slug'), drag);
                return;
            }
            var options = {mod_name: drag.data('module-slug')},
            type = drag.data('type'),
                    is_library = type === 'part' || type === 'module';
            if (is_library) {
                api.toolbar.libraryItems.get(drag.data('id'), type, callback);
            }
            else {
                return callback(options);
            }
            function callback(options) {
                var moduleView = api.Views.init_module(options,true),
                        module = moduleView.view.render();
                function final(new_module) {
                    if (!is_library) {
                        moduleView.model.set({is_new: 1}, {silent: true});
                    }
                    var settings = new_module === true ? moduleView.model.getPreviewSettings() : moduleView.model.get('mod_settings');

                    if (drop) {
                        if(drop.hasClass('tb_module_front')){
                            drop.after(module.el);
                        }else{
                            drop.append(module.el);
                        }
                    }
                    else {
                        drag.replaceWith(module.el);
                    }
                    if (is_library) {
                        api.activeModel = moduleView.model;
                    }
                    else {
                        moduleView.model.trigger('edit', null);
                    }
                    api.hasChanged = true;
                    var droppedID;
                    if (api.mode === 'visual' && Object.keys(settings).length > 1) {
                        droppedID = settings.cid;
                        if (type === 'part' || drag.data('type') === 'ajax') {
                            var pComponent_added = true;
                            moduleView.model.trigger('custom:preview:refresh', settings);
                        }
                        else if (type !== 'module') {
                            moduleView.model.trigger('custom:preview:live', settings);
                        }
                        else {
                            api.Utils.loadContentJs(module.$el, 'module');
                        }
                    }
                    if (is_library) {
                        if (pComponent_added) {
                            var pComponent = moduleView.view.$el.find('.tb_preview_component').detach();
                            moduleView.view.$el.prepend(pComponent);
                        }
                        if (before) {
                            var after = module.$el.closest('.module_row');
                            after.removeClass('tb_row_empty').find('.tb_module_dragging_helper').remove();
                            module.$el.closest('.module_subrow').removeClass('tb_row_empty');
                            api.undoManager.push(after.data('cid'), before, after, 'row');
                            droppedID = after.data('cid');
                            api.Instances.Builder[api.builderIndex].removeLayoutButton();
                            api.activeModel=null;
                        }
                    }
                    api.Utils.scrollToDropped(null,droppedID);
                }
                if (api.mode === 'visual' && is_library) {
                    var dataa = new Array();
                    dataa[moduleView.model.cid] = 1;
                    api.bootstrap(dataa, final);
                } else {
                    final(true);
                }
                return module;
            }
            // Add WP editor placeholder
            if (api.mode !== 'visual') {
                $('.themify-wp-editor-holder').addClass('themify-active-holder');
            }
            
        },
        toJSON: function (el) {
            var option_data = {},
                rows = el.children,
                j = 0;
            for (var i = 0, len = rows.length; i < len; ++i) {
                if(rows[i].classList.contains('module_row')){
                    var data = api.Utils._getRowSettings(rows[i]);
                    if (Object.keys(data).length > 0) {
                        option_data[j] = data;
                        ++j;
                    }
                }
            }
            return option_data;
        },
        columnHover:function(el){
            var action,
                p =el[0]!==undefined?el[0]:el,
                items = p.classList.contains('sub_column')?[p]:p.getElementsByClassName('sub_column'),
                isWorking=null,
                mouseEnter = function(e){
                    if(isWorking===null){
                        isWorking=true;
                        var target = e.target,
                            column = this.parentNode.closest('.module_column');
                            action = target.getElementsByClassName('tb_column_action')[0];
                        if(!column.classList.contains('tb_hover_sub_column')){
                            column.classList.add('tb_hover_sub_column');
                            if(action!==undefined){
                                var box1 = action.getBoundingClientRect(),
                                    remove=true,
                                    r = box1.left<5?column.closest('.module_row').getElementsByClassName('tb_row_action')[0]:this.closest('.module_subrow').getElementsByClassName('tb_subrow_action')[0];
                                    if(r!==undefined){
                                        var box2=r.getBoundingClientRect();
                                            remove=Math.abs((box1.left-box2.left))<box1.width? Math.abs((box2.top-box1.top))>box1.height:true;
                                    }
                                    if(remove===true){
                                        action.classList.remove('tb_action_overlap');
                                    }
                                    else{
                                        action.classList.add('tb_action_overlap');
                                    }
                            }
                        }
                    }
                },
                mouseLeave=function(e){
                    if(isWorking===true){
                        var cl = this.parentNode.closest('.module_column').classList;
                        if(cl.contains('tb_hover_sub_column')){
                            cl.remove('tb_hover_sub_column');
                            if(action!==undefined){
                                action.classList.remove('tb_action_overlap');
                                action=undefined;
                            }
                        }
                        isWorking=null;
                    }
                };
                
                for(var i=items.length-1;i>-1;--i){
                    items[i].removeEventListener('mouseenter', mouseEnter,{passive:true});
                    items[i].removeEventListener('mouseleave', mouseLeave,{passive:true});
                    items[i].addEventListener('mouseenter',mouseEnter,{passive:true});
                    items[i].addEventListener('mouseleave',mouseLeave,{passive:true});
                }
        }
    };

    api.undoManager = {
        stack: [],
        is_working: false,
        index: -1,
        btnUndo: null,
        btnRedo: null,
        compactBtn: null,
        init: function () {
            this.btnUndo = api.toolbar.el.getElementsByClassName('tb_undo_btn')[0];
            this.btnRedo = api.toolbar.el.getElementsByClassName('tb_redo_btn')[0];
            this.compactBtn = api.toolbar.el.getElementsByClassName('tb_compact_undo')[0];
            api.toolbar.$el.find('.tb_undo_redo').on('click', this.do_change.bind(this));
            if (!themifyBuilder.disableShortcuts) {
                $(topWindow.document).on('keydown', this.keypres.bind(this));
                if (api.mode === 'visual') {
                    $(document).on('keydown', this.keypres.bind(this));
                }
            }
        },
        push: function (cid, before, after, type, data) {
            if (api.hasChanged) {
                api.editing = false;
                if (after) {
                    after = Common.clone(after);
                }
                if (api.mode === 'visual' && (type === 'duplicate' || type === 'sort')) {
                    $(window).triggerHandler('tfsmartresize.tfVideo');
                }
                this.stack.splice(this.index + 1, this.stack.length - this.index);
                this.stack.push({'cid': cid, 'type': type, 'data': data, 'before': before, 'after': after});
                this.index = this.stack.length - 1;
                this.updateUndoBtns();
                if(api.mode==='visual'){
                    api.Forms.LayoutPart.isSaved=null;
                    Themify.body.triggerHandler('builder_dom_changed', [type])
                }
            }
        },
        set: function (el) {
            var batch = el[0].querySelectorAll('[data-cid]');
            batch = Array.prototype.slice.call(batch);
            batch.unshift(el[0]);
            for (var i = 0, len = batch.length; i < len; ++i) {
                var model = api.Models.Registry.lookup(batch[i].getAttribute('data-cid'));
                if (model) {
                    model.trigger('change:view', batch[i]);
                }
            }
        },
        doScroll: function (el) {
            //todo
            return el;
            var offset = 0,
                    body = api.mode !== 'visual' || api.activeBreakPoint === 'desktop' ? $('html,body') : $('body', topWindow.document);
            if (api.mode === 'visual') {
                var fixed = $('#headerwrap');
                offset = 40;
                if (fixed.length > 0) {
                    offset += fixed.outerHeight();
                }
            }
            body.scrollTop(el.offset().top - offset);
            return el;
        },
        keypres: function (event) {
            // Redo
            if (90 === event.which && api.activeModel===null && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                if ((true === event.ctrlKey && true === event.shiftKey) || (true === event.metaKey && true === event.shiftKey)) {
                    event.preventDefault();
                    if (this.hasRedo()) {
                        this.changes(false);
                    }
                } else if (true === event.ctrlKey || true === event.metaKey) { // UNDO
                    event.preventDefault();
                    if (this.hasUndo()) {
                        this.changes(true);
                    }
                }
            }
        },
        changes: function (is_undo) {
            var index = is_undo ? 0 : 1,
                    stack = this.stack[this.index + index];
            if (stack !== undefined) {
                this.is_working = true;

                var el = '',
                        type = stack['type'],
                        item = $('.tb_element_cid_' + stack['cid']),
                        comon = Common,
                        cid = false;
                api.eventName = type;
                if (type === 'row') {
                    if (is_undo) {
                        el = comon.clone(stack.before);
                        cid = stack['cid'];
                    }
                    else {
                        el = comon.clone(stack.after);
                        cid = stack.before.data('cid');
                        item = $('.tb_element_cid_' + cid);
                    }
                    this.doScroll(item);
                    this.set(el);
                    el.toggleClass('tb_row_empty', el.find('.active_module').length === 0);
                    item.replaceWith(el);
                }
                else if (type === 'duplicate') {
                    if (is_undo) {
                        this.doScroll($('.tb_element_cid_' + stack.after.data('cid'))).remove();
                    }
                    else {
                        this.doScroll(item);
                        el = comon.clone(stack.after);
                        cid = stack.before.data('cid');
                        this.set(el);
                        item.after(el);
                    }
                }
                else if (type === 'delete_row') {
                    if (!is_undo) {
                        this.doScroll(item).remove();
                    }
                    else {
                        el = comon.clone(stack.before);
                        cid = stack['cid'];
                        var position = $('.tb_element_cid_' + stack.data.pos_cid);
                        this.doScroll(position);
                        this.set(el);
                        if (stack.data.pos === 'after') {
                            position.after(el);
                        }
                        else {
                            position.before(el);
                        }
                    }

                }
                else if (type === 'sort') {
                    cid = stack['cid'];
                    var before;
                    if (is_undo) {
                        before = stack.data['before'];
                        el = comon.clone(stack.before);
                    }
                    else {
                        before = stack.data['after'];
                        el = comon.clone(stack.after);
                        if (api.mode === 'visual') {
                            el.find('.active_module').css({'display': 'block', 'height': 'auto'});
                        }
                    }
                    this.doScroll(el);
                    this.set(el);
                    var old_el = $('.tb_element_cid_' + cid).closest('.module_row');
                    $('.tb_element_cid_' + cid).remove();
                    old_el.toggleClass('tb_row_empty', old_el.find('.active_module').length === 0);
                    old_el = null;
                    $('.tb_element_cid_' + before).replaceWith(el);
                    var r = el.closest('.module_row');
                    r.toggleClass('tb_row_empty', r.find('.active_module').length === 0);
                    r = null;
                }
                else if (type === 'row_sort') {
                    cid = stack['cid'];
                    var is_next = stack.data[is_undo ? 'bnext' : 'anext'],
                            el2 = $('.tb_element_cid_' + stack.data[is_undo ? 'before' : 'after']),
                            item = $('.tb_element_cid_' + cid);
                    el = comon.clone(item);
                    item.remove();
                    item = null;
                    this.set(el);
                    if (is_next) {
                        el2.before(el);
                    }
                    else {
                        el2.after(el);
                    }
                    this.doScroll(el);
                }
                else if (type === 'save') {
                    var cid = stack['cid'],
                            model = api.Models.Registry.lookup(cid),
                            is_module = model.get('elType') === 'module',
                            k = is_module ? 'mod_settings' : 'styling';
                    if (is_module && stack.data.column) {
                        var r;
                        if (is_undo) {
                            r = $('.tb_element_cid_' + cid).closest('.module_row');
                            cid = false;
                            this.doScroll(item).remove();
                        }
                        else {
                            cid = stack.data.column.data('cid');
                            el = comon.clone(stack.data.column);
                            item = $('.tb_element_cid_' + cid);
                            this.doScroll(item);
                            this.set(el);
                            item.replaceWith(el);
                            r = el.closest('.module_row');
                        }
                        r.toggleClass('tb_row_empty', r.find('.active_module').length === 0);
                        r = null;
                    }
                    else {
                        this.doScroll(item);
                        var settings = {};
                        if (is_undo) {
                            el = comon.clone(stack.before);
                            settings[k] = stack.data.bsettings;
                        }
                        else {
                            el = comon.clone(stack.after);
                            settings[k] = stack.data.asettings;
                        }
                        if (api.mode === 'visual') {
                            var styles = $.extend(true, {}, stack.data.styles);
                            for (var bp in styles) {
                                var stylesheet = ThemifyStyles.getSheet(bp),
                                        rules = stylesheet.cssRules ? stylesheet.cssRules : stylesheet.rules;

                                for (var i in styles[bp]) {
                                    if (rules[i]) {
                                        for (var j in styles[bp][i]) {
                                            var prop =j==='backgroundClip' || j==='background-clip'?'WebkitBackgroundClip':j;
                                            rules[i].style[prop] = is_undo ? styles[bp][i][j].b : styles[bp][i][j].a;
                                        }
                                    }
                                }
                            }
                        }
                        model.set(settings, {silent: true});
                        settings = null;
                        this.set(el);
                        item.replaceWith(el);
                    }
                }
                else if (type === 'predesign') {

                    var rows = stack.data.rows;
                    if (is_undo) {
                        this.doScroll($('.tb_element_cid_' + rows[0].data('cid')));
                        for (var i = 0, len = rows.length; i < len; ++i) {
                            $('.tb_element_cid_' + rows[i].data('cid')).remove();
                        }
                    }
                    else {
                        var fragment = document.createDocumentFragment(),
                                el = [];
                        for (var i = 0, len = rows.length; i < len; ++i) {
                            var row = comon.clone(rows[i]);
                            fragment.appendChild(row[0]);
                            el.push(row);
                        }
                        if (stack.data.prev !== false) {
                            this.doScroll($('.tb_element_cid_' + stack.data.prev)).after(fragment);
                        }
                        else {
                            this.doScroll((api.mode === 'visual' ? $('#themify_builder_content-' + stack.data.bid) : $('#tb_row_wrapper'))).prepend(fragment);
                        }
                        for (var i = 0, len = el.length; i < len; ++i) {
                            this.set(el[i]);
                            api.Mixins.Builder.update(el[i]);
                        }
                    }
                }
                else if (type === 'import') {
                    var $builder = $('[data-postid="' + stack.data.bid + '"]'),
                            $elements = is_undo ? stack.data.before : stack.data.after,
                            self = this;
                    $elements = comon.clone($elements);
                    $builder.children().remove();
                    $builder.prepend($elements);
                    $elements.each(function () {
                        self.set($(this));
                    });
                }
                else if (type === 'grid_sort') {
                    if (is_undo) {
                        $('.tb_element_cid_' + stack['cid']).remove();
                    }
                    else {
                        var next = $('.tb_element_cid_' + stack.before),
                                el = comon.clone(stack.after),
                                cid = stack['cid'];
                        if (stack.data.next) {
                            next.before(el);
                        }
                        else {
                            next.after(el);
                        }
                        this.set(el);
                    }
                }
                if (cid) {
                    api.Mixins.Builder.update($(el));
                }
                if (is_undo) {
                    --this.index;
                }
                else {
                    ++this.index;
                }
                this.is_working = false;
                this.updateUndoBtns();
                api.toolbar.pageBreakModule.countModules();
            }
        },
        hasRedo: function () {
            return this.index < (this.stack.length - 1);
        },
        hasUndo: function () {
            return this.index !== -1;
        },
        disable: function () {
            this.btnUndo.classList.add('tb_disabled');
            this.btnRedo.classList.add('tb_disabled');
            this.compactBtn.classList.add('tb_disabled');
        },
        updateUndoBtns: function () {
            var undo = this.hasUndo(),
                    redo = this.hasRedo();
            if (undo) {
                this.btnUndo.classList.remove('tb_disabled');
            }
            else {
                this.btnUndo.classList.add('tb_disabled');
            }
            if (redo) {
                this.btnRedo.classList.remove('tb_disabled');
            }
            else {
                this.btnRedo.classList.add('tb_disabled');
            }
            if (undo || redo) {
                this.compactBtn.classList.remove('tb_disabled');
            }
            else {
                this.compactBtn.classList.add('tb_disabled');
            }
        },
        reset: function () {
            this.stack = [];
            this.index = -1;
            this.updateUndoBtns();
        },
        do_change: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (this.is_working === false && !e.currentTarget.classList.contains('tb_disabled')) {
                this.changes(e.currentTarget.classList.contains('tb_undo_btn'));
            }
        }
    };
    api.Views.Toolbar = Backbone.View.extend({
        events: {
            // Import
            'click .tb_import': 'import',
            // Layout
            'click .tb_load_layout': 'loadLayout',
            'click .tb_save_layout': 'saveLayout',
            // Duplicate
            'click .tb_dup_link': 'duplicate',
            'click .tb_toolbar_save': 'save',
            'click .tb_toolbar_backend_edit a': 'save',
            'click .tb_toolbar_close_btn': 'panelClose',
            'click .tb_breakpoint_switcher': 'breakpointSwitcher',
            'click .tb_float_minimize': 'minimize',
            'click .tb_float_close':'closeFloat',
            'click .tb_toolbar_add_modules':'openFloat',
            // Zoom
            'click .tb_zoom': 'zoom',
            'click .tb_toolbar_zoom_menu_toggle': 'zoom',
            'click .tb_toolbar_builder_preview': 'previewBuilder',
            'click .js-tb_module_panel_acc' : 'toggleAccordion'
        },
        lightboxStorageKey:'tb_module_panel',
        render: function () {
            var that = this,
                    cotainer = document.createDocumentFragment();
            for (var slug in themifyBuilder.modules) {
                var outer = document.createElement('div'),
                        module = document.createElement('div'),
                        favorite = document.createElement('span'),
                        name = document.createElement('strong'),
                        add = document.createElement('a');
                outer.className = 'tb_module_outer tb-module-' + slug;
                if (themifyBuilder.modules[slug].favorite) {
                    outer.className += ' favorited';
                }
                module.className = 'tb_module tb-module-type-' + slug;
                favorite.className = 'tb_favorite ti-star tb_disable_sorting';
                name.className = 'module_name';
                name.textContent = themifyBuilder.modules[slug].name;
                add.href = '#';
                add.className = 'add_module_btn tb_disable_sorting';
                add.dataset.type = 'module';
                add.title = themifyBuilder.i18n.add_module;
                module.dataset['moduleSlug'] = slug;
                if (themifyBuilder.modules[slug].type) {
                    module.dataset['type'] = themifyBuilder.modules[slug].type;
                }
                module.appendChild(favorite);
                module.appendChild(name);
                module.appendChild(add);
                outer.appendChild(module);
                cotainer.appendChild(outer);
            }
            var separator = document.createElement('span'),
                    panel = this.el.getElementsByClassName('tb_module_panel_tab_acc_content_module')[0];
            separator.className = 'favorite-separator';
            cotainer.appendChild(separator);
            panel.appendChild(cotainer);
            if (api.mode === 'visual') {
                topWindow.document.body.appendChild(this.el);
            }
            var callback = function () {
                that.Panel.init();
                api.undoManager.init();
                new SimpleBar(that.el.getElementsByClassName('tb_module_panel_modules_wrap')[0]);
                that.pageBreakModule.init();
                that.preDesignedRows.init();
                that.libraryItems.init();
                that.common.init();
                // Compact toolbar
                setTimeout(function () {
                    that.help.init();
                    setTimeout(function () {
                        that.Revisions.init();
                    }, 1200);
                    if (api.mode === 'visual') {
                        api.Mixins.Builder.initModuleVisualDrag('.tb_module');
                        api.Mixins.Builder.initRowGridVisualDrag();
                    }
                }, 800);
                // Fire Module Favorite Toggle
                if (api.mode === 'visual') {
                    that.$el.on('click', '.tb_favorite', that.toggleFavoriteModule);
                    that.unload();
                }
                Themify.body.on('click', '.tb_favorite', that.toggleFavoriteModule);
                that.draggable();
                if(localStorage.getItem('tb_panel_closed')=== 'true'){
                    that.closeFloat();
                }
                else{
                    
                    that.Panel.setFocus();
                }
            };
            if (api.mode === 'visual') {
                topWindow.jQuery('body').one('themify_builder_ready', callback);
            }
            else {
                callback();
            }
        },
        
        getStorage: function () {
            var lightboxStorage = localStorage.getItem(this.lightboxStorageKey);
            return lightboxStorage?JSON.parse(lightboxStorage):null;
        },
        updateStorage: function () {
            var $el = this.$el.find('#tb_module_panel'),
                pos = $el.position(),
                h=$el.outerHeight();
        
            if(h<=0){
                var st = this.getStorage();
                h=st?st['height']:'';
            }
            var obj = {
                top: pos.top,
                left: pos.left,
                width: $el.outerWidth(),
                height: h
            };
            localStorage.setItem(this.lightboxStorageKey, JSON.stringify(obj));
        },
        getPanelClass:function(w){
            var cl;
            if(w<=195){
                cl = 'tb_float_xsmall';
            }
            else if (w <= 270) {
                cl = 'tb_float_small';
            }
            else if(w<=400){
                cl = 'tb_float_medium';
            }
            else{
                cl = 'tb_float_large';
            }
            return cl;
        },
        _setResponsiveTabs:function(cl){
       
            var tabs = api.toolbar.el.getElementsByClassName('tb_module_types');
            for(var i=tabs.length-1;i>-1;--i){
                if(cl==='tb_float_xsmall'){
                    tabs[i].classList.add('tb_ui_dropdown_items');
                    tabs[i].parentNode.classList.add('tb_compact_tabs');
                }
                else{
                    tabs[i].classList.remove('tb_ui_dropdown_items');
                    tabs[i].parentNode.classList.remove('tb_compact_tabs');
                }
            }
        },  
        resize:function(){
            var el = this.el.getElementsByClassName('tb_modules_panel_wrap')[0],
                self = this,
                x,
                y,
                height,
                width,
                smallW = 120,
                maxW=500,
                items = el.getElementsByClassName('tb_resizable'),
                activeCl,
                axis,
                minHeight=50,
                maxHeight=null,
                _move=function(e){
                    var  w=x + width - e.clientX,
                        left=null;
                    if (axis === 'w' || axis==='sw' || axis==='nw') {
                        var old_w=el.style['width'];
                        left = (parseInt(el.style['left'])+parseInt(old_w)-w);
                    }
                    if(axis!=='w') {
                        if(axis==='y' || axis==='-y' || axis==='sw' || axis==='se' || axis==='nw' || axis==='ne'){
                            var h = axis==='-y' || axis==='ne' || axis==='nw'?(y+height-e.clientY):(height + e.clientY - y);
                            if(h >= minHeight && h <= maxHeight){

                                if(axis==='-y' || axis==='ne' || axis==='nw'){
                                    el.style['top']=(parseInt(el.style['top'])+parseInt(el.style['height'])-h)+'px';
                                }
                                el.style['height']=h+'px';
                            }

                        }
                        if(axis!=='sw' && axis!=='nw'){
                            w = width + e.clientX - x;
                        }
                    }
                    if (axis!=='y' && axis!=='-y') {
                        if(w>maxW || w<smallW){
                            old_w = w;
                            w=w<smallW?smallW:maxW;
                            if(left!==null){
                                left=left+old_w-w;
                            }
                        }
                        if(left!==null){
                            el.style['left']=left+'px';
                        }
                        el.style['width']=w+'px';
                        var current=self.getPanelClass(w);
                        if(activeCl!==current){
                            if(activeCl){
                                el.classList.remove(activeCl);
                            }
                            el.classList.add(current);
                            activeCl=current;
                            self._setResponsiveTabs(current);
                        }
                       
                    }
                },
                _stop=function(){
                    topWindow.document.body.classList.remove('tb_start_animate');
                    topWindow.document.body.classList.remove('tb_panel_resize');
                    topWindow.document.removeEventListener('mousemove', _move, {passive: true});
                    topWindow.document.removeEventListener('mouseup', _stop, {passive: true});
                    x=width=axis=activeCl=null;
                    self.updateStorage();
                };
            for(var i=items.length-1;i>-1;--i){
                items[i].addEventListener('mousedown', function (e) {
                    if (e.which === 1) {
                        topWindow.document.body.classList.add('tb_start_animate');
                        topWindow.document.body.classList.add('tb_panel_resize');
                        axis= this.dataset['axis'];
                        x = e.clientX;
                        y=e.clientY;
                        maxHeight=$(window).height()-50;
                        height=parseInt($(el).outerHeight(), 10);
                        width = parseInt($(el).outerWidth(), 10);
                        topWindow.document.addEventListener('mousemove', _move, {passive: true});
                        topWindow.document.addEventListener('mouseup', _stop, {passive: true});
                        
                    }
                },{passive:true});
            }
        },
        setFloat:function(){
            var el = this.Panel.el.find('#tb_module_panel');
            el[0].classList.add('tb_panel_floating');
            var storage = this.getStorage();
            if(storage){
                el[0].style['width'] = storage['width']+'px';
                el[0].style['height'] = storage['height']+'px';
            } 
            var cl = this.getPanelClass(el.width());
            el[0].classList.add(cl);
            this._setResponsiveTabs(cl);
        },
        removeFloat:function(){
            this.Panel.el.find('#tb_module_panel').css({'top':'','width':'','height':'','left':'','right':'','bottom':''}).removeClass('tb_panel_floating tb_float_xsmall tb_float_small tb_float_medium tb_float_large tb_is_minimize');
        },
        draggable:function(){
            var $el = this.$el.find('#tb_module_panel'),
                self=this;
            if(!Common.Lightbox.dockMode.get()){
                $el[0].classList.add('tb_panel_floating');
                var storage = this.getStorage(),
                    w=null;
                if(storage){
                    for(var i in storage){
                        $el[0].style[i] = storage[i]+'px';
                    }
                    w = storage['width'];
                }
                else{
                    w = $el.width();
                }
                var cl = this.getPanelClass(w);
                $el[0].classList.add(cl);
                this._setResponsiveTabs(cl);
            }
            $el.draggable({
                    handle: '.tb_drag_handle',
                    cancel:'.tb_module_types',
                    scroll: true,
                    start:function(e, ui){
                        topWindow.document.body.classList.add('tb_panel_drag');
                        self.setFloat();
                        if(Common.Lightbox.dockMode.get()){
                            Common.Lightbox.dockMode.close();
                            setTimeout(function(){api.Utils._onResize(true);},100);
                        } 
                    },
                    drag: function (e,ui) {
                        if(api.mode==='visual'){
                            Common.Lightbox.dockMode.drag(e,ui);
                        }
                    },
                    stop:function(e, ui){
                        topWindow.document.body.classList.remove('tb_panel_drag');
                        Common.Lightbox.dockMode.drag(e,ui);
                        if(Common.Lightbox.dockMode.get()){
                            self.removeFloat();
                            self._setResponsiveTabs(false);
                        } 
                        else{
                            var h = $(topWindow).height() - 30,
                            top = ui.position.top,
                            new_pos = {};
                            if(top<0){
                                new_pos.top = 0;
                            }
                            else if(top > h){
                                 new_pos.top = h;
                            }
                            for(var i in new_pos){
                                ui.helper[0].style[i] = new_pos[i]+'px';
                            }
                            self.updateStorage();
                        }
                        
                        if(api.mode === 'visual'){
                             $(document).triggerHandler('mouseup');
                        }
                    }
            });
            this.resize();
        },
        minimize:function(e){
            e.preventDefault();
            e.stopPropagation();
            var panel = $(e.currentTarget).closest('#tb_module_panel');
            if(panel.hasClass('tb_is_minimize')){
                panel.removeClass('tb_is_minimize');
                var storage = this.getStorage();
                panel.css('height',(storage?storage['height']:''));
            }
            else{
                panel.addClass('tb_is_minimize');
            }
            if(api.mode === 'visual'){
                 $(document).triggerHandler('mouseup');
            }
        },
        import: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var component = e.currentTarget.getAttribute('data-component'),
                body= topWindow.document.getElementsByTagName('body')[0],
                    options = {
                        contructor: component !== 'file',
                        dataType: 'json',
                        data: {
                            action: 'builder_import',
                            type: component
                        }
                    };
            if (component !== 'file' || confirm(themifyBuilder.i18n.importFileConfirm)) {
                if (component === 'file') {
                    var el = topWindow.document.getElementById('tb_import_filestb_plupload_browse_button');
                    if(el===null){
                        el = document.createElement('input');
                        var wrap = document.createElement('div'),
                            nonce = document.createElement('span');
                        wrap.id='tb_import_filestb_plupload_upload_ui';
                        wrap.style['display']='none';
                        el.type='button';
                        el.id='tb_import_filestb_plupload_browse_button';
                        nonce.className='ajaxnonceplu';
                        nonce.id=themifyBuilder.import_nonce;
                        wrap.appendChild(el);
                        wrap.appendChild(nonce);
                        body.appendChild(wrap);
                        api.Utils.builderPlupload('', el.parentNode);
                    }
                    else{
                        el.click();
                    }
                }
                else{
                    Common.Lightbox.$lightbox[0].style['display']='none';
                    var el = $(e.currentTarget.closest('ul')),
                        offset = el.offset(),
                        top = offset.top+el.height()-40;
                        Themify.body.off('themify_builder_lightbox_close.import');
                        el.addClass('tb_current_menu_selected');
                        if(api.Forms.LayoutPart.id !== null){
                            top-=window.pageYOffset+60;
                        }
                        
                    Common.Lightbox.open(options, function(){
                        body.classList.add('tb_standalone_lightbox');
                    }, function () {
                            this.$lightbox[0].classList.add('tb_import_post_lightbox');
                            this.setStandAlone(offset.left,top,true);
                            Themify.body.one('themify_builder_lightbox_close.import',function(){
                                body.classList.remove('tb_standalone_lightbox');
                                Common.Lightbox.$lightbox[0].classList.remove('tb_import_post_lightbox');
                                el.removeClass('tb_current_menu_selected');
                                body=null;
                            });
                            $('#tb_submit_import_form', Common.Lightbox.$lightbox).one('click', function (e) {
                                e.preventDefault();
                                var options = {
                                    buttons: {
                                        no: {
                                            label: api.Constructor.label.replace_builder,
                                        },
                                        yes: {
                                            label: api.Constructor.label.append_builder
                                        }
                                    }
                                };

                                Common.LiteLightbox.confirm(themifyBuilder.i18n.dialog_import_page_post, function (response) {
                                    $.ajax({
                                        type: 'POST',
                                        url: themifyBuilder.ajaxurl,
                                        dataType: 'json',
                                        data: {
                                            action: 'builder_import_submit',
                                            nonce: themifyBuilder.tb_load_nonce,
                                            data: api.Forms.serialize('tb_options_import'),
                                            importType: 'no' === response ? 'replace' : 'append',
                                            importTo: themifyBuilder.post_ID
                                        },
                                        beforeSend: function (xhr) {
                                            Common.showLoader('show');
                                        },
                                        success: function (data) {
                                            if(data['builder_data']!==undefined){
                                                api.Forms.reLoad(data.builder_data, themifyBuilder.post_ID);
                                            }
                                            else{
                                                Common.showLoader('error');
                                            }
                                            Common.Lightbox.close();
                                        }
                                    });

                                }, options);
                            });
                    });
                }
            }

        },
        unload: function () {
            if (api.mode === 'visual') {
                document.head.insertAdjacentHTML('afterbegin', '<base target="_parent">');
            }
            topWindow.onbeforeunload = function () {
                return  !api.editing && (api.hasChanged || api.undoManager.hasUndo()) ? 'Are you sure' : null;
            };
        },
        panelClose: function (e) {
            e.preventDefault();
            topWindow.location.reload(true);
        },
        // Layout actions
        loadLayout: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var self = this,
                body = topWindow.document.body,
                el =  $(e.currentTarget.closest('ul')),
                options = self.layoutsList ? {loadMethod: 'html', data: self.layoutsList} : {data: {action: 'tb_load_layout'}};
                Common.Lightbox.$lightbox[0].style['display']='none';
                el.addClass('tb_current_menu_selected');
                Themify.body.off('themify_builder_lightbox_close.loadLayout');
                Common.Lightbox.open(options,function(){
                        body.classList.add('tb_load_layout_active');
                        body.classList.add('tb_standalone_lightbox');
                    },
                    function () {
                        var lightbox = this.$lightbox,
                            container = lightbox.find('#tb_tabs_pre-designed');
                        
                        /* the pre-designed layouts has been disabled */
                        if (container.length === 0) {
                            body.classList.remove('tb_load_layout_active');
                            body.classList.remove('tb_standalone_lightbox');
                            el.removeClass('tb_current_menu_selected');
                            return;
                        }
                        lightbox[0].classList.add('tb_predesigned_lightbox');
                        this.setStandAlone(topWindow.innerWidth/2,((topWindow.document.documentElement.clientHeight -lightbox.height())/2),true);
                        var filter = container.find('.tb_ui_dropdown_items'),
                                layoutLayoutsList = function (preview_list) {
                                    preview_list.each(function (i) {
                                        if (i % 4 === 0) {
                                            this.classList.add('layout-column-break');
                                        }
                                        else {
                                            this.classList.remove('layout-column-break');
                                        }
                                    });
                                };
                        function reInitJs() {
                            var preview_list = container.find('.layout_preview_list');
                            filter.show().find('li').on('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!this.classList.contains('current')) {
                                    var matched = preview_list;
                                    if (this.classList.contains('all')) {
                                        matched.show();
                                    } else {
                                        preview_list.hide();
                                        matched = preview_list.filter('[data-category*="' + $(this).text() + '"]');
                                        matched.show();
                                    }
                                    layoutLayoutsList(matched);
                                    $(this).addClass('current').siblings().removeClass('current');
                                    filter.parent().find('.tb_ui_dropdown_label').html($(this).text());
                                }
                                api.Utils.hideOnClick(filter);
                            });
                            lightbox.on('click.loadLayout', '.layout_preview img', function (e) {

                                e.preventDefault();
                                e.stopPropagation();
                                var $this = $(this).closest('.layout_preview'),
                                        options = {
                                            buttons: {
                                                no: {
                                                    label: 'Replace Layout'
                                                },
                                                yes: {
                                                    label: 'Append to Layout'
                                                }
                                            }
                                        };

                                Common.LiteLightbox.confirm(themifyBuilder.i18n.confirm_template_selected, function (response) {
                                    var group = $this.closest('ul').data('group'),
                                            done = function (data) {
                                                if ('no' !== response) {
                                                    var el = api.mode !== 'visual' ? document.getElementById('tb_row_wrapper') : document.getElementsByClassName('themify_builder_content-' + themifyBuilder.post_ID)[0],
                                                            json = api.Mixins.Builder.toJSON(el),
                                                            res = [];
                                                    for (var i in json) {
                                                        res.push(json[i]);
                                                    }
                                                    json = null;
                                                    for (var i in data) {
                                                        res.push(data[i]);
                                                    }
                                                    data = res;
                                                    res = null;
                                                }
                                                if (self.is_set !== true) {
                                                    $.ajax({
                                                        type: 'POST',
                                                        url: themifyBuilder.ajaxurl,
                                                        data: {
                                                            action: 'set_layout_action',
                                                            nonce: themifyBuilder.tb_load_nonce,
                                                            mode: 'no' !== response ? 1 : 0,
                                                            id: themifyBuilder.post_ID
                                                        },
                                                        success: function () {
                                                            self.is_set = true;
                                                        }
                                                    });
                                                }
                                                api.Forms.reLoad(data, themifyBuilder.post_ID);
                                                Common.Lightbox.close();
                                            };
                                    if (group === 'pre-designed') {
                                        Common.showLoader('show');
                                        var slug = $this.data('slug'),
                                                file = 'https://themify.me/themify-layouts/' + slug + '.txt';
                                        if (!api.layouts_selected) {
                                            api.layouts_selected = {};
                                        }
                                        else if (api.layouts_selected[slug]) {
                                            done(JSON.parse(api.layouts_selected[slug]));
                                            return;
                                        }
                                        $.get(file, null, null, 'text')
                                                .done(function (data) {
                                                    api.layouts_selected[slug] = data;
                                                    done(JSON.parse(data));
                                                })
                                                .fail(function (jqxhr, textStatus, error) {
                                                    Common.LiteLightbox.alert('There was an error in loading layout, please try again later, or you can download this file: (' + file + ') and then import manually (https://themify.me/docs/builder#import-export).');
                                                })
                                                .always(function () {
                                                    Common.showLoader();
                                                });
                                    } else {
                                        $.ajax({
                                            type: 'POST',
                                            url: themifyBuilder.ajaxurl,
                                            dataType: 'json',
                                            data: {
                                                action: 'tb_set_layout',
                                                nonce: themifyBuilder.tb_load_nonce,
                                                layout_slug: $this.data('slug'),
                                                layout_group: group,
                                                mode: 'no' !== response ? 1 : 0
                                            },
                                            beforeSend: function () {
                                                if ('visual' === api.mode) {
                                                    Common.showLoader('show');
                                                }
                                            },
                                            success: function (res) {
                                                if (res.data) {
                                                    done(res.data);
                                                    Common.showLoader();
                                                } else {
                                                    Common.showLoader('error');
                                                    alert(res.msg);
                                                    Common.Lightbox.close();
                                                }
                                            }
                                        });
                                    }
                                }, options);
                            })
                            .find('#tb_layout_search').on('keyup', function () {
                                var s = $.trim($(this).val()),
                                        matched = preview_list;
                                if (s === '') {
                                    matched.show();
                                } else {
                                    var selected = filter.find('li.all');
                                    if (!selected[0].classList.contains('current')) {
                                        selected.click();
                                    }
                                    preview_list.hide();
                                    matched = preview_list.find('.layout_title:contains(' + s + ')').closest('.layout_preview_list');
                                    matched.show();
                                }
                                layoutLayoutsList(matched);
                            })[0].focus();
                            new SimpleBar(lightbox[0]);
                            new SimpleBar(filter[0]);
                            Themify.body.one('themify_builder_lightbox_close.loadLayout', function () {
                                lightbox.off('click.loadLayout')[0].classList.remove('tb_predesigned_lightbox');
                                container.find('#tb_layout_search').off('keyup');
                                container=lightbox=null;
                                body.classList.remove('tb_load_layout_active');
                                body.classList.remove('tb_standalone_lightbox');
                                el.removeClass('tb_current_menu_selected');
                            });
                        }
                        if (self.layoutsList) {
                            reInitJs();
                            return;
                        }
                        Common.showLoader('show');
                        $.getJSON('https://themify.me/themify-layouts/index.json')
                                .done(function (data) {
                                    var categories = {},
                                            frag1 = document.createDocumentFragment(),
                                            frag2 = document.createDocumentFragment();
                                    for (var i = 0, len = data.length; i < len; ++i) {
                                        var li = document.createElement('li'),
                                                layout = document.createElement('div'),
                                                thumbnail = document.createElement('div'),
                                                img = document.createElement('img'),
                                                action = document.createElement('div'),
                                                title = document.createElement('div'),
                                                a = document.createElement('a'),
                                                icon = document.createElement('i');
                                        li.className = 'layout_preview_list';
                                        li.dataset.category = data[i].category;

                                        layout.className = 'layout_preview';
                                        layout.dataset.id = data[i].id;
                                        layout.dataset.slug = data[i].slug;

                                        thumbnail.className = 'thumbnail';
                                        img.src = data[i].thumbnail;
                                        img.alt = data[i].title;
                                        img.title = data[i].title;
                                        action.className = 'layout_action';
                                        title.className = 'layout_title';
                                        title.textContent = data[i].title;
                                        a.className = 'layout-preview-link themify_lightbox';
                                        a.href = data[i].url;
                                        a.target = '_blank';
                                        a.title = themifyBuilder.i18n.preview;
                                        icon.className = 'ti-search';
                                        a.appendChild(icon);
                                        action.appendChild(title);
                                        action.appendChild(a);
                                        thumbnail.appendChild(img);
                                        layout.appendChild(thumbnail);
                                        layout.appendChild(action);
                                        li.appendChild(layout);
                                        frag1.appendChild(li);
                                        if (data[i].category) {
                                            var cat = String(data[i].category).split(',');
                                            for (var j = 0, len2 = cat.length; j < len2; ++j) {
                                                if ('' !== cat[j] && categories[cat[j]] !== 1) {
                                                    var li2 = document.createElement('li');
                                                    li2.textContent = cat[j];
                                                    frag2.appendChild(li2);
                                                    categories[cat[j]] = 1;
                                                }
                                            }
                                        }
                                    }
                                    filter[0].appendChild(frag2);
                                    container[0].getElementsByClassName('tb_layout_lists')[0].appendChild(frag1);
                                    frag1 = frag2 = categories = null;
                                    lightbox.find('.tb_tab').each(function () {
                                        layoutLayoutsList($(this).find('.layout_preview_list'));
                                    });
                                    self.layoutsList = lightbox[0].getElementsByClassName('tb_options_tab_wrapper')[0].cloneNode(true);
                                    reInitJs();
                                })
                                .fail(function (jqxhr, textStatus, error) {
                                    Common.LiteLightbox.alert($('#tb_load_layout_error', container).show().text());
                                })
                                .always(function () {
                                    Common.showLoader('spinhide');
                                });
                    });
        },
        saveLayout: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var options = {
                contructor: true,
                loadMethod: 'html',
                save: {},
                data: {
                    'save_as_layout': {
                        options: [
                            {
                                id: 'layout_img_field',
                                type: 'image',
                                label: api.Constructor.label.image_preview
                            },
                            {
                                id: 'layout_img_field_id',
                                type: 'hidden'
                            },
                            {
                                id: 'layout_title_field',
                                type: 'text',
                                label: api.Constructor.label.title
                            },
                            {
                                id: 'postid',
                                type: 'hidden',
                                value: themifyBuilder.post_ID
                            }
                        ]
                    }
                }
            },
            el =  $(e.currentTarget.closest('ul'));
            el.addClass('tb_current_menu_selected');
            Common.Lightbox.$lightbox[0].style['display']='none';
            Common.Lightbox.open(options,function(){
                topWindow.document.body.classList.add('tb_standalone_lightbox');
            }, function () {
                var $lightbox=this.$lightbox;
                $lightbox.find('.builder_save_button').one('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        dataType: 'json',
                        data: {
                            action: 'tb_save_custom_layout',
                            nonce: themifyBuilder.tb_load_nonce,
                            form_data: api.Forms.serialize($lightbox[0])
                        },
                        beforeSend:function(){
                           Common.showLoader('show');
                        },
                        success: function (data) {
                            if (data.status === 'success') {
                                Common.showLoader();
                                Common.Lightbox.close();
                            } else {
                                Common.showLoader('error');
                                alert(data.msg);
                            }
                        }
                    });
                });
                $lightbox.addClass('tb_savead_lightbox');
                this.setStandAlone(e.clientX,e.clientY);
                Themify.body.one('themify_builder_lightbox_close', function () {
                    $lightbox.removeClass('tb_savead_lightbox').find('.builder_save_button').off('click');
                    topWindow.document.body.classList.remove('tb_standalone_lightbox');
                    el.removeClass('tb_current_menu_selected');
                });
            });
        },
        // Duplicate actions
        duplicate: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var self = this;
            function duplicatePageAjax() {
                self.Revisions.ajax({action: 'tb_duplicate_page', 'tb_is_admin': 'visual' !== api.mode}, function (url) {
                    url && (topWindow.location.href = $('<div/>').html(url).text());
                });
            }
            if (confirm(themifyBuilder.i18n.confirm_on_duplicate_page)) {
                api.Utils.saveBuilder(duplicatePageAjax);
            }
        },
        Revisions: {
            init: function () {
                api.toolbar.$el.find('.tb_revision').on('click', this.revision.bind(this));

            },
            revision: function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget.classList.contains('tb_save_revision')) {
                    this.save();
                }
                else {
                    this.load(e);
                }
            },
            load: function (e) {
                var self = this,
                    $body = $('body', topWindow.document),
                    el = $(e.currentTarget.closest('ul')),
                    offset = el.offset();
                    el.addClass('tb_current_menu_selected');
                    Common.Lightbox.$lightbox[0].style['display']='none';
                    Themify.body.off('themify_builder_lightbox_close.revisions');
                self.ajax({action: 'tb_load_revision_lists'}, function (data) {
                    Common.Lightbox.open({
                        contructor: true,
                        loadMethod: 'html',
                        data: {
                            revision: {
                                html: $(data)[0]
                            }
                        }
                    },function(){
                        $body.addClass('tb_standalone_lightbox');
                    }, function () { 
                        this.$lightbox[0].classList.add('tb_revision_lightbox');
                        this.setStandAlone(offset.left,offset.top,true);
                        $body.on('click.revision', '.js-builder-restore-revision-btn', self.restore.bind(self))
                                .on('click.revision', '.js-builder-delete-revision-btn', self.delete.bind(self));
                        Themify.body.one('themify_builder_lightbox_close.revisions', function () {
                            el.removeClass('tb_current_menu_selected');
                            $body.off('.revision').removeClass('tb_standalone_lightbox');
                            Common.Lightbox.$lightbox[0].classList.remove('tb_revision_lightbox');
                            $body=null;
                        });
                    });
                });
            },
            ajax: function (data, callback) {
                var _default = {
                    tb_load_nonce: themifyBuilder.tb_load_nonce,
                    postid: themifyBuilder.post_ID
                };
                data = $.extend({}, data, _default);
                return $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    data: data,
                    beforeSend: function () {
                        Common.showLoader('show');
                    },
                    complete: function () {
                        Common.showLoader('hide');
                    },
                    success: function (data) {
                        if ($.isFunction(callback)) {
                            callback.call(this, data);
                        }
                    }
                });
            },
            save: function (callback) {
                var self = this;
                Common.LiteLightbox.prompt(themifyBuilder.i18n.enterRevComment, function (result) {
                    if (result !== null) {
                        api.Utils.saveBuilder(function () {
                            self.ajax({action: 'tb_save_revision', rev_comment: result}, callback);
                        }, 0, true);
                    }
                });
            },
            restore: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var revID = $(e.currentTarget).data('rev-id'),
                        self = this,
                        restoreIt = function () {
                            self.ajax({action: 'tb_restore_revision_page', revid: revID}, function (data) {
                                if (data.builder_data) {
                                    api.Forms.reLoad(data.builder_data, themifyBuilder.post_ID);
                                    Common.Lightbox.close();
                                } else {
                                    Common.showLoader('error');
                                    alert(data.data);
                                }
                            });
                        };

                Common.LiteLightbox.confirm(themifyBuilder.i18n.confirmRestoreRev, function (response) {
                    if ('yes' === response) {
                        self.save(restoreIt);
                    } else {
                        restoreIt();
                    }
                }, {
                    buttons: {
                        no: {
                            label: 'Don\'t Save'
                        },
                        yes: {
                            label: 'Save'
                        }
                    }
                });

            },
            delete: function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!confirm(themifyBuilder.i18n.confirmDeleteRev)) {
                    return;
                }
                var $this = $(e.currentTarget),
                        self = this,
                        revID = $this.data('rev-id');
                self.ajax({action: 'tb_delete_revision', revid: revID}, function (data) {
                    if (!data.success) {
                        Common.showLoader('error');
                        alert(data.data);
                    }
                    else {
                        $this.closest('li').remove();
                    }
                });
            }
        },
        save: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var link = $(e.currentTarget).closest('.tb_toolbar_backend_edit').length > 0 ? $(e.currentTarget).prop('href') : false;
            if (themifyBuilder.is_gutenberg_editor && link !== false) {
                api.undoManager.reset();
                api._backendSwitchFrontend(link);
                return;
            }

            api.Utils.saveBuilder(function (jqXHR, textStatus) {
                if (textStatus !== 'success') {
                    alert(themifyBuilder.i18n.errorSaveBuilder);
                }
                else if (link !== false) {
                    if (api.mode === 'visual') {
                        sessionStorage.setItem('focusBackendEditor', true);
                        topWindow.location.href = link;
                    } else {
                        api.undoManager.reset();
                        api._backendSwitchFrontend(link);
                    }
                }
            });
        },
        libraryItems: {
            items: [],
            is_init: null,
            init: function () {
                $(document).one('tb_panel_tab_tb_module_panel_library_wrap', this.load.bind(this));
            },
            load: function (e, parent) {
                var self = this;
                parent = $(parent).find('.tb_module_panel_library_wrap');
                parent.addClass('tb_busy');
                $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    data: {
                        action: 'tb_get_library_items',
                        nonce: themifyBuilder.tb_load_nonce,
                        part: 'all',
                        pid: themifyBuilder.post_ID
                    },
                    success: function (data) {
                        self.setData(data);
                        parent.removeClass('tb_busy');
                        self.is_init = true;
                    },
                    error: function () {
                        parent.removeClass('tb_busy');
                        Common.showLoader('error');
                        self.init();
                        api.toolbar.$el.find('.tb_library_item_list').html('<h3>Failed to load Library Items.</h3>');
                    }
                });
            },
            get: function (id, type, callback) {
                if (this.items[id] !== undefined) {
                    callback(this.items[id]);
                }
                else {
                    var self = this;
                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        dataType: 'json',
                        data: {
                            action: 'tb_get_library_item',
                            nonce: themifyBuilder.tb_load_nonce,
                            type: type,
                            id: id
                        },
                        beforeSend: function (xhr) {
                            Common.showLoader('show');
                        },
                        success: function (data) {
                            Common.showLoader('hide');
                            if (data.status === 'success') {
                                self.items[id] = data.content;
                                callback(data.content);
                            }
                            else {
                                Common.showLoader('error');
                            }
                        },
                        error: function () {
                            Common.showLoader('error');
                        }
                    });
                }
            },
            template: function (data) {
                var html = '';
                for (var i = 0, len = data.length; i < len; ++i) {
                    var type = 'part';
                    if (data[i].post_type.indexOf('_rows', 5) !== -1) {
                        type = 'row';
                    }
                    else if (data[i].post_type.indexOf('_module', 5) !== -1) {
                        type = 'module';
                    }
                    html += '<div class="tb_library_item tb_item_' + type + '" data-type="' + type + '" data-id="' + data[i].id + '">';
                    html += '<div class="tb_library_item_inner"><span>' + data[i].post_title + '</span>';
                    html += '<a href="#" class="remove_item_btn tb_disable_sorting" title="Delete"></a></div></div>';
                }
                return html;
            },
            bindEvents: function (force) {
                if (api.mode === 'visual') {
                    api.Mixins.Builder.initModuleVisualDrag('.tb_item_module,.tb_item_part');
                    api.Mixins.Builder.initRowVisualDrag('.tb_item_row');
                }
                else {
                    api.Mixins.Builder.initRowDraggable(api.toolbar.$el.find('.tb_module_panel_library_wrap').first(), '.tb_item_row');
                    api.Mixins.Builder.initModuleDraggable(api.toolbar.$el.find('.tb_library_item_list').first(), '.tb_item_module,.tb_item_part');
                }
                if (api.toolbar.common.btn || (api.mode === 'visual' && (api.toolbar.common.is_init || force))) {
                    api.Mixins.Builder.initRowDraggable(api.toolbar.common.btn.find('.tb_module_panel_library_wrap').first(), '.tb_item_row');
                    api.Mixins.Builder.initModuleDraggable(api.toolbar.common.btn.find('.tb_library_item_list').first(), '.tb_item_module,.tb_item_part');
                }
            },
            setData: function (data) {
                var html = '<span class="tb_no_content" style="display:none">No library content found.</span>' + this.template(data),
                        libraryItems = $('.tb_library_item_list');
                if (api.mode === 'visual') {
                    libraryItems = libraryItems.add(api.toolbar.$el.find('.tb_library_item_list'));
                }
                data = null;
                libraryItems = libraryItems.get();
                for (var i =libraryItems.length-1; i>-1; --i) {
                    libraryItems[i].insertAdjacentHTML('afterbegin', html);
                    new SimpleBar(libraryItems[i]);
                    libraryItems[i].previousElementSibling.getElementsByClassName('current')[0].click();
                }
                Themify.body.on('click', '.remove_item_btn', this.delete.bind(this));
                if (api.mode === 'visual') {
                    api.toolbar.$el.on('click', '.remove_item_btn', this.delete.bind(this));
                }
                this.bindEvents();
            },
            delete: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var elem = $(e.currentTarget).closest('.tb_library_item'),
                        type = elem.data('type');
                if (confirm(themifyBuilder.i18n[type + 'LibraryDeleteConfirm'])) {
                    var id = elem.data('id');
                    $.ajax({
                        type: 'POST',
                        url: themifyBuilder.ajaxurl,
                        data: {
                            action: 'tb_remove_library_item',
                            nonce: themifyBuilder.tb_load_nonce,
                            id: id
                        },
                        beforeSend: function (xhr) {
                            Common.showLoader('show');
                        },
                        success: function (slug) {
                            Common.showLoader('hide');
                            if (slug) {
                                var el = elem.closest('#' + api.toolbar.common.btn.prop('id')).length > 0 ?
                                        api.toolbar.$el.find('.tb_item_' + type + '[data-id="' + id + '"]')
                                        : api.toolbar.common.btn.find('.tb_item_' + type + '[data-id="' + id + '"]');
                                elem = elem.add(el);
                                if (type === 'part') {
                                    elem = elem.add($('.themify_builder_content-' + id).closest('.active_module'));
                                    var control = api.Constructor.layoutPart.data;
                                    for(var i=control.length-1;i>-1;--i){
                                        if(control[i].post_name===slug){
                                            api.Constructor.layoutPart.data.splice(i, 1);
                                            break;
                                        }
                                    }
                                    control=null;
                                }
                                var activeTab = elem.parent().siblings('.tb_library_types').find('.current');
                                elem.remove();
                                activeTab.trigger('click');
                                activeTab = null;
                            }
                            else {
                                Common.showLoader('error');
                            }
                        },
                        error: function () {
                            Common.showLoader('error');
                        }
                    });
                }
            }
        },
        preDesignedRows: {
            is_init: null,
            rows: {},
            init: function () {
                setTimeout(function () {
                    //resolve dns and cache predessinged rows
                    var meta = topWindow.document.createElement('meta'),
                        fr = topWindow.document.createDocumentFragment(),
                        items = {'//themify.me':'dns-prefetch preconnect','//fonts.googleapis.com':'dns-prefetch','//maps.googleapis.com':'dns-prefetch','https://themify.me/public-api/predesigned-rows/index.json':'prefetch','https://themify.me/themify-layouts/index.json':'prefetch'};
                    meta.content='on';
                    meta.setAttribute('http-equiv','x-dns-prefetch-control');
                    fr.appendChild(meta);
                    for(var href in items){
                        var el = topWindow.document.createElement('link');
                        el.setAttribute('crossorigin',true);
                        el.rel=items[href];
                        el.href=href;
                        fr.appendChild(el);
                    }
                    items=null;
                    topWindow.document.head.appendChild(fr);
                }, 7000);
                $(document).one('tb_panel_tab_tb_module_panel_rows_wrap', this.load.bind(this));
            },
            load: function (e, parent) {
                var self = this;
                parent = $(parent).find('.tb_predesigned_rows_list');
                parent.addClass('tb_busy');
                $.getJSON('https://themify.me/public-api/predesigned-rows/index.json')
                        .done(function (data) {
                            self.setData(data, parent);
                        })
                        .fail(function (jqxhr, textStatus, error) {
                            self.setData({}, parent);
                            self.is_init = null;
                            Common.showLoader('error');
                            api.toolbar.$el.find('.tb_predesigned_rows_container').append('<h3>Failed to load Pre-Designed Rows from server.</h3>');
                            $(document).one('tb_panel_tab_tb_module_panel_rows_wrap', self.load.bind(self));
                        });
            },
            setData: function (data) {
                var cats = [],
                    catF=document.createDocumentFragment(),
                    f = document.createDocumentFragment();
                for (var i = 0, len = data.length; i < len; ++i) {
                    var tmp = data[i].category.split(','),
                        item_cats = '';
                    for (var j = 0, clen = tmp.length; j < clen; ++j) {
                        if (cats.indexOf(tmp[j]) === -1) {
                            cats.push(tmp[j]);
                        }
                        item_cats += ' tb' + Themify.hash(tmp[j]);
                    }
                    if (((i + 1) % 4) === 0) {
                        item_cats += ' tb_column_break';
                    }
                    var item = document.createElement('div'),
                        figure = document.createElement('figure'),
                        title=document.createElement('div'),
                        img =new Image(),
                        add=document.createElement('a');
                        item.className='predesigned_row'+item_cats;
                        item.setAttribute('data-slug',data[i].slug);
                        figure.className='tb_predesigned_rows_image';
                        title.className='tb_predesigned_rows_title';
                        title.textContent=img.alt=img.title=data[i].title;
                        img.src=data[i].thumbnail === undefined || data[i].thumbnail === ''?'https://placeholdit.imgix.net/~text?txtsize=24&txt=' + (encodeURI(data[i].title)) + '&w=181&h=77':data[i].thumbnail;
                        img.width=500;
                        img.height=300;
                        add.href='#';
                        add.className='add_module_btn tb_disable_sorting';
                        add.dataset.type = 'predesigned';
                        figure.appendChild(img);
                        figure.appendChild(add);
                        item.appendChild(figure);
                        item.appendChild(title);
                        f.appendChild(item);
                }
                data = null;
                cats.sort();
                for (var i = 0, len = cats.length; i < len; ++i) {
                    var item = document.createElement('li');
                        item.setAttribute('data-slug',Themify.hash(cats[i]));
                        item.textContent=cats[i];
                        catF.appendChild(item);
                }
                var filter = $('.tb_module_panel_container .tb_ui_dropdown .tb_ui_dropdown_items'),
                        predesigned = $('.tb_predesigned_rows_container'),
                        self = this;
                if (api.mode === 'visual') {
                    predesigned = predesigned.add(api.toolbar.$el.find('.tb_predesigned_rows_container'));
                    filter = filter.add(api.toolbar.$el.find('.tb_module_panel_container .tb_ui_dropdown .tb_ui_dropdown_items'));
                }
                filter = filter.get();
                predesigned = predesigned.get();
                for (var i =filter.length-1; i>-1; --i) {
                    filter[i].appendChild(catF.cloneNode(true));
                    predesigned[i].appendChild(f.cloneNode(true));
                    var img = predesigned[i].getElementsByTagName('img');
                    if (img.length > 0) {
                        img = img[img.length - 1];
                        $(img).one('load', function () {
                            callback($(this).closest('.tb_predesigned_rows_container')[0]);
                        });
                    } else {
                        callback(predesigned[i]);
                    }
                }
                function callback(el) {
                    new SimpleBar(el);
                    var $el =$(el);
                    if (self.is_init !== true) {
                        if (api.mode === 'visual') {
                            api.Mixins.Builder.initRowVisualDrag('.predesigned_row');
                        }
                        else {
                            api.Mixins.Builder.initRowDraggable(api.toolbar.$el.find('.tb_predesigned_rows_container').first(), '.predesigned_row');
                        }
                        if (api.toolbar.common.is_init) {
                            api.Mixins.Builder.initRowDraggable(api.toolbar.common.btn.find('.tb_predesigned_rows_container').first(), '.predesigned_row');
                        }
                       self.is_init = true;
                    }
                    new SimpleBar($el.closest('.tb_module_panel_tab').find('.tb_ui_dropdown_items')[0]);
                    $el.closest('.tb_predesigned_rows_list').removeClass('tb_busy').closest('.tb_module_panel_tab').find('.tb_ui_dropdown').css('visibility', 'visible');
                }
                 Themify.body.on('click', '.tb_module_panel_container .tb_ui_dropdown_items li', this.filter.bind(this));
                if (api.mode === 'visual') {
                    $('body', topWindow.document).on('click', '.tb_module_panel_container .tb_ui_dropdown_items li', this.filter.bind(this));
                }
            },
            get: function (slug, callback) {
                Common.showLoader('show');
                if (this.rows[slug] !== undefined) {
                    if (typeof callback === 'function') {
                        callback(this.rows[slug]);
                    }
                    return;
                }
                var self = this;
                $.getJSON('https://themify.me/public-api/predesigned-rows/' + slug + '.txt')
                        .done(function (data) {
                            self.rows[slug] = data;
                            if (typeof callback === 'function') {
                                callback(data);
                            }

                        }).fail(function (jqxhr, textStatus, error) {
                    Common.showLoader('error');
                    alert('Failed to fetch row template');
                });
            },
            filter: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var el = $(e.currentTarget),
                        slug = el.data('slug'),
                        parent = el.closest('.tb_module_panel_tab'),
                        active = parent.find('.tb_ui_dropdown_label'),
                        rows = parent.find('.predesigned_row');
                active.text(el.text());
                parent.find('.tb_module_panel_search_text').val('');
                var cl = slug ? 'tb' + slug : false;
                active.data('active', cl);
                el.addClass('current').siblings().removeClass('current');
                rows.each(function () {
                    if (!cl || this.classList.contains(cl)) {
                        $(this).show();
                    }
                    else {
                        $(this).hide();
                    }
                }).filter(':visible').each(function (i) {
                    if (((i + 1) % 4) === 0) {
                        $(this).addClass('tb_column_break');
                    }
                    else {
                        $(this).removeClass('tb_column_break');
                    }
                });
                api.Utils.hideOnClick(parent.find('.tb_ui_dropdown_items'));
            }
        },
        pageBreakModule: {
            init: function () {
                if (api.mode === 'visual') {
                    api.Mixins.Builder.initRowVisualDrag('.tb_page_break_module');
                }
                else {
                    api.Mixins.Builder.initRowDraggable(api.toolbar.$el.find('.tb_module_panel_modules_wrap').first(), '.tb_page_break_module');
                }
            },
            countModules: function () {
                var modules = api.mode === 'visual' ? document.getElementsByClassName('module-page-break') : document.getElementsByClassName('tb-page-break') ;
                for( var i = modules.length-1; i>-1; --i ){
                    if(api.mode === 'visual'){
                        modules[i].getElementsByClassName('page-break-order')[0].textContent=i+1;
                    } else {
                        modules[i].getElementsByClassName('page-break-overlay')[0].textContent='PAGE BREAK - ' + (i+1);
                    }
                }
            },
            get: function () {
                return [{
                        cols: [
                            {
                                grid_class: 'col-full first last',
                                modules: [
                                    {
                                        mod_name: 'page-break'
                                    }
                                ]
                            }
                        ],
                        column_alignment: 'col_align_middle',
                        styling: {
                            custom_css_row: 'tb-page-break'
                        }
                    }
                ];
            }
        },
        common: {
            btn: null,
            is_init: null,
            clicked: null,
            init: function () {
                var btn = document.createElement('div'),
                    wrap = api.toolbar.$el;
                btn.className='tb_modules_panel_wrap';
                btn.id='tb_module_panel_dropdown';
                this.btn = $(btn);
                btn=null;
                wrap = wrap.add(Common.Lightbox.$lightbox);
                if (api.mode!=='visual' && document.querySelector('.edit-post-layout__content') !== null) {
                    $('.edit-post-layout__content')[0].appendChild(this.btn[0]);
                } else {
                    Themify.body[0].appendChild(this.btn[0]);
                }
                var self = this;
                if (api.mode === 'visual') {
                    api.toolbar.$el.find('.tb_module_types li').on('click', this.tabs.bind(this));
                }
                Themify.body.on('click', '.tb_module_types li', this.tabs.bind(this)).on('click', '.tb_column_btn_plus', this.show.bind(this));
                wrap.on('click', '.tb_clear_input',this.clear);
                api.toolbar.$el.find('.tb_module_panel_search_text').on('keyup', this.search.bind(this));
                this.btn.on('click', '.add_module_btn,.js-tb_module_panel_acc', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var holder,
                        isEmpty=null,
                        cl = this.classList,
                        type = this.dataset['type'];
                        if(!self.clicked){
                            self.clicked = api.Instances.Builder[api.builderIndex].newRowAvailable(1,true);
                            isEmpty=true;
                            
                        }
                    if('module' === type){
                        holder= self.clicked.hasClass('tb_module_btn_plus')?self.clicked.parent():self.clicked.closest('.module_column').find('.tb_holder').last();
                        api.toolbar.Panel.add_module(e, holder);
                    }
                    else if('row' === type){
                        holder = self.clicked.hasClass('tb_module_btn_plus')?self.clicked.parent():self.clicked.closest('.module_column').find('.tb_holder').first();
                        api.toolbar.Panel.click_add_sub_row(e, holder);
                    }
                    else if(cl.contains('js-tb_module_panel_acc')){
                        api.toolbar.toggleAccordion(e);
                    }
                    else if('predesigned' === type || 'page_break' === type){
                        holder = self.clicked.closest('.module_row');
                        if('page_break' === type){
                            api.toolbar.Panel.click_add_page_break(e, holder);
                        }
                        else{
                            api.toolbar.preDesignedRows.get( $(e.currentTarget).closest('.predesigned_row').data('slug'), function (data) {
                                 api.Mixins.Builder.rowDrop(data, isEmpty?holder:$('<div>').insertAfter(holder),true );
                                 
                            });
                        }
                    }
                    if(!cl.contains('js-tb_module_panel_acc')){
                        self.hide(true);
                        }
                })
                .on('keyup', '.tb_module_panel_search_text', this.search.bind(this))
                .on('click', '.tb_clear_input', this.clear);
            },
            run: function () {
                var markup = api.toolbar.$el.find('#tb_module_panel');
                this.btn[0].insertAdjacentHTML('beforeend', markup[0].innerHTML);
                this.btn.find('.tb_module_outer').show();
                var menu = this.btn.find('.tb_module_types').closest('div')[0];
                menu.parentNode.parentNode.insertBefore(menu, menu.parentNode);
                menu.parentNode.removeChild(menu.nextElementSibling);
                menu=null;
                var dropdown_items =this.btn.find('.tb_compact_tabs').removeClass('tb_compact_tabs').find('.tb_ui_dropdown_items').removeClass('tb_ui_dropdown_items');
                this.btn.find('.tb_module_panel_search_text').val('');
                new SimpleBar(this.btn.find('.tb_module_panel_modules_wrap')[0]);
                if(dropdown_items.find('.simplebar-scroll-content').length){
                    var el = new SimpleBar(dropdown_items[0]);
                    el.recalculate();
                }
                api.Mixins.Builder.initModuleDraggable(this.btn, '.tb_module');
                api.Mixins.Builder.initModuleDraggable(this.btn.find('.tb_rows_grid').first(), '.tb_row_grid');
                api.Mixins.Builder.initRowDraggable(this.btn, '.tb_page_break_module');
                if (api.toolbar.libraryItems.is_init || api.mode === 'visual') {
                    api.Mixins.Builder.initModuleDraggable(this.btn.find('.tb_library_item_list').first(), '.tb_item_module,.tb_item_part');
                    api.Mixins.Builder.initRowDraggable(this.btn.find('.tb_library_item_list').first(), '.tb_item_row');
                }
                if (api.toolbar.preDesignedRows.is_init || api.mode === 'visual') {
                    api.Mixins.Builder.initRowDraggable(this.btn.find('.tb_predesigned_rows_container').first(), '.predesigned_row');
                }
                this.is_init = true;
                api.Mixins.Builder.initRowDraggable(this.btn.find('.tb_module_panel_rows_wrap').first(), '.tb_page_break_module');
            },
            tabs: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var elm = $(e.currentTarget),
                    p=elm.closest('ul'),
                        target = elm.data('target'),
                        parent = elm.closest('.tb_modules_panel_wrap');
                parent.find('.' + elm.data('hide')).hide();
                var items = parent.find('.' + target),
                        not_found = parent.find('.tb_no_content');
                if (items.length > 0) {
                    not_found.hide();
                    items.show();
                }
                else {
                    not_found.show();
                }
                elm.closest('li').addClass('current').siblings().removeClass('current');
                parent.find('.tb_module_panel_search_text').val('').focus().trigger('keyup');
                $(document).triggerHandler('tb_panel_tab_' + target, parent);
                var dropdown_label = p.parent().find('.tb_ui_dropdown_label');
                if(dropdown_label.length>0){
                    dropdown_label.text(elm.text());
                }
                api.Utils.hideOnClick(p);
            },
            show: function (e,holder) {
                e.preventDefault();
                e.stopPropagation();
                if(!api.activeModel && topWindow.document.body.classList.contains('tb_standalone_lightbox')){
                    Common.Lightbox.close();
                }
                if (this.is_init === null) {
                    this.run();
                }
                if(this.clicked){
                    this.clicked[0].classList.remove('clicked'); 
                }
                this.clicked = holder?holder:$(e.currentTarget);
                var self = this,
                        offset = this.clicked.offset(),
                    $body = Themify.body,
                    left = offset.left+(this.clicked.width()/2), 
                    top = offset.top,
                    $guten_container = api.mode!=='visual'?$('.edit-post-layout__content'):false;
                if ($guten_container!==false && $guten_container.length > 0) {
                    top += $guten_container.scrollTop() - 70;
                    left = ($guten_container.width() / 2);
                }
                left = left - (this.btn.outerWidth() / 2);
                if (left < 0) {
                    left = 0;
                }
                if(this.clicked.parents('.sub_column').length){
                    this.btn[0].classList.add('tb_subrow_open');
                }
                else {
                    this.btn[0].classList.remove('tb_subrow_open');
                }
                this.btn.css({top: top, left: left}).show();
                this.resize();
                if (api.mode === 'visual') {
                    $body = $body.add($('body', topWindow.document));
                    if (api.activeBreakPoint !== 'desktop') {
                        $('body', topWindow.document).height(document.body.scrollHeight + self.btn.outerHeight(true));
                        Themify.body.css('padding-bottom', 180);
                    }
                }
                $body.addClass('tb_panel_dropdown_openend');
                this.clicked.addClass('clicked');
                if (api.activeBreakPoint === 'desktop') {
                    setTimeout(function(){
                        this.btn.find('.tb_module_panel_search_text').focus();
                    }.bind(this),50);
                }
                this.hide();
                api.ActionBar.clear();
                if(api.activeModel!==null){
                    var save = Common.Lightbox.$lightbox[0].getElementsByClassName('builder_save_button')[0];
                    if(save!==undefined){
                        save.click();
                    }
                }
            },
            resize:function(){
                if(this.btn!==null){
                    api.Utils.addViewPortClass(this.btn[0]);
                }
            },
            hide: function (force) {
                var self = this;
                function callback() {
                    if (force===true || !self.btn.is(':hover')) {
                        var $body = Themify.body;
                        if(self.btn!==null){
                            self.btn.hide().css('width', '');
                            if(self.clicked){
                                self.clicked[0].classList.remove('clicked'); 
                            }
                            self.clicked = null;
                        }
                        $(document).off('click', callback);
                        $(topWindow.document).off('click', callback);
                        if (api.mode === 'visual') {
                                $body = $body.add($('body', topWindow.document));
                                if(api.activeBreakPoint !== 'desktop'){
                                $('body', topWindow.document).height(document.body.scrollHeight);
                                Themify.body.css('padding-bottom', '');
                            }
                        }
                        $body.removeClass('tb_panel_dropdown_openend');
                    }
                }
                if(force===true){
                    callback();
                }
                else{
                    if (api.mode === 'visual') {
                        $(topWindow.document).on('click', callback);
                    }
                    $(document).on('click', callback);
                }
            },
            search: function (e) {
                var el = $(e.currentTarget),
                        parent = el.closest('.tb_modules_panel_wrap'),
                        target = parent.find('.tb_module_types .current').first().data('target'),
                        search = false,
                        filter = false,
                        is_module = false,
                        is_library = false,
                        s = $.trim(el.val());
                if (target === 'tb_module_panel_modules_wrap') {
                    search = parent.find('.tb_module_outer');
                    is_module = true;
                }
                else if (target === 'tb_module_panel_rows_wrap' && api.toolbar.preDesignedRows.is_init) {
                    filter = parent.find('.tb_ui_dropdown_label').data('active');
                    search = parent.find('.predesigned_row');
                }
                else if (target === 'tb_module_panel_library_wrap') {
                    search = parent.find('.tb_library_item');
                    filter = parent.find('.tb_library_types .current').data('target');
                    is_library = true;
                }
                if (search !== false) {
                    var is_empty = s === '',
                        reg = !is_empty ? new RegExp(s, 'i') : false;
                        search.each(function () {
                            if (filter && !this.classList.contains(filter)) {
                                return true;
                            }
                            var elm = is_module ? $(this).find('.module_name') : (is_library ? $(this).find('.tb_library_item_inner span') : $(this).find('.tb_predesigned_rows_title'));
                            if (is_empty || reg.test(elm.text())) {
                                $(this).show();
                            }
                            else {
                                $(this).hide();
                            }
                        });
                    // hide other accordions
                    if ( is_empty ) {
                        parent.find('.tb_module_panel_tab_acc_title').show().end()
                        .find('.tb_module_panel_tab_acc_content:not(.tb_module_panel_tab_acc_content_module)').show();
                    } else {
                        parent.find('.tb_module_panel_tab_acc_title').hide().end()
                        .find('.tb_module_panel_tab_acc_content:not(.tb_module_panel_tab_acc_content_module)').hide();
                    }
                }
            },
            clear:function(e){
                e.preventDefault();
                e.stopPropagation();
                var input = $(this).parent().children('input').first();
                if(input.length>0){
                    input.val('');
                    if(input[0].hasAttribute("data-search")){
                        input.trigger('keyup').focus();
                    }
                    else{
                        input.trigger('change');
                        Themify.triggerEvent(input[0],'change');
                    }
                }
                
            }
        },
        help: {
            init: function () {
                $('.tb_help_btn', api.toolbar.$el).on('click', this.show.bind(this));
            },
            show: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var self = this;
                Common.showLoader('show');
                return $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    data: {tb_load_nonce: themifyBuilder.tb_load_nonce, action: 'tb_help'},
                    complete: function () {
                        Common.showLoader('spinhide');
                    },
                    success: function (data) {
                        topWindow.document.body.insertAdjacentHTML('beforeend', data);
                        var $wrapper = $('#tb_help_lightbox', topWindow.document.body);
                        $('.tb_player_btn', $wrapper).on('click', self.play.bind(self));
                        $('.tb_help_menu a', $wrapper).on('click', self.tabs.bind(self));
                        $('.tb_close_lightbox', $wrapper).on('click', self.close.bind(self));
                        $wrapper.slideDown();
                    }
                });
            },
            play: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var a = $(e.currentTarget).closest('a'),
                        href = a.prop('href'),
                        iframe = document.createElement('iframe');
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'autoplay; fullscreen');
                iframe.setAttribute('src', href + '?rel=0&showinfo=0&autoplay=1&enablejsapi=1&html5=1&version=3');
                a.replaceWith(iframe);

            },
            tabs: function (e) {
                e.preventDefault();
                e.stopPropagation();
                var $this = $(e.currentTarget),
                        wrapper = $('.tb_help_video_wrapper', topWindow.document),
                        active = wrapper.find($this.attr('href')),
                        activePlayer = active.find('.tb_player_btn');
                wrapper.find('.tb_player_wrapper').removeClass('current').hide();
                active.addClass('current').show();
                $this.closest('li').addClass('current').siblings().removeClass('current');
                this.stopPlay();
                if (activePlayer.length > 0) {
                    activePlayer.trigger('click');
                }
                else {
                    this.startPlay();
                }
            },
            execute: function (iframe, param) {
                iframe.contentWindow.postMessage('{"event":"command","func":"' + param + '","args":""}', '*');
            },
            stopPlay: function () {
                var self = this;
                $('.tb_player_wrapper', topWindow.document).each(function () {
                    if (!this.classList.contains('current')) {
                        var iframe = $(this).find('iframe');
                        if (iframe.length > 0) {
                            self.execute(iframe[0], 'pauseVideo');
                        }
                    }
                });
            },
            startPlay: function () {
                var iframe = $('.tb_player_wrapper.current', topWindow.document).find('iframe');
                iframe.length > 0 && this.execute(iframe[0], 'playVideo');
            },
            close: function (e, callback) {
                e.preventDefault();
                e.stopPropagation();
                $(e.currentTarget).closest('#tb_help_lightbox').slideUp('normal', function () {
                    $(this).next('.tb_overlay').remove();
                    $(this).empty().remove();
                    if (callback) {
                        callback();
                    }
                });
            }
        },
        breakpointSwitcher: function (e) {
            e.preventDefault();
            e.stopPropagation();
            var self = this,
                breakpoint = 'desktop',
                _this = e.currentTarget,
                $body = $('body', topWindow.document),
                is_resizing = api.mode === 'visual' && api.iframe[0].classList.contains('tb_resizing_start'),
                prevBreakPoint = api.activeBreakPoint,
                callback = function () {
                    self.responsive_grids(breakpoint, prevBreakPoint);
                    var finish = function () {
                            api.Utils.setCompactMode(document.getElementsByClassName('module_column'));
                            api.toolbar.el.getElementsByClassName('tb_compact_switcher')[0].getElementsByTagName('i')[0].className = _this.getElementsByTagName('i')[0].className;
                            $body.removeClass('tb_start_animate').toggleClass('tb_responsive_mode', breakpoint !== 'desktop').removeClass('builder-breakpoint-' + prevBreakPoint).addClass('builder-breakpoint-' + breakpoint);
                            Themify.body.triggerHandler('themify_builder_change_mode', [prevBreakPoint, breakpoint]);
                            if (api.mode === 'visual') {
                                api.iframe[0].style['willChange'] = '';
                                setTimeout(function () {
                                    topWindow.document.body.style['height'] = breakpoint !== 'desktop'?document.body.scrollHeight + 'px':'';
                                    if(!is_resizing && api.scrollTo){
                                        $(window).add(topWindow.document).scrollTop(api.scrollTo.offset().top);
                                                api.scrollTo = false;
                                        }
                                }, 150);
                            }
                    };
                    if (api.mode === 'visual') {
                            api.Utils._onResize(true, function () {
                                self.iframeScroll(breakpoint !== 'desktop');
                                if (prevBreakPoint === 'desktop' || breakpoint === 'desktop') {
                                        api.Mixins.Builder.updateModuleSort(null, breakpoint === 'desktop' ? 'enable' : 'disable');
                                }
                                setTimeout(finish, is_resizing ? 1 : 100);
                            });
                    } else {
                            finish();
                    }
                };
            if (_this.classList.contains('breakpoint-tablet')) {
                breakpoint = 'tablet';
            } else if (_this.classList.contains('breakpoint-tablet_landscape')) {
                breakpoint = 'tablet_landscape';
            } else if (_this.classList.contains('breakpoint-mobile')) {
                breakpoint = 'mobile';
            }
            var w=breakpoint !== 'desktop'?api.Utils.getBPWidth(breakpoint) - 1:'';
            if ((prevBreakPoint === breakpoint && e.originalEvent !== undefined && ((w ? (w + 'px') : w) === api.iframe[0].style['width']))) {
                return false;
            }
            api.ActionBar.clear();
            if(api.mode === 'visual'){
                //hide the hidden  rows for fast resizing
                if (!is_resizing && !api.isPreview){
                    var childs = api.Instances.Builder[0].el.children,
                        items = [],
                        clH=window.innerHeight,
                        fillHidden=function(item){
                            if(item!==null && item!==undefined){
                                var off = item.getBoundingClientRect();
                                if((off.bottom<0&&off.top<0)||off.top>clH){
                                    item.style['display']='none';
                                    items.push(item);
                                }
                            }
                        };
                        for(var i=childs.length-1;i>-1;--i){
                            fillHidden(childs[i]);
                        }
                    fillHidden(document.getElementById('headerwrap'));
                    fillHidden(document.getElementById('footerwrap'));
                    childs=clH=null;
                }
                $body = $body.add(Themify.body);
            }
            api.activeBreakPoint = breakpoint;
            $body.addClass('tb_start_animate'); //disable all transitions
            if (api.mode === 'visual') {
                api.iframe[0].style['willChange'] = 'width';
                // disable zoom if active
                var zoom_menu = topWindow.document.getElementsByClassName('tb_toolbar_zoom_menu')[0];
                zoom_menu.classList.remove('tb_toolbar_zoom_active');
                zoom_menu.getElementsByClassName('tb_toolbar_zoom_menu_toggle')[0].dataset['zoom'] = 100;
                if ('tablet_landscape' === breakpoint && Common.Lightbox.dockMode.get()) {
                    var wspace = $('.tb_workspace_container', topWindow.document).width();
                    if (wspace < w) {
                        w = wspace; // make preview fit the screen when dock mode active
                    }
                }
                if (api.isPreview) {
                    var h,
                        previewWidth = {
                            'tablet_landscape': [1024, 768],
                            'tablet': [768, 1024],
                            'mobile': [375, 667]
                        };

                    if (previewWidth[breakpoint]!==undefined) {
                        w = previewWidth[breakpoint][0];
                        h = previewWidth[breakpoint][1];
                    }
                }
                api.iframe[0].parentNode.classList.remove('tb_zoom_bg');
                if (!is_resizing) {
                    topWindow.document.body.offsetHeight;//force reflow
                    api.iframe.one(api.Utils.transitionPrefix(), function () {
                        if (!api.isPreview){
                            for(var i=items.length-1;i>-1;--i){
                                items[i].style['display']='';
                            }
                            items=null;
                        }
                        setTimeout(callback, 10);
                    });
                    api.iframe[0].style['width'] = w ? (w + 'px') : w;
                    api.iframe[0].style['height'] = api.isPreview?(h ? (h + 'px') : h):'';
                }
                else {
                    callback();
                }
            }
            else {
                callback();
            }
        },
        iframeScroll: function (init) {
            var top = $(topWindow.document);
            top.off('scroll.themifybuilderresponsive');
            if (init) {
                top.on('scroll.themifybuilderresponsive', function () {
                    window.scrollTo(0, $(this).scrollTop());
                });
            }
        },
        responsive_grids: function (type, prev) {
            var rows = document.querySelectorAll('.row_inner,.subrow_inner'),
                    is_desktop = type === 'desktop',
                    set_custom_width = is_desktop || prev === 'desktop';
            for (var i =rows.length-1; i>-1; --i) {
                var base = rows[i].getAttribute('data-basecol');
                if (base !== null) {
                    var columns = rows[i].children,
                            grid = rows[i].dataset['col_' + type],
                            first = columns[0],
                            last = columns[columns.length - 1];
                    if (!is_desktop) {
                        if (prev !== 'desktop') {
                            rows[i].classList.remove('tb_3col');
                            var prev_class = rows[i].getAttribute('data-col_' + prev);
                            if (prev_class) {
                                rows[i].classList.remove($.trim(prev_class.replace('tb_3col', '').replace('mobile', 'column').replace('tablet', 'column')));
                            }
                        }
                        if (!grid || grid === '-auto') {
                            rows[i].classList.remove('tb_grid_classes');
                            rows[i].classList.remove('col-count-' + base);
                        }
                        else {
                            var cl = rows[i].getAttribute('data-col_' + type);
                            if (cl) {
                                rows[i].classList.add('tb_grid_classes');
                                rows[i].classList.add('col-count-' + base);
                                cl = cl.split(' ');
                                for (var k = 0, klen = cl.length; k < klen; ++k) {
                                    rows[i].classList.add($.trim(cl[k].replace('mobile', 'column').replace('tablet', 'column')));
                                }
                            }
                        }
                    }
                    if (set_custom_width) {
                        for (var j = 0, clen = columns.length; j < clen; ++j) {
                            var w = $(columns[j]).data('w');
                            if (w !== undefined) {
                                if (is_desktop) {
                                    columns[j].style['width'] = w + '%';
                                }
                                else {
                                    columns[j].style['width'] = '';
                                }
                            }
                        }
                    }
                    var dir = rows[i].getAttribute('data-' + type + '_dir');
                    if (dir === 'rtl') {
                        first.classList.remove('first');
                        first.classList.add('last');
                        last.classList.remove('last');
                        last.classList.add('first');
                        rows[i].classList.add('direction-rtl');
                    }
                    else {
                        first.classList.remove('last');
                        first.classList.add('first');
                        last.classList.remove('first');
                        last.classList.add('last');
                        rows[i].classList.remove('direction-rtl');
                    }
                }
            }
        },
        Panel: {
            el: null,
            init: function () {
                this.el = api.toolbar.$el.find('.tb_toolbar_add_modules_wrap');
                this.el.on('click', '.add_module_btn',this.initEvents.bind(this));
                this.compactToolbar();
                if(api.mode==='visual'){
                    Common.Lightbox.dockMode.setDoc();
                }
            },
            initEvents:function(e){
                e.preventDefault();
                e.stopPropagation();
                var type = e.currentTarget.dataset['type'];
                if('module' === type){
                    this.add_module(e);
                }else if('row' === type){
                    this.click_add_sub_row(e);
                }else if('page_break' === type){
                    this.click_add_page_break(e);
                }
                else if('predesigned' === type){
                    api.toolbar.preDesignedRows.get( e.currentTarget.closest('.predesigned_row').dataset['slug'], function (data) {
                        var holder = api.Instances.Builder[api.builderIndex].$el.find('.module_row').last();
                        api.Mixins.Builder.rowDrop(data, $('<div>').insertAfter(holder),true );
                    });
                }
            },
            setFocus:function(){
                api.toolbar.el.getElementsByClassName('tb_module_panel_search_text')[0].focus();
            },
            add_module: function (e, holder) {
                e.preventDefault();
                e.stopPropagation();
                if(!holder){
                    holder = api.Instances.Builder[api.builderIndex].newRowAvailable(1,true).find('.tb_holder').first();
                }
                api.Mixins.Builder.moduleDrop($(e.currentTarget).closest('.tb_module'), holder);
            },
            click_add_sub_row: function( e, holder ) {
                e.preventDefault();
                e.stopPropagation();
                var is_sub_row = holder ? true : false;
                holder = holder || api.Instances.Builder[api.builderIndex].$el.find('.module_row').last();
                var data = $(e.currentTarget).closest('.tb_row_grid').data('slug');
                if ( is_sub_row ) {
                    if(holder.hasClass('tb_module_front')){
                        api.Mixins.Builder.subRowDrop(data, $('<div>').insertAfter(holder) );
                    }else{
                        api.Mixins.Builder.subRowDrop(data, $('<div>').appendTo(holder) );
                    }
                } else {
                    api.Mixins.Builder.rowDrop(api.Utils.grid( data ), $('<div>').insertAfter(holder),true,true );
                }
            },
            click_add_page_break: function( e, holder ) {
                e.preventDefault();
                e.stopPropagation();
                holder = holder || api.Instances.Builder[api.builderIndex].$el.find('.module_row').last();
                api.Mixins.Builder.rowDrop(api.toolbar.pageBreakModule.get(), $('<div>').insertAfter(holder),true);
                api.toolbar.pageBreakModule.countModules();
            },
            compactToolbar: function () {
                var barLimit = api.mode === 'visual' ? 850 : 750;
                function callback() {
                    api.toolbar.$el.outerWidth() < barLimit ? topWindow.document.body.classList.add('tb_compact_toolbar') : topWindow.document.body.classList.remove('tb_compact_toolbar');
                    api.toolbar.common.resize();
                }
                $(topWindow).on('tfsmartresize.compact', callback);
                if (api.mode === 'visual') {
                    topWindow.jQuery('body').one('themify_builder_ready', callback);
                }
                else {
                    callback();
                }
            }
        },
        toggleFavoriteModule: function () {
            var $this = $(this),
                    moduleBox = $this.closest('.tb_module_outer'),
                    slug = $this.parent().data('module-slug');

            $.ajax({
                type: 'POST',
                url: themifyBuilder.ajaxurl,
                dataType: 'json',
                data: {
                    action: 'tb_module_favorite',
                    module_name: slug,
                    module_state: +!moduleBox.hasClass('favorited')
                },
                beforeSend: function (xhr) {
                    var prefix = api.Utils.transitionPrefix();
                    function callback(box, repeat) {

                        function finish() {
                            box.removeAttr('style');
                            if (repeat) {
                                var p = box.closest('#tb_module_panel_dropdown').length > 0 ? api.toolbar.$el : $('#tb_module_panel_dropdown');
                                callback(p.find('.tb-module-type-' + slug).closest('.tb_module_outer'), false);
                            }
                        }
                        if (!box.is(':visible')) {
                            box.toggleClass('favorited');
                            finish();
                            return;
                        }
                        box.css({
                            opacity: 0,
                            transform: 'scale(0.5)'
                        }).one(prefix, function () {
                            box.toggleClass('favorited').css({
                                opacity: 1,
                                transform: 'scale(1)'
                            }).one(prefix, finish);
                        });
                    }
                    callback(moduleBox, true);
                }
            });
        },
        zoom: function (e) {
            e.preventDefault();
            if ('desktop' !== api.activeBreakPoint)
                return true;
            function callback() {
                api.Utils._onResize(true);
            }
            var $link,
                    $this = $(e.currentTarget),
                    zoom_size = $this.data('zoom'),
                    $canvas = $('.tb_iframe', topWindow.document),
                    $parentMenu = $this.closest('.tb_toolbar_zoom_menu');

            if ($this.hasClass('tb_toolbar_zoom_menu_toggle')) {
                zoom_size = '100' == zoom_size ? 50 : 100;
                $this.data('zoom', zoom_size);
                $link = $this.next('ul').find('[data-zoom="' + zoom_size + '"]');
            } else {
                $link = $this;
                $parentMenu.find('.tb_toolbar_zoom_menu_toggle').data('zoom', zoom_size);
            }

            $canvas.removeClass('tb_zooming_50 tb_zooming_75');
            $link.parent().addClass('selected-zoom-size').siblings().removeClass('selected-zoom-size');
            if ('50' == zoom_size || '75' == zoom_size) {
                var scale = '50' == zoom_size ? 2 : 1.25;
                $canvas.addClass('tb_zooming_' + zoom_size).one(api.Utils.transitionPrefix(), callback).parent().addClass('tb_zoom_bg')
                        .css('height', Math.max(topWindow.innerHeight * scale, 600));
                $parentMenu.addClass('tb_toolbar_zoom_active');
                api.zoomMeta.isActive = true;
                api.zoomMeta.size = zoom_size;
                Themify.body.addClass('tb_zoom_only');
            }
            else {
                $canvas.addClass('tb_zooming_' + zoom_size).one(api.Utils.transitionPrefix(), callback).parent().css('height', '');
                $parentMenu.removeClass('tb_toolbar_zoom_active');
                api.zoomMeta.isActive = false;
                Themify.body.removeClass('tb_zoom_only');
            }
        },
        previewBuilder: function (e) {
            e.preventDefault();
            function hide_empty_rows() {
                if (api.isPreview) {
                    var row_inner = document.getElementsByClassName('row_inner');
                    for (var i = row_inner.length - 1; i > -1; --i) {
                        if (row_inner[i].classList.contains('col-count-1') && row_inner[i].getElementsByClassName('active_module').length === 0) {
                            var column = row_inner[i].getElementsByClassName('module_column')[0],
                                    mcolumn = api.Models.Registry.lookup(column.getAttribute('data-cid'));
                            if (mcolumn && Object.keys(mcolumn.get('styling')).length === 0) {
                                var row = row_inner[i].closest('.module_row'),
                                        mrow = api.Models.Registry.lookup(row.getAttribute('data-cid'));
                                if (mrow && Object.keys(mrow.get('styling')).length === 0) {
                                    row.classList.add('tb_hide');
                                }
                            }

                        }
                    }
                }
                else {
                    $('.tb_hide.module_row').removeClass('tb_hide');
                }
            }
            $(e.currentTarget).toggleClass('tb_toolbar_preview_active');
            api.isPreview = !api.isPreview;
            if(!api.isPreview){
                api.iframe[0].style['height'] = '';
            }
            Themify.body.toggleClass('tb_preview_only themify_builder_active');
            $('body', topWindow.document).toggleClass('tb_preview_parent');
            hide_empty_rows();
            if(api.mode==='visual' && !topWindow.document.body.classList.contains('tb_panel_minimized') && Common.Lightbox.dockMode.get()){
                api.Utils._onResize(true);
            }
            api.vent.trigger('dom:preview');
        },
        toggleAccordion: function( e ) {
            $(e.currentTarget).closest('.tb_module_panel_tab_acc_component').toggleClass('tb_collapsed');
        },
        closeFloat:function(e){
            if(e){
                e.preventDefault();
                e.stopPropagation();
                localStorage.setItem('tb_panel_closed', true);
            }
            topWindow.document.body.classList.add('tb_panel_closed');
        },
        openFloat:function(e){
            if(e){
                e.preventDefault();
                e.stopPropagation();
                localStorage.removeItem('tb_panel_closed');
            }
            topWindow.document.body.classList.remove('tb_panel_closed');
            api.toolbar.common.hide(true);
            api.toolbar.Panel.setFocus();
        }
    });


    api.Forms = {
        Data: {},
        Validators: {},
        parseSettings: function (item, repeat) {
            var value = '',
                    cl = item.classList,
                    option_id;
            if (!cl.contains('tb_row_js_wrapper')) {
                var p = item.closest('.tb_field');
                if (p !== null && !p.classList.contains('_tb_hide_binding') && !(p.style['display'] === 'none' && p.className.indexOf('tb_group_element_') !== -1)) {
                    p = p.parentNode;
                    if (p.classList.contains('tb_multi_fields') && p.parentNode.classList.contains('_tb_hide_binding')) {
                        return false;
                    }
                }
            }
            if (repeat) {
                option_id = item.getAttribute('data-input-id');
            }
            else {
                option_id = item.getAttribute('id');
            }
            if (cl.contains('tb_lb_wp_editor')) {
                if (tinyMCE !== undefined) {
                    var tid = item.id,
                            tiny = tinyMCE.get(tid);
                    value = tiny !== null ? (tiny.hidden === false ? tiny.getContent() : switchEditors.wpautop(tinymce.DOM.get(tid).value)) : item.value;
                } else {
                    value = item.value;
                }
            }
            else if (cl.contains('themify-checkbox')) {
                var cselected = [],
                        chekboxes = item.getElementsByClassName('tb-checkbox'),
                        isSwitch = cl.contains('tb_switcher');
                for (var i = 0, len = chekboxes.length; i < len; ++i) {
                    if ((isSwitch===true || chekboxes[i].checked === true) && chekboxes[i].value!=='') {
                        cselected.push(chekboxes[i].value);
                    }
                }
                value = cselected.length > 0 ? cselected.join('|') : isSwitch?'':false;
                cselected = chekboxes = null;
            }
            else if (cl.contains('themify-layout-icon')) {
                value = item.getElementsByClassName('selected')[0];
                value = value !== undefined ? value.id : '';
            }
            else if (cl.contains('tb_search_input')) {
                value = item.getAttribute('data-value');
                if (cl.contains('query_category_single')) {
                    var parent = item.closest('.tb_input'),
                            multiple_cat = parent.getElementsByClassName('query_category_multiple')[0];
                    multiple_cat = multiple_cat === undefined ? '' : multiple_cat.value.trim();
                    if (multiple_cat !== '') {
                        value = multiple_cat + '|' + (multiple_cat.indexOf(',') !== -1 ? 'multiple' : 'single');
                    }
                    else {
                        value += '|single';
                    }
                }

            }
            else if (cl.contains('tb_radio_input_container')) {
                var radios = item.getElementsByTagName('input'),
                        input = null;
                for (var i = 0, len = radios.length; i < len; ++i) {
                    if (radios[i].checked === true) {
                        input = radios[i];
                        break;
                    }
                }
                if (input !== null && (api.activeBreakPoint === 'desktop' || !input.classList.contains('responsive_disable'))) {
                    value = input.value;
                }
                input = radios = null;
            }
            else if (cl.contains('tb_search_container')) {
                value = item.previousElementSibling.dataset['value'];
            }
            else if (cl.contains('tb_row_js_wrapper')) {
                value = [];
                var repeats = item.getElementsByClassName('tb_repeatable_field_content');
                for (var i = 0, len = repeats.length; i < len; ++i) {
                    var childs = repeats[i].getElementsByClassName('tb_lb_option_child');
                    value[i] = {};
                    for (var j = 0, clen = childs.length; j < clen; ++j) {
                        var v = this.parseSettings(childs[j], true);
                        if (v) {
                            value[i][v['id']] = v['v'];
                        }
                    }
                }
                repeats = childs = null;
            }
            else if (cl.contains('module-widget-form-container')) {
                value = $(item).find(':input').themifySerializeObject();
            }
            else if (cl.contains('tb_widget_select')) {
                value = item.getElementsByClassName('selected')[0];
                value = value !== undefined ? value.dataset['value'] : '';
            }
            else if(cl.contains('tb_sort_fields_parent')){
                var childs = item.children,
                    value = [];
                for(var i=0,len=childs.length;i<len;++i){
                    var type= childs[i].getAttribute('data-type');
                    if(type){
                        var hidden = childs[i].getElementsByTagName('input')[0],
                            wrap = childs[i].getElementsByClassName('tb_sort_field_lightbox')[0],
                            v = {
                               'type':type,
                               'id':hidden.getAttribute('id')
                            };
                            if(wrap!==undefined){
                                v['val'] = this.serialize(wrap, null,true);
                            }
                            else{
                                var temp = hidden.value;
                                if(temp!==''){
                                     v['val'] = JSON.parse(temp);
                                }
                            }
                            value.push(v);
                    }
                }
                
                if(value.length===0){
                    value ='';
                }
            }
            else {
                value = item.value;
                if (value !== '') {
                    var opacity = item.getAttribute('data-opacity');
                    if (opacity !== null && opacity !== '' && opacity != 1 && opacity != '0.99') {
                        value += '_' + opacity;
                    }
                }
            }
            if (value === undefined || value === null) {
                value = '';
            }

            return  {'id': option_id, 'v': value};
        },
        serialize: function (id, empty, repeat) {
            var repeat = repeat || false,
                    result = {},
                    el = typeof id === 'object' ? id : topWindow.document.getElementById(id);
            if (el !== null) {
                var options = el.getElementsByClassName((repeat ? 'tb_lb_option_child' : 'tb_lb_option'));
                for (var i = options.length - 1; i > -1; --i) {
                    var v = this.parseSettings(options[i], repeat);
                    if (v !== false && (empty === true || v['v'] !== '')) {
                        result[v['id']] = v['v'];
                    }
                }
            }
            return result;
        },
        LayoutPart: {
            cache: [],
            undo: null,
            old_id: null,
            isReload: null,
            id: null,
            init: false,
            html: null,
            el: null,
            options: null,
            isSaved:null,
            scrollTo: function (prev, breakpoint) {
                api.scrollTo = api.Forms.LayoutPart.el;
            },
            edit: function (item) {
                Common.showLoader('show');
                document.body.classList.add('tb_layout_part_edit');
                if (api.activeModel!==null) {
                    var save = Common.Lightbox.$lightbox[0].getElementsByClassName('builder_save_button')[0];
                    if(save!==undefined){
                        save.click();
                    }
                    save=null;
                }
                topWindow.document.body.classList.add('tb_layout_part_edit');
                var self = this,
                        $item = $(item).closest('.active_module'),
                        builder = $item.find('.themify_builder_content'),
                        tpl = Common.templateCache.get('tmpl-small_toolbar');
                this.id = builder.data('postid');
                this.old_id = themifyBuilder.post_ID;
                this.init = true;
                this.isSaved=null;
                function callback(data) {
                    document.getElementById('themify_builder_content-' + themifyBuilder.post_ID).insertAdjacentHTML('afterbegin', '<div class="tb_overlay"></div>');
                    $item.addClass('tb_active_layout_part').closest('.row_inner').find('.active_module').each(function () {
                        if (!this.classList.contains('tb_active_layout_part')) {
                            this.insertAdjacentHTML('afterbegin', '<div class="tb_overlay"></div>');
                        }
                    });
                    var id = 'themify_builder_content-' + self.id;
                    self.html = $item[0].innerHTML;
                    themifyBuilder.post_ID = self.id;
                    $item[0].insertAdjacentHTML('afterbegin', tpl.replace('#postID#', self.id));
                    $('.' + id).each(function () {
                        $(this).closest('.active_module').find('.themify-builder-generated-css').first().prop('disabled', true);
                    });
                    $item.removeClass('active_module module')
                            .closest('.tb_holder').removeClass('tb_holder').addClass('tb_layout_part_parent')
                            .closest('.module_row').addClass('tb_active_layout_part_row');
                    builder.attr('id', id).removeClass('not_editable_builder').empty();

                    self.el = $item;
                    api.id = self.id;
                    var settings = [],
                        items;
                    api.builderIndex = 1;
                    api.Instances.Builder[api.builderIndex] = new api.Views.Builder({el: '#' + id, collection: new api.Collections.Rows(data), type: api.mode});
                    items = api.Instances.Builder[api.builderIndex].render().el.querySelectorAll('[data-cid]');
                    for (var i = 0, len = items.length; i < len; ++i) {
                        settings[items[i].dataset.cid] = 1;
                    }
                    items = null;
                    api.bootstrap(settings, finish);
                    function finish() {
                        settings =api.activeModel= null;
                        api.Utils.loadContentJs(builder);
                        api.id = false;
                        Themify.body.on('themify_builder_change_mode', self.scrollTo);
                        api.hasChanged = null;
                        api.Instances.Builder[api.builderIndex].$el.triggerHandler('tb_init');
                        $item.find('.tb_toolbar_save').click(self.save.bind(self));
                        $item.find('.tb_toolbar_close_btn').click(self.close.bind(self));
                        $item.find('.tb_load_layout').click(api.Views.Toolbar.prototype.loadLayout);
                        $item.find('.tb_toolbar_import ul a').click(api.Views.Toolbar.prototype.import);
                        Common.showLoader('hide');
                        self.init = false;
                        self.undo = api.undoManager.stack;
                        api.undoManager.btnUndo = $item[0].getElementsByClassName('tb_undo_btn')[0];
                        api.undoManager.btnRedo = $item[0].getElementsByClassName('tb_redo_btn')[0];
                        api.undoManager.reset();
                        $item.find('.tb_undo_redo').click(function (e) {
                            api.undoManager.do_change(e);
                        });
                        if (api.activeBreakPoint !== 'desktop') {
                            api.Mixins.Builder.updateModuleSort(null, 'disable');
                        }
                        api.ActionBar.clear();
                        if(api.mode==='visual'){
                            setTimeout(function(){api.Utils.checkAllimageSize();},500);
                        }
                    }
                }

                if (this.cache[this.id] !== undefined) {
                    callback(this.cache[this.id]);
                    return;
                }
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: themifyBuilder.ajaxurl,
                    data: {
                        action: 'tb_layout_part_swap',
                        nonce: themifyBuilder.tb_load_nonce,
                        id: self.id
                    },
                    success: function (res) {
                        if (res) {
                            self.cache[self.id] = res;
                            callback(res);
                        }
                    }

                });
            },
            close: function (e) {
                e.preventDefault();
                e.stopPropagation();
                if((api.hasChanged || api.undoManager.hasUndo()) && this.isSaved===null && !confirm(themifyBuilder.i18n.layoutEditConfirm)){
                    return;
                }
                if(api.activeModel!==null){
                    Common.Lightbox.close();
                }
                var self = this,
                    builder = this.el.find('.themify_builder_content');
                if (this.options !== null) {
                    Common.showLoader('show');
                    var module = api.Models.Registry.lookup(this.el.data('cid'));
                    this.cache[this.id] = this.options;
                    $(document).ajaxComplete(function afterRefresh(e, xhr, settings) {
                        if (settings.data.indexOf('tb_load_module_partial', 3) !== -1) {
                            $(this).off('ajaxComplete', afterRefresh);
                            if (xhr.status === 200) {
                                self.el = api.liveStylingInstance.$liveStyledElmt;
                                builder = self.el.children('.themify_builder_content');
                                var html = builder[0].innerHTML,
                                        link = '';
                                self.el.children('.themify-builder-generated-css').each(function () {
                                    link += this.outerHTML;
                                });
                                $('.themify_builder_content-' + self.id).each(function () {
                                    var p = $(this).closest('.module');
                                    p.children('link.themify-builder-generated-css').remove();
                                    if (link !== '') {
                                        p[0].insertAdjacentHTML('afterbegin', link);
                                    }
                                    this.innerHTML = html;
                                    api.Utils.loadContentJs($(this));
                                });
                                link = html = null;
                                Common.showLoader('hide');
                                callback();
                            }
                            else {
                                Common.showLoader('error');
                            }
                        }
                    });
                    var options = $.extend(true, {}, module.get('mod_settings'));
                    options['unsetKey'] = true;
                    module.trigger('custom:preview:refresh', options);
                    options = null;
                }
                else {
                    this.el[0].innerHTML = self.html;
                    callback();
                    $('.themify_builder_content-' + self.id).each(function () {
                        $(this).closest('.active_module').find('.themify-builder-generated-css').removeAttr('disabled');
                    });
                    api.Utils.loadContentJs(builder);
                }
                function callback() {
                    self.el.removeClass('tb_active_layout_part').addClass('active_module module')
                            .closest('.tb_layout_part_parent').addClass('tb_holder').removeClass('tb_layout_part_parent')
                            .closest('.module_row').removeClass('tb_active_layout_part_row');
                    $('#tb_small_toolbar', self.el).remove();
                    var items = builder[0].querySelectorAll('[data-cid]'),
                        ids=[];
                    for (var i =items.length-1; i >-1; --i) {
                        var cid = items[i].dataset.cid,
                            m = api.Models.Registry.lookup(cid);
                        if (m) {
                            m.destroy();
                            api.Models.Registry.remove(cid);
                            ids.push(cid);
                        }
                    }
                    items = null;
                    var stack=api.undoManager.stack;
                    for(var i=stack.length-1;i>-1;--i){
                        if(stack[i].type==='save' && stack[i]['data']!==undefined  && stack[i]['data']['styles']!==undefined && ids.indexOf(stack[i].cid)!==-1){
                            var styles = stack[i]['data']['styles'];
                            for(var bp in styles){
                                var sheet = ThemifyStyles.getSheet(bp);
                                for(var j in styles[bp]){
                                    sheet.deleteRule(j);
                                }
                            }
                        }
                    }
                    stack=ids=null;
                    builder.removeAttr('id').addClass('not_editable_builder');
                    document.body.classList.remove('tb_layout_part_edit');
                    topWindow.document.body.classList.remove('tb_layout_part_edit');
                    $('.tb_overlay').remove();
                    api.undoManager.stack = self.undo;
                    api.undoManager.index = self.undo.length - 1;
                    api.undoManager.btnUndo = api.toolbar.el.getElementsByClassName('tb_undo_btn')[0];
                    api.undoManager.btnRedo = api.toolbar.el.getElementsByClassName('tb_redo_btn')[0];
                    themifyBuilder.post_ID = self.old_id;
                    self.undo =self.isSaved= self.old_id = self.html = self.id = self.options =self.isReload =self.el =api.Instances.Builder[api.builderIndex] = null;
                    delete api.Instances.Builder[api.builderIndex];
                    api.builderIndex = 0;
                    Themify.body.off('themify_builder_change_mode', self.scrollTo);
                    api.Mixins.Builder.updateModuleSort();
                    api.undoManager.updateUndoBtns();
                    if (api.activeBreakPoint !== 'desktop') {
                        api.Mixins.Builder.updateModuleSort(null, 'disable');
                    }
                    api.ActionBar.clear();
                    api.Instances.Builder[api.builderIndex].lastRowAddBtn();
                }

            },
            save: function (e,close) {
                e.preventDefault();
                e.stopPropagation();
                if (api.activeModel!==null) {
                    var save = Common.Lightbox.$lightbox[0].getElementsByClassName('builder_save_button')[0];
                    if(save!==undefined){
                        save.click();
                    }
                    save=null;
                }
                if (api.undoManager.hasUndo() || this.isReload !== null  || close) {
                    var self = this;
                    this.html = null;
                    this.old_settings = null;
                    Common.showLoader('show');
                    api.Utils.saveBuilder(function (res) {
                        if (res.success) {
                            self.options = res.data.builder_data;
                            api.hasChanged=null;
                            self.isSaved=true;
                            if(close){
                                self.close(e);
                            }
                        }
                    }, 1);
                }
                else {
                    Common.showLoader('show');
                    setTimeout(function () {
                        Common.showLoader('hide');
                    }, 100);
                }
            }
        },
        reLoad: function (data, id, callback) {

            var is_layout_part = api.Forms.LayoutPart.id !== null,
                    index = api.builderIndex,
                    settings = null,
                    el = '';

            api.Mixins.Builder.updateModuleSort(null, 'destroy');
            if (!is_layout_part) {
                api.Models.Registry.destroy();
                api.Instances.Builder = {};
            }
            if (api.mode === 'visual') {
                el = '#themify_builder_content-' + id;
                api.id = id;
                if (!is_layout_part) {
                    api.liveStylingInstance.reset();
                    api.editing = false;
                    Themify.body.addClass('sidebar-none full_width');
                    $('#sidebar,.page-title').remove();
                }
            }
            else {
                el = '#tb_row_wrapper';
            }
            if (is_layout_part) {
                var items = api.Instances.Builder[index].el.querySelectorAll('[data-cid]');
                api.Forms.LayoutPart.isReload = true;
                for (var i = 0, len = items.length; i < len; ++i) {
                    var cid = items[i].dataset.cid,
                            m = api.Models.Registry.lookup(cid);
                    if (m) {
                        m.destroy();
                        api.Models.Registry.remove(cid);
                    }
                }
                items = null;
                api.Instances.Builder[index].$el.empty();
            }
            api.Instances.Builder[index] = new api.Views.Builder({el: el, collection: new api.Collections.Rows(data), type: api.mode});
            api.Instances.Builder[index].render();
            api.undoManager.reset();
            if (is_layout_part) {
                settings = [];
                items = api.Instances.Builder[index].el.querySelectorAll('[data-cid]');
                for (var i = 0, len = items.length; i < len; ++i) {
                    settings[items[i].dataset.cid] = 1;
                }
                items = null;
            }
            if (api.mode === 'visual') {
                api.bootstrap(settings, finish);
            }
            else {
                finish();
            }

            function finish() {
                if (api.mode === 'visual') {
                    api.liveStylingInstance.setCss(api.Mixins.Builder.toJSON(api.Instances.Builder[index].el));
                    api.Utils.loadContentJs(api.Instances.Builder[index].$el);
                    api.id = false;
                }
                api.Instances.Builder[api.builderIndex].$el.triggerHandler('tb_init');
                Common.showLoader('hide');
                if (api.mode === 'visual' && api.activeBreakPoint !== 'desktop') {
                    $('body', topWindow.document).height(document.body.scrollHeight);
                    setTimeout(function () {
                        $('body', topWindow.document).height(document.body.scrollHeight);
                    }, 2000);
                }
                if (callback) {
                    callback();
                }
                api.hasChanged = true;
                if (api.mode === 'visual'){
                    setTimeout(function(){api.Utils.checkAllimageSize();},500);
                }
            }
        },
        isValidate: function (form) {
            var validate = form.getElementsByClassName('tb_must_validate'),
                len=validate.length;
            if (len=== 0) {
                return true;
            }
            var checkValidate=function (rule, value) {
                    var validator = api.Forms.get_validator(rule);
                    return validator(value);
                },
                is_error = true;
                for(var i=len-1;i>-1;--i){
                    var item=validate[i].getElementsByClassName('tb_lb_option')[0];
                    if (!checkValidate(validate[i].getAttribute('data-validation'), item.value)) {
                        if(!item.classList.contains('tb_field_error')){
                            var el = document.createElement('span');
                                el.className='tb_field_error_msg';
                                el.textContent=validate[i].getAttribute('data-error-msg');
                            item.classList.add('tb_field_error');
                            var after = item.tagName==='SELECT'?item.parentNode:item;
                            after.parentNode.insertBefore(el, after.nextSibling);
                        }
                        is_error=false;
                    }
                    else{
                        item.classList.remove('tb_field_error');
                        var er = validate[i].getElementsByClassName('tb_field_error_msg');
                        for(var j=er.length-1;j>-1;--j){
                            er[j].parentNode.removeChild(er[j]);
                        }
                    }
                }
                if(is_error===false){
                    var tab =Common.Lightbox.$lightbox.find('[href="#'+form.getAttribute('id')+'"]')[0];
                    if(!tab.parentNode.classList.contains('current')){
                        tab.click();
                    }
                }
            return is_error;
        }
    };

    api.Utils = {
        onResizeEvents: [],
        gridClass: ['col-full', 'col2-1', 'col3-1', 'col4-1', 'col5-1', 'col6-1', 'col4-2', 'col4-3', 'col3-2'],
        _onResize: function (trigger, callback) {
            var events = $._data(window, 'events')['resize'];
            $(topWindow).off('tfsmartresize.tb_visual').on('tfsmartresize.tb_visual', function (e) {
                if (tbLocalScript.fullwidth_support === '') {
                    $(window).triggerHandler('tfsmartresize.tbfullwidth');
                    $(window).triggerHandler('tfsmartresize.tfVideo');
                }
            })
            .off('tfsmartresize.zoom').on('tfsmartresize.zoom', function () {
                if (api.zoomMeta.isActive) {
                    var scale = '50' == api.zoomMeta.size ? 2 : 1.25;
                    $('.tb_workspace_container', topWindow.document).css('height', Math.max(topWindow.innerHeight * scale, 600));
                }
            });
            if (events !== undefined) {
                for (var i = 0, len = events.length; i < len; ++i) {
                    if (events[i].handler !== undefined) {
                        this.onResizeEvents.push(events[i].handler);
                    }
                }
            }
            $(window).off('resize');
            if (trigger) {
                var e = $.Event('resize', {type: 'resize', isTrigger: false});
                for (var i = 0, len = this.onResizeEvents.length; i < len; ++i) {
                    try {
                        this.onResizeEvents[i].apply(window, [e, $]);
                    }
                    catch (e) {
                    }
                }
                if (typeof callback === 'function') {
                    callback();
                }
            }

        },
        _addNewColumn: function (params, $context) {
            var columnView = api.Views.init_column({grid_class: params.newclass, component_name: params.component});
            $context.appendChild(columnView.view.render().el);
        },
        filterClass: function (str) {
            var n = str.split(' '),
                    new_arr = [];

            for (var i = n.length - 1; i > -1; --i) {
                if (this.gridClass.indexOf(n[i]) !== -1) {
                    new_arr.push(n[i]);
                }
            }
            return new_arr.join(' ');
        },
        _getRowSettings: function (base, type) {
            var cols = {},
                    type = type || 'row',
                    option_data = {},
                    styling,
                    model_r = api.Models.Registry.lookup(base.getAttribute('data-cid'));
            if (model_r) {
                // cols
                var inner = base.getElementsByClassName(type + '_inner')[0],
                        columns = inner.children,
                        that = this,
                        getModules = function(modules){
                            modules = modules.children;
                            for (var j = 0, clen = modules.length; j < clen; ++j) {
                                if(!modules[j].classList.contains('active_module')){
                                    getModules(modules[j]);
                                }
                                var module_m = api.Models.Registry.lookup(modules[j].getAttribute('data-cid'));
                                if (module_m) {
                                    styling = module_m.get('mod_settings');
                                var k = items.push({mod_name: module_m.get('mod_name'), element_id: module_m.get('element_id')})-1;
                                    if (styling && Object.keys(styling).length > 0) {
                                            delete styling['cid'];
                                    items[k]['mod_settings'] = styling;
                                    }
                                    // Sub Rows
                                    if (modules[j].classList.contains('module_subrow')) {
                                    items[k] = that._getRowSettings(modules[j], 'subrow');
                                    }
                                }
                            }
                        };
                for (var i = 0, len = columns.length; i < len; ++i) {
                    var modules = {},
                            model_c = api.Models.Registry.lookup(columns[i].getAttribute('data-cid'));
                    if (model_c) {
                        // mods
                        var modules = columns[i].getElementsByClassName('tb_holder')[0],
                            items = [];
                        if (modules!==undefined) {
                            getModules(modules);
                        }
                        cols[i] = {
                            element_id: model_c.get('element_id'),
                            grid_class: this.filterClass(columns[i].className)
                        };
                        if (items && items.length > 0) {
                            cols[i]['modules'] = items;
                        }
                        var custom_w = parseFloat(columns[i].style.width);
                        if (custom_w > 0 && !isNaN(custom_w)) {
                            cols[i]['grid_width'] = custom_w;
                        }
                        styling = model_c.get('styling');
                        if (styling && Object.keys(styling).length > 0) {
                            delete styling['cid'];
                            cols[i]['styling'] = styling;
                        }
                    }
                }

                option_data = {
                    element_id: model_r.get('element_id'),
                    cols: cols,
                    column_alignment: model_r.get('column_alignment'),
                    gutter: model_r.get('gutter'),
                    column_h:model_r.get('column_h')
                };
                var default_data = {
                    gutter: 'gutter-default',
                    column_alignment: is_fullSection ? 'col_align_middle' : 'col_align_top'
                },
                row_opt = {
                    desktop_dir: 'ltr',
                    tablet_dir: 'ltr',
                    tablet_landscape_dir: 'ltr',
                    mobile_dir: 'ltr',
                    col_tablet_landscape: '-auto',
                    col_tablet: '-auto',
                    col_mobile: '-auto'
                };
                for (var i in option_data) {
                    if (option_data[i] === '' || option_data[i] === null || option_data[i] === default_data[i]) {
                        delete option_data[i];
                    }
                }
                styling = model_r.get('styling');
                for (var i in row_opt) {
                    var v = inner.getAttribute('data-' + i);
                    if (v !== null && v !== '' && v !== row_opt[i]) {
                        option_data[i] = v.trim();
                    }
                }
                if (styling && Object.keys(styling).length > 0) {
                    delete styling['cid'];
                    option_data['styling'] = styling;
                }

            }
            return option_data;
        },
        selectedGridMenu: function (row,handle) {
            var points = api.Constructor.breakpointsReverse,
                model = api.Models.Registry.lookup(row.getAttribute('data-cid')),
                inner = row.getElementsByClassName(handle + '_inner')[0],
                gutter = model.get('gutter'),
                column_aligment = model.get('column_alignment'),
                column_h = model.get('column_h'),
                dir = model.get('desktop_dir'),
                styling = handle==='row'?model.get('styling'):null,
                cl = [],
                attr = {},
                columns = inner.children;
                for (var j = 0, clen = columns.length; j < clen; ++j) {
                    columns[j].className = columns[j].className.replace(/first|last/ig, '');
                    if (clen !== 1) {
                        if (j === 0) {
                            columns[j].className += dir === 'rtl' ? ' last' : ' first';
                        }
                        else if (j === (clen - 1)) {
                            columns[j].className += dir === 'rtl' ? ' first' : ' last';
                        }
                    }
                }
                var col = columns.length;
                cl.push('col-count-' + col);
                attr['data-basecol'] = col;

                if (styling!==null && styling['row_anchor'] !== undefined && styling['row_anchor'] !== '') {
                    row.getElementsByClassName('tb_row_anchor')[0].textContent = styling['row_anchor'];
                }
                columns=styling=col= null;
                if (gutter !== 'gutter-default') {
                    cl.push(gutter);
                }
                if(column_h){
                    cl.push('col_auto_height');
                }
                if(!column_aligment){
                    column_aligment = 'col_align_top';
                }
                cl.push(column_aligment);
                if (dir !== 'ltr') {
                    cl.push('direction-rtl');
                }

                for (var i = points.length-1; i > -1; --i) {
                    var dir = model.get(points[i] + '_dir');
                    if (dir !== 'ltr' && dir !== '') {
                        attr['data-' + points[i] + '_dir'] = dir;
                    }
                    if (points[i] !== 'desktop') {
                        var col = model.get('col_' + points[i]);
                        if (col !== '-auto' && col !== '' && col !== undefined) {
                            attr['data-col_' + points[i]] = col;
                        }
                    }
                }
                for (var j = cl.length - 1; j > -1; --j) {
                    if (cl[j]) {
                        inner.classList.add(cl[j]);
                    }
                }
                for (var j in attr) {
                    inner.setAttribute(j, attr[j]);
                }
        },
        clear: function (items, is_array,level) {
            var res = is_array ? [] : {};
            for (var i in items) {
                if (Array.isArray(items[i])) {
                    var data = this.clear(items[i], true,1);
                    if (data.length > 0) {
                        res[i] = data;
                    }
                }
                else if (typeof items[i] === 'object') {
                    var data = this.clear(items[i], false,1);
                    if (!$.isEmptyObject(data)) {
                        res[i] = data;
                    }
                }
                else if (items[i] !== null && items[i] !== undefined && items[i] !== '' && i!=='' && items[i] !== 'pixels' && items[i] !== 'default' && items[i] !== '|') {
                    if ((items[i] === 'show' && i.indexOf('visibility_') ===0) || (i==='unstick_when_condition' && items[i]==='hits') || ((i==='stick_at_pos_val_unit' || i === 'unstick_when_pos_val_unit') && items[i] === 'px')) {
                        continue;
                    }
                    else if (i === 'custom_parallax_scroll_speed' && (!items[i] || items[i]=='0')) {
                        delete res['custom_parallax_scroll_reverse'];
                        delete res['custom_parallax_scroll_fade'];
                        delete res[i];
                        delete items['custom_parallax_scroll_reverse'];
                        delete items['custom_parallax_scroll_fade'];
                        delete items[i];
                        continue;
                    }
                    else if ((i === 'unstick_when_element' && items[i] === 'builder_end') || (i==='stick_at_check' && items[i]!=='stick_at_check')) {
                        delete res['unstick_when_el_row_id'];
                        delete res['unstick_when_el_mod_id'];
                        delete res['unstick_when_condition'];
                        delete items['unstick_when_el_row_id'];
                        delete items['unstick_when_el_mod_id'];
                        delete items['unstick_when_condition'];

                        delete res['unstick_when_pos'];
                        delete res['unstick_when_pos_val'];
                        delete res['unstick_when_element'];
                        delete res['unstick_when_pos_val_unit'];
                        delete items['unstick_when_pos'];
                        delete items['unstick_when_pos_val'];
                        delete items['unstick_when_pos_val_unit'];
                        delete items['unstick_when_element'];
                      
                        if(i==='stick_at_check'){
                            delete items[i];
                            delete res[i];  
                            delete items['stick_at_position'];
                            delete res['stick_at_position'];  
                        }
                        continue;
                    }
                    else if (i==='background_gradient-css' || i==='cover_gradient-css' || i==='cover_gradient_hover-css' || i==='background_image-type_image' || i==='custom_parallax_scroll_reverse_reverse' || items[i] === '|single' || items[i] === '|multiple' || ((i==='custom_parallax_scroll_reverse'||i==='custom_parallax_scroll_fade'|| i==='visibility_all' || i==='sticky_visibility') && !items[i])) {
                        delete items[i];
                        delete res[i];  
                        continue;
                    }
                    else if(level===1){
                        var  opt=[];
                            
                        if(items[i]==='image' && (i==='background_type' || i==='b_t_h' || i==='background_image-type' || i==='b_i_h-type')){
                                opt.push(i); 
                        }
                        else if(items[i]==='px' && i.indexOf('_unit',2)!==-1){
                            var id = i.replace('_unit','');
                            if(!items[id]){
                                opt.push(i); 
                            }
                        }
                        else if(i.indexOf('checkbox_')===0 && i.indexOf('_apply_all',6)!==-1){
                                if(!items[i]){
                                    opt.push(i); 
                                }
                                else{
                                    res[i] = items[i];
                                }
                                var id = i.replace('_apply_all','').replace('checkbox_',''),
                                    side = ['top','left','right','bottom'];
                                for(var j=3;j>-1;--j){
                                    var tmpId=id+'_'+side[j]+'_unit';
                                    if(items[tmpId]==='px'){
                                        opt.push(tmpId);
                                    }
                                    else if(items[tmpId]!==undefined && items[tmpId]!==null && items[tmpId]!==''){
                                        res[tmpId] = items[tmpId];
                                    }
                                }
                        }
                        else if(i.indexOf('gradient',3)!==-1){
                            if(items[i]=='180'  || items[i]==='linear' || items[i]===$.ThemifyGradient.default || (items[i]===false && i.indexOf('-circle-radial',3)!==-1)){
                                opt.push(i); 
                            }
                        }
                        else if((i==='background_zoom' && items[i]==='')|| items[i]==='solid' || (items[i]===false && (i.indexOf('_user_role',3)!==-1 || i.indexOf('_appearance',3)!==-1))){
                             opt.push(i); 
                        }
                        if(opt.length>0){
                            for(var j=opt.length-1;j>-1;--j){
                                delete res[opt[j]];
                                delete items[opt[j]];
                            }
                            opt.length=0;
                            opt=[];
                            continue;
                        }
                        
                    }
                    res[i] = items[i];
                }

            }
            return res;
        },
        clearElementId: function (data,_new) {
            for (var i in data) {
                if(_new===true){
                    data[i]['element_id']=api.Utils.generateUniqueID();
                }
                else{
                    delete data[i]['element_id'];
                }
                var opt = data[i]['styling']!==undefined?data[i]['styling']:data[i]['mod_settings'];
                if(opt!==undefined && opt['custom_css_id']!==undefined && opt['custom_css_id']!==''){
                    var j=2;
                    while(true){
                        var id = opt['custom_css_id']+'-'+j.toString(),
                            el = document.getElementById(id);
                        if(el===null || el.closest('.module_row')===null){
                            opt['custom_css_id']=id;
                            break;
                }
                        ++j;
                    }
                }
                if (data[i]['cols'] !== undefined) {
                    this.clearElementId(data[i]['cols'],_new);
                }
                else if (data[i]['modules'] !== undefined) {
                    this.clearElementId(data[i]['modules'],_new);
                }
            }
        },
        clearLastEmptyRow:function(rows){
                for (var i = rows.length-1; i >-1; --i) {
                    var styles = rows[i]['attributes']!==undefined?rows[i]['attributes']:rows[i];
                    if(styles['styling']===undefined || Object.keys(styles['styling']).length===0){
                        var cols = styles['cols'],
                            isEmpty=true;
                        for(var j in cols){
                            if((cols[j].modules !== undefined && (cols[j].modules.length > 0 || Object.keys(cols[j].modules).length>0)) || (cols[j].styling!==undefined && Object.keys(cols[j].styling).length>0)){
                                isEmpty=false;
                                break;
                            }
                        }
                        if(isEmpty===true){
                            if(rows[i].cid!==undefined){
                               api.Models.Registry.remove(rows[i].cid);
                                rows[i].destroy();
                            }
                            rows.splice(i, 1);
                        }
                        else{
                            break;
                        }
                    }
                    else{
                       break; 
                    }
                }  
        },
        builderPlupload: function (action_text, importBtn) {
            var is_import = importBtn?true:false,
                items = is_import?[importBtn]:Common.Lightbox.$lightbox[0].getElementsByClassName('tb_plupload_upload_uic'),
                len = items.length;
            if (len > 0) {
                var cl = is_import ? false : (action_text === 'new_elemn' ? '.plupload-clone' : false);
                if (this.pconfig === undefined) {
                    this.pconfig = JSON.parse(JSON.stringify(themify_builder_plupload_init));
                    this.pconfig['multipart_params']['_ajax_nonce'] = themifyBuilder.tb_load_nonce;
                    this.pconfig['multipart_params']['topost'] = themifyBuilder.post_ID;
                }
                for (var i = len - 1; i > -1; --i) {
                    if (!items[i].classList.contains('tb_plupload_init') && (cl === false || items[i].classList.contains(cl))) {
                        var _this = items[i],
                                imgId = _this.getAttribute('id').replace('tb_plupload_upload_ui', ''),
                                config = $.extend(true, {}, this.pconfig),
                                ext = _this.getAttribute('data-extensions'),
                                parts = ['browse_button', 'container', 'drop_element', 'file_data_name'];
                        config['multipart_params']['imgid'] = imgId;
                        for (var j = parts.length - 1; j > -1; --j) {
                            config[parts[j]] = imgId + this.pconfig[parts[j]];
                        }

                        if (ext !== null) {
                            config['filters'][0]['extensions'] = ext;
                        }
                        else {
                            config['filters'][0]['extensions'] = api.activeModel !== null ?
                                    config['filters'][0]['extensions'].replace(/\,zip|\,txt/, '')
                                    : 'zip,txt';
                        }
                        var uploader = new topWindow.plupload.Uploader(config);
                       
                        _this.classList.add('tb_plupload_init');
                        if(is_import){
                            uploader.bind('init',function(up){
                                $(up.settings.browse_button).click();
                            });
                        }
                        // a file was added in the queue
                        uploader.bind('FilesAdded', function (up, files) {
                            up.refresh();
                            up.start();
                            Common.showLoader('show');
                        });

                        uploader.bind('Error', function (up, error) {
                            var $promptError = $('.prompt-box .show-error');
                            $('.prompt-box .show-login').hide();
                            $promptError.show();

                            if ($promptError.length > 0) {
                                $promptError.html('<p class="prompt-error">' + error.message + '</p>');
                            }
                            $('.overlay, .prompt-box').fadeIn(500);
                        });

                        // a file was uploaded
                        uploader.bind('FileUploaded', function (up, file, response) {
                            var json = JSON.parse(response['response']),
                                    alertData = $('#tb_alert', topWindow.document),
                                    status = 200 === response['status'] && !json.error ? 'done' : 'error';
                            if (json.error) {
                                Common.showLoader(status);
                                alert(json.error);
                                return;
                            }
                            if (is_import) {
                                var before = $('#tb_row_wrapper').children().clone(true);
                                alertData.promise().done(function () {
                                    api.Forms.reLoad(json.builder_data, themifyBuilder.post_ID);
                                    var after = $('#tb_row_wrapper').children().clone(true);
                                    Common.Lightbox.close();
                                    api.undoManager.push('', '', '', 'import', {before: before, after: after, bid: themifyBuilder.post_ID});
                                });
                            }
                            else {
                                Common.showLoader(status);
                                var parent = this.getOption().container.closest('.tb_input'),
                                        input = parent.getElementsByClassName('tb_uploader_input')[0],
                                        placeHolder = parent.getElementsByClassName('thumb_preview')[0];
                                input.value = json.large_url ? json.large_url : json.url;
                                if (placeHolder !== undefined) {
                                    api.Constructor.file.setImage(placeHolder, json.thumb);
                                }
                                
                                Themify.triggerEvent(input, 'change');
                            }
                        });
                        uploader.init();
                        _this.classList.remove('plupload-clone');
                    }
                }
            }
        },
        columnDrag: function ($container, $remove, old_gutter, new_gutter) {
            var self = this;
            if ($remove) {
                var columns = $container ? $container.children('.module_column') : $('.module_column');
                columns.css('width', '');
                self.setCompactMode(columns);
            }
            var _margin = {
                default: 3.2,
                narrow: 1.6,
                none: 0
            };
            if (old_gutter && new_gutter) {
                var cols = $container.children('.module_column'),
                        new_margin = new_gutter === 'gutter-narrow' ? _margin.narrow : (new_gutter === 'gutter-none' ? _margin.none : _margin.default),
                        old_margin = old_gutter === 'gutter-narrow' ? _margin.narrow : (old_gutter === 'gutter-none' ? _margin.none : _margin.default),
                        margin = old_margin - new_margin;
                margin = parseFloat((margin * (cols.length - 1)) / cols.length);
                cols.each(function (i) {
                    if ($(this).prop('style').width) {
                        var w = parseFloat($(this).prop('style').width) + margin;
                        $(this).css('width', w + '%');
                    }
                });
                return;
            }
            var $cdrags = $container ? $container.children('.module_column').find('.tb_grid_drag') : $('.tb_grid_drag'),
                    _cols = {
                        default: {'col6-1': 14, 'col5-1': 17.44, 'col4-1': 22.6, 'col4-2': 48.4, 'col2-1': 48.4, 'col4-3': 74.2, 'col3-1': 31.2, 'col3-2': 65.6},
                        narrow: {'col6-1': 15.33, 'col5-1': 18.72, 'col4-1': 23.8, 'col4-2': 49.2, 'col2-1': 49.2, 'col4-3': 74.539, 'col3-1': 32.266, 'col3-2': 66.05},
                        none: {'col6-1': 16.666, 'col5-1': 20, 'col4-1': 25, 'col4-2': 50, 'col2-1': 50, 'col4-3': 75, 'col3-1': 33.333, 'col3-2': 66.666}
                    },
            min = 5;
            $cdrags.each(function () {

                var $el,
                        $row,
                        $columns,
                        $current,
                        elWidth = 0,
                        dir,
                        cell = false,
                        cell_w = 0,
                        before = false,
                        $helperClass,
                        row_w,
                        dir_rtl,
                        tooltip1=null,
                        tooltip2=null,
                        startW;
                $(this).draggable({
                    axis: 'x',
                    cursor: 'col-resize',
                    distance: 0,
                    scroll: false,
                    snap: false,
                    containment: '.row_inner',
                    helper: function (e) {
                        $el = $(e.currentTarget);
                        $row = $el.closest('.subrow_inner');
                        if ($row.length === 0) {
                            $row = $el.closest('.row_inner');
                        }
                        dir = $el[0].classList.contains('tb_drag_right') ? 'w' : 'e';
                        $helperClass = dir === 'w' ? 'tb_grid_drag_right_tooltip' : 'tb_grid_drag_left_tooltip',
                        before = Common.clone($row.closest('.module_row'));
                        
                        $row.addClass('tb_drag_column_start');
                        return $('<div class="ui-widget-header tb_grid_drag_tooltip ' + $helperClass + '"></div><div class="ui-widget-header tb_grid_drag_tooltip"></div>');
                    },
                    start: function (e, ui) {
                        api.ActionBar.disable=true;
                        api.ActionBar.clear();
                        $columns = $row.children('.module_column');
                        $current = $el.closest('.module_column');
                        dir_rtl = $row[0].classList.contains('direction-rtl');
                        if (dir === 'w') {
                            cell = dir_rtl ? $current.prev('.module_column') : $current.next('.module_column');
                            elWidth = $el.outerWidth();
                            startW = $current.outerWidth();
                        }
                        else {
                            cell = dir_rtl ? $current.next('.module_column') : $current.prev('.module_column');
                            elWidth = $current.outerWidth();
                            startW = elWidth;
                        }
                        elWidth = parseInt(elWidth);
                        cell_w = parseInt(cell.outerWidth())-2;
                        row_w = $row.outerWidth();
                        tooltip1 = $current.children('.' + $helperClass)[0];
                        tooltip2=$current.children('.tb_grid_drag_tooltip').last()[0];
                    },
                    stop: function (e, ui) {
                        $('.tb_grid_drag_tooltip').remove();
                        $row.removeClass('tb_drag_column_start');
                        var percent = Math.ceil(100 * ($current.outerWidth() / row_w));
                        $current.css('width', percent + '%');
                        var cols = _cols.default,
                                margin = _margin.default;
                        if ($row[0].classList.contains('gutter-narrow')) {
                            cols = _cols.narrow;
                            margin = _margin.narrow;
                        }
                        else if ($row[0].classList.contains('gutter-none')) {
                            cols = _cols.none;
                            margin = _margin.none;
                        }
                        var cellW = margin * ($columns.length - 1);
                        $columns.each(function (i) {
                            if (i !== cell.index()) {
                                var w;
                                if ($(this).prop('style').width) {
                                    w = parseFloat($(this).prop('style').width);
                                }
                                else {
                                    var col = $.trim(self.filterClass($(this).attr('class')).replace('first', '').replace('last', ''));
                                    w = cols[col];
                                }
                                cellW += w;
                            }
                        });
                        cell.css('width', (100 - cellW) + '%');
                        cell = cell.add($current);
                        self.setCompactMode(cell);
                        var after = $row.closest('.module_row');
                        api.undoManager.push(after.data('cid'), before, after, 'row');
                        Themify.body.triggerHandler('tb_grid_changed', [after]);
                        setTimeout(function(){
                            api.ActionBar.disable=null;
                        },5);
                        tooltip1=tooltip2=elWidth=cell_w=row_w=startW=cell=$helperClass=$current=dir=dir_rtl=$row=$columns=null;
                    },
                    drag: function (e, ui) {
                        if (cell && cell.length > 0) {
                            var left = parseInt(ui.position.left),
                                px = elWidth + (dir === 'e' ? -(left) : left),
                                width = parseFloat((100 * px) / row_w);
                            if (width >= min && width < 100) {
                                var max = cell_w;
                                max += (dir === 'w' ? -(px - startW) : (startW - px));
                                var max_percent = parseFloat((100 * max) / row_w);
                                if (max_percent > min && max_percent < 100) {
                                    cell.css('width', max + 'px');
                                    $current.css('width', px + 'px');
                                    tooltip1.innerHTML=width.toFixed(2) + '%';
                                    tooltip2.innerHTML=max_percent.toFixed(2) + '%';
                                }
                            }
                        }

                    }

                });
            });
        },
        grid: function (slug) {
            var cols = [];
            slug = parseInt(slug);
            if (slug === 1) {
                cols.push({"grid_class": "col-full"});
            } else {
                for (var i = 0; i < slug; ++i) {
                    cols.push({"grid_class": "col" + slug + "-1"});
                }
            }

            return [{"cols": cols}];
        },
        setCompactMode: function (col) {
            if (col instanceof jQuery) {
                col = col.get();
            }
            for (var i = col.length - 1; i > -1; --i) {
                if (col[i].clientWidth < 185) {
                    col[i].classList.add('compact-mode');
                }
                else {
                    col[i].classList.remove('compact-mode');
                }
            }
        },
        initNewEditor: function (editor_id) {
            // v4 compatibility
            if (parseInt(tinyMCE.majorVersion) > 3) {
                var settings = tinyMCEPreInit.mceInit['tb_lb_hidden_editor'];
                settings['elements'] = editor_id;
                settings['selector'] = '#' + editor_id;
                // Creates a new editor instance
                var ed = new tinyMCE.Editor(editor_id, settings, tinyMCE.EditorManager);
                ed.render();
                return ed;
            }
        },
        initQuickTags: function (editor_id) {
            // add quicktags
            if (typeof topWindow.QTags === 'function') {
                topWindow.quicktags({id: editor_id});
                topWindow.QTags._buttonsInit();
            }
        },
        _getColClass: function (classes) {
            for (var i = 0, len = classes.length; i < len; ++i) {
                if (this.gridClass.indexOf(classes[i]) !== -1) {
                    return classes[i].replace('col', '');
                }
            }
        },
        saveBuilder: function (callback, i, onlyData) {
            i = i || 0;
            if (i === 0) {
                if (api.activeModel!==null) {
                    var save = Common.Lightbox.$lightbox[0].getElementsByClassName('builder_save_button')[0];
                    if(save!==undefined){
                        save.click();
                    }
                    save=null;
                }
                Common.showLoader('show');
            }
            var len = Object.keys(api.Instances.Builder).length,
                    view = api.Instances.Builder[i],
                    self = this,
                    id = view.$el.data('postid'),
                    data = api.Mixins.Builder.toJSON(view.el);

            function sendData(id, data) {
                var css = ThemifyStyles.createCss(data,null,true);
                data = api.Utils.clear(data);
                var sendData = {
                    action: 'tb_save_data',
                    tb_load_nonce: themifyBuilder.tb_load_nonce,
                    id: id,
                    data: JSON.stringify(data),
                    sourceEditor: 'visual' === api.mode ? 'frontend' : 'backend'
                };
                if (onlyData) {
                    sendData.only_data = onlyData;
                }
                $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    cache: false,
                    data: {
                        css: JSON.stringify(css),
                        action: 'tb_save_css',
                        tb_load_nonce: sendData.tb_load_nonce,
                        id: sendData.id
                    }
                });
                css = null;
                return $.ajax({
                    type: 'POST',
                    url: themifyBuilder.ajaxurl,
                    cache: false,
                    data: sendData
                });
            }
            sendData(id, data).always(function (jqXHR, textStatus) {
                ++i;
                if (len === i) {
                    // load callback
                    if ($.isFunction(callback)) {
                        callback.call(self, jqXHR, textStatus);
                    }
                    if (textStatus !== 'success') {
                        Common.showLoader('error');
                    }
                    else {
                        Common.showLoader('hide');
                        api.editing = true;
                        Themify.body.triggerHandler('themify_builder_save_data', [jqXHR, textStatus]);
                    }
                }
                else {
                    setTimeout(function () {
                        self.saveBuilder(callback, i, onlyData);
                    }, 50);
                }
            });
        },
        loadContentJs: function (el, type) {
            ThemifyBuilderModuleJs.loadOnAjax(el, type); // load module js ajax
            // hook
            if (api.saving === false) {
                var mediaelements = $('audio.wp-audio-shortcode, video.wp-video-shortcode', el);
                if (mediaelements.length > 0) {
                    if (themifyBuilder.media_css) {
                        for (var i in themifyBuilder.media_css) {
                            Themify.LoadCss(themifyBuilder.media_css[i]);
                        }
                        themifyBuilder.media_css = null;
                    }
                    mediaelements.each(function () {
                        var p = $(this).closest('.mejs-mediaelement');
                        if (p.length > 0) {
                            this.removeAttribute('style');
                            this.setAttribute('id', this.getAttribute('id').replace('_html5', ''));
                            p.closest('.widget').html(this);
                        }

                    });
                    var settings = typeof topWindow._wpmejsSettings !== 'undefined' ? topWindow._wpmejsSettings : {};
                    mediaelements.mediaelementplayer(settings);
                }
            }
            Themify.body.triggerHandler('builder_load_module_partial', [el, type]);
        },
        createClearBtn: function ($input) {
            $input.siblings('.tb_clear_btn').click(function () {
                $(this).hide();
                $input.val('').trigger('keyup');
            });
        },
        toRGBA: function (color) {
            return ThemifyStyles.toRGBA(color);
        },
        getColor: function (el) {
            var v = el.value;
            if(v!==''){
                if (el.getAttribute('data-minicolors-initialized') !== null) {
                    v = $(el).minicolors('rgbaString');
                }
                else {
                    var opacity = el.getAttribute('data-opacity');
                    if (opacity !== '' && opacity !== null && opacity != '1' && opacity != '0.99') {
                        v = this.toRGBA(v + '_' + opacity);
                    }
                }
            }
            return v;
        },
        getIcon: function (icon) {
            var cl = icon.split('-')[0].trim();
			if ( cl === 'fa' || cl === 'ti' ) {
				return cl + ' ' + icon;
			} else if ( cl === 'fas fa' || cl === 'far fa' || cl === 'fab fa' ) {
				return icon;
			} else {
				return false;
			}
        },
        // get breakpoint width
        getBPWidth: function (device) {
            var breakpoints = Array.isArray(themifyBuilder.breakpoints[ device ]) ? themifyBuilder.breakpoints[ device ] : themifyBuilder.breakpoints[ device ].toString().split('-');
            return breakpoints[ breakpoints.length - 1 ];

        },
        transitionPrefix: function () {
            if (this.transitionPrefix.pre === undefined) {
                var el = document.createElement('fakeelement'),
                        transitions = {
                            transition: 'transitionend',
                            OTransition: 'oTransitionEnd',
                            MozTransition: 'transitionend',
                            WebkitTransition: 'webkitTransitionEnd'
                        };

                for (var t in transitions) {
                    if (el.style[t] !== undefined) {
                        this.transitionPrefix.pre = transitions[t];
                        break;
                    }
                }
            }
            return this.transitionPrefix.pre;
        },
        generateUniqueID: function () {
            return (Math.random().toString(36).substr(2, 4) + (new Date().getUTCMilliseconds()).toString()).substr(0, 7);
        },
        getUIDList: function (type) {
            type = type || 'row';
            var atts = _.pluck(api.Models.Registry.items, 'attributes');
            return _.where(atts, {elType: type}) || [];
        },
        scrollTo:function(to){
            var body = api.activeBreakPoint === 'desktop' ? $('html,body') : $('body', topWindow.document);
            body.scrollTop(to);
        },
        scrollToDropped:function(el,cid){
            if(!el){
                el = api.Instances.Builder[api.builderIndex].el.getElementsByClassName('tb_element_cid_'+cid)[0];
            }
            if(!el){
                return;
            }
            if(api.mode === 'visual'){
                this.scrollTo($(el).offset().top - 120);
            }else{
                var content = document.getElementsByClassName('edit-post-layout__content')[0];
                if(content!==undefined){
                    var top;
                    if(el.classList.contains('module_row')){
                        top = el.offsetTop;
                    }else{
                        var row=el.closest('.module_row');
                        if(row!==null){
                            row = $(row);
                            top = ( row.offset().top + 200 ) - row.offsetParent().offset().top;
                        }
                        else{
                            top = el.offsetTop;
                        }
                    }
                    $(content).scrollTop(top);
                }
            }
        },
        addViewPortClass:function(el){
            this.removeViewPortClass(el);
            var cl = this.isInViewport(el);
            if(cl!==false){
                cl = cl.split(' ');
                for(var i=cl.length-1;i>-1;--i){
                    if(cl[i]!==''){
                        el.classList.add(cl[i]);
                    }   
                }
            }
        },
        removeViewPortClass:function(el){
            var removeCl = ['top','left','bottom','right'];
            for(var i=4;i>-1;--i){
                el.classList.remove('tb_touch_'+removeCl[i]);
            }
        },
        isInViewport:function(el){
            var offset = el.getBoundingClientRect(),
                cl = '';
            if(offset.left<0){
                cl='tb_touch_left';
            }
            else if(offset.right-1>=document.documentElement.clientWidth){
                cl='tb_touch_right';
            }
            if(offset.top<0){
                cl+=' tb_touch_top';
            }
            else if((offset.bottom+1)>=document.documentElement.clientHeight){
                cl+=' tb_touch_bottom';
            }
            return cl===''?false:cl;
        },
        checkImageSize:function(el){
            var img= el.getElementsByTagName('img')[0],
                callback = function(w){
                    if(img.width<w){
                        el.classList.add('tb_disable_object_fit');
                    }
                    else{
                        el.classList.remove('tb_disable_object_fit');
                    }
                };
            if(img!==undefined){
                var w = img.naturalWidth;
                if(!w || !img.complete){
                    var newImg = new Image();
                    newImg.onload = function() {
                       callback(newImg.width);
                    };
                    newImg.src = img.src;  
                }
                else{
                    callback(w);
                }
            }
            else{
                el.classList.remove('tb_disable_object_fit');
            }
        },
        checkAllimageSize:function(){
            var el=api.Instances.Builder[api.builderIndex].el,
                items = api.Models.Registry.items;
            for(var i in items){
                if(items[i]['attributes']['mod_name']==='image'){
                    var item = el.getElementsByClassName('tb_element_cid_'+items[i].cid)[0];
                    if(item!==undefined){
                        this.checkImageSize(item);
                    }
                }
            }
        },
        hideOnClick:function(ul){
            if(ul[0]!==undefined){
                ul=ul[0];
            }
            if(ul.classList.contains('tb_ui_dropdown_items') || ul.classList.contains('tb_down')){
                ul.classList.add('tb_hide_option');
                ul.previousElementSibling.blur();
                setTimeout(function(){
                    ul.classList.remove('tb_hide_option');
                },500);
            }
        },
        changeOptions:function(item,type){
            var event=item.tagName==='INPUT'?'keyup':'change',
                self=this;
                if(event==='keyup'){
                    item.setAttribute('data-prev',item.value);
                }
                self.custom_css_id = function(_this,id,el,v){
                    var sel = document.getElementById(v);
                    if(sel===null || el[0].getAttribute('id')===v ||sel.closest('.module_row')===null){
                        el[0].setAttribute('id',v);
                        return true;
                    }
                    return false;
                };
                self.row_anchor = function(_this,id,el,v){
                    if (api.mode === 'visual') {
                        el.removeClass(api.liveStylingInstance.getRowAnchorClass(_this.getAttribute('data-prev')));
                        if (v !== '') {
                            el.addClass(api.liveStylingInstance.getRowAnchorClass(v));
                        }
                        el.data('anchor', v).attr('data-anchor', v);
                    }
                    api.hasChanged=true;
                    el.find('.tb_row_anchor').first().text(v.replace('#', ''));
                    return true;
                };
                self.custom_css = function(_this,id,el,v){
                    if(api.mode==='visual'){
                        el.removeClass(_this.getAttribute('data-prev')).addClass(v);
                    }
                    return true;
                };
                self.layout =function(_this,id,el,v){
                    if(api.mode==='visual'){
                        api.liveStylingInstance.bindRowWidthHeight(id,v,el);
                    }  
                    return true;
                };
                item.addEventListener(event,function(e){
                    var v,
                        isSame=api.activeModel!==null && api.ActionBar.cid===api.activeModel.cid,
                        isActionBar=!Common.Lightbox.$lightbox[0].contains(this),
                        id=this.id,
                        hasError = id==='custom_css_id',
                        save = (hasError===true &&(isActionBar===false || isSame===true))?Common.Lightbox.$lightbox[0].getElementsByClassName('builder_save_button')[0]:undefined,
                        el;
                        if(isActionBar===true && isSame===false){
                            el = $('.tb_element_cid_'+api.ActionBar.cid);
                        }
                        else{
                            el = api.mode==='visual'?api.liveStylingInstance.$liveStyledElmt:$('.tb_element_cid_'+api.activeModel.cid);
                        }
                        v = this.value;
                    if(event==='keyup' && type!=='custom_css'){
                        v = v.trim();
                        if(v){
                            v = v.replace(/[^a-zA-Z0-9\-\_]+/gi, '');
                        }
                        this.value=v;
                    }
                    else if(type==='layout'){
                        v = e.detail.val;
                    }
                    if(self[type].call(self,this,id,el,v)){
                        if(hasError){
                            $(this).next('.tb_field_error_msg').remove();
                            if(save!==undefined){
                                save.classList.remove('tb_disable_save');
                            }
                        }
                        if(isActionBar===true){
                            var callback = function(){
                                var value=v;
                                if(event==='keyup'){
                                    this.removeEventListener('change',callback,{passive:true,once:true});
                                    this.removeAttribute('data-isInit');
                                    value=this.value.trim();
                                }
                                var model = api.Models.Registry.lookup(el.data('cid')),
                                    currentStyle = model.get('styling');
                                if(!currentStyle){
                                    currentStyle={};
                                }
                                currentStyle[id]=value;
                                model.set({styling: currentStyle}, {silent: true});
                            };
                            if(event==='keyup'){
                                if(!this.getAttribute('data-isInit')){
                                    this.setAttribute('data-isInit',1);
                                    this.addEventListener('change',callback,{passive:true,once:true});
                                }
                            }
                            else{
                                callback();
                            }
                        }
                        api.hasChanged=true;
                    }
                    else if(hasError){
                        var er = document.createElement('span');
                            er.className='tb_field_error_msg';
                            er.textContent = api.Constructor.label.errorId;
                            this.parentNode.insertBefore(er, this.nextSibling);
                        if(save!==undefined){
                            save.classList.add('tb_disable_save');
                        }
                    }
                    if(isSame===true){
                        var sameEl = isActionBar?Common.Lightbox.$lightbox.find('#'+id):$('#'+api.ActionBar.el.id).find('#'+id);
                        if(event==='keyup'){
                            sameEl.val(v).attr('data-prev',v);
                        }
                        
                        else if(type==='layout'){
                            sameEl.find('.selected').removeClass('selected');
                            if(v!==''){
                                sameEl.find('#'+v).addClass('selected');
                            }
                            else{
                                sameEl.children().first().addClass('selected');
                            }
                        }
                    } 
                    if(event==='keyup'){
                        this.setAttribute('data-prev',v);
                    }
                },{passive:true});
        }
    };
    
    api.ActionBar={
        cid:null,
        topH:null,
        type:null,
        disable:null,
        prevExpand:null,
        needClear:true,
        el:null,
        breadCrumbs:null,
        disablePosition:null,
        isInit:null,
        init:function(){
            if(this.isInit===null){
                this.isInit=true;
                this.el = document.createElement('div');
                this.breadCrumbs =  document.createElement('ul');
                this.el.id='tb_component_bar';
                this.breadCrumbs.className='tb_action_breadcrumb';
                document.addEventListener('click',this.click.bind(this));
                document.addEventListener('dblclick',this.click.bind(this));
                if(api.mode==='visual'){
                    topWindow.document.addEventListener('click',this.click.bind(this)); 
                }
                var canvas=api.mode==='visual'?null: document.getElementById('tb_canvas_block');

                if(canvas===null){
                    document.addEventListener('keyup',this.actions.bind(this));
                    topWindow.document.addEventListener('keyup',this.actions.bind(this)); 
                }
                else{
                    canvas.addEventListener('keyup',this.actions.bind(this));
                }
                this.el.addEventListener('click',this.actions.bind(this));
                this.el.addEventListener('mousedown',this.mouseDown.bind(this));
                this.topH = api.toolbar.$el.height();
                if(api.mode==='visual'){
                    document.body.appendChild(this.el);
                }
                else{
                    api.Instances.Builder[api.builderIndex].el.parentNode.appendChild(this.el);
                }
            }
        },
        mouseDown:function(e){
            if(e.which===1 && (this.type==='row' || this.type==='subrow') && e.target.classList.contains('ti-move')){         
                e.preventDefault();
                e.stopPropagation();
                var item = api.Instances.Builder[api.builderIndex].$el.find('.tb_element_cid_'+this.cid);
                if(item!==undefined){
                    var el = this.type==='row'?item[0].getElementsByClassName('tb_row_action')[0]:item[0],
                        offset=item.offset(),
                        ev;
                    this.clear();
                    if(typeof(Event) === 'function') {
                        ev = new Event('mousedown', {bubbles: true,cancelable:false});
                    } else {
                        ev = document.createEvent('Event');
                        ev.initEvent('mousedown', true, false);
                    }
                    ev.pageX = offset.left;
                    ev.pageY = offset.top;
                    ev.which=1;
                    el.dispatchEvent(ev);
                }
            }
        },
        click:function(e){
            if (api.isPreview || this.disable===true) {
                return true;
            }
            var target = e.target,
                tagName=target.tagName,
                lastRow = api.Instances.Builder[api.builderIndex].lastRow,
                el = $(target).closest('[data-cid]')[0];   
                if(topWindow.document.body.classList.contains('tb_standalone_lightbox') && !topWindow.document.body.classList.contains('modal-open')){
                    if(!api.toolbar.el.contains(target) && !Common.Lightbox.$lightbox[0].contains(target)&& !Common.Lightbox.$lightbox[0].classList.contains('tb_predesigned_lightbox')){
                        Common.Lightbox.close();
                    }
                    var selected_menu = topWindow.document.getElementsByClassName('tb_current_menu_selected')[0];
                    if(selected_menu!==undefined){
                        selected_menu.classList.remove('tb_current_menu_selected');
                    }
                    selected_menu=null;
                }
                if(lastRow && !lastRow.contains(target)){
                    lastRow.classList.remove('expanded');
                }
                if(e.type==='dblclick' && api.Forms.LayoutPart.id!==null && target.classList.contains('tb_overlay')){
                    api.Forms.LayoutPart.save(e,true);
                    return;
                }
             if(el!==undefined && (e.type==='dblclick' || !target.classList.contains('tb_disable_sorting') ) && !el.classList.contains('tb_active_layout_part')){
                if(api.mode==='visual' && (tagName==='A' || target.closest('a')!==null)){
                    e.preventDefault();
                }
                var cid = el.getAttribute('data-cid'),
                    model = api.Models.Registry.lookup(cid),
                    is_pageBreak = el.classList.contains('tb-page-break');
                if (model) {
                    if(e.type==='dblclick'){
                        if(tagName==='INPUT' || target.closest('.tb_clicked')!==null || is_pageBreak){
                            return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        el.classList.remove('tb_element_selected');
                        if(!target.classList.contains('tb_row_settings')){
                            model.trigger('edit',e,target);
                            return;
                        }
                    }
                    var isEmpty=this.cid!==null,
                        type = model.get('elType'),
                        is_expand = type!=='module' && target.classList.contains('tb_action_wrap');
                        this.cid=cid;
                        this.type=type;
                        if(is_pageBreak===true && type==='row'){
                            this.clear();
                            if(target.classList.contains('tb_row_anchor') ){
                                e.preventDefault();
                                e.stopPropagation();
                                model.trigger('delete',e,target);
                            }
                            return;
                        }
                    if(is_expand===false && target.closest('.tb_action_wrap')!==null){
                        this.actions(e);
                        return;
                    }
                    this.clear();
                    if(isEmpty===true && this.needClear===true) {
                        Themify.body[0].classList.add('tb_action_active');
                        var self = this,
                            mouseMove=function(){
                            document.removeEventListener('mousemove',mouseMove,{passive:true,once:true});
                            if(self.cid===null){
                                Themify.body[0].classList.remove('tb_action_active');
                            }
                        };
                        document.addEventListener('mousemove',mouseMove,{passive:true,once:true});
                        return;
                    }
                    this.cid=cid;
                    this.type=type;
                    var tpl_id = 'tmpl-builder_'+type+'_action',
                        t = Common.is_template_support?document.getElementById(tpl_id).content.cloneNode(true):Common.templateCache.get(tpl_id);
                    if(is_expand===true){
                        this.prevExpand =target;
                        Common.is_template_support?this.prevExpand.appendChild(t):this.prevExpand.insertAdjacentHTML('beforeend', t);
                        this.prevExpand.closest('.tb_action_wrap').classList.add('tb_clicked');
                        this.prevExpand.setAttribute('id',this.el.id);
                    }
                    else{
                        if(type!=='row'){
                           this.setBreadCrumbs(el);
                        }
                        this.el.className='tb_show_toolbar tb_'+type+'_action';
                        var wrap = document.createElement('div');
                            wrap.className='tb_action_label_wrap';
                        Common.is_template_support?wrap.appendChild(t):wrap.insertAdjacentHTML('beforeend', t);
                        if(api.mode==='visual'){
                            var m;
                            if(type==='module'){
                                m=model.get('mod_name');
                                this.el.className+=' tb_'+m+'_action';
                                m=themifyBuilder.modules[m].name;
                            }
                            else{
                                m=type;
                                if(type==='row'){
                                    var row_anchor = model.get('styling')['row_anchor'];
                                    if(row_anchor!==undefined){
                                        row_anchor = row_anchor.trim();
                                        if(row_anchor!==''){
                                            m+=' #'+row_anchor;
                                        }
                                    }
                                }
                            }
                            var mod_name=document.createElement('div');
                                mod_name.className='tb_data_mod_name';
                                mod_name.textContent=m.charAt(0).toUpperCase() + m.slice(1);
                            wrap.appendChild(mod_name);
                        }
                        this.el.appendChild(wrap);
                    }
                    Themify.body[0].classList.add('tb_action_active');
                    el.classList.add('tb_element_selected');
                    if(is_expand===false && this.disablePosition===null){
                        var left=e.pageX,
                            top=e.pageY;
                        if(api.mode !== 'visual'){
                            var rect = api.Instances.Builder[0].el.getBoundingClientRect();
                            left = e.clientX - rect.left;
                            top = e.clientY - rect.top+30;
                        }
                        this.setPosition(this.el,{left:left,top:top});
                    }
                }
                else{
                    this.clear();
                }
            }
            else if(!this.el.contains(target)){
                this.clear();
            }
        },
        setBreadCrumbs:function(el){
            while (this.breadCrumbs.firstChild) {
                this.breadCrumbs.removeChild(this.breadCrumbs.firstChild);
            }
            var f = document.createDocumentFragment(),
                path = [],
                item = el;
                while(true){
                    item = item.parentNode;
                    var cid = item.getAttribute('data-cid');
                    if(cid){
                        path.push(cid);
                    }
                    if(item.classList.contains('module_row')){
                        break;
                    }
                }
                for(var i=path.length-1;i>-1;--i){
                    var li =document.createElement('li'),
                        model = api.Models.Registry.lookup(path[i]),
                        type = model.get('elType');
                        li.textContent = type==='column'?model.get('component_name'):type;
                        li.className='tb_bread_'+type;
                        li.setAttribute('data-id',path[i]);
                        f.appendChild(li);
                }
                path=item=null;
                this.breadCrumbs.appendChild(f);
                if(this.el.firstChild===null){
                    this.el.appendChild(this.breadCrumbs);
                }
                else{
                    this.el.insertBefore(this.breadCrumbs, this.el.firstChild);
                }
        },
        actions:function(e){
            var target = e.target,
                tagName= target.tagName;
            if(e.type==='keyup'){
                var focesEl = document.activeElement.tagName;
                if(focesEl !== 'INPUT' && focesEl !== 'TEXTAREA'){
                    var code = e.keyCode,
                        target=undefined,
                        isSelected = document.getElementsByClassName('tb_element_selected').length>0,
                        btn = isSelected?(this.el.classList.contains('tb_show_toolbar')?this.el:document.getElementById(this.el.id)):null;
                    if(code === 46 || code === 8){
                        if(isSelected){
                            target = btn.getElementsByClassName('tb_delete')[0];
                        }
                        if(api.mode!=='visual' && themifyBuilder.is_gutenberg_editor){
                            var canvas = document.getElementById('tb_canvas_block');
                            if(canvas!==null && canvas.closest('.wp-block').classList.contains('is-selected')){
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                    }
                    else if(isSelected){
                        if(e.ctrlKey|| e.metaKey){
                            if(code === 67){
                                target = btn.getElementsByClassName('tb_copy_component')[0];
                            }
                            else if(code===86){
                                target = e.shiftKey?btn.getElementsByClassName('tb_paste_style')[0]:btn.getElementsByClassName('tb_paste_component')[0];
                            }
                        }
                    }
                    if(target===undefined){
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    tagName=target.tagName;
                }
                else{
                    return;
                }
            }
            else{
                e.preventDefault();
                e.stopPropagation();
            } 
            if(this.cid!==null && (tagName ==='LI' || tagName ==='SPAN' || tagName==='A')){
                var isBreadCrumb = target.parentNode.classList.contains('tb_action_breadcrumb'),
                    cid = isBreadCrumb?target.getAttribute('data-id'):this.cid,
                    action=null,
                    model = api.Models.Registry.lookup(cid),
                    cl = target.classList;
                if(model){
                    Themify.body[0].classList.remove('tb_component_menu_active');
                    if(isBreadCrumb===true){
                        this.needClear=null;
                        this.disablePosition=true;
                        document.getElementsByClassName('tb_element_cid_'+cid)[0].click();
                        this.disablePosition=null;
                        if(api.mode==='visual'){
                            var offset = this.el.getBoundingClientRect();
                            if(offset.right>=document.body.clientWidth){
                                this.setPosition(this.el,{left:offset.left,top:this.el.offsetTop+55});
                            }
                        }
                        this.needClear=true;
                        return;
                    }
                    var tabId = target.getAttribute('data-href');
                    if(tabId){
                        var tabs = target.parentNode.getElementsByTagName('li');
                        for(var i=tabs.length-1;i>-1;--i){
                            var id = tabs[i].getAttribute('data-href'),
                                el = id?document.getElementById(id):null,
                                isSelected = tabs[i].classList.contains('selected');
                            tabs[i].classList.remove('selected');
                            if(el!==null){
                                el.classList.remove('selected');
                            }
                            if(id===tabId && !isSelected){
                                if(id==='tb_row_options' || id==='tb_rgrids'){
                                    this.gridMenu(el);
                                }
                                else if(id==='tb_roptions' && el.children.length===0){
                                    this.setRowOptions(el);
                                }
                                el.classList.add('selected');
                                tabs[i].classList.add('selected');
                                api.Utils.addViewPortClass(el);
                                Themify.body[0].classList.add('tb_component_menu_active');
                            }
                        }
                       return;
                    }
                    else if(cl.contains('tb_edit') || cl.contains('tb_styling') || cl.contains('tb_visibility_component') || cl.contains('tb_swap')){
                        action = 'edit';
                    }
                    else if(cl.contains('tb_duplicate')){
                        action='duplicate';
                    }
                    else if(cl.contains('tb_save_component')){
                        action='save';
                    }
                    else if(cl.contains('tb_delete')){
                        action='delete';
                    }
                    else if(cl.contains('ti-import') || cl.contains('ti-export')){
                        action='importExport';
                    }
                    else if(cl.contains('tb_copy_component')){
                        action='copy';
                    }
                    else if(cl.contains('tb_paste_component') || cl.contains('tb_paste_style')){
                        action='paste';
                    }
                    else if(tagName==='LI' || tagName==='SPAN' || cl.contains('tb_action_more')|| cl.contains('tb_inner_action_more')){
                        var li = target.closest('li');
                        if(li===null){
                            return;
                        }
                        var ul = li.parentNode,
                            ul_cl = ul.classList,
                            is_edit =ul_cl.contains('tb_grid_list') ||  ul_cl.contains('tb_column_alignment') || ul_cl.contains('tb_column_gutter') || ul_cl.contains('tb_column_direction') || ul_cl.contains('tb_column_height') || ul_cl.contains('grid_tabs'),
                            is_selected = target.classList.contains('selected'),
                            childs = ul.children;
                            if(is_edit && is_selected){
                                return;
                            }
                            for(var i=childs.length-1;i>-1;--i){
                                childs[i].classList.remove('selected');
                                if(is_edit===false){
                                    var inner = childs[i].getElementsByClassName('selected');
                                    for(var j=inner.length-1;j>-1;--j){
                                        inner[j].classList.remove('selected');
                                    }
                                }
                            }
                        if(!is_selected){
                            li.classList.add('selected');
                            Themify.body[0].classList.add('tb_component_menu_active');
                        }
                        if(is_edit){
                            if(ul_cl.contains('tb_column_alignment')){
                                this._columnAlignmentClicked(li);
                            }
                            else if(ul_cl.contains('tb_column_gutter')){
                                this._gutterChange(li);
                            }
                            else if(ul_cl.contains('tb_column_direction')){
                                this._columnDirectionClicked(li);
                            }
                            else if(ul_cl.contains('tb_column_height')){
                                this._columnHeight(li);
                            }
                            else if(ul_cl.contains('grid_tabs')){
                                this._switchGridTabs(li);
                            }
                            else if(ul_cl.contains('tb_grid_list')){
                                this._gridClicked(li);
                            }
                        }
                        else{
                            childs=this.prevExpand!==null?this.prevExpand.children:this.el.getElementsByClassName('tb_action_label_wrap')[0].children;
                            for(var i=childs.length-1;i>-1;--i){
                                childs[i].classList.remove('selected');
                            }
                            if(!is_selected && (this.prevExpand===null || this.type==='column')){
                                var ul = li.getElementsByTagName('ul')[0];
                                if(ul!==undefined){
                                    api.Utils.addViewPortClass(ul);
                                }
                                
                            }
                        }
                        return;
                    }
                    else{
                        return;
                    }
                    this.clear();
                    model.trigger(action,e,target);
                }
            }
        },
        _switchGridTabs: function (target) {
            api.scrollTo = $(document.getElementsByClassName('tb_element_cid_'+this.cid)[0]);
            api.Constructor.lightboxSwitch(target.getAttribute('data-id'));
        },
        _gridClicked: function (target) {
            var $this = $(target),
                set = $this.data('grid'),
                handle = this.type,
                $base,
                row= $('.tb_element_cid_'+this.cid).first(),
                is_sub_row = false,
                type = api.activeBreakPoint,
                is_desktop = type === 'desktop',
                before = Common.clone(row.closest('.module_row'));
            is_sub_row = handle === 'subrow';
            $base = row.find('.' + handle + '_inner').first();
            if (is_desktop) {
                var $both = $base,
                    col = $this.data('col');
                $both = $both.add($('#tb_rgrids'));
                if (col === undefined) {
                    col = 1;
                    $this.data('col', col);
                }
                for(var i=6;i>0;--i){
                    $both.removeClass('col-count-'+i);
                }
                $both.addClass('col-count-' + col);
                $base.attr('data-basecol', col);
                if (is_desktop) {
                    $this.closest('.tb_grid_menu').find('.tb_grid_reposnive .tb_grid_list').each(function () {
                        var selected = $(this).find('.selected'),
                            mode = $(this).data('type'),
                            rcol = selected.data('col');
                        if (rcol !== undefined && (rcol > col || (col === 4 && rcol === 3) || (col >= 4 && rcol >= 4 && col != rcol))) {
                            selected.removeClass('selected');
                            $base.removeClass('tb_grid_classes col-count-' + $base.attr('data-basecol') + ' ' + $base.attr('data-col_' + mode)).attr('data-col_' + mode, '');
                            $(this).closest('.tb_grid_list').find('.' + mode + '-auto').addClass('selected');
                        }
                    });
                }
            }
            else {
                if (set[0] !== '-auto') {
                    var cl = 'column' + set.join('-'),
                            col = $this.data('col');
                    if (col === 3 && $base.attr('data-basecol') > col) {
                        cl += ' tb_3col';
                    }
                    $base.removeClass($base.attr('data-col_tablet') + ' ' + $base.attr('data-col_tablet_landscape') + ' ' + $base.attr('data-col_mobile'))
                            .addClass(cl + ' tb_grid_classes col-count-' + $base.attr('data-basecol')).attr('data-col_' + type, cl);
                }
                else {
                    $base.removeClass('tb_grid_classes tb_3col col-count-' + $base.attr('data-basecol') + ' ' + $base.attr('data-col_' + type)).attr('data-col_' + type, '');
                }
                if (api.mode === 'visual') {
                    $('body', topWindow.document).height(document.body.scrollHeight);
                }
                api.Utils.setCompactMode($base.children('.module_column'));
                return false;
            }

            var cols = $base.children('.module_column'),
                    set_length = set.length,
                    col_cl = 'module_column' + (is_sub_row ? ' sub_column' : '') + ' col';
            for (var i = 0; i < set_length; ++i) {
                var c = cols.eq(i);
                if (c.length > 0) {
                    c.removeClass(api.Utils.gridClass.join(' ')).addClass(col_cl + set[i]);
                } else {
                    // Add column
                    api.Utils._addNewColumn({
                        newclass: col_cl + set[i],
                        component: is_sub_row ? 'sub-column' : 'column'
                    }, $base[0]);
                }
            }

            // remove unused column
            if (set_length < $base.children().length) {
                $base.children('.module_column').eq(set_length - 1).nextAll().each(function () {
                    // relocate active_module
                    var modules = $(this).find('.tb_holder').first();
                    modules.children().appendTo($(this).prev().find('.tb_holder').first());
                    $(this).remove(); // finally remove it
                });
            }
            var $children = $base.children();
            $children.removeClass('first last');
            if ($base.hasClass('direction-rtl')) {
                $children.last().addClass('first');
                $children.first().addClass('last');
            }
            else {
                $children.first().addClass('first');
                $children.last().addClass('last');
            }
       
            api.Utils.columnDrag($base, true);
            var row = $base.closest('.module_row');
            //api.Mixins.Builder.columnSort(row);
            api.hasChanged = true;
            api.Mixins.Builder.updateModuleSort(row);
            api.undoManager.push(row.data('cid'), before, row, 'row');
            Themify.body.triggerHandler('tb_grid_changed', [row]);
        },
        _columnHeight:function(target){
            var $this = $(target),
                val = $this.data('value');
                if (val===undefined) {
                    return;
                }
            var $row = $('.tb_element_cid_'+this.cid).first(),
                el = api.Models.Registry.lookup(this.cid),
                before = Common.clone($row),
                inner =   $row.find('.' + this.type + '_inner').first();
                if(val===''){
                    inner.removeClass('col_auto_height');
                }
                else{
                    inner.addClass('col_auto_height');
                }
            el.set({'column_h': val}, {silent: true});
            api.undoManager.push(this.cid, before, $('.tb_element_cid_'+this.cid).first(), 'row');
        },
        _columnAlignmentClicked: function (target) {
            target = $(target);
            var alignment = target.data('alignment');
            if (!alignment) {
                return;
            }
            var $row = $('.tb_element_cid_'+this.cid).first(),
                el = api.Models.Registry.lookup(this.cid),
                before = Common.clone($row);
            $row.find('.' + this.type + '_inner').first().removeClass(el.get('column_alignment')).addClass(alignment);
            el.set({column_alignment: alignment}, {silent: true});
            api.undoManager.push(this.cid, before, $('.tb_element_cid_'+this.cid).first(), 'row');
        },
        _columnDirectionClicked: function (target) {
            target = $(target);
            var dir = target.data('dir');
            if (!dir) {
                return;
            }
            var $row = $('.tb_element_cid_'+this.cid).first(),
                inner = $row.find('.' + this.type + '_inner').first(),
                    columns = inner.children('.module_column'),
                    first = columns.first(),
                    last = columns.last(),
                    el = api.Models.Registry.lookup(this.cid),
                    data = {};
                data[api.activeBreakPoint + '_dir'] = dir;
                el.set(data, {silent: true});
            if (dir === 'rtl') {
                first.removeClass('first').addClass('last');
                last.removeClass('last').addClass('first');
                inner.addClass('direction-rtl');
            }
            else {
                first.removeClass('last').addClass('first');
                last.removeClass('first').addClass('last');
                inner.removeClass('direction-rtl');
            }
            
            inner.attr('data-' + api.activeBreakPoint + '_dir', dir);
        },
        _gutterChange: function (target) {
            var $this = $(target),
                val = $this.data('value');
                if (!val) {
                    return;
                }
            var row = $('.tb_element_cid_'+this.cid).first(),
                model = api.Models.Registry.lookup(this.cid),
                oldVal= model.get('gutter'),
                before = Common.clone(row),
                inner = row.find('.' + this.type + '_inner').first();
                api.Utils.columnDrag(inner, false, oldVal, val);
                inner.removeClass(oldVal).addClass(val);
                model.set({gutter: val}, {silent: true});
                api.undoManager.push(this.cid, before, $('.tb_element_cid_'+this.cid).first(), 'row');
        },
        gridMenu:function(el){
            var breakpoint = api.activeBreakPoint,
                isDesktop = breakpoint==='desktop',
                model= api.Models.Registry.lookup(this.cid),
                col = isDesktop===true?undefined:model.get('col_' + breakpoint),
                dir = model.get(breakpoint + '_dir'),
                column_aligment = model.get('column_alignment'),
                column_h = model.get('column_h'),
                gutter = model.get('gutter'),
                inner = document.getElementsByClassName('tb_element_cid_'+this.cid)[0].getElementsByClassName(this.type+'_inner')[0],
                columns = inner.children,
                count=columns.length,
                grid_base = [];
            for (var i = 0;i < count; ++i) {
                grid_base.push(api.Utils._getColClass(columns[i].className.split(' ')));
            }
            var grid = el.id==='tb_rgrids'?el:$(el).find('#tb_rgrids')[0];
            for(var i=6;i>-1;--i){
                grid.classList.remove('col-count-'+i);
            }
            grid.classList.add('col-count-'+count);
            columns=grid=null;
            grid_base = 'grid-layout-' + grid_base.join('-');
            var wrap = el.getElementsByClassName('tb_grid_'+breakpoint)[0],
                items = wrap.getElementsByClassName('tb_grid_list')[0].getElementsByTagName('li');
                col = col !== '-auto'  && col !== undefined && col !== ''?'grid-layout-' + col.replace(/column|tb_3col/ig, '').trim():false;
                if(isDesktop===false && count===1){
                    col = breakpoint+'-auto';
                }
            for(var i=items.length-1;i>-1;--i){
                if((isDesktop===true && items[i].classList.contains(grid_base)) || (isDesktop===false && col!==false && items[i].classList.contains(col))){
                    items[i].classList.add('selected');
                }
                else {
                    items[i].classList.remove('selected');
                }
            }
            grid_base=null;
            if (dir !== 'ltr') {
                items = wrap.getElementsByClassName('tb_column_direction')[0].getElementsByTagName('li');
                for (var i = items.length - 1; i > -1; --i) {
                    if (items[i].getAttribute('data-dir')===dir) {
                        items[i].classList.add('selected');
                    }
                    else {
                        items[i].classList.remove('selected');
                    }
                }
            }
            items = null;
            if(isDesktop===true){
                if (column_aligment!== 'col_align_top' || is_fullSection === true) {
                    var aligments = wrap.getElementsByClassName('tb_column_alignment')[0].getElementsByTagName('li');
                    for (var i = aligments.length - 1; i > -1; --i) {
                        if (aligments[i].getAttribute('data-alignment')===column_aligment) {
                            aligments[i].classList.add('selected');
                        }
                        else {
                            aligments[i].classList.remove('selected');
                        }
                    }
                    aligments=null;
                }
                if (gutter !== 'gutter-default') {
                    var gutterSelect = wrap.getElementsByClassName('tb_column_gutter')[0].getElementsByTagName('li');
                    for (var i = gutterSelect.length - 1; i > -1; --i) {
                        if (gutterSelect[i].getAttribute('data-value')===gutter) {
                            gutterSelect[i].classList.add('selected');
                        }
                        else {
                            gutterSelect[i].classList.remove('selected');
                        }
                    }
                    gutterSelect=null;
                }
                if(column_h){
                    var columnHeight = wrap.getElementsByClassName('tb_column_height')[0].getElementsByTagName('li');
                    for (var i = columnHeight.length - 1; i > -1; --i) {
                        if (columnHeight[i].getAttribute('data-value')==column_h) {
                            columnHeight[i].classList.add('selected');
                        }
                        else {
                            columnHeight[i].classList.remove('selected');
                        }
                    }
                }
            }
            
        },
        setRowOptions:function(el){
            var prevData=null,
                prevModel=api.activeModel,
                prevType=api.Constructor.component,
                model= api.Models.Registry.lookup(this.cid),
                currentStyle = model.get('styling');
                if(!currentStyle){
                    currentStyle = {};
                }
                
            if(prevModel!==null){
               var k = api.activeModel.get('elType')==='module'?'mod_settings':'styling';
               prevData = api.activeModel.get(k);
            }
            if(el.children[0]!==undefined){
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
            api.Constructor.values = currentStyle;
            api.Constructor.component = this.type;
            api.activeModel = model;
            
            el.appendChild(api.Constructor.create(api.Constructor.data['row'].setting['options'].slice(0,5)));
            
            api.Constructor.values=prevData;
            api.activeModel=prevModel;
            api.Constructor.component=prevType;
            
            prevModel=prevData=model=prevType=null;
        },
        clear:function(){
            if(this.type!==null){
                this.cid=this.type=null;
                this.el.classList.remove('tb_show_toolbar');
                while (this.el.firstChild) {
                    this.el.removeChild(this.el.firstChild);
                }
                if(this.prevExpand!==null){
                    while (this.prevExpand.firstChild) {
                        this.prevExpand.removeChild(this.prevExpand.firstChild);
                    }
                    this.prevExpand.closest('.tb_action_wrap').classList.remove('tb_clicked');
                    this.prevExpand.removeAttribute('id');
                    this.prevExpand=null;
                }
                this.clearSelected();
                Themify.body[0].classList.remove('tb_action_active');
                Themify.body[0].classList.remove('tb_component_menu_active');
            }
        },
        clearSelected:function(){
            var selected = document.getElementsByClassName('tb_element_selected');
            for(var i=selected.length-1;i>-1;--i){
                selected[i].classList.remove('tb_element_selected');
            }
        },
        setPosition:function(el,from){
            var pos ={},
                box = el.getBoundingClientRect(),
                elW = box.width,
                elH = box.height+40,
                winOffsetY = api.mode === 'visual'?window.pageYOffset:(api.toolbar.el.offsetTop+this.topH),
                container = api.mode === 'visual'?document.body:api.Instances.Builder[0].el,
                winW = container.clientWidth,
                top;
            if(from.nodeType!==undefined){
                pos = $(from).offset();
            }
            else{
                top = from.top;
                pos = from;
            }
            el.removeAttribute('data-top');
            pos['right']=pos['bottom']='';
            pos.left-=parseFloat(elW/2);
                pos.top-=elH;
            var r = pos.left+elW;
            if(r>winW){
                pos.left='auto';
                pos.right=10;
            }
            else if(pos.left<0){
                pos.left=30;
            }
            
            if(pos.top>container.clientHeight){
                if(api.mode !== 'visual'){
                    pos.top='auto';
                    pos.bottom=50;
                }
            }
            else if(winOffsetY>pos.top){
                el.dataset['top'] =true;
                pos.top+=2*elH-25;
                if(api.mode !== 'visual'){
                    pos.top-=elH/2;
                }
            }
            for(var i in pos){
               el.style[i]=pos[i]!=='auto' && pos[i]!==''?pos[i]+'px':pos[i];
            }
        }
    };

    // Validators
    api.Forms.register_validator = function (type, fn) {
        this.Validators[ type ] = fn;
    };
    api.Forms.get_validator = function (type) {
        return this.Validators[type] !== undefined ? this.Validators[ type ] : this.Validators.not_empty; // default
    };

    api.Forms.register_validator('email', function (value) {
        var pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            arr = value.split(',');
            for(var i=arr.length-1;i>-1;--i){
                if(!pattern.test(arr[i])){
                    return false;
                }
            }
        return true;
    });

    api.Forms.register_validator('not_empty', function (value) {
        return !(!value || '' === value.trim());
    });

})(jQuery, Backbone,Themify, window,window.top, document, ThemifyBuilderCommon, undefined);
