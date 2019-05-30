var ThemifyStyles;
(function (window, document, undefined) {
    'use strict';
    var isVisual = null;
    if (typeof String.prototype.trimRight !== 'function') {
        String.prototype.trimRight = function () {
            return this.replace(/\s+$/, '');
        };
    }
    ThemifyStyles = {
        styleName: 'tb_component_customize_',
        storeAgekey: 'tb_styles_rules',
        breakpoint: null,
        saving: null,
        fonts: {},
        rules: {},
        init: function (data, breakpointsReverse) {
            this.breakpointsReverse = breakpointsReverse;
            this.data = data;
            isVisual = typeof tb_app !== 'undefined' && tb_app.mode === 'visual';
            if (isVisual) {
                this.InitInlineStyles();
            }
        },
        getStorageRules: function () {
            if (themifyBuilder.debug) {
                return false;
            }
            var record = localStorage.getItem(this.storeAgekey);
            if (!record) {
                return false;
            }
            record = JSON.parse(record);
            return record;
        },
        setStorageRules: function (v) {

        },
        extend: function () {
            // Variables
            var extended = {},
                    deep = false,
                    self = this,
                    i = 0,
                    length = arguments.length;
            // Check if a deep merge
            if (arguments[0] === true) {
                deep = arguments[0];
                ++i;
            }
            // Merge the object into the extended object
            var merge = function (obj) {
                for (var prop in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        // If deep merge and property is an object, merge properties
                        if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                            extended[prop] = self.extend(true, extended[prop], obj[prop]);
                        } else {
                            extended[prop] = obj[prop];
                        }
                    }
                }
            };
            // Loop through each object and conduct a merge
            for (; i < length; ++i) {
                var obj = arguments[i];
                merge(obj);
            }
            return extended;
        },
        InitInlineStyles: function () {
            var points = this.breakpointsReverse,
                    f = document.createDocumentFragment();
            for (var i = points.length - 1; i > -1; --i) {
                var style = document.createElement('style');
                style.type = 'text/css';
                style.id = this.styleName + points[i];
                if (points[i] !== 'desktop') {
                    style.media = 'screen and (max-width:' + tb_app.Utils.getBPWidth(points[i]) + 'px)';
                }
                f.appendChild(style);
            }
            document.body.appendChild(f);
        },
        getSheet: function (breakpoint) {
            return  document.getElementById(this.styleName + breakpoint).sheet;
        },
        getBaseSelector: function (type, id) {
            var selector = '.tb_' + id + '.module';
            selector += type === 'row' || type === 'column' || type === 'subrow' ? '_' : '-';
            selector += type;
            return selector;
        },
        getNestedSelector: function (selectors) {
            var nested = ['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span'],
                    nlen = nested.length;
            selectors = selectors.slice(0);
            for (var j = selectors.length - 1; j > -1; --j) {
                if (selectors[j].indexOf('.tb_text_wrap') !== -1) {
                    var s = selectors[j].trimRight();
                    if (s.endsWith('.tb_text_wrap')) {//check if after .tb_text_wrap is empty 
                        for (var k = 0; k < nlen; ++k) {
                            selectors.push(s + ' ' + nested[k]);
                        }
                    }
                }
            }
            return selectors;
        },
        toRGBA: function (color) {
            if (color !== undefined && color !== '' && color !== '#') {
                var colorArr = color.split('_'),
                        patt = /^([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/;
                if (colorArr[0] !== undefined) {
                    var matches = patt.exec(colorArr[0].replace('#', '')),
                            opacity = colorArr[1] !== undefined && colorArr[1] != '0.99' ? colorArr[1] : 1;
                    return matches ? 'rgba(' + parseInt(matches[1], 16) + ', ' + parseInt(matches[2], 16) + ', ' + parseInt(matches[3], 16) + ', ' + opacity + ')' : color;
                }
            }
            else {
                color = '';
            }
            return color;
        },
        getStyleVal: function (id, data) {
            if (this.breakpoint === 'desktop') {
                return data[id] !== '' ? data[id] : undefined;
            }
            var breakpoints = this.breakpointsReverse,
                    index = breakpoints.indexOf(this.breakpoint);
            for (var i = index, len = breakpoints.length; i < len; ++i) {
                if (breakpoints[i] !== 'desktop') {
                    if (data['breakpoint_' + breakpoints[i]] !== undefined && data['breakpoint_' + breakpoints[i]][id] !== undefined && data['breakpoint_' + breakpoints[i]][id] !== '') {
                        return data['breakpoint_' + breakpoints[i]][id];
                    }
                }
                else if (data[id] !== '') {
                    return data[id];
                }
            }
            return undefined;
        },
        createCss: function (data, elType, saving) {
            if (!elType) {
                elType = 'row';
            }
            this.saving = saving;
            var points = this.breakpointsReverse,
                    len = points.length,
                    self = this,
                    css = {},
                    loop = function (data, type) {
                        var getCustomCss = function (component, elementId, st) {
                            if (st !== undefined) {
                                var styles = self.extend(true, {}, st);
                                for (var i = len - 1; i > -1; --i) {
                                    var res = null;
                                    self.breakpoint = points[i];
                                    if (points[i] === 'desktop') {
                                        res = self.getFieldCss(elementId, component, styles);
                                    }
                                    else if (styles['breakpoint_' + points[i]] !== undefined && Object.keys(styles['breakpoint_' + points[i]]).length > 0) {
                                        res = self.getFieldCss(elementId, component, styles['breakpoint_' + points[i]]);
                                    }
                                    if (res && Object.keys(res).length > 0) {
                                        if (css[points[i]] === undefined) {
                                            css[points[i]] = {};
                                        }
                                        for (var j in res) {
                                            if (css[points[i]][j] === undefined) {
                                                css[points[i]][j] = res[j];
                                            }
                                            else {
                                                for (var k = res[j].length - 1; k > -1; --k) {
                                                    css[points[i]][j].push(res[j][k]);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };

                        for (var i in data) {
                            var row = data[i],
                                    styling = row['styling'] ? row['styling'] : row['mod_settings'];
                            getCustomCss(type, row['element_id'], styling);
                            if (row['cols'] !== undefined) {
                                for (var j in row['cols']) {
                                    var col = row['cols'][j];
                                    getCustomCss('column', col['element_id'], col['styling']);

                                    if (col['modules'] !== undefined) {
                                        for (var m in col['modules']) {
                                            var mod = col['modules'][m];
                                            if (mod['mod_name'] !== undefined) {
                                                getCustomCss(mod['mod_name'], mod['element_id'], mod['mod_settings']);
                                            }
                                            else {
                                                loop([mod], 'subrow');
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
            loop(data, elType);
            css['fonts'] = this.fonts;
            this.fonts = {};
            this.saving = null;
            return css;
        },
        getStyleOptions: function (module) {
            if (this.rules[module] === undefined) {
                var all_fields = this.data;
                if (all_fields[module] !== undefined) {
                    this.rules[module] = {};
                    var self = this,
                            getStyles = function (styles) {
                                for (var i in styles) {
                                    if(styles[i]!==null){
                                        var type = styles[i].type;
                                        if (type === 'expand' || type === 'multi' || type === 'group') {
                                            getStyles(styles[i].options);
                                        }
                                        else if (type === 'tabs') {
                                            for (var j in styles[i].options) {
                                                getStyles(styles[i].options[j].options);
                                            }
                                        }
                                        else if (styles[i].prop !== undefined) {
                                            var id = styles[i].id;
                                            self.rules[module][id] = styles[i];

                                            if (type === 'box_shadow' || type === 'text_shadow') {
                                                var vals = type === 'box_shadow' ? ['hOffset', 'vOffset', 'blur', 'color'] : ['hShadow', 'vShadow', 'blur', 'color'];
                                                for (var j = vals.length - 1; j > -1; --j) {
                                                    var k = id + '_' + vals[j];
                                                    self.rules[module][k] = self.extend(true, {}, styles[i]);
                                                    self.rules[module][k]['prop'] = styles[i].prop;
                                                }
                                            }
                                            else if (type === 'fontColor' && self.rules[module][styles[i].s] === undefined) {
                                                self.rules[module][styles[i].s] = {type: 'color', prop: 'color', isFontColor: true, selector: styles[i].selector, origId: id};
                                            }
                                            else if (type === 'padding' || type === 'margin' || type === 'border' || type === 'border_radius') {
                                                var vals = ['top', 'right', 'bottom', 'left'],
                                                        is_border = styles[i].type === 'border',
                                                        is_border_radius = is_border === false && styles[i].type === 'border_radius',
                                                        prop = styles[i].prop;
                                                if (is_border === true) {
                                                    self.rules[module][id + '-type'] = {type: 'radio'};
                                                }
                                                for (var j = 3; j > -1; --j) {
                                                    var k = id + '_' + vals[j];
                                                    if (is_border === true) {
                                                        k += '_width';
                                                    }
                                                    self.rules[module][k] = self.extend(true, {}, styles[i]);
                                                    self.rules[module][k]['prop'] = is_border_radius === true ? prop : prop + '-' + vals[j];
                                                }
                                            }
                                            else if (type === 'gradient' || type === 'imageGradient') {
                                                self.rules[module][id + '-gradient'] = styles[i];
                                                self.rules[module][id + '-gradient-angle'] = self.rules[module][id + '-circle-radial'] = self.rules[module][id + '-gradient-type'] = {type: 'gradient'};
                                                if (type === 'imageGradient') {
                                                    self.rules[module][id + '-type'] = {type: 'radio'};

                                                    var extend = self.extend(true, {}, styles[i]);
                                                    delete extend.binding;
                                                    //bg
                                                    self.rules[module][styles[i].colorId] = extend;
                                                    self.rules[module][styles[i].colorId]['prop'] = 'background-color';
                                                    self.rules[module][styles[i].colorId]['type'] = 'color';
                                                    self.rules[module][styles[i].colorId]['id'] = styles[i].colorId;

                                                }
                                            }
                                            else if (type === 'multiColumns') {
                                                self.rules[module][id + '_gap'] = self.rules[module][id + '_divider_color'] = self.rules[module][id + '_divider_width'] = self.rules[module][id + '_divider_style'] = {type: type};
                                            }
                                            else if (type === 'font_select') {
                                                self.rules[module][id + '_w'] = {type: 'font_weight'};
                                            }
                                        }
                                        else if (styles[i].id !== undefined) {
                                            self.rules[module][styles[i].id] = styles[i];
                                        }
                                    }
                                }
                            };
                    if (all_fields[module].styling !== undefined) {
                        if (all_fields[module].styling.options.length !== undefined) {
                            getStyles(all_fields[module].styling.options);
                        }
                        else {
                            getStyles(all_fields[module].styling);
                        }
                    }
                    else {
                        getStyles(all_fields[module].type === undefined ? all_fields[module] : [all_fields[module]]);
                    }

                }
                else {
                    return false;
                }
            }
            return this.rules[module];
        },
        getFieldCss: function (elementId, module, settings) {
            if (this.data[module] !== undefined) {

                var styles = {},
                        rules = this.getStyleOptions(module),
                        prefix = this.getBaseSelector(module, elementId);
                /* 
                 settings=this.cleanUnusedStyles(settings);
                 if(this.breakpoint==='desktop'){
                 settings = this.cleanDuplicates(module,settings);
                 }
                 */
                var isSaving = this.saving === true;
                for (var i in settings) {
                    if (rules[i] !== undefined && rules[i].selector !== undefined) {
                        var type = rules[i].type;
                        if (type === 'margin') {
                            type = 'padding';
                        }
                        var st = this.fields[type].call(this, i, module, rules[i], settings);
                        if (st !== false) {
                            var selectors = Array.isArray(rules[i].selector) ? rules[i].selector : [rules[i].selector],
                                    isHover = rules[i].ishover === true,
                                    res = [];
                            selectors = this.getNestedSelector(selectors);
                            for (var j = 0, len = selectors.length; j < len; ++j) {
                                var sel = selectors[j];
                                if (isHover === true) {
                                    sel += ':hover';
                                }
                                if (isVisual === true) {
                                    if (isSaving === false) {
                                        if (isHover === true || sel.indexOf(':hover') !== -1) {
                                            sel += ',' + prefix + sel.replace(':hover', '.tb_visual_hover');
                                        }
                                    }
                                    else if (sel.indexOf('.tb_visual_hover') !== -1) {
                                        var s = sel.split(',');
                                        for (var k = s.length - 1; k > -1; --k) {
                                            if (s[k].indexOf('.tb_visual_hover') !== -1) {
                                                s.splice(k, 1);
                                            }
                                        }
                                        sel = s.join(',');
                                        s = null;
                                    }
                                }
                                res.push(prefix + sel);
                            }
                            res = res.join(',');
                            if (styles[res] === undefined) {
                                styles[res] = [];
                            }
                            if (styles[res].indexOf(st) === -1) {
                                styles[res].push(st);
                            }
                        }
                        else if (st === null) {
                            delete settings[i];
                        }
                    }
                }
                return styles;
            }
            return false;
        },
        fields: {
            frameCache: {},
            imageGradient: function (id, type, args, data) {
                var selector = false,
                        is_gradient = id.indexOf('-gradient', 3) !== -1,
                        checked = is_gradient === true ? id.replace('-gradient', '-type') : id + '-type';
                checked = this.getStyleVal(checked, data);
                if (checked === 'gradient') {
                    if (is_gradient === true) {
                        selector = this.fields['gradient'].call(this, id, type, args, data);
                        selector += 'background-color:transparent;';
                    }
                    // delete data[args.colorId];
                    //delete data[id.replace('-gradient','')];
                }
                else if (is_gradient === false) {
                    selector = this.fields['image'].call(this, id, type, args, data);
                    if (selector !== false && this.getStyleVal(id, data) !== '') {
                        var v = this.fields['select'].call(this, args.repeatId, type, {prop: 'background-mode','origId':args.origId}, data);
                        if (v !== false) {
                            selector += v;
                        }
                        v = this.fields['select'].call(this, args.posId, type, {prop: 'background-position','origId':args.origId}, data);
                        if (v !== false) {
                            selector += v;
                        }
                    }
                    //delete data[id+'-gradient'];
                    //this.fields['gradient'].call(this, id + '-gradient', type, args, data);
                }
                return selector;
            },
            image: function (id, type, args, data) {
                var v = this.getStyleVal(id, data),
                        selector = false;
                if (v !== undefined) {
                    if (id === 'background_image' || id === 'bg_i_h') {
                        var checked = id === 'background_image' ? 'background_type' : 'b_t_h';
                        checked = this.getStyleVal(checked, data);
                        if (checked && checked !== 'image') {
                            return false;
                        }
                    }
                    if (v === '') {
                        if (this.breakpoint !== 'desktop') {
                            selector = args.prop + ':none;';
                        }
                    }
                    else {
                        selector = args.prop + ':url(' + v + ');';
                    }
                }
                return selector;
            },
            gradient: function (id, type, args, data) {
                var opt = [],
                        selector = false,
                        origId = args.id,
                        v = this.getStyleVal(id, data);
                if (origId === 'background_gradient' || origId === 'b_g_h' || origId === 'cover_gradient' || origId === 'cover_gradient_hover') {
                    var checked;
                    if (origId === 'background_gradient') {
                        checked = 'background_type';
                    }
                    else if (origId === 'b_g_h') {
                        checked = 'b_t_h';
                    }
                    else if (origId === 'cover_gradient') {
                        checked = 'cover_color-type';
                    }
                    else {
                        checked = 'cover_color_hover-type';
                    }
                    checked = this.getStyleVal(checked, data);
                    if (checked !== 'gradient' && checked !== 'hover_gradient' && checked !== 'cover_gradient') {
                        return false;
                    }
                }
                if (!v) {
                    opt = [id, origId + '-gradient-angle', origId + '-circle-radial', origId + '-gradient-type'];
                }
                else {
                    var gradient = v.split('|'),
                            type = this.getStyleVal(origId + '-gradient-type', data),
                            angle;
                    if (!type) {
                        type = 'linear';
                    }
                    if (type === 'radial') {
                        opt = [origId + '-gradient-angle'];
                        angle = this.getStyleVal(origId + '-circle-radial', data) ? 'circle' : '';
                    }
                    else {
                        opt = [origId + '-circle-radial'];
                        angle = this.getStyleVal(origId + '-gradient-angle', data);
                        if (!angle) {
                            angle = '180';
                        }
                        angle += 'deg';
                    }
                    if (angle !== '') {
                        angle += ',';
                    }
                    var res = [];
                    for (var i = 0, len = gradient.length; i < len; ++i) {
                        var p = parseInt(gradient[i]) + '%',
                                color = gradient[i].replace(p, '').trim();
                        res.push(color + ' ' + p);
                    }
                    res = res.join(',');

                    selector = args.prop + ':' + type + '-gradient(' + angle + res + ');';
                }
                /*
                 for(var i=opt.length-1;i>-1;--i){
                 delete data[opt[i]];
                 }
                 */
                return selector;
            },
            icon_radio: function (id, type, args, data) {
                var v = this.getStyleVal(id, data);
                if (!v) {
                    return false;
                }
                return args.prop + ':' + v + ';';
            },
            color: function (id, type, args, data) {
                if (args.prop === 'column-rule-color') {
                    return false;
                }

                var v = this.getStyleVal(id, data);
                if (v === '' || v === undefined) {
                    delete data[id];
                    return false;
                }
                var c = this.toRGBA(v);
                if (!c || c === '_') {
                    delete data[id];
                    return false;
                }

                if (args.isFontColor === true) {
                    return this.fields['fontColor'].call(this, args.origId, type, {s: id}, data);
                }
                var selector = args.prop + ':' + c + ';';

                if (args.colorId === id && args.origId !== undefined && !this.getStyleVal(args.origId, data)) {
                    if (this.getStyleVal(args.origId + '-type', data) === 'gradient') {
                        return false;
                    }
                    selector += 'background-image:none;';
                }
                else if ((id === 'b_c_h' || id === 'b_c_i_h') && (type === 'row' || type === 'column' || type === 'subrow' || type === 'sub-column')) {
                    var imgId = id === 'b_c_h' ? 'bg_i_h' : 'b_i_i_h';
                    if (!this.getStyleVal(imgId, data)) {
                        if (id !== 'b_c_h' || (id === 'b_c_h' && this.getStyleVal('b_t_h', data) !== 'gradient')) {
                            selector += 'background-image:none;';
                        }
                    }
                }
                return selector;
            },
            fontColor: function (id, type, args, data) {
                var v = this.getStyleVal(id, data),
                        selector = false;
                if (v === undefined || v.indexOf('_gradient') === -1) {
                    selector = this.fields['color'].call(this, (v !== undefined && v.indexOf('_solid') !== -1) ? v.replace(/_solid$/ig, '') : args.s, type, {prop: 'color'}, data);

                    if (selector !== false) {
                        selector += '-webkit-background-clip:border-box;background-clip:border-box;background-image:none;';
                    }
                }
                else if (v !== undefined) {
                    selector = this.fields['gradient'].call(this, v.replace(/_gradient$/ig, '-gradient'), type, {prop: 'background-image'}, data);
                    if (selector !== false) {
                        selector += '-webkit-background-clip:text;background-clip:text;color:transparent;';
                    }
                }
                return selector;
            },
            padding: function (id, type, args, data) {
                var prop = args.prop,
                        propName = prop.indexOf('padding') !== -1 ? 'padding' : 'margin',
                        origId = args.id,
                        v = this.getStyleVal(id, data);
                if (!v) {
                    delete data[id + '_unit'];
                    return false;
                }
                if (data['checkbox_' + origId + '_apply_all'] && data['checkbox_' + origId + '_apply_all'] !== '|') {
                    if (prop !== propName + '-top') {
                        return false;
                    }
                    prop = propName;
                    /*
                     var opt = ['left','bottom','right'];
                     for(var i=2;i>-1;--i){
                     delete data[origId+'_'+opt[i]];
                     delete data[origId+'_'+opt[i]+'_unit'];
                     }
                     */
                }
                var unit = this.getStyleVal(id + '_unit', data);
                if (!unit) {
                    unit = 'px';
                }
                return prop + ':' + v + unit + ';';
            },
            box_shadow: function (id, type, args, data) {
                var prop = args.prop,
                        origId = args.id,
                        v = this.getStyleVal(id, data),
                        selector;
                if (!v) {
                    delete data[id + '_unit'];
                    return false;
                }

                var subSets = ['hOffset', 'vOffset', 'blur'],
                        cssValue = '';
                for (var i = 0, len = subSets.length; i < len; ++i) {
                    cssValue += (data[origId + '_' + subSets[i]] !== undefined ? data[origId + '_' + subSets[i]] : '');
                    if (subSets[i] !== 'color') {
                        var unit = this.getStyleVal(origId + '_' + subSets[i] + '_unit', data);
                        if (!unit) {
                            unit = 'px';
                        }
                        cssValue += unit + ' ';
                    }
                }
                cssValue += this.toRGBA(data[origId + '_color']);
                if (data[origId + '_inset'] === 'inset') {
                    cssValue = 'inset ' + cssValue;
                }
                selector = prop + ':' + cssValue + ';';
                return selector;
            },
            text_shadow: function (id, type, args, data) {
                var prop = args.prop,
                        origId = args.id,
                        v = this.getStyleVal(id, data),
                        selector;
                if (!v) {
                    delete data[id + '_unit'];
                    return false;
                }

                var subSets = ['hShadow', 'vShadow', 'blur'],
                        cssValue = '';
                for (var i = 0, len = subSets.length; i < len; ++i) {
                    cssValue += (data[origId + '_' + subSets[i]] !== undefined ? data[origId + '_' + subSets[i]] : '');
                    var unit = this.getStyleVal(origId + '_' + subSets[i] + '_unit', data);
                    if (!unit) {
                        unit = 'px';
                    }
                    cssValue += unit + ' ';
                }
                cssValue += this.toRGBA(data[origId + '_color']);
                selector = prop + ':' + cssValue + ';';
                return selector;
            },
            border_radius: function (id, type, args, data) {
                var prop = args.prop,
                        origId = args.id,
                        selector;

                var apply_all = data['checkbox_' + origId + '_apply_all'];
                if (apply_all === '1' || apply_all === undefined) {
                    id = origId + '_top';
                    var v = this.getStyleVal(id, data);
                    if (!v) {
                        delete data[id + '_unit'];
                        return false;
                    }
                    var unit = this.getStyleVal(id + '_unit', data);
                    if (!unit) {
                        unit = 'px';
                    }
                    selector = prop + ':' + v + unit + ';';
                } else {
                    var positions = ['top', 'right', 'bottom', 'left'],
                            cssValue = '';
                    for (var i = 0, len = positions.length; i < len; ++i) {
                        var unit = this.getStyleVal(origId + '_' + positions[i] + '_unit', data);
                        if (!unit) {
                            unit = 'px';
                        }
                        cssValue += (data[origId + '_' + positions[i]] !== undefined ? data[origId + '_' + positions[i]] : '0') + unit + ' ';
                    }
                    selector = prop + ':' + cssValue + ';';
                }
                return selector;
            },
            border: function (id, type, args, data) {
                var prop = args.prop,
                        origId = args.id,
                        val,
                        v = this.getStyleVal(id, data);
                if (!v) {
                    return false;
                }
                var all = this.getStyleVal(origId + '-type', data);
                if (all === undefined) {
                    all = 'top';
                }
                if (all === 'all') {
                    if (prop !== 'border-top') {
                        return false;
                    }
                    prop = 'border';
                    /*
                     var opt = ['left','bottom','right'];
                     for(var i=2;i>-1;--i){
                     delete data[origId+'_'+opt[i]+'_width'];
                     delete data[origId+'_'+opt[i]+'_style'];
                     delete data[origId+'_'+opt[i]+'_color'];
                     }
                     */
                }
                var style = this.getStyleVal(id.replace('_width', '_style'), data),
                        colorId = id.replace('_width', '_color');
                if (style === 'none') {
                    val = style;
                    /*
                     delete data[colorId];
                     delete data[id];
                     */
                }
                else {
                    if (!style) {
                        style = 'solid';
                    }
                    val = v + 'px ' + style;
                    var color = this.getStyleVal(colorId, data);
                    if (color !== '' && color !== undefined) {
                        val += ' ' + this.toRGBA(color);
                    }
                    else {
                        delete data[colorId];
                    }
                }
                return prop + ':' + val + ';';
            },
            select: function (id, type, args, data) {
                var prop = args.prop,
                        selector = '',
                        v = this.getStyleVal(id, data);

                if (v === undefined || v === '' || prop === 'column-rule-style') {
                    return false;
                }
                if (prop === 'background-mode' || prop === 'background-position' || prop === 'background-repeat' || prop === 'background-attachment') {
                    if (data[args['origId']] === undefined || data[args['origId']] === '') {
                        return false;
                    }
                    if (prop === 'background-mode') {
                        var bg_values = {
                            'repeat': 'repeat',
                            'repeat-x': 'repeat-x',
                            'repeat-y': 'repeat-y',
                            'repeat-none': 'no-repeat',
                            'no-repeat': 'no-repeat',
                            'fullcover': 'cover',
                            'best-fit-image': 'contain',
                            'builder-parallax-scrolling': 'cover',
                            'builder-zoom-scrolling': '100%',
                            'builder-zooming': '100%'
                        };
                        if (bg_values[v] !== undefined) {
                            if (v.indexOf('repeat') !== -1) {
                                prop = 'background-repeat';
                            }
                            else {
                                prop = 'background-size';
                                selector = 'background-repeat: no-repeat;';
                                if (v === 'best-fit-image' || v === 'builder-zooming') {
                                    selector += 'background-position:center center;';
                                }
                                else if (v === 'builder-zoom-scrolling') {
                                    selector += 'background-position:50%;';
                                }
                            }
                            v = bg_values[v];
                        }
                    }
                    else if (prop === 'background-position') {
                        v = v.replace('-', ' ');
                    }
                    else if (prop === 'background-repeat' && v === 'fullcover') {
                        prop = 'background-size';
                        v = 'cover';
                    }
                }
                else if (prop === 'column-count') {
                    if (v == '0') {
                        var opt = [id, id + '_gap', id + '_divider_color', id + '_width', id + '_divider_style'];
                        for (var i = opt.length - 1; i > -1; --i) {
                            delete data[opt[i]];
                        }
                        return false;
                    }
                    var gap = this.getStyleVal(id + '_gap', data);
                    if (gap) {
                        selector = 'column-gap:' + gap + 'px;';
                    }
                    var style = this.getStyleVal(id + '_divider_style', data),
                            width = this.getStyleVal(id + '_width', data);
                    if (style === 'none') {
                        delete data[id + '_divider_color'];
                        delete data[id + '_width'];
                        selector += 'column-rule:none;';
                    }
                    else {
                        if (width === '' || width === undefined) {
                            delete data[id + '_divider_color'];
                            delete data[id + '_width'];
                            delete data[id + '_divider_style'];
                        }
                        else {
                            if (!style) {
                                style = 'solid';
                            }
                            selector += 'column-rule:' + width + 'px ' + style;
                            var color = this.getStyleVal(id + '_divider_color', data);
                            if (color !== '' && color !== undefined) {
                                selector += ' ' + this.toRGBA(color);
                            }
                            selector += ';';
                        }
                    }

                }

                selector += prop + ':' + v + ';';
                return selector;
            },
            font_select: function (id, type, args, data) {
                var v = data[id],
                        selector = '';
                if (v === 'default' || v === '' || v === undefined) {
                    delete data[id];
                    delete data[id + '_w'];
                    return false;
                }
                if ((typeof tb_app !== 'undefined' && tb_app.Constructor.font_select.google[v] !== undefined) || (typeof ThemifyBuilderStyle !== 'undefined' && ThemifyBuilderStyle.google[v] !== undefined)) {
                    var w = data[id + '_w'];
                    if (this.fonts[v] === undefined) {
                        this.fonts[v] = [];
                    }
                    if (w) {
                        var def = {
                            regular: 400,
                            italic: 400,
                            bold: 700
                        };
                        if (this.fonts[v].indexOf(w) === -1) {
                            this.fonts[v].push((def[w] !== undefined ? def[w] : w));
                        }
                        var italic = w.indexOf('italic') !== -1 ? ';font-style: italic' : '';
                        w = def[w] !== undefined ? def[w] : w.replace(/[^0-9]/g, '');
                        w += italic;
                        selector = 'font-weight:' + w + ';';
                    }

                }
                else {
                    delete data[id + '_w'];
                }
                selector += args.prop + ':' + v + ';';
                return selector;
            },
            frame: function (id, type, args, data) {
                return false;
            },
            range: function (id, type, args, data) {
                if (args.prop === 'column-gap' || args.prop === 'column-rule-width') {
                    return false;
                }
                var v = this.getStyleVal(id, data);
                if (v === '' || v === undefined) {
                    delete data[id];
                    delete data[id + '_unit'];
                    return false;
                }
                var unit = this.getStyleVal(id + '_unit', data);
                if (!unit) {
                    unit = 'px';
                }
                return args.prop + ':' + v + unit + ';';
            },
            radio: function (id, type, args, data) {
                if (args.prop === 'frame-custom') {
                    var side = id.split('-')[0],
                            opt = [],
                            layout,
                            v = this.getStyleVal(id, data);
                    if (v === side + '-presets') {
                        layout = this.getStyleVal(side + '-frame_layout', data);
                        opt.push(side + '-frame_custom');
                    }
                    else {
                        layout = this.getStyleVal(side + '-frame_custom', data);
                        opt.push(side + '-frame_layout');
                        opt.push(side + '-frame_color');
                    }
                    if (!layout || (v === side + '-presets' && layout === 'none')) {
                        opt.push(side + '-frame_color');
                        opt.push(side + '-frame_width');
                        opt.push(side + '-frame_height');
                        opt.push(side + '-frame_repeat');
                        opt.push(side + '-frame_height_unit');
                        opt.push(side + '-frame_width_unit');
                        opt.push(side + '-frame_location');
                    }
                    /*
                     for(var i=opt.length-1;i>-1;--i){
                     delete data[opt[i]];
                     }
                     */
                    if (!layout) {
                        return false;
                    }
                    var selector = '';
                    if (v === side + '-presets') {
                        if (side === 'left' || side === 'right') {
                            layout += '-l';
                        }
                        var key = Themify.hash(layout),
                                self = this,
                                callback = function (svg) {
                                    var color = self.getStyleVal(side + '-frame_color', data);
                                    if (color !== undefined && color !== '') {
                                        svg = svg.replace(/\#D3D3D3/ig, self.toRGBA(color));
                                    }
                                    selector = 'background-image: url("data:image/svg+xml;base64,' + window.btoa(svg) + '");';
                                };
                        if (self.fields.frameCache[key] !== undefined) {
                            callback(self.fields.frameCache[key]);
                        }
                        else {
                            var url = isVisual !== true && typeof themifyBuilder !== 'undefined' ? themifyBuilder.builder_url : tbLocalScript.builder_url,
                                    xhr = new XMLHttpRequest();
                            url += '/img/row-frame/' + layout + '.svg';
                            xhr.open('GET', url, false);
                            xhr.onreadystatechange = function () {
                                if (this.readyState === 4 && (this.status === 200 || xhr.status === 0)) {
                                    self.fields.frameCache[key] = this.responseText;
                                    callback(this.responseText);
                                }
                            };
                            xhr.send(null);
                        }
                    }
                    else {
                        selector = 'background-image:url("' + layout + '");';
                    }
                    var w = this.getStyleVal(side + '-frame_width', data),
                            h = this.getStyleVal(side + '-frame_height', data);
                    if (w) {
                        var unit = this.getStyleVal(side + '-frame_width_unit', data);
                        if (!unit) {
                            unit = '%';
                        }
                        selector += 'width:' + w + unit + ';';
                    }
                    else {
                        delete data[side + '-frame_width'];
                        delete data[side + '-frame_width_unit'];
                    }
                    if (h) {
                        var unit = this.getStyleVal(side + '-frame_height_unit', data);
                        if (!unit) {
                            unit = '%';
                        }
                        selector += 'height:' + h + unit + ';';
                    }
                    else {
                        delete data[side + '-frame_height']
                        delete data[ side + '-frame_height_unit' ];
                    }
                    var repeat = this.getStyleVal(side + '-frame_repeat', data);
                    if (repeat) {
                        var rep = 0.1 + (100 / repeat);

                        if (side === 'left' || side === 'right') {
                            selector += 'background-size:100% ' + rep + '%;';
                        }
                        else {
                            selector += 'background-size:' + rep + '% 100%;';
                        }
                    }
                    else {
                        delete data[side + '-frame_repeat'];
                    }
                    return selector;
                }

            },
            multiColumns: function (id, type, args, data) {
                if (args.prop !== 'column-count') {
                    return false;
                }
                var v = this.getStyleVal(id, data),
                        selector = false;
                if (v) {
                    selector = args.prop + ':' + v + ';';
                    var gap = this.getStyleVal(id + '_gap', data),
                            w = this.getStyleVal(id + '_divider_width', data);
                    if (gap !== '' && gap !== undefined) {
                        selector += 'column-gap:' + gap + 'px;';
                    }
                    else {
                        delete data[id + '_gap'];
                    }
                    if (w) {
                        var s = this.getStyleVal(id + '_divider_style', data),
                                c = this.getStyleVal(id + '_divider_color', data);
                        selector += 'column-rule:' + w + 'px ';
                        selector += s ? s : 'solid';
                        selector += c !== '' && c !== undefined ? ' ' + this.toRGBA(c) : '';
                        selector += ';';
                    }
                    else {
                        delete data[id + '_divider_color'];
                        delete data[id + '_divider_width'];
                        delete data[id + '_divider_style'];
                    }
                }
                else {
                    delete data[id];
                    delete data[id + '_gap'];
                    delete data[id + '_divider_color'];
                    delete data[id + '_divider_width'];
                    delete data[id + '_divider_style'];
                }
                return selector;
            },
            height: function (id, type, args, data) {
                var prop = 'height', v, selector;
                if ('auto' === this.getStyleVal(id + '_auto_height', data)) {
                    selector = prop + ':' + 'auto' + ';';
                } else {
                    v = this.getStyleVal(id, data);
                    if (!v) {
                        return false;
                    }
                    var unit = this.getStyleVal(id + '_unit', data);
                    if (!unit) {
                        unit = 'px';
                    }
                    selector = prop + ':' + v + unit + ';';
                }
                return selector;
            }
        },
        cleanDuplicates: function (module, data) {
            var checkDefault = function (v, id) {
                var is_frame_unit = id.indexOf('-frame_') !== -1;
                return (v === 'px' && is_frame_unit === false) || (v === 'pixels' && v === 'n' && v === 'solid' && v === 'linear' && v === 'default' && v === '|') || (is_frame_unit === true && v === '%');
            };
            var b = this.breakpointsReverse,
                    rules = this.rules[module];
            for (var i = 0, len = b.length; i < len; ++i) {
                if (b[i] !== 'desktop') {
                    if (data['breakpoint_' + b[i]] !== undefined) {
                        var responseiveData = data['breakpoint_' + b[i]];
                        for (var k in responseiveData) {
                            var type = null;
                            if (rules[k] !== undefined && rules[k].prop !== undefined) {
                                type = rules[k].type;
                                if (rules[k].is_responsive === false) {
                                    delete responseiveData[k];
                                    continue;
                                }
                                if (type === 'icon_checkbox' || type === 'checkbox' || type === 'radio') {
                                    continue;
                                }
                            }
                            var found = false;
                            for (var j = i + 1; j <= len; ++j) {
                                if (b[j] === 'desktop' || data['breakpoint_' + b[j]] !== undefined) {
                                    var parentData = b[j] === 'desktop' ? data : data['breakpoint_' + b[j]];
                                    if (parentData[k] !== undefined) {
                                        found = true;
                                        if (parentData[k] === responseiveData[k]) {
                                            if (type === 'image' || type === 'color' || type === 'range' || type === 'frame' || type === 'select' || type === 'icon_radio' || type === 'font_select' || type === 'text' || type === 'textarea' || k.indexOf('_unit') !== -1) {
                                                delete responseiveData[k];
                                            }
                                            else if (k.indexOf('-gradient') !== -1) {
                                                var realId = k.replace('-gradient', '');
                                                if (rules[realId] !== undefined && (rules[realId].type === 'imageGradient' || rules[realId].type === 'gradient')) {
                                                    delete responseiveData[k];
                                                    var opt = ['gradient-angle', 'gradient-type', 'circle-radial'];
                                                    for (var m = 0, mlen = m.length; m < mlen; ++m) {
                                                        if (parentData[realId + '-' + opt[m]] === responseiveData[realId + '-' + opt[m]]) {
                                                            delete responseiveData[realId + '-' + opt[m]];
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                var opt = ['top', 'right', 'bottom', 'left'];
                                                for (var m = 0; m < 4; ++m) {
                                                    if (k.indexOf('_' + opt[m] + '_style') !== -1) {
                                                        var realId = k.replace('_' + opt[m] + '_style', '');
                                                        if (rules[realId] !== undefined && rules[realId].type === 'border') {
                                                            delete responseiveData[k];
                                                            if (parentData[realId + '_' + opt[m] + '_color'] === responseiveData[realId + '_' + opt[m] + '_color']) {
                                                                delete responseiveData[realId + '_' + opt[m] + '_color'];
                                                            }
                                                            if (parentData[realId + '_' + opt[m] + '_width'] === responseiveData[realId + '_' + opt[m] + '_width']) {
                                                                delete responseiveData[realId + '_' + opt[m] + '_width'];
                                                            }
                                                        }
                                                    }
                                                    else if (k.indexOf('_' + opt[m]) !== -1) {
                                                        var realId = k.replace('_' + opt[m], '');
                                                        if (rules[realId] !== undefined) {
                                                            var realType = rules[realId].type;
                                                            if (realType === 'margin' || realType === 'padding') {
                                                                delete responseiveData[k];
                                                                if (parentData[k + '_unit'] === responseiveData[k + '_unit']) {
                                                                    delete responseiveData[k + '_unit'];
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                }
                            }
                            if (found === false && checkDefault(responseiveData[k], k)) {
                                delete responseiveData[k];
                            }
                        }
                    }
                }
                else {
                    for (var k in data) {
                        if (k.indexOf('_unit') !== -1) {
                            var realId = k.replace('_unit', '');
                            if (data[realId] === undefined || data[realId] === '') {
                                delete data[k];
                            }
                        }
                        if (checkDefault(data[k], k)) {
                            delete data[k];
                        }
                    }
                }
            }
            return data;
        },
        cleanUnusedStyles: function (items) {
            for (var i in items) {
                var suffix,
                        opt = [],
                        type = this.rules[i] !== undefined ? this.rules[i].type : null,
                        replaceHover = function (str) {
                            if (suffix !== '') {
                                str = str.split('_');
                                var nstr = [];
                                for (var i = 0, len = str.length; i < len; ++i) {
                                    nstr.push(str[0]);
                                }
                                return nstr.join('_') + '_' + suffix;
                            }
                            return str;
                        };
                if (i === 'background_type' || i === 'b_t_h' || i === 'background_image' || i === 'b_i_h') {
                    if (i === 'background_image' || i === 'b_i_h') {
                        suffix = i === 'b_i_h' ? 'h' : '';
                        if (items[replaceHover('background_image')]) {
                            continue;
                        }
                        else {
                            i = suffix === 'h' ? 'b_t_h' : 'background_type';
                            items[i] = 'image';
                        }
                    }
                    suffix = i === 'b_t_h' ? 'h' : '';

                    if (items[i] !== 'gradient') {
                        var prefix = replaceHover('background_gradient');
                        opt = [prefix + '-circle-radial', prefix + '-gradient', prefix + '-gradient-angle', prefix + '-gradient-type'];
                    }
                    else {
                        opt = [replaceHover('background_color')];
                    }
                    if (items[i] !== 'slider') {
                        opt.push(replaceHover('background_slider'));
                        opt.push(replaceHover('background_slider_size'));
                        opt.push(replaceHover('background_slider_mode'));
                        opt.push(replaceHover('background_slider_speed'));
                    }
                    if (items[i] !== 'video') {
                        opt.push('background_video_options');
                        opt.push('background_video');
                    }
                    var img = replaceHover('background_image');
                    if (items[i] !== 'image' || !items[img]) {
                        if (items[i] !== 'video') {
                            opt.push(img);
                        }
                        opt.push(replaceHover('background_repeat'));
                        opt.push(replaceHover('background_zoom'));
                        opt.push(replaceHover('background_position'));
                        opt.push(replaceHover('background_attachment'));
                    }
                    for (var j = opt.length - 1; j > -1; --j) {
                        delete items[opt[j]];
                    }
                }
                else if (i === 'background_attachment_inner' || i === 'b_a_i_h') {
                    suffix = i === 'b_a_i_h' ? 'h' : '';
                    var prefix = replaceHover('background_image_inner');
                    if (!items[prefix]) {
                        opt = [prefix, replaceHover('background_repeat_inner'), replaceHover('background_position_inner'), i];
                        for (var j = opt.length - 1; j > -1; --j) {
                            delete items[opt[j]];
                        }
                    }
                }
                else if (i === 'cover_color-type' || i === 'cover_color_hover-type') {
                    var is_hover = i === 'cover_color_hover-type';
                    if ((is_hover === true && items[i] === 'hover_color') || (is_hover === false && items[i] === 'color')) {
                        var prefix = 'cover_gradient';
                        if (is_hover === true) {
                            prefix += '_hover';
                        }
                        opt = [prefix + '-circle-radial', prefix + '-gradient', prefix + '-gradient-angle', prefix + '-gradient-type'];
                    }
                    else {
                        opt = is_hover === true ? ['cover_color_hover'] : ['cover_color'];
                    }
                    for (var j = opt.length - 1; j > -1; --j) {
                        delete items[opt[j]];
                    }
                }
                else if (type === 'radio' && i.indexOf('-frame_type') !== -1) {
                    var id = i.replace('-frame_type', ''),
                            found = false;
                    if (items[i] === id + '-presets') {
                        opt = [id + '-frame_custom'];
                        found = !items[id + '-frame_layout'] || items[id + '-frame_layout'] === 'none';
                    }
                    else {
                        opt = [id + '-frame_layout'];
                        opt.push(id + '-frame_color');
                        found = !items[id + '-frame_custom'];

                    }
                    if (found) {
                        opt.push(id + '-frame_color');
                        opt.push(id + '-frame_width');
                        opt.push(id + '-frame_width_unit');
                        opt.push(id + '-frame_height');
                        opt.push(id + '-frame_height_unit');
                        opt.push(id + '-frame_repeat');
                        opt.push(id + '-frame_location');
                    }
                    for (var j = opt.length - 1; j > -1; --j) {
                        delete items[opt[j]];
                    }
                }
                else if (i === 'background_image-type' || i === 'b_i_h-type') {
                    suffix = i === 'b_i_h-type' ? 'h' : '';
                    var prefix,
                            img = replaceHover('background_image');
                    if (items[i] === 'image') {
                        prefix = replaceHover('background_image');
                        opt = [prefix + '-circle-radial', prefix + '-gradient', prefix + '-gradient-angle', prefix + '-gradient-type'];
                    }
                    if (items[i] !== 'image' || !items[img]) {
                        opt = [img, replaceHover('background_repeat'), replaceHover('background_position')];
                        if (items[i] !== 'image') {
                            opt.push(replaceHover('background_color'));
                        }
                    }
                    for (var j = opt.length - 1; j > -1; --j) {
                        delete items[opt[j]];
                    }
                }
                else if (type === 'multiColumns' && i.indexOf('_count') !== -1) {
                    var id = i.replace('_count', '');
                    if (!items[id]) {
                        opt = [id, id + '_gap', id + '_divider_color', id + '_divider_width', id + '_divider_style'];
                        for (var j = opt.length - 1; j > -1; --j) {
                            delete items[opt[j]];
                        }
                    }
                }
                else if (items[i] && i.indexOf('_apply_all') !== -1 && i.indexOf('checkbox_') === 0) {
                    var id = i.replace('_apply_all', '').replace('checkbox_', '');
                    if (this.rules[id] !== undefined && this.rules[id].type === id) {
                        opt = ['right', 'bottom', 'left'];
                        for (var j = 0; j < 3; ++j) {
                            delete items[id + '_' + opt[j]];
                        }
                    }
                }
                else if (items[i] === 'all' && i.indexOf('-type') !== -1) {
                    var id = i.replace('-type', ''),
                            options = ['color', 'style', 'width'],
                            len2 = options.length;
                    opt = ['right', 'bottom', 'left'];
                    for (var j = opt.length - 1; j > -1; --j) {
                        for (var k = len2 - 1; k > -1; --k) {
                            delete items[id + '_' + opt[j] + '_' + options[k]];
                        }
                    }
                }
                else if ((i === 'element_font_weight' || i === 'e_f_w_h') && items[i] == 400) {
                    delete items[i];
                }
                else if (type === 'font_select' && (!items[i] || items[i] === 'default')) {
                    delete items[i];
                    delete items[i + '_w'];
                }
                else if (i.indexOf('breakpoint_') !== -1) {
                    items[i] = this.cleanUnusedStyles(items[i]);
                }
            }
            return items;
        }
    };
    if (typeof ThemifyBuilderStyle !== 'undefined') {
        var points = Object.keys(ThemifyBuilderStyle.points).reverse();
        points.push('desktop');
        ThemifyStyles.init(ThemifyBuilderStyle.styles, points);
        ThemifyBuilderStyle.styles = points = null;
        if (ThemifyBuilderStyle.google !== undefined) {
            var fonts = ThemifyBuilderStyle.google;
            ThemifyBuilderStyle.google = {};
            for (var i = fonts.length - 1; i > -1; --i) {
                if ('' !== fonts[i].value && 'default' !== fonts[i].value) {
                    ThemifyBuilderStyle.google[fonts[i].value] = {'n': fonts[i].name, 'v': fonts[i].variant};
                }
            }
            fonts = null;
        }
        document.addEventListener('DOMContentLoaded', function () {
            var items = document.getElementsByClassName('tb_generate_css');
            for (var k = items.length - 1; k > -1; --k) {
                var id = items[k].getAttribute('data-postid');
                if (!window['themify_builder_data_' + id]) {
                    items[k].style['visiblity'] = items[k].style['opacity'] = '';
                    items[k].classList.remove('tb_generate_css');
                    continue;
                }
                var css = ThemifyStyles.createCss(window['themify_builder_data_' + id], null, true),
                        cssFonts = [],
                        d = document.createDocumentFragment();
                window['themify_builder_data_' + id] = null;
                for (var i in css) {
                    if (i !== 'fonts') {
                        var st = document.createElement('style');
                        st.type = 'text/css';
                        st.id = 'tb_temp_styles_' + id;
                        if (i !== 'desktop') {
                            var w = ThemifyBuilderStyle.points[i];
                            if (i !== 'mobile') {
                                w = w[1];
                            }
                            st.media = 'screen and (max-width:' + w + 'px)';
                        }
                        var cssText = '';
                        for (var j  in css[i]) {
                            cssText += j + '{' + css[i][j].join(' ') + '}';
                        }
                        st.appendChild(document.createTextNode(cssText));
                        d.appendChild(st);
                    }
                    else {
                        for (var j in css['fonts']) {
                            var f = j.split(' ').join('+');
                            if (css['fonts'][j].length > 0) {
                                f += ':' + css['fonts'][j].join(',');
                            }
                            cssFonts.push(f);
                        }
                    }
                }
                if (cssFonts.length > 0) {
                    Themify.LoadCss('//fonts.googleapis.com/css?family=' + cssFonts.join('|') + '&subset=latin&ver=' + tbLocalScript.version, false);
                }
                cssFonts = null;
                document.head.appendChild(d);
                items[k].style['visiblity'] = items[k].style['opacity'] = '';
                items[k].classList.remove('tb_generate_css');
                var xhr = new XMLHttpRequest(),
                        data = {
                            css: JSON.stringify(css),
                            action: 'tb_save_css',
                            tb_load_nonce: ThemifyBuilderStyle.nonce,
                            id: id
                        },
                body = '';
                for (var i in data) {
                    if (body !== '') {
                        body += '&';
                    }
                    body += encodeURIComponent(i) + '=' + encodeURIComponent(data[i]);
                }
                data = null;
                xhr.open('POST', ThemifyBuilderStyle.ajaxurl);
                xhr.responseType = 'json';
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                xhr.send(body);
            }
        });
    }
})(window, document, undefined);
