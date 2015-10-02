/*
https://github.com/KidSysco/jquery-ui-month-picker/

Version 2.2

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation;
version 3.0. This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Lesser General Public License for more details.
You should have received a copy of the GNU Lesser General Public
License along with this library; if not, visit
http://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt.
*/
;
(function ($, window, document) {
    var _speeds = $.fx.speeds;
    var _eventsNs = '.MonthPicker';
    var _disabledClass = 'month-picker-disabled';
    var _defaultPos = { my: 'left top+1', at: 'left bottom' };
    var _setupErr = 'MonthPicker Setup Error: ';
    var _posErr = _setupErr + 'The jQuery UI position plug-in must be loaded in order to specify a position.';
    var _badOptValErr = _setupErr + 'Unsupported % option value, supported (case sensitive) values are: ';
    var _animVals = {
            Animation: ['slideToggle', 'fadeToggle'],
            ShowAnim: ['fadeIn', 'slideDown'],
            HideAnim: ['fadeOut', 'slideUp']
	    };
	var $noop = $.noop;
	var $datepicker = $.datepicker;
    
    $.MonthPicker = {
        i18n: {
            year: "Year",
            prevYear: "Previous Year",
            nextYear: "Next Year",
            next5Years: 'Jump Forward 5 Years',
            prev5Years: 'Jump Back 5 Years',
            nextLabel: "Next",
            prevLabel: "Prev",
            buttonText: "Open Month Chooser",
            jumpYears: "Jump Years",
            months: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
        }
    };
    
    var _markup =
        '<div class="ui-widget-header ui-helper-clearfix ui-corner-all">' +
            '<table class="month-picker-year-table" width="100%" border="0" cellspacing="1" cellpadding="2">' +
                '<tr>' +
                    '<td class="previous-year"><button>&nbsp;</button></td>' +
                    '<td class="year-container-all">' +
                        '<div class="year-title"></div>' +
                        '<div id="year-container"><span class="year" /></div>' +
                    '</td>' +
                    '<td class="next-year"><button>&nbsp;</button></td>' +
                '</tr>' +
            '</table>' +
        '</div>' +
        '<div class="ui-widget ui-widget-content ui-helper-clearfix ui-corner-all">' +
            '<table class="month-picker-month-table" width="100%" border="0" cellspacing="1" cellpadding="2">' +
                '<tr>' +
                    '<td><button class="button-1" /></td>' +
                    '<td><button class="button-2" /></td>' +
                    '<td><button class="button-3" /></td>' +
                '</tr>' +
                '<tr>' +
                    '<td><button class="button-4" /></td>' +
                    '<td><button class="button-5" /></td>' +
                    '<td><button class="button-6" /></td>' +
                '</tr>' +
                '<tr>' +
                    '<td><button class="button-7" /></td>' +
                    '<td><button class="button-8" /></td>' +
                    '<td><button class="button-9" /></td>' +
                '</tr>' +
                '<tr>' +
                    '<td><button class="button-10" /></td>' +
                    '<td><button class="button-11" /></td>' +
                    '<td><button class="button-12" /></td>' +
                '</tr>' +
            '</table>' +
        '</div>';

    $.widget("KidSysco.MonthPicker", {

        /******* Properties *******/

        options: {
            i18n: null,
            Position: null,
            StartYear: null,
            ShowIcon: true,
            UseInputMask: false,
            ValidationErrorMessage: null,
            Disabled: false,
            MonthFormat: 'mm/yy', 
            Animation: 'fadeToggle',
            ShowAnim: null,
            HideAnim: null,
            Duration: 'normal',
            OnAfterMenuOpen: $noop,
            OnAfterMenuClose: $noop,
            OnAfterNextYear: $noop,
            OnAfterNextYears: $noop,
            OnAfterPreviousYear: $noop,
            OnAfterPreviousYears: $noop,
            OnAfterChooseMonth: $noop,
            OnAfterChooseYear: $noop,
            OnAfterChooseYears: $noop,
            OnAfterChooseMonths: $noop
        },

        _monthPickerMenu: null,

        _monthPickerButton: null,

        _validationMessage: null,

        _yearContainer: null,
        
        _isMonthInputType: null,

        _enum: {
            _overrideStartYear: 'MonthPicker_OverrideStartYear'
        },

        /******* jQuery UI Widget Factory Overrides ********/

        _destroy: function () {
	        var _elem = this.element;
            if (jQuery.mask && this.options.UseInputMask) {
                _elem.unmask();
            }

            _elem.val('')
                .css('color', '')
                .removeClass('month-year-input')
                .removeData(this._enum._overrideStartYear)
                .unbind(_eventsNs);

            $(document).unbind('click' + _eventsNs + _elem.attr('id'), $.proxy(this._hide, this));

            if(this._monthPickerMenu) {
                this._monthPickerMenu.remove();
                this._monthPickerMenu = null;
            }

            if (this.monthPickerButton) {
                this._monthPickerButton.remove();
                this._monthPickerButton = null;
            }

            if (this._validationMessage) {
                this._validationMessage.remove();
                this._validationMessage = null;
            }
        },

        _setOption: function (key, value) {
            switch (key) {
                case 'i18n':
                    // Pass a clone i18n object to the this._super.
                    value = $.extend({}, value);
                    break;
                case 'Destroy':
                    this._destroy();
                    return;
	        }
	        
	        // Make sure the user passed in a valid Animation, ShowAnim and HideAnim options values.
	        if (key in _animVals && _animVals[key].indexOf(value) === -1) {
                alert(_badOptValErr.replace(/%/, key) + _animVals[key]);
                return;
            }
            
            // In jQuery UI 1.8, manually invoke the _setOption method from the base widget.
            //$.Widget.prototype._setOption.apply(this, arguments);
            // In jQuery UI 1.9 and above, you use the _super method instead.
            this._super(key, value);
            
            switch (key) {
	            case 'Position':
                    if (!$.ui.position) {
                        alert(_posErr);
                    }
                    break;
                case 'Disabled':
                    this._setDisabledState();
                    break;
                 case 'UseInputMask':
                    this._setUseInputMask();
                    break;
                case 'StartYear':
                    this._setStartYear();
                    if (value !== null) {
                        this._setPickerYear(value);
                    }
                    break;
                case 'ShowIcon':
                    this._showIcon();
                    break;
                case 'ValidationErrorMessage':
                    if (this.options.ValidationErrorMessage !== null) {
                        this._createValidationMessage();
                    } else {
                        this._removeValidationMessage();
                    }

                    break;
            }
        },

        _init: function () {
            if (!jQuery.ui || !jQuery.ui.button || !jQuery.ui.datepicker) {
                alert(_setupErr + 'The jQuery UI button and datepicker plug-ins must be loaded before MonthPicker is called.');
                return false;
            }

            var _el = this.element, _opts = this.options;
            // According to http://www.w3.org/TR/html-markup/input.html#input
            // An input element with no type attribute specified represents the same thing as an
            // input element with its type attribute set to "text".
            // TLDR:
            // http://www.w3.org/TR/html5/forms.html#the-input-element 
            // https://api.jquery.com/text-selector/
            if (!_el.is('input') || ['text', 'month', void 0].indexOf(_el.attr('type')) === -1) {
	            var error = _setupErr + 'MonthPicker can only be called on text or month inputs.';
	            // Call alert first so that IE<10 won't trip over console.log and swallow all errors.
                alert(error + ' \n\nSee console (developer tools) for more details.');
                
                console.error(error + '\n Caused by:');
                console.log(_el[0]);
                return false;
            }

            if (!jQuery.mask && _opts.UseInputMask) {
                alert(_setupErr + 'The UseInputMask option is set but the Digital Bush Input Mask jQuery Plugin is not loaded. Get the plugin from http://digitalbush.com/');
                return false;
            }
            
            if (_opts.Position !== null && !$.ui.position) {
                alert(_posErr);
                return false;
            }
            
            // Make sure the user passed in a valid Animation, ShowAnim and HideAnim options values.
            for (var opt in _animVals) {
                if (_opts[opt] !== null && _animVals[opt].indexOf(_opts[opt]) === -1) {
                    alert(_badOptValErr.replace(/%/, opt) + _animVals[opt]);
                    return false;
                }
            }
            
            this._isMonthInputType = _el.attr('type') === 'month';
            if (this._isMonthInputType) {
	            this.options.MonthFormat = 'yy-mm';
	            _el.css('width', 'auto');
            }

            _el.addClass('month-year-input');

            this._setStartYear();

            var _menu = this._monthPickerMenu = $('<div id="MonthPicker_' + _el.attr('id') + '" class="month-picker ui-helper-clearfix"></div>');

            $(_markup).appendTo(_menu);
            $('body').append(_menu);

            _menu.find('.year-title').text(this._i18n('year'));
            _menu.find('.year-container-all').attr('title', this._i18n('jumpYears'));

            this._showIcon();

            this._createValidationMessage();

            this._yearContainer = $('.year', this._monthPickerMenu);

            $('.previous-year button', this._monthPickerMenu)
                .button({
                icons: {
                    primary: 'ui-icon-circle-triangle-w'
                },
                text: false
            });
            
            $('.previous-year button span.ui-button-icon-primary').text(this._i18n('prevLabel'));
             
            $('.next-year button', this._monthPickerMenu)
                .button({
                icons: {
                    primary: 'ui-icon-circle-triangle-e'
                },
                text: false
            });
            
            $('.next-year button span.ui-button-icon-primary').text(this._i18n('nextLabel'));

            $('.month-picker-month-table td button', _menu).button();

            $('.year-container-all', _menu).click($.proxy(this._showYearsClickHandler, this));

            $(document).bind('click' + _eventsNs + this.element.attr('id'), $.proxy(this._hide, this));
            _menu.bind('click' + _eventsNs, function (event) {
                return false;
            });

            this._setUseInputMask();
            this._setDisabledState();
        },

        /****** Misc. Utility functions ******/

        _i18n: function(str) {
            return $.extend({}, $.MonthPicker.i18n, this.options.i18n)[str];
        },

        /****** Publicly Accessible API functions ******/
        
        GetSelectedDate: function () {
	        return this._parseMonth();
        },
        
        GetSelectedYear: function () {
            var date = this.GetSelectedDate();
            return date ? date.getFullYear() : NaN;
        },

        GetSelectedMonth: function () {
            var date = this.GetSelectedDate();
            return date ? date.getMonth()+1 : NaN;
        },
        
        Validate: function() {
	        var _date = this.GetSelectedDate();
        	
        	if (this.options.ValidationErrorMessage !== null && !this.options.Disabled) {
	        	this._validationMessage[ _date ? 'hide' : 'show' ]();
        	}
        	
        	return _date;
        },
        
        GetSelectedMonthYear: function () {
	        var date = this.Validate();
	        return date ? (date.getMonth() + 1) + '/' + date.getFullYear() : null;
        },

        Disable: function () {
            this._setOption("Disabled", true);
        },

        Enable: function () {
            this._setOption("Disabled", false);
        },

        Destroy: function() {
            this._destroy();
        },

        ClearAllCallbacks: function () {
            for (var _opt in this.options) {
                if (_opt.indexOf('On') === 0) {
                    this.options[_opt] = $noop;
                }
            }
        },

        Clear: function () {
            this.element.val('');

            if (this._validationMessage !== null) {
                this._validationMessage.hide();
            }
        },
        
        /**
         * Methods the user can override to use a third party library
         * such as http://momentjs.com for parsing and formatting months.
         */
        ParseMonth: function (str, format) {
            try {
                return $datepicker.parseDate('dd' + format, '01' + str);
            } catch (e) {
                return null;
            }
        },
        
        FormatMonth: function (date, format) {
            try {
                return $datepicker.formatDate(format, date) || null;
	        } catch (e) {
                return null;
            }
        },
        
        /****** Private functions ******/

        _parseMonth: function(str) {
            return this.ParseMonth(str || this.element.val(), this.options.MonthFormat);
        },
        
        _formatMonth: function(date) {
            return this.FormatMonth(date || this._parseMonth(), this.options.MonthFormat);
        },

        _showIcon: function () {
	        var _button = this._monthPickerButton, 
                _showIcon = this.options.ShowIcon, 
                _elem = this.element;
	        	
            if (_button === null) {
                if (_showIcon) {
                    _button = $('<span id="MonthPicker_Button_' + _elem.attr('id') + '" class="month-picker-open-button">' + this._i18n('buttonText') + '</span>').insertAfter(_elem);
                    _button.button({
                        text: false,
                        icons: {
                            primary: 'ui-icon-calculator'
                        }
                    }).click($.proxy(this._show, this));
                } else {
                    _elem.bind('click' + _eventsNs, $.proxy(this._show, this));
                }
            } else {
                if (!_showIcon) {
                    _button.remove();
                    _button = null;
                    _elem.bind('click' + _eventsNs, $.proxy(this._show, this));
                }
            }
            
            this._monthPickerButton = _button;
        },

        _createValidationMessage: function () {
	        var _errorMsg = this.options.ValidationErrorMessage, _elem = this.element;
            if (_errorMsg !== null && _errorMsg !== '') {
                this._validationMessage = $('<span id="MonthPicker_Validation_' + _elem.attr('id') + '" class="month-picker-invalid-message">' + _errorMsg + '</span>');

                this._validationMessage.insertAfter(this.options.ShowIcon ? _elem.next() : _elem);

                _elem.blur($.proxy(this.Validate, this));
            }
        },

        _removeValidationMessage: function () {
            if (this.options.ValidationErrorMessage === null) {
                this._validationMessage.remove();
                this._validationMessage = null;
            }
        },

        _show: function () {
            var _selectedYear = this.GetSelectedYear();
            var _elem = this.element;
            if (_elem.data(this._enum._overrideStartYear) !== void 0) {
                this._setPickerYear(this.options.StartYear);
            } else if (!isNaN(_selectedYear)) {
                this._setPickerYear(_selectedYear);
            } else {
                this._setPickerYear(new Date().getFullYear());
            }
            
            this._showMonths();
            
            var _menu = this._monthPickerMenu, _opts = this.options;
            if (_menu.css('display') === 'none') {
                this._addKeyEvents();
                
                _menu[_opts.ShowAnim || _opts.Animation]({
	               duration: this._duration(),
	               start: $.proxy(this._position, this, _menu),
	               complete: $.proxy(this.options.OnAfterMenuOpen, _elem)
	            });
            }
            
            return false;
        },
        
        _addKeyEvents: function () {
        	$(document).on('keydown' + _eventsNs, $.proxy(function(event) {
	            var keyCode = $.ui.keyCode;
	            switch (event.keyCode) {
		            case keyCode.ENTER:
		            	this._chooseMonth(new Date().getMonth() + 1);
		            	this._hide();
		            	break;
		            case keyCode.ESCAPE:
		            	this._hide();
		            	break;
	            }
            }, this));
        },
        
        _duration: function() {
            var _dur = this.options.Duration;

            if ($.isNumeric(_dur)) {
		        return _dur;
            }

            return _dur in _speeds ? _speeds[ _dur ] : _speeds._default;
        },
        
        _position: $.ui.position ?
            function($menu) {
                var _posOpts = $.extend(_defaultPos, this.options.Position);
                return $menu.position($.extend({of: this.element}, _posOpts));
            } :
            function($menu) {
                var _el = this.element;

                return $menu.css({
                    top: (_el.offset().top + _el.height() + 7) + 'px',
                    left: _el.offset().left + 'px'
                });
            },

        _hide: function () {
	        var _menu = this._monthPickerMenu, 
	            _opts = this.options,
	            _elem = this.element;
	            
            if (_menu.css('display') === 'block') {
	            $(document).off('keydown' + _eventsNs);
	            var _callback = $.proxy(_opts.OnAfterMenuClose, _elem);
                _menu[_opts.HideAnim || _opts.Animation](this._duration(), _callback);
            }
        },
		
        _setUseInputMask: function () {
            if (!this._isMonthInputType) {
                try {
                    if (this.options.UseInputMask) {   
                        this.element.mask( this._formatMonth(new Date).replace(/\d/g, 9) );
                    } else {
                        this.element.unmask();
                    }
                } catch (e) {}
            }
        },

        _setDisabledState: function () {
	        var _button = this._monthPickerButton, _elem = this.element;
            if (this.options.Disabled) {
                _elem.addClass(_disabledClass).prop('disabled', true);
                
                if (_button !== null) {
                    _button.button('option', 'disabled', true);
                }

                if (this._validationMessage !== null) {
                    this._validationMessage.hide();
                }

            } else {
                _elem.removeClass(_disabledClass).prop('disabled', false);
                
                if (_button !== null) {
                    _button.button('option', 'disabled', false);
                }
            }
        },

        _setStartYear: function () {
            if (this.options.StartYear !== null) {
                this.element.data(this._enum._overrideStartYear, true);
            } else {
                this.element.removeData(this._enum._overrideStartYear);
            }
        },

        _getPickerYear: function () {
            return parseInt(this._yearContainer.text(), 10);
        },

        _setPickerYear: function (year) {
            this._yearContainer.text(year);
        },

        _chooseMonth: function (month) {
            var date = new Date(this._getPickerYear(), month-1);
            this.element.val(this._formatMonth( date )).blur();
            
            this.options.OnAfterChooseMonth.call(this.element);
        },

        _chooseYear: function (year) {
            this._setPickerYear(year);
            this._showMonths();

            this.options.OnAfterChooseYear.call(this.element);
        },

        _showMonths: function () {
            var _months = this._i18n('months'), _menu = this._monthPickerMenu;
            
            $('.previous-year button', _menu)
                .attr('title', this._i18n('prevYear'))
                .unbind('click')
                .bind('click' + _eventsNs, $.proxy(this._previousYear, this));

            $('.next-year button', _menu)
                .attr('title', this._i18n('nextYear'))
                .unbind('click')
                .bind('click' + _eventsNs, $.proxy(this._nextYear, this));

            $('.year-container-all', _menu).css('cursor', 'pointer');
            $('.month-picker-month-table button', _menu).unbind(_eventsNs);

            for (var _month in _months) {
                var _counter = parseInt(_month, 10) + 1;
                $('.button-' + _counter, _menu)
                    .bind('click' + _eventsNs, {
                    _month: _counter
                }, $.proxy(function (event) {
                    this._chooseMonth(event.data._month);
                    this._hide();
                }, this));

                $('.button-' + _counter, _menu).button('option', 'label', _months[_month]);
            }
        },

        _showYearsClickHandler: function () {
            this._showYears();

            this.options.OnAfterChooseYears.call(this.element);
        },

        _showYears: function () {
            var _year = this._getPickerYear(), _menu = this._monthPickerMenu;
			
            $('.previous-year button', _menu)
                .attr('title', this._i18n('prev5Years'))
                .unbind('click')
                .bind('click', $.proxy(function () {
	                this._previousYears();
	                return false;
            	}, this));

            $('.next-year button', _menu)
                .attr('title', this._i18n('next5Years'))
                .unbind('click')
                .bind('click', $.proxy(function () {
	                this._nextYears();
	                return false;
				}, this));

            $('.year-container-all', _menu).css('cursor', 'default');
            $('.month-picker-month-table button', _menu).unbind(_eventsNs);

            var _yearDifferential = -4;
            for (var _counter = 1; _counter <= 12; _counter++) {
                $('.button-' + _counter, _menu)
                    .bind('click' + _eventsNs, {
                    _yearDiff: _yearDifferential
                }, $.proxy(function (event) {
                    this._chooseYear(_year + event.data._yearDiff);
                }, this));

                $('.button-' + _counter, _menu).button('option', 'label', _year + _yearDifferential);

                _yearDifferential++;
            }
        },

        _nextYear: function () {
            var _year = $('.month-picker-year-table .year', this._monthPickerMenu);
            _year.text(parseInt(_year.text()) + 1, 10);

            this.options.OnAfterNextYear.call(this.element);
        },

        _nextYears: function () {
            var _year = $('.month-picker-year-table .year', this._monthPickerMenu);
            _year.text(parseInt(_year.text()) + 5, 10);
            this._showYears();

            this.options.OnAfterNextYears.call(this.element);
        },

        _previousYears: function () {
            var _year = $('.month-picker-year-table .year', this._monthPickerMenu);
            _year.text(parseInt(_year.text()) - 5, 10);
            this._showYears();

            this.options.OnAfterPreviousYears.call(this.element);
        },

        _previousYear: function () {
            var _year = $('.month-picker-year-table .year', this._monthPickerMenu);
            _year.text(parseInt(_year.text()) - 1, 10);
            
            this.options.OnAfterPreviousYear.call(this.element);
        }
    });
    
    // Added in version 2.4.
    $.KidSysco.MonthPicker.VERSION = '2.4';
}(jQuery, window, document));
