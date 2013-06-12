(function($) {
    /**
     * --------------------------------------------------------------------
     * jQuery-Plugin "daterangepicker.jQuery.js"
     * by Scott Jehl, scott@filamentgroup.com
     * reference article: http://www.filamentgroup.com/lab/update_date_range_picker_with_jquery_ui/
     * demo page: http://www.filamentgroup.com/examples/daterangepicker/
     *
     * Copyright (c) 2010 Filament Group, Inc
     * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
     *
     * Dependencies: jquery, jquery UI datepicker, date.js, jQuery UI CSS Framework
     *
     *  12.15.2010 Made some fixes to resolve breaking changes introduced by jQuery UI 1.8.7
     *
     *  2012-02-15 Modified by jpatching for use in Icarus
     * --------------------------------------------------------------------
     */
    // "Global" variables, active within the scope of this plugin
    var options, datepickerOptions, rp;

    $.extend($.fn, {

        dateRangePicker: function(method, data) {

            var init = function (rangeInput, settings) {

                //defaults
                options = jQuery.extend({
                    rangeStartTitle: 'Start date',
                    rangeEndTitle: 'End date',
                    nextLinkText: 'Next',
                    prevLinkText: 'Prev',
                    doneButtonText: 'Done',
                    constrainDates: true,
                    rangeSplitter: '-', //string to use between dates in single input
                    dateFormat: 'm/d/yy', // date formatting. Available formats: http://docs.jquery.com/UI/Datepicker/%24.datepicker.formatDate
                    closeOnSelect: false, //if a complete selection is made, close the menu
                    appendTo: 'body',
                    onClose: function(dateStart, dateEnd) {},
                    onOpen: function() {},
                    onChange: function(dateStart, dateEnd) {},
                    defaultStartDate: Date.today(),
                    defaultEndDate: Date.today(),
                    minDate: Date.today().add({
                        years: -10
                    }),
                    maxDate: Date.today(),
                    tzOffset: 0, // The timezone offset. Eg. -0700 for MST
                    datepickerOptions: null //object containing native UI datepicker API options
                }, settings);

                //custom datepicker options, extended by options
                datepickerOptions = {
                    onSelect: function(dateText, inst) {
                        options.onUpdate();

                        //if closeOnSelect is true
                        if (options.closeOnSelect) {
                            if (!rp.find('li.ui-state-active').is('.ui-daterangepicker-dateRange') && !rp.is(':animated') ) {
                                hideRP();
                            }
                        }

                        options.onChange();
                    },
                    defaultDate: +0
                };
                // Convenience method to access onSelect
                options.onSelect = datepickerOptions.onSelect;

                // Update the input box with the current date/time
                // Does not fire any events. Use onSelect to update *and* fire the events
                options.onUpdate = function () {
                    $(this).trigger('constrainOtherPicker');

                    var datePickerA = new Date(rp.find('.range-start').datepicker('getDate'));
                    var timeA = getTime(rp.find('.time-start'))
                    datePickerA.set({
                        hour: timeA.hour,
                        minute: timeA.minute,
                        second: 0
                    })

                    var datePickerB = new Date(rp.find('.range-end').datepicker('getDate'));
                    var timeB = getTime(rp.find('.time-end'))
                    datePickerB.set({
                        hour: timeB.hour,
                        minute: timeB.minute,
                        second: 0
                    })

                    // Show the error message if dateA is before dateB
                    if (datePickerA.compareTo(datePickerB) > 0) {
                        errorMessage.show();
                        doneBtn.trigger('disable');
                        return;
                    } else {
                        errorMessage.hide();
                        doneBtn.trigger('enable');
                    }

                    var rangeA = fDate(datePickerA);
                    var rangeB = fDate(datePickerB);
                    if (rp.find('.ui-daterangepicker-specificDate').is('.ui-state-active')) {
                        rangeB = rangeA;
                    }

                    var dateStringA = rangeA.toString(options.dateFormat).replace(/AM/, 'am').replace(/PM/, 'pm').replace(' 0:', ' 12:');
                    var dateStringB = rangeB.toString(options.dateFormat).replace(/AM/, 'am').replace(/PM/, 'pm').replace(' 0:', ' 12:');

                    // send back to input
                    rangeInput.val(dateStringA+' '+ options.rangeSplitter +' '+dateStringB);

                    // Set the start/end date so they can be returned in callback functions
                    options.startDate = datePickerA;
                    options.endDate = datePickerB;
                }

                //change event fires both when a calendar is updated or a change event on the input is triggered
                rangeInput.bind('change', options.onChange);

                // Format the input and wrap it in a ui div
                rangeInput.addClass('ui-rangepicker-input ui-widget-content');
                rangeInput.wrap('<div class="ui-daterangepicker-arrows ui-widget ui-widget-header ui-helper-clearfix ui-corner-all"></div>');

                // Make the input read only
                rangeInput.attr('readonly', true);

                //datepicker options from options
                options.datepickerOptions = (settings) ? jQuery.extend(datepickerOptions, settings.datepickerOptions) : datepickerOptions;

                // Select the default date ranges
                var inputDateA = options.defaultStartDate;
                var inputDateB = options.defaultEndDate;

                // Capture Dates from input(s)
                var inputDateAtemp, inputDateBtemp;
                if (rangeInput.size() == 2) {
                    inputDateAtemp = Date.parse( rangeInput.eq(0).val() );
                    inputDateBtemp = Date.parse( rangeInput.eq(1).val() );
                    if (inputDateAtemp == null) {
                        inputDateAtemp = inputDateBtemp;
                    }

                    if (inputDateBtemp == null) {
                        inputDateBtemp = inputDateAtemp;
                    }
                } else {
                    inputDateAtemp = Date.parse( rangeInput.val().split(options.rangeSplitter)[0] );
                    inputDateBtemp = Date.parse( rangeInput.val().split(options.rangeSplitter)[1] );
                    if (inputDateBtemp == null) {
                        inputDateBtemp = inputDateAtemp;
                    } //if one date, set both
                }

                if (inputDateAtemp != null) {
                    inputDateA = inputDateAtemp;
                }

                if (inputDateBtemp != null) {
                    inputDateB = inputDateBtemp;
                }

                //build picker and
                rp = $('<div class="ui-daterangepicker ui-widget ui-helper-clearfix ui-widget-content ui-corner-all"></div>');

                //function to format a date string
                function fDate(date) {
                    if (date == null || !date.getDate()) {
                        return '';
                    }

                    var day = date.getDate();
                    var month = date.getMonth();
                    var year = date.getFullYear();
                    month++; // adjust javascript month

                    return date;
                }

                jQuery.fn.restoreDateFromData = function() {
                    if ($(this).data('saveDate')) {
                        $(this).datepicker('setDate', $(this).data('saveDate')).removeData('saveDate');
                    }

                    return this;
                }

                jQuery.fn.saveDateToData = function() {
                    if (!$(this).data('saveDate')) {
                        $(this).data('saveDate', $(this).datepicker('getDate') );
                    }

                    return this;
                }

                //show, hide, or toggle rangepicker
                function showRP() {
                    if (rp.data('state') == 'closed') {
                        positionRP();
                        rp.fadeIn(300).data('state', 'open');
                        options.onOpen();

                        //Specific Date range (show both calendars)
                        doneBtn.hide();
                        rpPickers.show();
                        rp.find('.title-start').text(options.rangeStartTitle);
                        rp.find('.title-end').text(options.rangeEndTitle);
                        rp.find('.range-start').restoreDateFromData().datepicker('refresh').css('opacity',1).show(400);
                        rp.find('.range-end').restoreDateFromData().datepicker('refresh').css('opacity',1).show(400);
                        setTimeout(function() {
                            doneBtn.fadeIn();
                        }, 400);

                        // If chosen is available, chosen-ify the select boxes
                        if ($().chosen !== undefined) {
                            $().chosen.bind();
                        }

                        return false;
                    }
                }

                function hideRP(noTrigger) {
                    if (rp.data('state') == 'open') {
                        rp.fadeOut(300).data('state', 'closed');

                        if (_.isUndefined(noTrigger)) {
                            options.onClose();
                        }
                    }
                }

                function toggleRP() {
                    if ( rp.data('state') == 'open' ) {
                        hideRP();
                    } else {
                        showRP();
                    }
                }

                function positionRP() {
                    var riOffset = rangeInput.offset(),
                    left = riOffset.left - 5,
                    top = riOffset.top + rangeInput.outerHeight() + 2;

                    rp.parent().css({
                        left: left,
                        top: top
                    });
                }

                //picker divs
                var rpPickers = $(
                    '<div class="ranges ui-widget-header ui-corner-all ui-helper-clearfix">' +
                        '<div class="range-start">' +
                            '<span class="title-start">Start Date</span>' +
                        '</div>' +
                        '<div class="range-end">' +
                            '<span class="title-end">End Date</span>' +
                        '</div>' +
                    '</div>')
                    .appendTo(rp);

                rpPickers.find('.range-start, .range-end').datepicker(options.datepickerOptions);
                rpPickers.find('.range-start').datepicker('setDate', inputDateA);
                rpPickers.find('.range-end').datepicker('setDate', inputDateB);

                rpPickers.find('.range-start, .range-end')
                    .bind('constrainOtherPicker', function() {
                        if (options.constrainDates) {
                            //constrain dates
                            if ($(this).is('.range-start')) {
                                rp.find('.range-end').datepicker( "option", "minDate", $(this).datepicker('getDate'));
                            } else {
                                rp.find('.range-start').datepicker( "option", "maxDate", $(this).datepicker('getDate'));
                            }
                        }
                    })
                    .trigger('constrainOtherPicker');

                // Add in the time pickers
                var timeOptions = '';
                for (var h=0; h < 24; h++) {
                    for (var i=0; i < 2; i++) {
                        var hour = '';
                        if (h == 0) {
                            hour = 12;
                        } else if (h > 12) {
                            hour = h - 12;
                        } else {
                            hour = h;
                        }

                        var minutes = '';
                        if (i % 2) {
                            minutes = ':30';
                        } else {
                            minutes = ':00';
                        }

                        var meridian = '';
                        if (h < 12) {
                            meridian = ' am';
                        } else {
                            meridian = ' pm';
                        }

                        var label = hour + minutes + meridian;
                        var value = h + minutes;

                        timeOptions +=  '<option value="' + value + '">' + label + '</option>';
                    }
                }

                // Add the time pickers
                var timePickers = [
                    {
                        parent: '.range-start',
                        className: 'time-start',
                        title: 'Start Time',
                        selectName: 'timeStart'
                    },
                    {
                        parent: '.range-end',
                        className: 'time-end',
                        title: 'End Time',
                        selectName: 'timeEnd'
                    }
                ];

                for (var i in timePickers) {
                    var timePicker = timePickers[i];
                    rpPickers.find(timePicker.parent).append(
                        '<div class="ui-timepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ' + timePicker.className + '">' +
                            '<span class="title">' +
                                timePicker.title +
                            '</span>' +
                            '<select name="' + timePicker.selectName + '" class="input-dropdown">' +
                                timeOptions +
                            '</select>' +
                        '</div>');
                }

                setTime(rpPickers.find('.time-start'), options.defaultStartDate);
                setTime(rpPickers.find('.time-end'), options.defaultEndDate);

                // Bind the onchange event
                rpPickers.find('.time-start, .time-end').on('change', datepickerOptions.onSelect);

                // Set the min/max dates
                rp.find('.range-start').datepicker( "option", "minDate",  options.minDate);
                rp.find('.range-start').datepicker( "option", "maxDate", options.maxDate);
                rp.find('.range-end').datepicker( "option", "minDate",  options.minDate);
                rp.find('.range-end').datepicker( "option", "maxDate", options.maxDate);

                // Add the error message
                var errorMessage = $(
                    '<div style="clear: both"></div>' +
                    '<div class="error ui-state-error ui-corner-all ui-helper-clearfix" style="display: none">' +
                        '<p>' +
                            '<span class="ui-icon ui-icon-alert"></span>' +
                            '<strong>Error:</strong>Start date cannot be before end date' +
                        '</p>' +
                    '</div>')
                    .appendTo(rpPickers);

                var doneBtn =
                $('<div class="input-block-level"><button class="btn btn-small btn-success pull-right"><i class="icon-ok"></i>'+ options.doneButtonText +'</button></div>')
                    .click(function() {
                        rp.find('.ui-datepicker-current-day').trigger('click');
                        hideRP();
                    })
                    .hover(
                        function() {
                            $(this).addClass('ui-state-hover');
                        },
                        function() {
                            $(this).removeClass('ui-state-hover');
                        })
                    .bind('disable', function () {
                        $(this).attr('disabled', true);
                        $(this).addClass('disabled');
                    })
                    .bind('enable', function () {
                        $(this).removeAttr('disabled');
                        $(this).removeClass('disabled');
                    })
                    .appendTo(rpPickers);

                //inputs toggle rangepicker visibility
                rangeInput.click(function() {
                    toggleRP();
                    return false;
                });

                //hide em all
                rpPickers.hide().find('.range-start, .range-end, .btnDone').hide();

                rp.data('state', 'closed');

                //Fixed for jQuery UI 1.8.7 - Calendars are hidden otherwise!
                rpPickers.find('.ui-datepicker').css("display","block");

                //inject rp
                $(options.appendTo).append(rp);

                //wrap and position
                rp.wrap('<div class="ui-daterangepickercontain"></div>');

                $(document).click(function() {
                    if (rp.is(':visible')) {
                        hideRP(true);
                    }
                });

                rp.click(function() {
                    return false;
                }).hide();

                // Update the input box with the default values
                options.onUpdate();
            };

            /**
             * Set the time
             *
             * @param DOM picker The picker parent element
             * @param Date date The date
             */
            var setTime = function (picker, date) {
                // Round the minutes to increments of 30
                var minutes = date.getMinutes();
                if (minutes > 30) {
                    date.set({
                        minute: 30
                    });
                } else if (minutes > 0 && minutes < 30) {
                    date.set({
                        minute: 0
                    });
                }

                var timeValue = date.toString('H:mm');
                $(picker).find('select').val(timeValue);
            };

            /**
             * Get the time
             *
             * @param DOM picker The picker parent element
             *
             * @return object
             */
            var getTime = function (picker) {
                var time = $(picker).find('select').val();
                var hour = parseInt(time.replace(/:.+$/, ''), 10);
                var minute = parseInt(time.replace(/^.+:/, ''), 10);

                return {
                    hour: hour,
                    minute: minute
                };
            };

            switch( method ) {
                case 'getStartDate':
                    return options.startDate;

                case 'setStartDate':
                    $(rp).find('.range-start').datepicker('setDate', data);
                    setTime($(rp).find('.time-start'), data);

                    // Force the input to update
                    options.onSelect();
                    break;

                case 'getEndDate':
                    return options.endDate;

                case 'setEndDate':
                    $(rp).find('.range-end').datepicker('setDate', data);
                    setTime($(rp).find('.time-end'), data);

                    // Force the input to update
                    options.onSelect();
                    break;

                default:
                    init(this, method);
                    break;
            }

            return $(this);
        }

    });

})(jQuery);
