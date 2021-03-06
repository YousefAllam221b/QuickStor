// ----------------------------------------------------------------------------
// You can set the following variables before loading this script:

/*global netdataNoDygraphs           *//* boolean,  disable dygraph charts
 *                                                  (default: false) */
/*global netdataNoSparklines         *//* boolean,  disable sparkline charts
 *                                                  (default: false) */
/*global netdataNoPeitys             *//* boolean,  disable peity charts
 *                                                  (default: false) */
/*global netdataNoGoogleCharts       *//* boolean,  disable google charts
 *                                                  (default: false) */
/*global netdataNoMorris             *//* boolean,  disable morris charts
 *                                                  (default: false) */
/*global netdataNoEasyPieChart       *//* boolean,  disable easypiechart charts
 *                                                  (default: false) */
/*global netdataNoGauge              *//* boolean,  disable gauge.js charts
 *                                                  (default: false) */
/*global netdataNoD3                 *//* boolean,  disable d3 charts
 *                                                  (default: false) */
/*global netdataNoC3                 *//* boolean,  disable c3 charts
 *                                                  (default: false) */
/*global netdataNoBootstrap          *//* boolean,  disable bootstrap - disables help too
 *                                                  (default: false) */
/*global netdataDontStart            *//* boolean,  do not start the thread to process the charts
 *                                                  (default: false) */
/*global netdataErrorCallback        *//* function, callback to be called when the dashboard encounters an error
 *                                                  (default: null) */
/*global netdataRegistry:true        *//* boolean,  use the netdata registry
 *                                                  (default: false) */
/*global netdataNoRegistry           *//* boolean,  included only for compatibility with existing custom dashboard
 *                                                  (obsolete - do not use this any more) */
/*global netdataRegistryCallback     *//* function, callback that will be invoked with one param: the URLs from the registry
 *                                                  (default: null) */
/*global netdataShowHelp:true        *//* boolean,  disable charts help
 *                                                  (default: true) */
/*global netdataShowAlarms:true      *//* boolean,  enable alarms checks and notifications
 *                                                  (default: false) */
/*global netdataRegistryAfterMs:true *//* ms,       delay registry use at started
 *                                                  (default: 1500) */
/*global netdataCallback             *//* function, callback to be called when netdata is ready to start
 *                                                  (default: null)
 *                                                  netdata will be running while this is called
 *                                                  (call NETDATA.pause to stop it) */
/*global netdataPrepCallback         *//* function, callback to be called before netdata does anything else
 *                                                  (default: null) */
/*global netdataServer               *//* string,   the URL of the netdata server to use
 *                                                  (default: the URL the page is hosted at) */

// ----------------------------------------------------------------------------
// global namespace

var NETDATA = window.NETDATA || {};

(function(window, document) {
    // ------------------------------------------------------------------------
    // compatibility fixes

    // fix IE issue with console
    if(!window.console) { window.console = { log: function(){} }; }

    // if string.endsWith is not defined, define it
    if(typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(s) {
            if(s.length > this.length) return false;
            return this.slice(-s.length) === s;
        };
    }

    // if string.startsWith is not defined, define it
    if(typeof String.prototype.startsWith !== 'function') {
        String.prototype.startsWith = function(s) {
            if(s.length > this.length) return false;
            return this.slice(s.length) === s;
        };
    }

    NETDATA.name2id = function(s) {
        return s
            .replace(/ /g, '_')
            .replace(/\(/g, '_')
            .replace(/\)/g, '_')
            .replace(/\./g, '_')
            .replace(/\//g, '_');
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Detect the netdata server

    // http://stackoverflow.com/questions/984510/what-is-my-script-src-url
    // http://stackoverflow.com/questions/6941533/get-protocol-domain-and-port-from-url
    NETDATA._scriptSource = function() {
        var script = null;

        if(typeof document.currentScript !== 'undefined') {
            script = document.currentScript;
        }
        else {
            var all_scripts = document.getElementsByTagName('script');
            script = all_scripts[all_scripts.length - 1];
        }

        if (typeof script.getAttribute.length !== 'undefined')
            script = script.src;
        else
            script = script.getAttribute('src', -1);

        return script;
    };

    if(typeof netdataServer !== 'undefined')
        NETDATA.serverDefault = netdataServer;
    else {
        var s = NETDATA._scriptSource();
        if(s) NETDATA.serverDefault = s.replace(/\/dashboard.js(\?.*)*$/g, "");
        else {
            console.log('WARNING: Cannot detect the URL of the netdata server.');
            NETDATA.serverDefault = null;
        }
    }

    if(NETDATA.serverDefault === null)
        NETDATA.serverDefault = '';
    else if(NETDATA.serverDefault.slice(-1) !== '/')
        NETDATA.serverDefault += '/';

    // default URLs for all the external files we need
    // make them RELATIVE so that the whole thing can also be
    // installed under a web server
    NETDATA.jQuery              = NETDATA.serverDefault + 'lib/jquery-2.2.4.min.js';
    NETDATA.peity_js            = NETDATA.serverDefault + 'lib/jquery.peity-3.2.0.min.js';
    NETDATA.sparkline_js        = NETDATA.serverDefault + 'lib/jquery.sparkline-2.1.2.min.js';
    NETDATA.easypiechart_js     = NETDATA.serverDefault + 'lib/jquery.easypiechart-97b5824.min.js';
    NETDATA.gauge_js            = NETDATA.serverDefault + 'lib/gauge-1.3.2.min.js';
    NETDATA.dygraph_js          = NETDATA.serverDefault + 'lib/dygraph-combined-dd74404.js';
    NETDATA.dygraph_smooth_js   = NETDATA.serverDefault + 'lib/dygraph-smooth-plotter-dd74404.js';
    NETDATA.raphael_js          = NETDATA.serverDefault + 'lib/raphael-2.2.4-min.js';
    NETDATA.c3_js               = NETDATA.serverDefault + 'lib/c3-0.4.11.min.js';
    NETDATA.c3_css              = NETDATA.serverDefault + 'css/c3-0.4.11.min.css';
    NETDATA.d3_js               = NETDATA.serverDefault + 'lib/d3-3.5.17.min.js';
    NETDATA.morris_js           = NETDATA.serverDefault + 'lib/morris-0.5.1.min.js';
    NETDATA.morris_css          = NETDATA.serverDefault + 'css/morris-0.5.1.css';
    NETDATA.google_js           = 'https://www.google.com/jsapi';

    NETDATA.themes = {
        white: {
            bootstrap_css: NETDATA.serverDefault + 'css/bootstrap-3.3.7.css',
            dashboard_css: NETDATA.serverDefault + 'dashboard.css?v20161229-2',
            background: '#FFFFFF',
            foreground: '#000000',
            grid: '#F0F0F0',
            axis: '#F0F0F0',
            colors: [   '#3366CC', '#DC3912',   '#109618', '#FF9900',   '#990099', '#DD4477',
                        '#3B3EAC', '#66AA00',   '#0099C6', '#B82E2E',   '#AAAA11', '#5574A6',
                        '#994499', '#22AA99',   '#6633CC', '#E67300',   '#316395', '#8B0707',
                        '#329262', '#3B3EAC' ],
            easypiechart_track: '#f0f0f0',
            easypiechart_scale: '#dfe0e0',
            gauge_pointer: '#C0C0C0',
            gauge_stroke: '#F0F0F0',
            gauge_gradient: false
        },
        slate: {
            bootstrap_css: NETDATA.serverDefault + 'css/bootstrap-slate-flat-3.3.7.css?v20161229-1',
            dashboard_css: NETDATA.serverDefault + 'dashboard.slate.css?v20161229-2',
            background: '#272b30',
            foreground: '#C8C8C8',
            grid: '#283236',
            axis: '#283236',
/*          colors: [   '#55bb33', '#ff2222',   '#0099C6', '#faa11b',   '#adbce0', '#DDDD00',
                        '#4178ba', '#f58122',   '#a5cc39', '#f58667',   '#f5ef89', '#cf93c0',
                        '#a5d18a', '#b8539d',   '#3954a3', '#c8a9cf',   '#c7de8a', '#fad20a',
                        '#a6a479', '#a66da8' ],
*/
            colors: [   '#66AA00', '#FE3912',   '#3366CC', '#D66300',   '#0099C6', '#DDDD00',
                        '#5054e6', '#EE9911',   '#BB44CC', '#e45757',   '#ef0aef', '#CC7700',
                        '#22AA99', '#109618',   '#905bfd', '#f54882',   '#4381bf', '#ff3737',
                        '#329262', '#3B3EFF' ],
            easypiechart_track: '#373b40',
            easypiechart_scale: '#373b40',
            gauge_pointer: '#474b50',
            gauge_stroke: '#373b40',
            gauge_gradient: false
        }
    };

    if(typeof netdataTheme !== 'undefined' && typeof NETDATA.themes[netdataTheme] !== 'undefined')
        NETDATA.themes.current = NETDATA.themes[netdataTheme];
    else
        NETDATA.themes.current = NETDATA.themes.white;

    NETDATA.colors = NETDATA.themes.current.colors;

    // these are the colors Google Charts are using
    // we have them here to attempt emulate their look and feel on the other chart libraries
    // http://there4.io/2012/05/02/google-chart-color-list/
    //NETDATA.colors        = [ '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6',
    //                      '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11',
    //                      '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC' ];

    // an alternative set
    // http://www.mulinblog.com/a-color-palette-optimized-for-data-visualization/
    //                         (blue)     (red)      (orange)   (green)    (pink)     (brown)    (purple)   (yellow)   (gray)
    //NETDATA.colors        = [ '#5DA5DA', '#F15854', '#FAA43A', '#60BD68', '#F17CB0', '#B2912F', '#B276B2', '#DECF3F', '#4D4D4D' ];

    if(typeof netdataShowHelp === 'undefined')
        netdataShowHelp = true;

    if(typeof netdataShowAlarms === 'undefined')
        netdataShowAlarms = false;

    if(typeof netdataRegistryAfterMs !== 'number' || netdataRegistryAfterMs < 0)
        netdataRegistryAfterMs = 1500;

    if(typeof netdataRegistry === 'undefined') {
        // backward compatibility
        netdataRegistry = (typeof netdataNoRegistry !== 'undefined' && netdataNoRegistry === false);
    }
    if(netdataRegistry === false && typeof netdataRegistryCallback === 'function')
        netdataRegistry = true;


    // ----------------------------------------------------------------------------------------------------------------
    // detect if this is probably a slow device

    var isSlowDeviceResult = undefined;
    var isSlowDevice = function() {
        if(isSlowDeviceResult !== undefined)
            return isSlowDeviceResult;

        try {
            var ua = navigator.userAgent.toLowerCase();

            var iOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;
            var android = /android/.test(ua) && !window.MSStream;
            isSlowDeviceResult = (iOS === true || android === true);
        }
        catch (e) {
            isSlowDeviceResult = false;
        }

        return isSlowDeviceResult;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // the defaults for all charts

    // if the user does not specify any of these, the following will be used

    NETDATA.chartDefaults = {
        host: NETDATA.serverDefault,    // the server to get data from
        width: '100%',                  // the chart width - can be null
        height: '100%',                 // the chart height - can be null
        min_width: null,                // the chart minimum width - can be null
        library: 'dygraph',             // the graphing library to use
        method: 'average',              // the grouping method
        before: 0,                      // panning
        after: -600,                    // panning
        pixels_per_point: 1,            // the detail of the chart
        fill_luminance: 0.8             // luminance of colors in solid areas
    };

    // ----------------------------------------------------------------------------------------------------------------
    // global options

    NETDATA.options = {
        pauseCallback: null,            // a callback when we are really paused

        pause: false,                   // when enabled we don't auto-refresh the charts

        targets: null,                  // an array of all the state objects that are
                                        // currently active (independently of their
                                        // viewport visibility)

        updated_dom: true,              // when true, the DOM has been updated with
                                        // new elements we have to check.

        auto_refresher_fast_weight: 0,  // this is the current time in ms, spent
                                        // rendering charts continuously.
                                        // used with .current.fast_render_timeframe

        page_is_visible: true,          // when true, this page is visible

        auto_refresher_stop_until: 0,   // timestamp in ms - used internally, to stop the
                                        // auto-refresher for some time (when a chart is
                                        // performing pan or zoom, we need to stop refreshing
                                        // all other charts, to have the maximum speed for
                                        // rendering the chart that is panned or zoomed).
                                        // Used with .current.global_pan_sync_time

        last_resized: Date.now(),       // the timestamp of the last resize request

        last_page_scroll: 0,            // the timestamp the last time the page was scrolled

        // the current profile
        // we may have many...
        current: {
            pixels_per_point: isSlowDevice()?5:1, // the minimum pixels per point for all charts
                                        // increase this to speed javascript up
                                        // each chart library has its own limit too
                                        // the max of this and the chart library is used
                                        // the final is calculated every time, so a change
                                        // here will have immediate effect on the next chart
                                        // update

            idle_between_charts: 100,   // ms - how much time to wait between chart updates

            fast_render_timeframe: 200, // ms - render continuously until this time of continuous
                                        // rendering has been reached
                                        // this setting is used to make it render e.g. 10
                                        // charts at once, sleep idle_between_charts time
                                        // and continue for another 10 charts.

            idle_between_loops: 500,    // ms - if all charts have been updated, wait this
                                        // time before starting again.

            idle_parallel_loops: 100,   // ms - the time between parallel refresher updates

            idle_lost_focus: 500,       // ms - when the window does not have focus, check
                                        // if focus has been regained, every this time

            global_pan_sync_time: 1000, // ms - when you pan or zoom a chart, the background
                                        // auto-refreshing of charts is paused for this amount
                                        // of time

            sync_selection_delay: 1500, // ms - when you pan or zoom a chart, wait this amount
                                        // of time before setting up synchronized selections
                                        // on hover.

            sync_selection: true,       // enable or disable selection sync

            pan_and_zoom_delay: 50,     // when panning or zooming, how ofter to update the chart

            sync_pan_and_zoom: true,    // enable or disable pan and zoom sync

            pan_and_zoom_data_padding: true, // fetch more data for the master chart when panning or zooming

            update_only_visible: true,  // enable or disable visibility management

            parallel_refresher: (isSlowDevice() === false), // enable parallel refresh of charts

            concurrent_refreshes: true, // when parallel_refresher is enabled, sync also the charts

            destroy_on_hide: (isSlowDevice() === true), // destroy charts when they are not visible

            show_help: netdataShowHelp, // when enabled the charts will show some help
            show_help_delay_show_ms: 500,
            show_help_delay_hide_ms: 0,

            eliminate_zero_dimensions: true, // do not show dimensions with just zeros

            stop_updates_when_focus_is_lost: true, // boolean - shall we stop auto-refreshes when document does not have user focus
            stop_updates_while_resizing: 1000,  // ms - time to stop auto-refreshes while resizing the charts

            double_click_speed: 500,    // ms - time between clicks / taps to detect double click/tap

            smooth_plot: (isSlowDevice() === false), // enable smooth plot, where possible

            charts_selection_animation_delay: 50, // delay to animate charts when syncing selection

            color_fill_opacity_line: 1.0,
            color_fill_opacity_area: 0.2,
            color_fill_opacity_stacked: 0.8,

            pan_and_zoom_factor: 0.25,      // the increment when panning and zooming with the toolbox
            pan_and_zoom_factor_multiplier_control: 2.0,
            pan_and_zoom_factor_multiplier_shift: 3.0,
            pan_and_zoom_factor_multiplier_alt: 4.0,

            abort_ajax_on_scroll: false,            // kill pending ajax page scroll
            async_on_scroll: false,                 // sync/async onscroll handler
            onscroll_worker_duration_threshold: 30, // time in ms, to consider slow the onscroll handler

            retries_on_data_failures: 3, // how many retries to make if we can't fetch chart data from the server

            setOptionCallback: function() { }
        },

        debug: {
            show_boxes:         false,
            main_loop:          false,
            focus:              false,
            visibility:         false,
            chart_data_url:     false,
            chart_errors:       false, // FIXME: remember to set it to false before merging
            chart_timing:       false,
            chart_calls:        false,
            libraries:          false,
            dygraph:            false
        }
    };

    NETDATA.statistics = {
        refreshes_total: 0,
        refreshes_active: 0,
        refreshes_active_max: 0
    };


    // ----------------------------------------------------------------------------------------------------------------
    // local storage options

    NETDATA.localStorage = {
        default: {},
        current: {},
        callback: {} // only used for resetting back to defaults
    };

    NETDATA.localStorageTested = -1;
    NETDATA.localStorageTest = function() {
        if(NETDATA.localStorageTested !== -1)
            return NETDATA.localStorageTested;

        if(typeof Storage !== "undefined" && typeof localStorage === 'object') {
            var test = 'test';
            try {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                NETDATA.localStorageTested = true;
            }
            catch (e) {
                NETDATA.localStorageTested = false;
            }
        }
        else
            NETDATA.localStorageTested = false;

        return NETDATA.localStorageTested;
    };

    NETDATA.localStorageGet = function(key, def, callback) {
        var ret = def;

        if(typeof NETDATA.localStorage.default[key.toString()] === 'undefined') {
            NETDATA.localStorage.default[key.toString()] = def;
            NETDATA.localStorage.callback[key.toString()] = callback;
        }

        if(NETDATA.localStorageTest() === true) {
            try {
                // console.log('localStorage: loading "' + key.toString() + '"');
                ret = localStorage.getItem(key.toString());
                // console.log('netdata loaded: ' + key.toString() + ' = ' + ret.toString());
                if(ret === null || ret === 'undefined') {
                    // console.log('localStorage: cannot load it, saving "' + key.toString() + '" with value "' + JSON.stringify(def) + '"');
                    localStorage.setItem(key.toString(), JSON.stringify(def));
                    ret = def;
                }
                else {
                    // console.log('localStorage: got "' + key.toString() + '" with value "' + ret + '"');
                    ret = JSON.parse(ret);
                    // console.log('localStorage: loaded "' + key.toString() + '" as value ' + ret + ' of type ' + typeof(ret));
                }
            }
            catch(error) {
                console.log('localStorage: failed to read "' + key.toString() + '", using default: "' + def.toString() + '"');
                ret = def;
            }
        }

        if(typeof ret === 'undefined' || ret === 'undefined') {
            console.log('localStorage: LOADED UNDEFINED "' + key.toString() + '" as value ' + ret + ' of type ' + typeof(ret));
            ret = def;
        }

        NETDATA.localStorage.current[key.toString()] = ret;
        return ret;
    };

    NETDATA.localStorageSet = function(key, value, callback) {
        if(typeof value === 'undefined' || value === 'undefined') {
            console.log('localStorage: ATTEMPT TO SET UNDEFINED "' + key.toString() + '" as value ' + value + ' of type ' + typeof(value));
        }

        if(typeof NETDATA.localStorage.default[key.toString()] === 'undefined') {
            NETDATA.localStorage.default[key.toString()] = value;
            NETDATA.localStorage.current[key.toString()] = value;
            NETDATA.localStorage.callback[key.toString()] = callback;
        }

        if(NETDATA.localStorageTest() === true) {
            // console.log('localStorage: saving "' + key.toString() + '" with value "' + JSON.stringify(value) + '"');
            try {
                localStorage.setItem(key.toString(), JSON.stringify(value));
            }
            catch(e) {
                console.log('localStorage: failed to save "' + key.toString() + '" with value: "' + value.toString() + '"');
            }
        }

        NETDATA.localStorage.current[key.toString()] = value;
        return value;
    };

    NETDATA.localStorageGetRecursive = function(obj, prefix, callback) {
        var keys = Object.keys(obj);
        var len = keys.length;
        while(len--) {
            var i = keys[len];

            if(typeof obj[i] === 'object') {
                //console.log('object ' + prefix + '.' + i.toString());
                NETDATA.localStorageGetRecursive(obj[i], prefix + '.' + i.toString(), callback);
                continue;
            }

            obj[i] = NETDATA.localStorageGet(prefix + '.' + i.toString(), obj[i], callback);
        }
    };

    NETDATA.setOption = function(key, value) {
        if(key.toString() === 'setOptionCallback') {
            if(typeof NETDATA.options.current.setOptionCallback === 'function') {
                NETDATA.options.current[key.toString()] = value;
                NETDATA.options.current.setOptionCallback();
            }
        }
        else if(NETDATA.options.current[key.toString()] !== value) {
            var name = 'options.' + key.toString();

            if(typeof NETDATA.localStorage.default[name.toString()] === 'undefined')
                console.log('localStorage: setOption() on unsaved option: "' + name.toString() + '", value: ' + value);

            //console.log(NETDATA.localStorage);
            //console.log('setOption: setting "' + key.toString() + '" to "' + value + '" of type ' + typeof(value) + ' original type ' + typeof(NETDATA.options.current[key.toString()]));
            //console.log(NETDATA.options);
            NETDATA.options.current[key.toString()] = NETDATA.localStorageSet(name.toString(), value, null);

            if(typeof NETDATA.options.current.setOptionCallback === 'function')
                NETDATA.options.current.setOptionCallback();
        }

        return true;
    };

    NETDATA.getOption = function(key) {
        return NETDATA.options.current[key.toString()];
    };

    // read settings from local storage
    NETDATA.localStorageGetRecursive(NETDATA.options.current, 'options', null);

    // always start with this option enabled.
    NETDATA.setOption('stop_updates_when_focus_is_lost', true);

    NETDATA.resetOptions = function() {
        var keys = Object.keys(NETDATA.localStorage.default);
        var len = keys.length;
        while(len--) {
            var i = keys[len];
            var a = i.split('.');

            if(a[0] === 'options') {
                if(a[1] === 'setOptionCallback') continue;
                if(typeof NETDATA.localStorage.default[i] === 'undefined') continue;
                if(NETDATA.options.current[i] === NETDATA.localStorage.default[i]) continue;

                NETDATA.setOption(a[1], NETDATA.localStorage.default[i]);
            }
            else if(a[0] === 'chart_heights') {
                if(typeof NETDATA.localStorage.callback[i] === 'function' && typeof NETDATA.localStorage.default[i] !== 'undefined') {
                    NETDATA.localStorage.callback[i](NETDATA.localStorage.default[i]);
                }
            }
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    if(NETDATA.options.debug.main_loop === true)
        console.log('welcome to NETDATA');

    NETDATA.onresizeCallback = null;
    NETDATA.onresize = function() {
        NETDATA.options.last_resized = Date.now();
        NETDATA.onscroll();

        if(typeof NETDATA.onresizeCallback === 'function')
            NETDATA.onresizeCallback();
    };

    NETDATA.onscroll_updater_count = 0;
    NETDATA.onscroll_updater_running = false;
    NETDATA.onscroll_updater_last_run = 0;
    NETDATA.onscroll_updater_watchdog = null;
    NETDATA.onscroll_updater_max_duration = 0;
    NETDATA.onscroll_updater_above_threshold_count = 0;
    NETDATA.onscroll_updater = function() {
        NETDATA.onscroll_updater_running = true;
        NETDATA.onscroll_updater_count++;
        var start = Date.now();

        var targets = NETDATA.options.targets;
        var len = targets.length;

        // when the user scrolls he sees that we have
        // hidden all the not-visible charts
        // using this little function we try to switch
        // the charts back to visible quickly


        if(NETDATA.options.abort_ajax_on_scroll === true) {
            // we have to cancel pending requests too

            while (len--) {
                if (targets[len]._updating === true) {
                    if (typeof targets[len].xhr !== 'undefined') {
                        targets[len].xhr.abort();
                        targets[len].running = false;
                        targets[len]._updating = false;
                    }
                    targets[len].isVisible();
                }
            }
        }
        else {
            // just find which chart is visible

            while (len--)
                targets[len].isVisible();
        }

        var end = Date.now();
        // console.log('scroll No ' + NETDATA.onscroll_updater_count + ' calculation took ' + (end - start).toString() + ' ms');

        if(NETDATA.options.current.async_on_scroll === false) {
            var dt = end - start;
            if(dt > NETDATA.onscroll_updater_max_duration) {
                // console.log('max onscroll event handler duration increased to ' + dt);
                NETDATA.onscroll_updater_max_duration = dt;
            }

            if(dt > NETDATA.options.current.onscroll_worker_duration_threshold) {
                // console.log('slow: ' + dt);
                NETDATA.onscroll_updater_above_threshold_count++;

                if(NETDATA.onscroll_updater_above_threshold_count > 2 && NETDATA.onscroll_updater_above_threshold_count * 100 / NETDATA.onscroll_updater_count > 2) {
                    NETDATA.setOption('async_on_scroll', true);
                    console.log('NETDATA: your browser is slow - enabling asynchronous onscroll event handler.');
                }
            }
        }

        NETDATA.onscroll_updater_last_run = start;
        NETDATA.onscroll_updater_running = false;
    };

    NETDATA.onscroll = function() {
        // console.log('onscroll');

        NETDATA.options.last_page_scroll = Date.now();
        NETDATA.options.auto_refresher_stop_until = 0;

        if(NETDATA.options.targets === null) return;

        if(NETDATA.options.current.async_on_scroll === true) {
            // async
            if(NETDATA.onscroll_updater_running === false) {
                NETDATA.onscroll_updater_running = true;
                setTimeout(NETDATA.onscroll_updater, 0);
            }
            else {
                if(NETDATA.onscroll_updater_watchdog !== null)
                    clearTimeout(NETDATA.onscroll_updater_watchdog);

                NETDATA.onscroll_updater_watchdog = setTimeout(function() {
                    if(NETDATA.onscroll_updater_running === false && NETDATA.options.last_page_scroll > NETDATA.onscroll_updater_last_run) {
                        // console.log('watchdog');
                        NETDATA.onscroll_updater();
                    }

                    NETDATA.onscroll_updater_watchdog = null;
                }, 200);
            }
        }
        else {
            // sync
            NETDATA.onscroll_updater();
        }
    };

    window.onresize = NETDATA.onresize;
    window.onscroll = NETDATA.onscroll;

    // ----------------------------------------------------------------------------------------------------------------
    // Error Handling

    NETDATA.errorCodes = {
        100: { message: "Cannot load chart library", alert: true },
        101: { message: "Cannot load jQuery", alert: true },
        402: { message: "Chart library not found", alert: false },
        403: { message: "Chart library not enabled/is failed", alert: false },
        404: { message: "Chart not found", alert: false },
        405: { message: "Cannot download charts index from server", alert: true },
        406: { message: "Invalid charts index downloaded from server", alert: true },
        407: { message: "Cannot HELLO netdata server", alert: false },
        408: { message: "Netdata servers sent invalid response to HELLO", alert: false },
        409: { message: "Cannot ACCESS netdata registry", alert: false },
        410: { message: "Netdata registry ACCESS failed", alert: false },
        411: { message: "Netdata registry server send invalid response to DELETE ", alert: false },
        412: { message: "Netdata registry DELETE failed", alert: false },
        413: { message: "Netdata registry server send invalid response to SWITCH ", alert: false },
        414: { message: "Netdata registry SWITCH failed", alert: false },
        415: { message: "Netdata alarms download failed", alert: false },
        416: { message: "Netdata alarms log download failed", alert: false },
        417: { message: "Netdata registry server send invalid response to SEARCH ", alert: false },
        418: { message: "Netdata registry SEARCH failed", alert: false }
    };
    NETDATA.errorLast = {
        code: 0,
        message: "",
        datetime: 0
    };

    NETDATA.error = function(code, msg) {
        NETDATA.errorLast.code = code;
        NETDATA.errorLast.message = msg;
        NETDATA.errorLast.datetime = Date.now();

        console.log("ERROR " + code + ": " + NETDATA.errorCodes[code].message + ": " + msg);

        var ret = true;
        if(typeof netdataErrorCallback === 'function') {
           ret = netdataErrorCallback('system', code, msg);
        }

        if(ret && NETDATA.errorCodes[code].alert)
            alert("ERROR " + code + ": " + NETDATA.errorCodes[code].message + ": " + msg);
    };

    NETDATA.errorReset = function() {
        NETDATA.errorLast.code = 0;
        NETDATA.errorLast.message = "You are doing fine!";
        NETDATA.errorLast.datetime = 0;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // commonMin & commonMax

    NETDATA.commonMin = {
        keys: {},
        latest: {},

        get: function(state) {
            if(typeof state.__commonMin === 'undefined') {
                // get the commonMin setting
                var self = $(state.element);
                state.__commonMin = self.data('common-min') || null;
            }

            var min = state.data.min;
            var name = state.__commonMin;

            if(name === null) {
                // we don't need commonMin
                //state.log('no need for commonMin');
                return min;
            }

            var t = this.keys[name];
            if(typeof t === 'undefined') {
                // add our commonMin
                this.keys[name] = {};
                t = this.keys[name];
            }

            var uuid = state.uuid;
            if(typeof t[uuid] !== 'undefined') {
                if(t[uuid] === min) {
                    //state.log('commonMin ' + state.__commonMin + ' not changed: ' + this.latest[name]);
                    return this.latest[name];
                }
                else if(min < this.latest[name]) {
                    //state.log('commonMin ' + state.__commonMin + ' increased: ' + min);
                    t[uuid] = min;
                    this.latest[name] = min;
                    return min;
                }
            }

            // add our min
            t[uuid] = min;

            // find the common min
            var m = min;
            for(var i in t)
                if(t.hasOwnProperty(i) && t[i] < m) m = t[i];

            //state.log('commonMin ' + state.__commonMin + ' updated: ' + m);
            this.latest[name] = m;
            return m;
        }
    };

    NETDATA.commonMax = {
        keys: {},
        latest: {},

        get: function(state) {
            if(typeof state.__commonMax === 'undefined') {
                // get the commonMax setting
                var self = $(state.element);
                state.__commonMax = self.data('common-max') || null;
            }

            var max = state.data.max;
            var name = state.__commonMax;

            if(name === null) {
                // we don't need commonMax
                //state.log('no need for commonMax');
                return max;
            }

            var t = this.keys[name];
            if(typeof t === 'undefined') {
                // add our commonMax
                this.keys[name] = {};
                t = this.keys[name];
            }

            var uuid = state.uuid;
            if(typeof t[uuid] !== 'undefined') {
                if(t[uuid] === max) {
                    //state.log('commonMax ' + state.__commonMax + ' not changed: ' + this.latest[name]);
                    return this.latest[name];
                }
                else if(max > this.latest[name]) {
                    //state.log('commonMax ' + state.__commonMax + ' increased: ' + max);
                    t[uuid] = max;
                    this.latest[name] = max;
                    return max;
                }
            }

            // add our max
            t[uuid] = max;

            // find the common max
            var m = max;
            for(var i in t)
                if(t.hasOwnProperty(i) && t[i] > m) m = t[i];

            //state.log('commonMax ' + state.__commonMax + ' updated: ' + m);
            this.latest[name] = m;
            return m;
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Chart Registry

    // When multiple charts need the same chart, we avoid downloading it
    // multiple times (and having it in browser memory multiple time)
    // by using this registry.

    // Every time we download a chart definition, we save it here with .add()
    // Then we try to get it back with .get(). If that fails, we download it.

    NETDATA.fixHost = function(host) {
        while(host.slice(-1) === '/')
            host = host.substring(0, host.length - 1);

        return host;
    };

    NETDATA.chartRegistry = {
        charts: {},

        fixid: function(id) {
            return id.replace(/:/g, "_").replace(/\//g, "_");
        },

        add: function(host, id, data) {
            host = this.fixid(host);
            id   = this.fixid(id);

            if(typeof this.charts[host] === 'undefined')
                this.charts[host] = {};

            //console.log('added ' + host + '/' + id);
            this.charts[host][id] = data;
        },

        get: function(host, id) {
            host = this.fixid(host);
            id   = this.fixid(id);

            if(typeof this.charts[host] === 'undefined')
                return null;

            if(typeof this.charts[host][id] === 'undefined')
                return null;

            //console.log('cached ' + host + '/' + id);
            return this.charts[host][id];
        },

        downloadAll: function(host, callback) {
            host = NETDATA.fixHost(host);

            var self = this;

            $.ajax({
                url: host + '/api/v1/charts',
                async: true,
                cache: false,
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function(data) {
                if(data !== null) {
                    var h = NETDATA.chartRegistry.fixid(host);
                    self.charts[h] = data.charts;
                }
                else NETDATA.error(406, host + '/api/v1/charts');

                if(typeof callback === 'function')
                    return callback(data);
            })
            .fail(function() {
                NETDATA.error(405, host + '/api/v1/charts');

                if(typeof callback === 'function')
                    return callback(null);
            });
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Global Pan and Zoom on charts

    // Using this structure are synchronize all the charts, so that
    // when you pan or zoom one, all others are automatically refreshed
    // to the same timespan.

    NETDATA.globalPanAndZoom = {
        seq: 0,                 // timestamp ms
                                // every time a chart is panned or zoomed
                                // we set the timestamp here
                                // then we use it as a sequence number
                                // to find if other charts are synchronized
                                // to this time-range

        master: null,           // the master chart (state), to which all others
                                // are synchronized

        force_before_ms: null,  // the timespan to sync all other charts
        force_after_ms: null,

        callback: null,

        // set a new master
        setMaster: function(state, after, before) {
            if(NETDATA.options.current.sync_pan_and_zoom === false)
                return;

            if(this.master !== null && this.master !== state)
                this.master.resetChart(true, true);

            var now = Date.now();
            this.master = state;
            this.seq = now;
            this.force_after_ms = after;
            this.force_before_ms = before;
            NETDATA.options.auto_refresher_stop_until = now + NETDATA.options.current.global_pan_sync_time;

            if(typeof this.callback === 'function')
                this.callback(true, after, before);
        },

        // clear the master
        clearMaster: function() {
            if(this.master !== null) {
                var st = this.master;
                this.master = null;
                st.resetChart();
            }

            this.master = null;
            this.seq = 0;
            this.force_after_ms = null;
            this.force_before_ms = null;
            NETDATA.options.auto_refresher_stop_until = 0;

            if(typeof this.callback === 'function')
                this.callback(false, 0, 0);
        },

        // is the given state the master of the global
        // pan and zoom sync?
        isMaster: function(state) {
            return (this.master === state);
        },

        // are we currently have a global pan and zoom sync?
        isActive: function() {
            return (this.master !== null && this.force_before_ms !== null && this.force_after_ms !== null && this.seq !== 0);
        },

        // check if a chart, other than the master
        // needs to be refreshed, due to the global pan and zoom
        shouldBeAutoRefreshed: function(state) {
            if(this.master === null || this.seq === 0)
                return false;

            //if(state.needsRecreation())
            //  return true;

            return (state.tm.pan_and_zoom_seq !== this.seq);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // dimensions selection

    // FIXME
    // move color assignment to dimensions, here

    var dimensionStatus = function(parent, label, name_div, value_div, color) {
        this.enabled = false;
        this.parent = parent;
        this.label = label;
        this.name_div = null;
        this.value_div = null;
        this.color = NETDATA.themes.current.foreground;
        this.selected = (parent.unselected_count === 0);

        this.setOptions(name_div, value_div, color);
    };

    dimensionStatus.prototype.invalidate = function() {
        this.name_div = null;
        this.value_div = null;
        this.enabled = false;
    };

    dimensionStatus.prototype.setOptions = function(name_div, value_div, color) {
        this.color = color;

        if(this.name_div !== name_div) {
            this.name_div = name_div;
            this.name_div.title = this.label;
            this.name_div.style.color = this.color;
            if(this.selected === false)
                this.name_div.className = 'netdata-legend-name not-selected';
            else
                this.name_div.className = 'netdata-legend-name selected';
        }

        if(this.value_div !== value_div) {
            this.value_div = value_div;
            this.value_div.title = this.label;
            this.value_div.style.color = this.color;
            if(this.selected === false)
                this.value_div.className = 'netdata-legend-value not-selected';
            else
                this.value_div.className = 'netdata-legend-value selected';
        }

        this.enabled = true;
        this.setHandler();
    };

    dimensionStatus.prototype.setHandler = function() {
        if(this.enabled === false) return;

        var ds = this;

        // this.name_div.onmousedown = this.value_div.onmousedown = function(e) {
        this.name_div.onclick = this.value_div.onclick = function(e) {
            e.preventDefault();
            if(ds.isSelected()) {
                // this is selected
                if(e.shiftKey === true || e.ctrlKey === true) {
                    // control or shift key is pressed -> unselect this (except is none will remain selected, in which case select all)
                    ds.unselect();

                    if(ds.parent.countSelected() === 0)
                        ds.parent.selectAll();
                }
                else {
                    // no key is pressed -> select only this (except if it is the only selected already, in which case select all)
                    if(ds.parent.countSelected() === 1) {
                        ds.parent.selectAll();
                    }
                    else {
                        ds.parent.selectNone();
                        ds.select();
                    }
                }
            }
            else {
                // this is not selected
                if(e.shiftKey === true || e.ctrlKey === true) {
                    // control or shift key is pressed -> select this too
                    ds.select();
                }
                else {
                    // no key is pressed -> select only this
                    ds.parent.selectNone();
                    ds.select();
                }
            }

            ds.parent.state.redrawChart();
        }
    };

    dimensionStatus.prototype.select = function() {
        if(this.enabled === false) return;

        this.name_div.className = 'netdata-legend-name selected';
        this.value_div.className = 'netdata-legend-value selected';
        this.selected = true;
    };

    dimensionStatus.prototype.unselect = function() {
        if(this.enabled === false) return;

        this.name_div.className = 'netdata-legend-name not-selected';
        this.value_div.className = 'netdata-legend-value hidden';
        this.selected = false;
    };

    dimensionStatus.prototype.isSelected = function() {
        return(this.enabled === true && this.selected === true);
    };

    // ----------------------------------------------------------------------------------------------------------------

    var dimensionsVisibility = function(state) {
        this.state = state;
        this.len = 0;
        this.dimensions = {};
        this.selected_count = 0;
        this.unselected_count = 0;
    };

    dimensionsVisibility.prototype.dimensionAdd = function(label, name_div, value_div, color) {
        if(typeof this.dimensions[label] === 'undefined') {
            this.len++;
            this.dimensions[label] = new dimensionStatus(this, label, name_div, value_div, color);
        }
        else
            this.dimensions[label].setOptions(name_div, value_div, color);

        return this.dimensions[label];
    };

    dimensionsVisibility.prototype.dimensionGet = function(label) {
        return this.dimensions[label];
    };

    dimensionsVisibility.prototype.invalidateAll = function() {
        var keys = Object.keys(this.dimensions);
        var len = keys.length;
        while(len--)
            this.dimensions[keys[len]].invalidate();
    };

    dimensionsVisibility.prototype.selectAll = function() {
        var keys = Object.keys(this.dimensions);
        var len = keys.length;
        while(len--)
            this.dimensions[keys[len]].select();
    };

    dimensionsVisibility.prototype.countSelected = function() {
        var selected = 0;
        var keys = Object.keys(this.dimensions);
        var len = keys.length;
        while(len--)
            if(this.dimensions[keys[len]].isSelected()) selected++;

        return selected;
    };

    dimensionsVisibility.prototype.selectNone = function() {
        var keys = Object.keys(this.dimensions);
        var len = keys.length;
        while(len--)
            this.dimensions[keys[len]].unselect();
    };

    dimensionsVisibility.prototype.selected2BooleanArray = function(array) {
        var ret = [];
        this.selected_count = 0;
        this.unselected_count = 0;

        var len = array.length;
        while(len--) {
            var ds = this.dimensions[array[len]];
            if(typeof ds === 'undefined') {
                // console.log(array[i] + ' is not found');
                ret.unshift(false);
            }
            else if(ds.isSelected()) {
                ret.unshift(true);
                this.selected_count++;
            }
            else {
                ret.unshift(false);
                this.unselected_count++;
            }
        }

        if(this.selected_count === 0 && this.unselected_count !== 0) {
            this.selectAll();
            return this.selected2BooleanArray(array);
        }

        return ret;
    };


    // ----------------------------------------------------------------------------------------------------------------
    // global selection sync

    NETDATA.globalSelectionSync = {
        state: null,
        dont_sync_before: 0,
        last_t: 0,
        slaves: [],

        stop: function() {
            if(this.state !== null)
                this.state.globalSelectionSyncStop();
        },

        delay: function() {
            if(this.state !== null) {
                this.state.globalSelectionSyncDelay();
            }
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Our state object, where all per-chart values are stored

    var chartState = function(element) {
        var self = $(element);
        this.element = element;

        // IMPORTANT:
        // all private functions should use 'that', instead of 'this'
        var that = this;

        /* error() - private
         * show an error instead of the chart
         */
        var error = function(msg) {
            var ret = true;

            if(typeof netdataErrorCallback === 'function') {
                ret = netdataErrorCallback('chart', that.id, msg);
            }

            if(ret) {
                that.element.innerHTML = that.id + ': ' + msg;
                that.enabled = false;
                that.current = that.pan;
            }
        };

        // GUID - a unique identifier for the chart
        this.uuid = NETDATA.guid();

        // string - the name of chart
        this.id = self.data('netdata');

        // string - the key for localStorage settings
        this.settings_id = self.data('id') || null;

        // the user given dimensions of the element
        this.width = self.data('width') || NETDATA.chartDefaults.width;
        this.height = self.data('height') || NETDATA.chartDefaults.height;
        this.height_original = this.height;

        if(this.settings_id !== null) {
            this.height = NETDATA.localStorageGet('chart_heights.' + this.settings_id, this.height, function(height) {
                // this is the callback that will be called
                // if and when the user resets all localStorage variables
                // to their defaults

                resizeChartToHeight(height);
            });
        }

        // string - the netdata server URL, without any path
        this.host = self.data('host') || NETDATA.chartDefaults.host;

        // make sure the host does not end with /
        // all netdata API requests use absolute paths
        while(this.host.slice(-1) === '/')
            this.host = this.host.substring(0, this.host.length - 1);

        // string - the grouping method requested by the user
        this.method = self.data('method') || NETDATA.chartDefaults.method;

        // the time-range requested by the user
        this.after = self.data('after') || NETDATA.chartDefaults.after;
        this.before = self.data('before') || NETDATA.chartDefaults.before;

        // the pixels per point requested by the user
        this.pixels_per_point = self.data('pixels-per-point') || 1;
        this.points = self.data('points') || null;

        // the dimensions requested by the user
        this.dimensions = self.data('dimensions') || null;

        // the chart library requested by the user
        this.library_name = self.data('chart-library') || NETDATA.chartDefaults.library;

        // how many retries we have made to load chart data from the server
        this.retries_on_data_failures = 0;

        // object - the chart library used
        this.library = null;

        // color management
        this.colors = null;
        this.colors_assigned = {};
        this.colors_available = null;

        // the element already created by the user
        this.element_message = null;

        // the element with the chart
        this.element_chart = null;

        // the element with the legend of the chart (if created by us)
        this.element_legend = null;
        this.element_legend_childs = {
            hidden: null,
            title_date: null,
            title_time: null,
            title_units: null,
            perfect_scroller: null, // the container to apply perfect scroller to
            series: null
        };

        this.chart_url = null;                      // string - the url to download chart info
        this.chart = null;                          // object - the chart as downloaded from the server

        this.title = self.data('title') || null;    // the title of the chart
        this.units = self.data('units') || null;    // the units of the chart dimensions
        this.append_options = self.data('append-options') || null;  // additional options to pass to netdata
        this.override_options = self.data('override-options') || null;  // override options to pass to netdata

        this.running = false;                       // boolean - true when the chart is being refreshed now
        this.enabled = true;                        // boolean - is the chart enabled for refresh?
        this.paused = false;                        // boolean - is the chart paused for any reason?
        this.selected = false;                      // boolean - is the chart shown a selection?
        this.debug = false;                         // boolean - console.log() debug info about this chart

        this.netdata_first = 0;                     // milliseconds - the first timestamp in netdata
        this.netdata_last = 0;                      // milliseconds - the last timestamp in netdata
        this.requested_after = null;                // milliseconds - the timestamp of the request after param
        this.requested_before = null;               // milliseconds - the timestamp of the request before param
        this.requested_padding = null;
        this.view_after = 0;
        this.view_before = 0;

        this.value_decimal_detail = -1;
        var d = self.data('decimal-digits');
        if(typeof d === 'number') {
            this.value_decimal_detail = d;
        }

        this.auto = {
            name: 'auto',
            autorefresh: true,
            force_update_at: 0, // the timestamp to force the update at
            force_before_ms: null,
            force_after_ms: null
        };
        this.pan = {
            name: 'pan',
            autorefresh: false,
            force_update_at: 0, // the timestamp to force the update at
            force_before_ms: null,
            force_after_ms: null
        };
        this.zoom = {
            name: 'zoom',
            autorefresh: false,
            force_update_at: 0, // the timestamp to force the update at
            force_before_ms: null,
            force_after_ms: null
        };

        // this is a pointer to one of the sub-classes below
        // auto, pan, zoom
        this.current = this.auto;

        // check the requested library is available
        // we don't initialize it here - it will be initialized when
        // this chart will be first used
        if(typeof NETDATA.chartLibraries[that.library_name] === 'undefined') {
            NETDATA.error(402, that.library_name);
            error('chart library "' + that.library_name + '" is not found');
            return;
        }
        else if(NETDATA.chartLibraries[that.library_name].enabled === false) {
            NETDATA.error(403, that.library_name);
            error('chart library "' + that.library_name + '" is not enabled');
            return;
        }
        else
            that.library = NETDATA.chartLibraries[that.library_name];

        // milliseconds - the time the last refresh took
        this.refresh_dt_ms = 0;

        // if we need to report the rendering speed
        // find the element that needs to be updated
        var refresh_dt_element_name = self.data('dt-element-name') || null; // string - the element to print refresh_dt_ms

        if(refresh_dt_element_name !== null) {
            this.refresh_dt_element = document.getElementById(refresh_dt_element_name) || null;
        }
        else
            this.refresh_dt_element = null;

        this.dimensions_visibility = new dimensionsVisibility(this);

        this._updating = false;

        // ============================================================================================================
        // PRIVATE FUNCTIONS

        var createDOM = function() {
            if(that.enabled === false) return;

            if(that.element_message !== null) that.element_message.innerHTML = '';
            if(that.element_legend !== null) that.element_legend.innerHTML = '';
            if(that.element_chart !== null) that.element_chart.innerHTML = '';

            that.element.innerHTML = '';

            that.element_message = document.createElement('div');
            that.element_message.className = 'netdata-message icon hidden';
            that.element.appendChild(that.element_message);

            that.element_chart = document.createElement('div');
            that.element_chart.id = that.library_name + '-' + that.uuid + '-chart';
            that.element.appendChild(that.element_chart);

            if(that.hasLegend() === true) {
                that.element.className = "netdata-container-with-legend";
                that.element_chart.className = 'netdata-chart-with-legend-right netdata-' + that.library_name + '-chart-with-legend-right';

                that.element_legend = document.createElement('div');
                that.element_legend.className = 'netdata-chart-legend netdata-' + that.library_name + '-legend';
                that.element.appendChild(that.element_legend);
            }
            else {
                that.element.className = "netdata-container";
                that.element_chart.className = ' netdata-chart netdata-' + that.library_name + '-chart';

                that.element_legend = null;
            }
            that.element_legend_childs.series = null;

            if(typeof(that.width) === 'string')
                $(that.element).css('width', that.width);
            else if(typeof(that.width) === 'number')
                $(that.element).css('width', that.width + 'px');

            if(typeof(that.library.aspect_ratio) === 'undefined') {
                if(typeof(that.height) === 'string')
                    that.element.style.height = that.height;
                else if(typeof(that.height) === 'number')
                    that.element.style.height = that.height.toString() + 'px';
            }
            else {
                var w = that.element.offsetWidth;
                if(w === null || w === 0) {
                    // the div is hidden
                    // this will resize the chart when next viewed
                    that.tm.last_resized = 0;
                }
                else
                    that.element.style.height = (w * that.library.aspect_ratio / 100).toString() + 'px';
            }

            if(NETDATA.chartDefaults.min_width !== null)
                $(that.element).css('min-width', NETDATA.chartDefaults.min_width);

            that.tm.last_dom_created = Date.now();

            showLoading();
        };

        /* init() private
         * initialize state variables
         * destroy all (possibly) created state elements
         * create the basic DOM for a chart
         */
        var init = function() {
            if(that.enabled === false) return;

            that.paused = false;
            that.selected = false;

            that.chart_created = false;         // boolean - is the library.create() been called?
            that.updates_counter = 0;           // numeric - the number of refreshes made so far
            that.updates_since_last_unhide = 0; // numeric - the number of refreshes made since the last time the chart was unhidden
            that.updates_since_last_creation = 0; // numeric - the number of refreshes made since the last time the chart was created

            that.tm = {
                last_initialized: 0,        // milliseconds - the timestamp it was last initialized
                last_dom_created: 0,        // milliseconds - the timestamp its DOM was last created
                last_mode_switch: 0,        // milliseconds - the timestamp it switched modes

                last_info_downloaded: 0,    // milliseconds - the timestamp we downloaded the chart
                last_updated: 0,            // the timestamp the chart last updated with data
                pan_and_zoom_seq: 0,        // the sequence number of the global synchronization
                                            // between chart.
                                            // Used with NETDATA.globalPanAndZoom.seq
                last_visible_check: 0,      // the time we last checked if it is visible
                last_resized: 0,            // the time the chart was resized
                last_hidden: 0,             // the time the chart was hidden
                last_unhidden: 0,           // the time the chart was unhidden
                last_autorefreshed: 0       // the time the chart was last refreshed
            };

            that.data = null;               // the last data as downloaded from the netdata server
            that.data_url = 'invalid://';   // string - the last url used to update the chart
            that.data_points = 0;           // number - the number of points returned from netdata
            that.data_after = 0;            // milliseconds - the first timestamp of the data
            that.data_before = 0;           // milliseconds - the last timestamp of the data
            that.data_update_every = 0;     // milliseconds - the frequency to update the data

            that.tm.last_initialized = Date.now();
            createDOM();

            that.setMode('auto');
        };

        var maxMessageFontSize = function() {
            var screenHeight = screen.height;
            var el = that.element;

            // normally we want a font size, as tall as the element
            var h = el.clientHeight;

            // but give it some air, 20% let's say, or 5 pixels min
            var lost = Math.max(h * 0.2, 5);
            h -= lost;

            // center the text, vertically
            var paddingTop = (lost - 5) / 2;

            // but check the width too
            // it should fit 10 characters in it
            var w = el.clientWidth / 10;
            if(h > w) {
                paddingTop += (h - w) / 2;
                h = w;
            }

            // and don't make it too huge
            // 5% of the screen size is good
            if(h > screenHeight / 20) {
                paddingTop += (h - (screenHeight / 20)) / 2;
                h = screenHeight / 20;
            }

            // set it
            that.element_message.style.fontSize = h.toString() + 'px';
            that.element_message.style.paddingTop = paddingTop.toString() + 'px';
        };

        var showMessageIcon = function(icon) {
            that.element_message.innerHTML = icon;
            maxMessageFontSize();
            $(that.element_message).removeClass('hidden');
            that.___messageHidden___ = undefined;
        };

        var hideMessage = function() {
            if(typeof that.___messageHidden___ === 'undefined') {
                that.___messageHidden___ = true;
                $(that.element_message).addClass('hidden');
            }
        };

        var showRendering = function() {
            var icon;
            if(that.chart !== null) {
                if(that.chart.chart_type === 'line')
                    icon = '<i class="fa fa-line-chart"></i>';
                else
                    icon = '<i class="fa fa-area-chart"></i>';
            }
            else
                icon = '<i class="fa fa-area-chart"></i>';

            showMessageIcon(icon + ' netdata');
        };

        var showLoading = function() {
            if(that.chart_created === false) {
                showMessageIcon('<i class="fa fa-refresh"></i> netdata');
                return true;
            }
            return false;
        };

        var isHidden = function() {
            return (typeof that.___chartIsHidden___ !== 'undefined');
        };

        // hide the chart, when it is not visible - called from isVisible()
        var hideChart = function() {
            // hide it, if it is not already hidden
            if(isHidden() === true) return;

            if(that.chart_created === true) {
                if(NETDATA.options.current.destroy_on_hide === true) {
                    // we should destroy it
                    init();
                }
                else {
                    showRendering();
                    that.element_chart.style.display = 'none';
                    if(that.element_legend !== null) that.element_legend.style.display = 'none';
                    that.tm.last_hidden = Date.now();

                    // de-allocate data
                    // This works, but I not sure there are no corner cases somewhere
                    // so it is commented - if the user has memory issues he can
                    // set Destroy on Hide for all charts
                    // that.data = null;
                }
            }

            that.___chartIsHidden___ = true;
        };

        // unhide the chart, when it is visible - called from isVisible()
        var unhideChart = function() {
            if(isHidden() === false) return;

            that.___chartIsHidden___ = undefined;
            that.updates_since_last_unhide = 0;

            if(that.chart_created === false) {
                // we need to re-initialize it, to show our background
                // logo in bootstrap tabs, until the chart loads
                init();
            }
            else {
                that.tm.last_unhidden = Date.now();
                that.element_chart.style.display = '';
                if(that.element_legend !== null) that.element_legend.style.display = '';
                resizeChart();
                hideMessage();
            }
        };

        var canBeRendered = function() {
            return (isHidden() === false && that.isVisible(true) === true);
        };

        // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
        var callChartLibraryUpdateSafely = function(data) {
            var status;

            if(canBeRendered() === false)
                return false;

            if(NETDATA.options.debug.chart_errors === true)
                status = that.library.update(that, data);
            else {
                try {
                    status = that.library.update(that, data);
                }
                catch(err) {
                    status = false;
                }
            }

            if(status === false) {
                error('chart failed to be updated as ' + that.library_name);
                return false;
            }

            return true;
        };

        // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
        var callChartLibraryCreateSafely = function(data) {
            var status;

            if(canBeRendered() === false)
                return false;

            if(NETDATA.options.debug.chart_errors === true)
                status = that.library.create(that, data);
            else {
                try {
                    status = that.library.create(that, data);
                }
                catch(err) {
                    status = false;
                }
            }

            if(status === false) {
                error('chart failed to be created as ' + that.library_name);
                return false;
            }

            that.chart_created = true;
            that.updates_since_last_creation = 0;
            return true;
        };

        // ----------------------------------------------------------------------------------------------------------------
        // Chart Resize

        // resizeChart() - private
        // to be called just before the chart library to make sure that
        // a properly sized dom is available
        var resizeChart = function() {
            if(that.isVisible() === true && that.tm.last_resized < NETDATA.options.last_resized) {
                if(that.chart_created === false) return;

                if(that.needsRecreation()) {
                    init();
                }
                else if(typeof that.library.resize === 'function') {
                    that.library.resize(that);

                    if(that.element_legend_childs.perfect_scroller !== null)
                        Ps.update(that.element_legend_childs.perfect_scroller);

                    maxMessageFontSize();
                }

                that.tm.last_resized = Date.now();
            }
        };

        // this is the actual chart resize algorithm
        // it will:
        // - resize the entire container
        // - update the internal states
        // - resize the chart as the div changes height
        // - update the scrollbar of the legend
        var resizeChartToHeight = function(h) {
            // console.log(h);
            that.element.style.height = h;

            if(that.settings_id !== null)
                NETDATA.localStorageSet('chart_heights.' + that.settings_id, h);

            var now = Date.now();
            NETDATA.options.last_page_scroll = now;
            NETDATA.options.auto_refresher_stop_until = now + NETDATA.options.current.stop_updates_while_resizing;

            // force a resize
            that.tm.last_resized = 0;
            resizeChart();
        };

        this.resizeHandler = function(e) {
            e.preventDefault();

            if(typeof this.event_resize === 'undefined'
                || this.event_resize.chart_original_w === 'undefined'
                || this.event_resize.chart_original_h === 'undefined')
                this.event_resize = {
                    chart_original_w: this.element.clientWidth,
                    chart_original_h: this.element.clientHeight,
                    last: 0
                };

            if(e.type === 'touchstart') {
                this.event_resize.mouse_start_x = e.touches.item(0).pageX;
                this.event_resize.mouse_start_y = e.touches.item(0).pageY;
            }
            else {
                this.event_resize.mouse_start_x = e.clientX;
                this.event_resize.mouse_start_y = e.clientY;
            }

            this.event_resize.chart_start_w = this.element.clientWidth;
            this.event_resize.chart_start_h = this.element.clientHeight;
            this.event_resize.chart_last_w = this.element.clientWidth;
            this.event_resize.chart_last_h = this.element.clientHeight;

            var now = Date.now();
            if(now - this.event_resize.last <= NETDATA.options.current.double_click_speed && this.element_legend_childs.perfect_scroller !== null) {
                // double click / double tap event

                // console.dir(this.element_legend_childs.content);
                // console.dir(this.element_legend_childs.perfect_scroller);

                // the optimal height of the chart
                // showing the entire legend
                var optimal = this.event_resize.chart_last_h
                        + this.element_legend_childs.perfect_scroller.scrollHeight
                        - this.element_legend_childs.perfect_scroller.clientHeight;

                // if we are not optimal, be optimal
                if(this.event_resize.chart_last_h !== optimal) {
                    // this.log('resize to optimal, current = ' + this.event_resize.chart_last_h.toString() + 'px, original = ' + this.event_resize.chart_original_h.toString() + 'px, optimal = ' + optimal.toString() + 'px, internal = ' + this.height_original.toString());
                    resizeChartToHeight(optimal.toString() + 'px');
                }

                // else if the current height is not the original/saved height
                // reset to the original/saved height
                else if(this.event_resize.chart_last_h !== this.event_resize.chart_original_h) {
                    // this.log('resize to original, current = ' + this.event_resize.chart_last_h.toString() + 'px, original = ' + this.event_resize.chart_original_h.toString() + 'px, optimal = ' + optimal.toString() + 'px, internal = ' + this.height_original.toString());
                    resizeChartToHeight(this.event_resize.chart_original_h.toString() + 'px');
                }

                // else if the current height is not the internal default height
                // reset to the internal default height
                else if((this.event_resize.chart_last_h.toString() + 'px') !== this.height_original) {
                    // this.log('resize to internal default, current = ' + this.event_resize.chart_last_h.toString() + 'px, original = ' + this.event_resize.chart_original_h.toString() + 'px, optimal = ' + optimal.toString() + 'px, internal = ' + this.height_original.toString());
                    resizeChartToHeight(this.height_original.toString());
                }

                // else if the current height is not the firstchild's clientheight
                // resize to it
                else if(typeof this.element_legend_childs.perfect_scroller.firstChild !== 'undefined') {
                    var parent_rect = this.element.getBoundingClientRect();
                    var content_rect = this.element_legend_childs.perfect_scroller.firstElementChild.getBoundingClientRect();
                    var wanted = content_rect.top - parent_rect.top + this.element_legend_childs.perfect_scroller.firstChild.clientHeight + 18; // 15 = toolbox + 3 space

                    // console.log(parent_rect);
                    // console.log(content_rect);
                    // console.log(wanted);

                    // this.log('resize to firstChild, current = ' + this.event_resize.chart_last_h.toString() + 'px, original = ' + this.event_resize.chart_original_h.toString() + 'px, optimal = ' + optimal.toString() + 'px, internal = ' + this.height_original.toString() + 'px, firstChild = ' + wanted.toString() + 'px' );
                    if(this.event_resize.chart_last_h !== wanted)
                        resizeChartToHeight(wanted.toString() + 'px');
                }
            }
            else {
                this.event_resize.last = now;

                // process movement event
                document.onmousemove =
                document.ontouchmove =
                this.element_legend_childs.resize_handler.onmousemove =
                this.element_legend_childs.resize_handler.ontouchmove =
                    function(e) {
                        var y = null;

                        switch(e.type) {
                            case 'mousemove': y = e.clientY; break;
                            case 'touchmove': y = e.touches.item(e.touches - 1).pageY; break;
                        }

                        if(y !== null) {
                            var newH = that.event_resize.chart_start_h + y - that.event_resize.mouse_start_y;

                            if(newH >= 70 && newH !== that.event_resize.chart_last_h) {
                                resizeChartToHeight(newH.toString() + 'px');
                                that.event_resize.chart_last_h = newH;
                            }
                        }
                    };

                // process end event
                document.onmouseup =
                document.ontouchend =
                this.element_legend_childs.resize_handler.onmouseup =
                this.element_legend_childs.resize_handler.ontouchend =
                    function(e) {
                        void(e);

                        // remove all the hooks
                        document.onmouseup =
                        document.onmousemove =
                        document.ontouchmove =
                        document.ontouchend =
                        that.element_legend_childs.resize_handler.onmousemove =
                        that.element_legend_childs.resize_handler.ontouchmove =
                        that.element_legend_childs.resize_handler.onmouseout =
                        that.element_legend_childs.resize_handler.onmouseup =
                        that.element_legend_childs.resize_handler.ontouchend =
                            null;

                        // allow auto-refreshes
                        NETDATA.options.auto_refresher_stop_until = 0;
                    };
            }
        };


        var noDataToShow = function() {
            showMessageIcon('<i class="fa fa-warning"></i> empty');
            that.legendUpdateDOM();
            that.tm.last_autorefreshed = Date.now();
            // that.data_update_every = 30 * 1000;
            //that.element_chart.style.display = 'none';
            //if(that.element_legend !== null) that.element_legend.style.display = 'none';
            //that.___chartIsHidden___ = true;
        };

        // ============================================================================================================
        // PUBLIC FUNCTIONS

        this.error = function(msg) {
            error(msg);
        };

        this.setMode = function(m) {
            if(this.current !== null && this.current.name === m) return;

            if(m === 'auto')
                this.current = this.auto;
            else if(m === 'pan')
                this.current = this.pan;
            else if(m === 'zoom')
                this.current = this.zoom;
            else
                this.current = this.auto;

            this.current.force_update_at = 0;
            this.current.force_before_ms = null;
            this.current.force_after_ms = null;

            this.tm.last_mode_switch = Date.now();
        };

        // ----------------------------------------------------------------------------------------------------------------
        // global selection sync

        // prevent to global selection sync for some time
        this.globalSelectionSyncDelay = function(ms) {
            if(NETDATA.options.current.sync_selection === false)
                return;

            if(typeof ms === 'number')
                NETDATA.globalSelectionSync.dont_sync_before = Date.now() + ms;
            else
                NETDATA.globalSelectionSync.dont_sync_before = Date.now() + NETDATA.options.current.sync_selection_delay;
        };

        // can we globally apply selection sync?
        this.globalSelectionSyncAbility = function() {
            if(NETDATA.options.current.sync_selection === false)
                return false;

            return (NETDATA.globalSelectionSync.dont_sync_before <= Date.now());
        };

        this.globalSelectionSyncIsMaster = function() {
            return (NETDATA.globalSelectionSync.state === this);
        };

        // this chart is the master of the global selection sync
        this.globalSelectionSyncBeMaster = function() {
            // am I the master?
            if(this.globalSelectionSyncIsMaster()) {
                if(this.debug === true)
                    this.log('sync: I am the master already.');

                return;
            }

            if(NETDATA.globalSelectionSync.state) {
                if(this.debug === true)
                    this.log('sync: I am not the sync master. Resetting global sync.');

                this.globalSelectionSyncStop();
            }

            // become the master
            if(this.debug === true)
                this.log('sync: becoming sync master.');

            this.selected = true;
            NETDATA.globalSelectionSync.state = this;

            // find the all slaves
            var targets = NETDATA.options.targets;
            var len = targets.length;
            while(len--) {
                var st = targets[len];

                if(st === this) {
                    if(this.debug === true)
                        st.log('sync: not adding me to sync');
                }
                else if(st.globalSelectionSyncIsEligible()) {
                    if(this.debug === true)
                        st.log('sync: adding to sync as slave');

                    st.globalSelectionSyncBeSlave();
                }
            }

            // this.globalSelectionSyncDelay(100);
        };

        // can the chart participate to the global selection sync as a slave?
        this.globalSelectionSyncIsEligible = function() {
            return (this.enabled === true
                && this.library !== null
                && typeof this.library.setSelection === 'function'
                && this.isVisible() === true
                && this.chart_created === true);
        };

        // this chart becomes a slave of the global selection sync
        this.globalSelectionSyncBeSlave = function() {
            if(NETDATA.globalSelectionSync.state !== this)
                NETDATA.globalSelectionSync.slaves.push(this);
        };

        // sync all the visible charts to the given time
        // this is to be called from the chart libraries
        this.globalSelectionSync = function(t) {
            if(this.globalSelectionSyncAbility() === false)
                return;

            if(this.globalSelectionSyncIsMaster() === false) {
                if(this.debug === true)
                    this.log('sync: trying to be sync master.');

                this.globalSelectionSyncBeMaster();

                if(this.globalSelectionSyncAbility() === false)
                    return;
            }

            NETDATA.globalSelectionSync.last_t = t;
            $.each(NETDATA.globalSelectionSync.slaves, function(i, st) {
                st.setSelection(t);
            });
        };

        // stop syncing all charts to the given time
        this.globalSelectionSyncStop = function() {
            if(NETDATA.globalSelectionSync.slaves.length) {
                if(this.debug === true)
                    this.log('sync: cleaning up...');

                $.each(NETDATA.globalSelectionSync.slaves, function(i, st) {
                    if(st === that) {
                        if(that.debug === true)
                            st.log('sync: not adding me to sync stop');
                    }
                    else {
                        if(that.debug === true)
                            st.log('sync: removed slave from sync');

                        st.clearSelection();
                    }
                });

                NETDATA.globalSelectionSync.last_t = 0;
                NETDATA.globalSelectionSync.slaves = [];
                NETDATA.globalSelectionSync.state = null;
            }

            this.clearSelection();
        };

        this.setSelection = function(t) {
            if(typeof this.library.setSelection === 'function')
                this.selected = (this.library.setSelection(this, t) === true);
            else
                this.selected = true;

            if(this.selected === true && this.debug === true)
                this.log('selection set to ' + t.toString());

            return this.selected;
        };

        this.clearSelection = function() {
            if(this.selected === true) {
                if(typeof this.library.clearSelection === 'function')
                    this.selected = (this.library.clearSelection(this) !== true);
                else
                    this.selected = false;

                if(this.selected === false && this.debug === true)
                    this.log('selection cleared');

                this.legendReset();
            }

            return this.selected;
        };

        // find if a timestamp (ms) is shown in the current chart
        this.timeIsVisible = function(t) {
            return (t >= this.data_after && t <= this.data_before);
        };

        this.calculateRowForTime = function(t) {
            if(this.timeIsVisible(t) === false) return -1;
            return Math.floor((t - this.data_after) / this.data_update_every);
        };

        // ----------------------------------------------------------------------------------------------------------------

        // console logging
        this.log = function(msg) {
            console.log(this.id + ' (' + this.library_name + ' ' + this.uuid + '): ' + msg);
        };

        this.pauseChart = function() {
            if(this.paused === false) {
                if(this.debug === true)
                    this.log('pauseChart()');

                this.paused = true;
            }
        };

        this.unpauseChart = function() {
            if(this.paused === true) {
                if(this.debug === true)
                    this.log('unpauseChart()');

                this.paused = false;
            }
        };

        this.resetChart = function(dont_clear_master, dont_update) {
            if(this.debug === true)
                this.log('resetChart(' + dont_clear_master + ', ' + dont_update + ') called');

            if(typeof dont_clear_master === 'undefined')
                dont_clear_master = false;

            if(typeof dont_update === 'undefined')
                dont_update = false;

            if(dont_clear_master !== true && NETDATA.globalPanAndZoom.isMaster(this) === true) {
                if(this.debug === true)
                    this.log('resetChart() diverting to clearMaster().');
                // this will call us back with master === true
                NETDATA.globalPanAndZoom.clearMaster();
                return;
            }

            this.clearSelection();

            this.tm.pan_and_zoom_seq = 0;

            this.setMode('auto');
            this.current.force_update_at = 0;
            this.current.force_before_ms = null;
            this.current.force_after_ms = null;
            this.tm.last_autorefreshed = 0;
            this.paused = false;
            this.selected = false;
            this.enabled = true;
            // this.debug = false;

            // do not update the chart here
            // or the chart will flip-flop when it is the master
            // of a selection sync and another chart becomes
            // the new master

            if(dont_update !== true && this.isVisible() === true) {
                this.updateChart();
            }
        };

        this.updateChartPanOrZoom = function(after, before) {
            var logme = 'updateChartPanOrZoom(' + after + ', ' + before + '): ';
            var ret = true;

            if(this.debug === true)
                this.log(logme);

            if(before < after) {
                if(this.debug === true)
                    this.log(logme + 'flipped parameters, rejecting it.');

                return false;
            }

            if(typeof this.fixed_min_duration === 'undefined')
                this.fixed_min_duration = Math.round((this.chartWidth() / 30) * this.chart.update_every * 1000);

            var min_duration = this.fixed_min_duration;
            var current_duration = Math.round(this.view_before - this.view_after);

            // round the numbers
            after = Math.round(after);
            before = Math.round(before);

            // align them to update_every
            // stretching them further away
            after -= after % this.data_update_every;
            before += this.data_update_every - (before % this.data_update_every);

            // the final wanted duration
            var wanted_duration = before - after;

            // to allow panning, accept just a point below our minimum
            if((current_duration - this.data_update_every) < min_duration)
                min_duration = current_duration - this.data_update_every;

            // we do it, but we adjust to minimum size and return false
            // when the wanted size is below the current and the minimum
            // and we zoom
            if(wanted_duration < current_duration && wanted_duration < min_duration) {
                if(this.debug === true)
                    this.log(logme + 'too small: min_duration: ' + (min_duration / 1000).toString() + ', wanted: ' + (wanted_duration / 1000).toString());

                min_duration = this.fixed_min_duration;

                var dt = (min_duration - wanted_duration) / 2;
                before += dt;
                after -= dt;
                wanted_duration = before - after;
                ret = false;
            }

            var tolerance = this.data_update_every * 2;
            var movement = Math.abs(before - this.view_before);

            if(Math.abs(current_duration - wanted_duration) <= tolerance && movement <= tolerance && ret === true) {
                if(this.debug === true)
                    this.log(logme + 'REJECTING UPDATE: current/min duration: ' + (current_duration / 1000).toString() + '/' + (this.fixed_min_duration / 1000).toString() + ', wanted duration: ' + (wanted_duration / 1000).toString() + ', duration diff: ' + (Math.round(Math.abs(current_duration - wanted_duration) / 1000)).toString() + ', movement: ' + (movement / 1000).toString() + ', tolerance: ' + (tolerance / 1000).toString() + ', returning: ' + false);
                return false;
            }

            if(this.current.name === 'auto') {
                this.log(logme + 'caller called me with mode: ' + this.current.name);
                this.setMode('pan');
            }

            if(this.debug === true)
                this.log(logme + 'ACCEPTING UPDATE: current/min duration: ' + (current_duration / 1000).toString() + '/' + (this.fixed_min_duration / 1000).toString() + ', wanted duration: ' + (wanted_duration / 1000).toString() + ', duration diff: ' + (Math.round(Math.abs(current_duration - wanted_duration) / 1000)).toString() + ', movement: ' + (movement / 1000).toString() + ', tolerance: ' + (tolerance / 1000).toString() + ', returning: ' + ret);

            this.current.force_update_at = Date.now() + NETDATA.options.current.pan_and_zoom_delay;
            this.current.force_after_ms = after;
            this.current.force_before_ms = before;
            NETDATA.globalPanAndZoom.setMaster(this, after, before);
            return ret;
        };

        var __legendFormatValueChartDecimalsLastMin = undefined;
        var __legendFormatValueChartDecimalsLastMax = undefined;
        var __legendFormatValueChartDecimals = -1;
        this.legendFormatValueDecimalsFromMinMax = function(min, max) {
            if(min === __legendFormatValueChartDecimalsLastMin && max === __legendFormatValueChartDecimalsLastMax)
                return;

            __legendFormatValueChartDecimalsLastMin = min;
            __legendFormatValueChartDecimalsLastMax = max;

            if(this.data !== null && this.data.min === this.data.max)
                __legendFormatValueChartDecimals = -1;

            else if(this.value_decimal_detail !== -1)
                __legendFormatValueChartDecimals = this.value_decimal_detail;

            else {
                var delta;

                if (min === max)
                    delta = Math.abs(min);
                else
                    delta = Math.abs(max - min);

                if (delta > 1000)     __legendFormatValueChartDecimals = 0;
                else if (delta > 10)  __legendFormatValueChartDecimals = 1;
                else if (delta > 1)   __legendFormatValueChartDecimals = 2;
                else if (delta > 0.1) __legendFormatValueChartDecimals = 2;
                else                  __legendFormatValueChartDecimals = 4;
            }
        };

        this.legendFormatValue = function(value) {
            if(typeof value !== 'number') return '-';

            var dmin, dmax;

            if(__legendFormatValueChartDecimals < 0) {
                dmin = 0;
                var abs = value;
                if(abs > 1000)      dmax = 0;
                else if(abs > 10 )  dmax = 1;
                else if(abs > 1)    dmax = 2;
                else if(abs > 0.1)  dmax = 2;
                else                dmax = 4;
            }
            else {
                dmin = dmax = __legendFormatValueChartDecimals;
            }

            if(this.value_decimal_detail !== -1) {
                dmin = dmax = this.value_decimal_detail;
            }

            return value.toLocaleString(undefined, {
                // style: 'decimal',
                // minimumIntegerDigits: 1,
                // minimumSignificantDigits: 1,
                // maximumSignificantDigits: 1,
                useGrouping: true,
                minimumFractionDigits: dmin,
                maximumFractionDigits: dmax
            });
        };

        this.legendSetLabelValue = function(label, value) {
            var series = this.element_legend_childs.series[label];
            if(typeof series === 'undefined') return;
            if(series.value === null && series.user === null) return;

            /*
            // this slows down firefox and edge significantly
            // since it requires to use innerHTML(), instead of innerText()

            // if the value has not changed, skip DOM update
            //if(series.last === value) return;

            var s, r;
            if(typeof value === 'number') {
                var v = Math.abs(value);
                s = r = this.legendFormatValue(value);

                if(typeof series.last === 'number') {
                    if(v > series.last) s += '<i class="fa fa-angle-up" style="width: 8px; text-align: center; overflow: hidden; vertical-align: middle;"></i>';
                    else if(v < series.last) s += '<i class="fa fa-angle-down" style="width: 8px; text-align: center; overflow: hidden; vertical-align: middle;"></i>';
                    else s += '<i class="fa fa-angle-left" style="width: 8px; text-align: center; overflow: hidden; vertical-align: middle;"></i>';
                }
                else s += '<i class="fa fa-angle-right" style="width: 8px; text-align: center; overflow: hidden; vertical-align: middle;"></i>';

                series.last = v;
            }
            else {
                if(value === null)
                    s = r = '';
                else
                    s = r = value;

                series.last = value;
            }
            */

            var s = this.legendFormatValue(value);

            // caching: do not update the update to show the same value again
            if(s === series.last_shown_value) return;
            series.last_shown_value = s;

            if(series.value !== null) series.value.innerText = s;
            if(series.user !== null) series.user.innerText = s;
        };

        this.__legendSetDateString = function(date) {
            if(date !== this.__last_shown_legend_date) {
                this.element_legend_childs.title_date.innerText = date;
                this.__last_shown_legend_date = date;
            }
        };

        this.__legendSetTimeString = function(time) {
            if(time !== this.__last_shown_legend_time) {
                this.element_legend_childs.title_time.innerText = time;
                this.__last_shown_legend_time = time;
            }
        };

        this.__legendSetUnitsString = function(units) {
            if(units !== this.__last_shown_legend_units) {
                this.element_legend_childs.title_units.innerText = units;
                this.__last_shown_legend_units = units;
            }
        };

        this.legendSetDateLast = {
            ms: 0,
            date: undefined,
            time: undefined
        };

        this.legendSetDate = function(ms) {
            if(typeof ms !== 'number') {
                this.legendShowUndefined();
                return;
            }

            if(this.legendSetDateLast.ms !== ms) {
                var d = new Date(ms);
                this.legendSetDateLast.ms = ms;
                this.legendSetDateLast.date = d.toLocaleDateString();
                this.legendSetDateLast.time = d.toLocaleTimeString();
            }

            if(this.element_legend_childs.title_date !== null)
                this.__legendSetDateString(this.legendSetDateLast.date);

            if(this.element_legend_childs.title_time !== null)
                this.__legendSetTimeString(this.legendSetDateLast.time);

            if(this.element_legend_childs.title_units !== null)
                this.__legendSetUnitsString(this.units)
        };

        this.legendShowUndefined = function() {
            if(this.element_legend_childs.title_date !== null)
                this.__legendSetDateString(' ');

            if(this.element_legend_childs.title_time !== null)
                this.__legendSetTimeString(this.chart.name);

            if(this.element_legend_childs.title_units !== null)
                this.__legendSetUnitsString(' ');

            if(this.data && this.element_legend_childs.series !== null) {
                var labels = this.data.dimension_names;
                var i = labels.length;
                while(i--) {
                    var label = labels[i];

                    if(typeof label === 'undefined' || typeof this.element_legend_childs.series[label] === 'undefined') continue;
                    this.legendSetLabelValue(label, null);
                }
            }
        };

        this.legendShowLatestValues = function() {
            if(this.chart === null) return;
            if(this.selected) return;

            if(this.data === null || this.element_legend_childs.series === null) {
                this.legendShowUndefined();
                return;
            }

            var show_undefined = true;
            if(Math.abs(this.netdata_last - this.view_before) <= this.data_update_every)
                show_undefined = false;

            if(show_undefined) {
                this.legendShowUndefined();
                return;
            }

            this.legendSetDate(this.view_before);

            var labels = this.data.dimension_names;
            var i = labels.length;
            while(i--) {
                var label = labels[i];

                if(typeof label === 'undefined') continue;
                if(typeof this.element_legend_childs.series[label] === 'undefined') continue;

                if(show_undefined)
                    this.legendSetLabelValue(label, null);
                else
                    this.legendSetLabelValue(label, this.data.view_latest_values[i]);
            }
        };

        this.legendReset = function() {
            this.legendShowLatestValues();
        };

        // this should be called just ONCE per dimension per chart
        this._chartDimensionColor = function(label) {
            if(this.colors === null) this.chartColors();

            if(typeof this.colors_assigned[label] === 'undefined') {
                if(this.colors_available.length === 0) {
                    var len = NETDATA.themes.current.colors.length;
                    while(len--)
                        this.colors_available.unshift(NETDATA.themes.current.colors[len]);
                }

                this.colors_assigned[label] = this.colors_available.shift();

                if(this.debug === true)
                    this.log('label "' + label + '" got color "' + this.colors_assigned[label]);
            }
            else {
                if(this.debug === true)
                    this.log('label "' + label + '" already has color "' + this.colors_assigned[label] + '"');
            }

            this.colors.push(this.colors_assigned[label]);
            return this.colors_assigned[label];
        };

        this.chartColors = function() {
            if(this.colors !== null) return this.colors;

            this.colors = [];
            this.colors_available = [];

            // add the standard colors
            var len = NETDATA.themes.current.colors.length;
            while(len--)
                this.colors_available.unshift(NETDATA.themes.current.colors[len]);

            // add the user supplied colors
            var c = $(this.element).data('colors');
            // this.log('read colors: ' + c);
            if(typeof c !== 'undefined' && c !== null && c.length > 0) {
                if(typeof c !== 'string') {
                    this.log('invalid color given: ' + c + ' (give a space separated list of colors)');
                }
                else {
                    c = c.split(' ');
                    var added = 0;

                    while(added < 20) {
                        len = c.length;
                        while(len--) {
                            added++;
                            this.colors_available.unshift(c[len]);
                            // this.log('adding color: ' + c[len]);
                        }
                    }
                }
            }

            return this.colors;
        };

        this.legendUpdateDOM = function() {
            var needed = false, dim, keys, len, i;

            // check that the legend DOM is up to date for the downloaded dimensions
            if(typeof this.element_legend_childs.series !== 'object' || this.element_legend_childs.series === null) {
                // this.log('the legend does not have any series - requesting legend update');
                needed = true;
            }
            else if(this.data === null) {
                // this.log('the chart does not have any data - requesting legend update');
                needed = true;
            }
            else if(typeof this.element_legend_childs.series.labels_key === 'undefined') {
                needed = true;
            }
            else {
                var labels = this.data.dimension_names.toString();
                if(labels !== this.element_legend_childs.series.labels_key) {
                    needed = true;

                    if(this.debug === true)
                        this.log('NEW LABELS: "' + labels + '" NOT EQUAL OLD LABELS: "' + this.element_legend_childs.series.labels_key + '"');
                }
            }

            if(needed === false) {
                // make sure colors available
                this.chartColors();

                // do we have to update the current values?
                // we do this, only when the visible chart is current
                if(Math.abs(this.netdata_last - this.view_before) <= this.data_update_every) {
                    if(this.debug === true)
                        this.log('chart is in latest position... updating values on legend...');

                    //var labels = this.data.dimension_names;
                    //var i = labels.length;
                    //while(i--)
                    //  this.legendSetLabelValue(labels[i], this.data.latest_values[i]);
                }
                return;
            }
            if(this.colors === null) {
                // this is the first time we update the chart
                // let's assign colors to all dimensions
                if(this.library.track_colors() === true) {
                    keys = Object.keys(this.chart.dimensions);
                    len = keys.length;
                    for(i = 0; i < len ;i++)
                        this._chartDimensionColor(this.chart.dimensions[keys[i]].name);
                }
            }
            // we will re-generate the colors for the chart
            // based on the selected dimensions
            this.colors = null;

            if(this.debug === true)
                this.log('updating Legend DOM');

            // mark all dimensions as invalid
            this.dimensions_visibility.invalidateAll();

            var genLabel = function(state, parent, dim, name, count) {
                var color = state._chartDimensionColor(name);

                var user_element = null;
                var user_id = self.data('show-value-of-' + name.toLowerCase() + '-at') || null;
                if(user_id === null)
                    user_id = self.data('show-value-of-' + dim.toLowerCase() + '-at') || null;
                if(user_id !== null) {
                    user_element = document.getElementById(user_id) || null;
                    if (user_element === null)
                        state.log('Cannot find element with id: ' + user_id);
                }

                state.element_legend_childs.series[name] = {
                    name: document.createElement('span'),
                    value: document.createElement('span'),
                    user: user_element,
                    last: null,
                    last_shown_value: null
                };

                var label = state.element_legend_childs.series[name];

                // create the dimension visibility tracking for this label
                state.dimensions_visibility.dimensionAdd(name, label.name, label.value, color);

                var rgb = NETDATA.colorHex2Rgb(color);
                label.name.innerHTML = '<table class="netdata-legend-name-table-'
                    + state.chart.chart_type
                    + '" style="background-color: '
                    + 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + NETDATA.options.current['color_fill_opacity_' + state.chart.chart_type] + ')'
                    + '"><tr class="netdata-legend-name-tr"><td class="netdata-legend-name-td"></td></tr></table>';

                var text = document.createTextNode(' ' + name);
                label.name.appendChild(text);

                if(count > 0)
                    parent.appendChild(document.createElement('br'));

                parent.appendChild(label.name);
                parent.appendChild(label.value);
            };

            var content = document.createElement('div');

            if(this.hasLegend()) {
                this.element_legend_childs = {
                    content: content,
                    resize_handler: document.createElement('div'),
                    toolbox: document.createElement('div'),
                    toolbox_left: document.createElement('div'),
                    toolbox_right: document.createElement('div'),
                    toolbox_reset: document.createElement('div'),
                    toolbox_zoomin: document.createElement('div'),
                    toolbox_zoomout: document.createElement('div'),
                    toolbox_volume: document.createElement('div'),
                    title_date: document.createElement('span'),
                    title_time: document.createElement('span'),
                    title_units: document.createElement('span'),
                    perfect_scroller: document.createElement('div'),
                    series: {}
                };

                this.element_legend.innerHTML = '';

                if(this.library.toolboxPanAndZoom !== null) {

                    var get_pan_and_zoom_step = function(event) {
                        if (event.ctrlKey)
                            return NETDATA.options.current.pan_and_zoom_factor * NETDATA.options.current.pan_and_zoom_factor_multiplier_control;

                        else if (event.shiftKey)
                            return NETDATA.options.current.pan_and_zoom_factor * NETDATA.options.current.pan_and_zoom_factor_multiplier_shift;

                        else if (event.altKey)
                            return NETDATA.options.current.pan_and_zoom_factor * NETDATA.options.current.pan_and_zoom_factor_multiplier_alt;

                        else
                            return NETDATA.options.current.pan_and_zoom_factor;
                    };

                    this.element_legend_childs.toolbox.className += ' netdata-legend-toolbox';
                    this.element.appendChild(this.element_legend_childs.toolbox);

                    this.element_legend_childs.toolbox_left.className += ' netdata-legend-toolbox-button';
                    this.element_legend_childs.toolbox_left.innerHTML = '<i class="fa fa-backward"></i>';
                    this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_left);
                    this.element_legend_childs.toolbox_left.onclick = function(e) {
                        e.preventDefault();

                        var step = (that.view_before - that.view_after) * get_pan_and_zoom_step(e);
                        var before = that.view_before - step;
                        var after = that.view_after - step;
                        if(after >= that.netdata_first)
                            that.library.toolboxPanAndZoom(that, after, before);
                    };
                    if(NETDATA.options.current.show_help === true)
                        $(this.element_legend_childs.toolbox_left).popover({
                        container: "body",
                        animation: false,
                        html: true,
                        trigger: 'hover',
                        placement: 'bottom',
                        delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                        title: 'Pan Left',
                        content: 'Pan the chart to the left. You can also <b>drag it</b> with your mouse or your finger (on touch devices).<br/><small>Help, can be disabled from the settings.</small>'
                    });


                    this.element_legend_childs.toolbox_reset.className += ' netdata-legend-toolbox-button';
                    this.element_legend_childs.toolbox_reset.innerHTML = '<i class="fa fa-play"></i>';
                    this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_reset);
                    this.element_legend_childs.toolbox_reset.onclick = function(e) {
                        e.preventDefault();
                        NETDATA.resetAllCharts(that);
                    };
                    if(NETDATA.options.current.show_help === true)
                        $(this.element_legend_childs.toolbox_reset).popover({
                        container: "body",
                        animation: false,
                        html: true,
                        trigger: 'hover',
                        placement: 'bottom',
                        delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                        title: 'Chart Reset',
                        content: 'Reset all the charts to their default auto-refreshing state. You can also <b>double click</b> the chart contents with your mouse or your finger (on touch devices).<br/><small>Help, can be disabled from the settings.</small>'
                    });
                    
                    this.element_legend_childs.toolbox_right.className += ' netdata-legend-toolbox-button';
                    this.element_legend_childs.toolbox_right.innerHTML = '<i class="fa fa-forward"></i>';
                    this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_right);
                    this.element_legend_childs.toolbox_right.onclick = function(e) {
                        e.preventDefault();
                        var step = (that.view_before - that.view_after) * get_pan_and_zoom_step(e);
                        var before = that.view_before + step;
                        var after = that.view_after + step;
                        if(before <= that.netdata_last)
                            that.library.toolboxPanAndZoom(that, after, before);
                    };
                    if(NETDATA.options.current.show_help === true)
                        $(this.element_legend_childs.toolbox_right).popover({
                        container: "body",
                        animation: false,
                        html: true,
                        trigger: 'hover',
                        placement: 'bottom',
                        delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                        title: 'Pan Right',
                        content: 'Pan the chart to the right. You can also <b>drag it</b> with your mouse or your finger (on touch devices).<br/><small>Help, can be disabled from the settings.</small>'
                    });

                    
                    this.element_legend_childs.toolbox_zoomin.className += ' netdata-legend-toolbox-button';
                    this.element_legend_childs.toolbox_zoomin.innerHTML = '<i class="fa fa-plus"></i>';
                    this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_zoomin);
                    this.element_legend_childs.toolbox_zoomin.onclick = function(e) {
                        e.preventDefault();
                        var dt = ((that.view_before - that.view_after) * (get_pan_and_zoom_step(e) * 0.8) / 2);
                        var before = that.view_before - dt;
                        var after = that.view_after + dt;
                        that.library.toolboxPanAndZoom(that, after, before);
                    };
                    if(NETDATA.options.current.show_help === true)
                        $(this.element_legend_childs.toolbox_zoomin).popover({
                        container: "body",
                        animation: false,
                        html: true,
                        trigger: 'hover',
                        placement: 'bottom',
                        delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                        title: 'Chart Zoom In',
                        content: 'Zoom in the chart. You can also press SHIFT and select an area of the chart to zoom in. On Chrome and Opera, you can press the SHIFT or the ALT keys and then use the mouse wheel to zoom in or out.<br/><small>Help, can be disabled from the settings.</small>'
                    });
                    
                    this.element_legend_childs.toolbox_zoomout.className += ' netdata-legend-toolbox-button';
                    this.element_legend_childs.toolbox_zoomout.innerHTML = '<i class="fa fa-minus"></i>';
                    this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_zoomout);
                    this.element_legend_childs.toolbox_zoomout.onclick = function(e) {
                        e.preventDefault();
                        var dt = (((that.view_before - that.view_after) / (1.0 - (get_pan_and_zoom_step(e) * 0.8)) - (that.view_before - that.view_after)) / 2);
                        var before = that.view_before + dt;
                        var after = that.view_after - dt;

                        that.library.toolboxPanAndZoom(that, after, before);
                    };
                    if(NETDATA.options.current.show_help === true)
                        $(this.element_legend_childs.toolbox_zoomout).popover({
                        container: "body",
                        animation: false,
                        html: true,
                        trigger: 'hover',
                        placement: 'bottom',
                        delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                        title: 'Chart Zoom Out',
                        content: 'Zoom out the chart. On Chrome and Opera, you can also press the SHIFT or the ALT keys and then use the mouse wheel to zoom in or out.<br/><small>Help, can be disabled from the settings.</small>'
                    });
                    
                    //this.element_legend_childs.toolbox_volume.className += ' netdata-legend-toolbox-button';
                    //this.element_legend_childs.toolbox_volume.innerHTML = '<i class="fa fa-sort-amount-desc"></i>';
                    //this.element_legend_childs.toolbox_volume.title = 'Visible Volume';
                    //this.element_legend_childs.toolbox.appendChild(this.element_legend_childs.toolbox_volume);
                    //this.element_legend_childs.toolbox_volume.onclick = function(e) {
                        //e.preventDefault();
                        //alert('clicked toolbox_volume on ' + that.id);
                    //}
                }
                else {
                    this.element_legend_childs.toolbox = null;
                    this.element_legend_childs.toolbox_left = null;
                    this.element_legend_childs.toolbox_reset = null;
                    this.element_legend_childs.toolbox_right = null;
                    this.element_legend_childs.toolbox_zoomin = null;
                    this.element_legend_childs.toolbox_zoomout = null;
                    this.element_legend_childs.toolbox_volume = null;
                }
                
                this.element_legend_childs.resize_handler.className += " netdata-legend-resize-handler";
                this.element_legend_childs.resize_handler.innerHTML = '<i class="fa fa-chevron-up"></i><i class="fa fa-chevron-down"></i>';
                this.element.appendChild(this.element_legend_childs.resize_handler);
                if(NETDATA.options.current.show_help === true)
                    $(this.element_legend_childs.resize_handler).popover({
                    container: "body",
                    animation: false,
                    html: true,
                    trigger: 'hover',
                    placement: 'bottom',
                    delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                    title: 'Chart Resize',
                    content: 'Drag this point with your mouse or your finger (on touch devices), to resize the chart vertically. You can also <b>double click it</b> or <b>double tap it</b> to reset between 2 states: the default and the one that fits all the values.<br/><small>Help, can be disabled from the settings.</small>'
                });

                // mousedown event
                this.element_legend_childs.resize_handler.onmousedown =
                    function(e) {
                        that.resizeHandler(e);
                    };

                // touchstart event
                this.element_legend_childs.resize_handler.addEventListener('touchstart', function(e) {
                    that.resizeHandler(e);
                }, false);

                this.element_legend_childs.title_date.className += " netdata-legend-title-date";
                this.element_legend.appendChild(this.element_legend_childs.title_date);
                this.__last_shown_legend_date = undefined;

                this.element_legend.appendChild(document.createElement('br'));

                this.element_legend_childs.title_time.className += " netdata-legend-title-time";
                this.element_legend.appendChild(this.element_legend_childs.title_time);
                this.__last_shown_legend_time = undefined;

                this.element_legend.appendChild(document.createElement('br'));

                this.element_legend_childs.title_units.className += " netdata-legend-title-units";
                this.element_legend.appendChild(this.element_legend_childs.title_units);
                this.__last_shown_legend_units = undefined;

                this.element_legend.appendChild(document.createElement('br'));

                this.element_legend_childs.perfect_scroller.className = 'netdata-legend-series';
                this.element_legend.appendChild(this.element_legend_childs.perfect_scroller);

                content.className = 'netdata-legend-series-content';
                this.element_legend_childs.perfect_scroller.appendChild(content);

                if(NETDATA.options.current.show_help === true)
                    $(content).popover({
                    container: "body",
                    animation: false,
                    html: true,
                    trigger: 'hover',
                    placement: 'bottom',
                    title: 'Chart Legend',
                    delay: { show: NETDATA.options.current.show_help_delay_show_ms, hide: NETDATA.options.current.show_help_delay_hide_ms },
                    content: 'You can click or tap on the values or the labels to select dimensions. By pressing SHIFT or CONTROL, you can enable or disable multiple dimensions.<br/><small>Help, can be disabled from the settings.</small>'
                });
            }
            else {
                this.element_legend_childs = {
                    content: content,
                    resize_handler: null,
                    toolbox: null,
                    toolbox_left: null,
                    toolbox_right: null,
                    toolbox_reset: null,
                    toolbox_zoomin: null,
                    toolbox_zoomout: null,
                    toolbox_volume: null,
                    title_date: null,
                    title_time: null,
                    title_units: null,
                    perfect_scroller: null,
                    series: {}
                };
            }

            if(this.data) {
                this.element_legend_childs.series.labels_key = this.data.dimension_names.toString();
                if(this.debug === true)
                    this.log('labels from data: "' + this.element_legend_childs.series.labels_key + '"');

                for(i = 0, len = this.data.dimension_names.length; i < len ;i++) {
                    genLabel(this, content, this.data.dimension_ids[i], this.data.dimension_names[i], i);
                }
            }
            else {
                var tmp = [];
                keys = Object.keys(this.chart.dimensions);
                for(i = 0, len = keys.length; i < len ;i++) {
                    dim = keys[i];
                    tmp.push(this.chart.dimensions[dim].name);
                    genLabel(this, content, dim, this.chart.dimensions[dim].name, i);
                }
                this.element_legend_childs.series.labels_key = tmp.toString();
                if(this.debug === true)
                    this.log('labels from chart: "' + this.element_legend_childs.series.labels_key + '"');
            }

            // create a hidden div to be used for hidding
            // the original legend of the chart library
            var el = document.createElement('div');
            if(this.element_legend !== null)
                this.element_legend.appendChild(el);
            el.style.display = 'none';

            this.element_legend_childs.hidden = document.createElement('div');
            el.appendChild(this.element_legend_childs.hidden);

            if(this.element_legend_childs.perfect_scroller !== null) {
                Ps.initialize(this.element_legend_childs.perfect_scroller, {
                    wheelSpeed: 0.2,
                    wheelPropagation: true,
                    swipePropagation: true,
                    minScrollbarLength: null,
                    maxScrollbarLength: null,
                    useBothWheelAxes: false,
                    suppressScrollX: true,
                    suppressScrollY: false,
                    scrollXMarginOffset: 0,
                    scrollYMarginOffset: 0,
                    theme: 'default'
                });
                Ps.update(this.element_legend_childs.perfect_scroller);
            }

            this.legendShowLatestValues();
        };

        this.hasLegend = function() {
            if(typeof this.___hasLegendCache___ !== 'undefined')
                return this.___hasLegendCache___;

            var leg = false;
            if(this.library && this.library.legend(this) === 'right-side') {
                var legend = $(this.element).data('legend') || 'yes';
                if(legend === 'yes') leg = true;
            }

            this.___hasLegendCache___ = leg;
            return leg;
        };

        this.legendWidth = function() {
            return (this.hasLegend())?140:0;
        };

        this.legendHeight = function() {
            return $(this.element).height();
        };

        this.chartWidth = function() {
            return $(this.element).width() - this.legendWidth();
        };

        this.chartHeight = function() {
            return $(this.element).height();
        };

        this.chartPixelsPerPoint = function() {
            // force an options provided detail
            var px = this.pixels_per_point;

            if(this.library && px < this.library.pixels_per_point(this))
                px = this.library.pixels_per_point(this);

            if(px < NETDATA.options.current.pixels_per_point)
                px = NETDATA.options.current.pixels_per_point;

            return px;
        };

        this.needsRecreation = function() {
            return (
                    this.chart_created === true
                    && this.library
                    && this.library.autoresize() === false
                    && this.tm.last_resized < NETDATA.options.last_resized
                );
        };

        this.chartURL = function() {
            var after, before, points_multiplier = 1;
            if(NETDATA.globalPanAndZoom.isActive() && NETDATA.globalPanAndZoom.isMaster(this) === false) {
                this.tm.pan_and_zoom_seq = NETDATA.globalPanAndZoom.seq;

                after = Math.round(NETDATA.globalPanAndZoom.force_after_ms / 1000);
                before = Math.round(NETDATA.globalPanAndZoom.force_before_ms / 1000);
                this.view_after = after * 1000;
                this.view_before = before * 1000;

                this.requested_padding = null;
                points_multiplier = 1;
            }
            else if(this.current.force_before_ms !== null && this.current.force_after_ms !== null) {
                this.tm.pan_and_zoom_seq = 0;

                before = Math.round(this.current.force_before_ms / 1000);
                after  = Math.round(this.current.force_after_ms / 1000);
                this.view_after = after * 1000;
                this.view_before = before * 1000;

                if(NETDATA.options.current.pan_and_zoom_data_padding === true) {
                    this.requested_padding = Math.round((before - after) / 2);
                    after -= this.requested_padding;
                    before += this.requested_padding;
                    this.requested_padding *= 1000;
                    points_multiplier = 2;
                }

                this.current.force_before_ms = null;
                this.current.force_after_ms = null;
            }
            else {
                this.tm.pan_and_zoom_seq = 0;

                before = this.before;
                after  = this.after;
                this.view_after = after * 1000;
                this.view_before = before * 1000;

                this.requested_padding = null;
                points_multiplier = 1;
            }

            this.requested_after = after * 1000;
            this.requested_before = before * 1000;

            this.data_points = this.points || Math.round(this.chartWidth() / this.chartPixelsPerPoint());

            // build the data URL
            this.data_url = this.host + this.chart.data_url;
            this.data_url += "&format="  + this.library.format();
            this.data_url += "&points="  + (this.data_points * points_multiplier).toString();
            this.data_url += "&group="   + this.method;

            if(this.override_options !== null)
                this.data_url += "&options=" + this.override_options.toString();
            else
                this.data_url += "&options=" + this.library.options(this);

            this.data_url += '|jsonwrap';

            if(NETDATA.options.current.eliminate_zero_dimensions === true)
                this.data_url += '|nonzero';

            if(this.append_options !== null)
                this.data_url += '|' + this.append_options.toString();

            if(after)
                this.data_url += "&after="  + after.toString();

            if(before)
                this.data_url += "&before=" + before.toString();

            if(this.dimensions)
                this.data_url += "&dimensions=" + this.dimensions;

            if(NETDATA.options.debug.chart_data_url === true || this.debug === true)
                this.log('chartURL(): ' + this.data_url + ' WxH:' + this.chartWidth() + 'x' + this.chartHeight() + ' points: ' + this.data_points + ' library: ' + this.library_name);
        };

        this.redrawChart = function() {
            if(this.data !== null)
                this.updateChartWithData(this.data);
        };

        this.updateChartWithData = function(data) {
            if(this.debug === true)
                this.log('updateChartWithData() called.');

            // this may force the chart to be re-created
            resizeChart();

            this.data = data;
            this.updates_counter++;
            this.updates_since_last_unhide++;
            this.updates_since_last_creation++;

            var started = Date.now();

            // if the result is JSON, find the latest update-every
            this.data_update_every = data.view_update_every * 1000;
            this.data_after = data.after * 1000;
            this.data_before = data.before * 1000;
            this.netdata_first = data.first_entry * 1000;
            this.netdata_last = data.last_entry * 1000;
            this.data_points = data.points;
            data.state = this;

            if(NETDATA.options.current.pan_and_zoom_data_padding === true && this.requested_padding !== null) {
                if(this.view_after < this.data_after) {
                    // console.log('adjusting view_after from ' + this.view_after + ' to ' + this.data_after);
                    this.view_after = this.data_after;
                }

                if(this.view_before > this.data_before) {
                    // console.log('adjusting view_before from ' + this.view_before + ' to ' + this.data_before);
                    this.view_before = this.data_before;
                }
            }
            else {
                this.view_after = this.data_after;
                this.view_before = this.data_before;
            }

            if(this.debug === true) {
                this.log('UPDATE No ' + this.updates_counter + ' COMPLETED');

                if(this.current.force_after_ms)
                    this.log('STATUS: forced    : ' + (this.current.force_after_ms / 1000).toString() + ' - ' + (this.current.force_before_ms / 1000).toString());
                else
                    this.log('STATUS: forced    : unset');

                this.log('STATUS: requested : ' + (this.requested_after / 1000).toString() + ' - ' + (this.requested_before / 1000).toString());
                this.log('STATUS: downloaded: ' + (this.data_after / 1000).toString() + ' - ' + (this.data_before / 1000).toString());
                this.log('STATUS: rendered  : ' + (this.view_after / 1000).toString() + ' - ' + (this.view_before / 1000).toString());
                this.log('STATUS: points    : ' + (this.data_points).toString());
            }

            if(this.data_points === 0) {
                noDataToShow();
                return;
            }

            if(this.updates_since_last_creation >= this.library.max_updates_to_recreate()) {
                if(this.debug === true)
                    this.log('max updates of ' + this.updates_since_last_creation.toString() + ' reached. Forcing re-generation.');

                init();
                return;
            }

            // check and update the legend
            this.legendUpdateDOM();

            if(this.chart_created === true
                && typeof this.library.update === 'function') {

                if(this.debug === true)
                    this.log('updating chart...');

                if(callChartLibraryUpdateSafely(data) === false)
                    return;
            }
            else {
                if(this.debug === true)
                    this.log('creating chart...');

                if(callChartLibraryCreateSafely(data) === false)
                    return;
            }
            hideMessage();
            this.legendShowLatestValues();
            if(this.selected === true)
                NETDATA.globalSelectionSync.stop();

            // update the performance counters
            var now = Date.now();
            this.tm.last_updated = now;

            // don't update last_autorefreshed if this chart is
            // forced to be updated with global PanAndZoom
            if(NETDATA.globalPanAndZoom.isActive())
                this.tm.last_autorefreshed = 0;
            else {
                if(NETDATA.options.current.parallel_refresher === true && NETDATA.options.current.concurrent_refreshes === true)
                    this.tm.last_autorefreshed = now - (now % this.data_update_every);
                else
                    this.tm.last_autorefreshed = now;
            }

            this.refresh_dt_ms = now - started;
            NETDATA.options.auto_refresher_fast_weight += this.refresh_dt_ms;

            if(this.refresh_dt_element !== null)
                this.refresh_dt_element.innerText = this.refresh_dt_ms.toString();
        };

        this.updateChart = function(callback) {
            if(this.debug === true)
                this.log('updateChart() called.');

            if(this._updating === true) {
                if(this.debug === true)
                    this.log('I am already updating...');

                if(typeof callback === 'function')
                    return callback();

                return;
            }

            // due to late initialization of charts and libraries
            // we need to check this too
            if(this.enabled === false) {
                if(this.debug === true)
                    this.log('I am not enabled');

                if(typeof callback === 'function')
                    return callback();

                return;
            }

            if(canBeRendered() === false) {
                if(typeof callback === 'function')
                    return callback();

                return;
            }

            if(this.chart === null)
                return this.getChart(function() {
                    return that.updateChart(callback);
                });

            if(this.library.initialized === false) {
                if(this.library.enabled === true) {
                    return this.library.initialize(function () {
                        return that.updateChart(callback);
                    });
                }
                else {
                    error('chart library "' + this.library_name + '" is not available.');

                    if(typeof callback === 'function')
                        return callback();

                    return;
                }
            }

            this.clearSelection();
            this.chartURL();

            if(this.debug === true)
                this.log('updating from ' + this.data_url);

            NETDATA.statistics.refreshes_total++;
            NETDATA.statistics.refreshes_active++;

            if(NETDATA.statistics.refreshes_active > NETDATA.statistics.refreshes_active_max)
                NETDATA.statistics.refreshes_active_max = NETDATA.statistics.refreshes_active;

            this._updating = true;

            this.xhr = $.ajax( {
                url: this.data_url,
                cache: false,
                async: true,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function(data) {
                that.xhr = undefined;
                that.retries_on_data_failures = 0;

                if(that.debug === true)
                    that.log('data received. updating chart.');

                that.updateChartWithData(data);
            })
            .fail(function(msg) {
                that.xhr = undefined;

                if(msg.statusText !== 'abort') {
                    that.retries_on_data_failures++;
                    if(that.retries_on_data_failures > NETDATA.options.current.retries_on_data_failures) {
                        // that.log('failed ' + that.retries_on_data_failures.toString() + ' times - giving up');
                        that.retries_on_data_failures = 0;
                        error('data download failed for url: ' + that.data_url);
                    }
                    else {
                        that.tm.last_autorefreshed = Date.now();
                        // that.log('failed ' + that.retries_on_data_failures.toString() + ' times, but I will retry');
                    }
                }
            })
            .always(function() {
                that.xhr = undefined;

                NETDATA.statistics.refreshes_active--;
                that._updating = false;

                if(typeof callback === 'function')
                    return callback();
            });
        };

        this.isVisible = function(nocache) {
            if(typeof nocache === 'undefined')
                nocache = false;

            // this.log('last_visible_check: ' + this.tm.last_visible_check + ', last_page_scroll: ' + NETDATA.options.last_page_scroll);

            // caching - we do not evaluate the charts visibility
            // if the page has not been scrolled since the last check
            if(nocache === false && this.tm.last_visible_check > NETDATA.options.last_page_scroll)
                return this.___isVisible___;

            this.tm.last_visible_check = Date.now();

            var wh = window.innerHeight;
            var x = this.element.getBoundingClientRect();
            var ret = 0;
            var tolerance = 0;

            if(x.width === 0 || x.height === 0) {
                hideChart();
                this.___isVisible___ = false;
                return this.___isVisible___;
            }

            if(x.top < 0 && -x.top > x.height) {
                // the chart is entirely above
                ret = -x.top - x.height;
            }
            else if(x.top > wh) {
                // the chart is entirely below
                ret = x.top - wh;
            }

            if(ret > tolerance) {
                // the chart is too far

                hideChart();
                this.___isVisible___ = false;
                return this.___isVisible___;
            }
            else {
                // the chart is inside or very close

                unhideChart();
                this.___isVisible___ = true;
                return this.___isVisible___;
            }
        };

        this.isAutoRefreshable = function() {
            return (this.current.autorefresh);
        };

        this.canBeAutoRefreshed = function() {
            var now = Date.now();

            if(this.running === true) {
                if(this.debug === true)
                    this.log('I am already running');

                return false;
            }

            if(this.enabled === false) {
                if(this.debug === true)
                    this.log('I am not enabled');

                return false;
            }

            if(this.library === null || this.library.enabled === false) {
                error('charting library "' + this.library_name + '" is not available');
                if(this.debug === true)
                    this.log('My chart library ' + this.library_name + ' is not available');

                return false;
            }

            if(this.isVisible() === false) {
                if(NETDATA.options.debug.visibility === true || this.debug === true)
                    this.log('I am not visible');

                return false;
            }

            if(this.current.force_update_at !== 0 && this.current.force_update_at < now) {
                if(this.debug === true)
                    this.log('timed force update detected - allowing this update');

                this.current.force_update_at = 0;
                return true;
            }

            if(this.isAutoRefreshable() === true) {
                // allow the first update, even if the page is not visible
                if(this.updates_counter && this.updates_since_last_unhide && NETDATA.options.page_is_visible === false) {
                    if(NETDATA.options.debug.focus === true || this.debug === true)
                        this.log('canBeAutoRefreshed(): page does not have focus');

                    return false;
                }

                if(this.needsRecreation() === true) {
                    if(this.debug === true)
                        this.log('canBeAutoRefreshed(): needs re-creation.');

                    return true;
                }

                // options valid only for autoRefresh()
                if(NETDATA.options.auto_refresher_stop_until === 0 || NETDATA.options.auto_refresher_stop_until < now) {
                    if(NETDATA.globalPanAndZoom.isActive()) {
                        if(NETDATA.globalPanAndZoom.shouldBeAutoRefreshed(this)) {
                            if(this.debug === true)
                                this.log('canBeAutoRefreshed(): global panning: I need an update.');

                            return true;
                        }
                        else {
                            if(this.debug === true)
                                this.log('canBeAutoRefreshed(): global panning: I am already up to date.');

                            return false;
                        }
                    }

                    if(this.selected === true) {
                        if(this.debug === true)
                            this.log('canBeAutoRefreshed(): I have a selection in place.');

                        return false;
                    }

                    if(this.paused === true) {
                        if(this.debug === true)
                            this.log('canBeAutoRefreshed(): I am paused.');

                        return false;
                    }

                    if(now - this.tm.last_autorefreshed >= this.data_update_every) {
                        if(this.debug === true)
                            this.log('canBeAutoRefreshed(): It is time to update me.');

                        return true;
                    }
                }
            }

            return false;
        };

        this.autoRefresh = function(callback) {
            if(this.canBeAutoRefreshed() === true && this.running === false) {
                var state = this;

                state.running = true;
                state.updateChart(function() {
                    state.running = false;

                    if(typeof callback !== 'undefined')
                        return callback();
                });
            }
            else {
                if(typeof callback !== 'undefined')
                    return callback();
            }
        };

        this._defaultsFromDownloadedChart = function(chart) {
            this.chart = chart;
            this.chart_url = chart.url;
            this.data_update_every = chart.update_every * 1000;
            this.data_points = Math.round(this.chartWidth() / this.chartPixelsPerPoint());
            this.tm.last_info_downloaded = Date.now();

            if(this.title === null)
                this.title = chart.title;

            if(this.units === null)
                this.units = chart.units;
        };

        // fetch the chart description from the netdata server
        this.getChart = function(callback) {
            this.chart = NETDATA.chartRegistry.get(this.host, this.id);
            if(this.chart) {
                this._defaultsFromDownloadedChart(this.chart);

                if(typeof callback === 'function')
                    return callback();
            }
            else {
                this.chart_url = "/api/v1/chart?chart=" + this.id;

                if(this.debug === true)
                    this.log('downloading ' + this.chart_url);

                $.ajax( {
                    url:  this.host + this.chart_url,
                    cache: false,
                    async: true,
                    xhrFields: { withCredentials: true } // required for the cookie
                })
                .done(function(chart) {
                    chart.url = that.chart_url;
                    that._defaultsFromDownloadedChart(chart);
                    NETDATA.chartRegistry.add(that.host, that.id, chart);
                })
                .fail(function() {
                    NETDATA.error(404, that.chart_url);
                    error('chart not found on url "' + that.chart_url + '"');
                })
                .always(function() {
                    if(typeof callback === 'function')
                        return callback();
                });
            }
        };

        // ============================================================================================================
        // INITIALIZATION

        init();
    };

    NETDATA.resetAllCharts = function(state) {
        // first clear the global selection sync
        // to make sure no chart is in selected state
        state.globalSelectionSyncStop();

        // there are 2 possibilities here
        // a. state is the global Pan and Zoom master
        // b. state is not the global Pan and Zoom master
        var master = true;
        if(NETDATA.globalPanAndZoom.isMaster(state) === false)
            master = false;

        // clear the global Pan and Zoom
        // this will also refresh the master
        // and unblock any charts currently mirroring the master
        NETDATA.globalPanAndZoom.clearMaster();

        // if we were not the master, reset our status too
        // this is required because most probably the mouse
        // is over this chart, blocking it from auto-refreshing
        if(master === false && (state.paused === true || state.selected === true))
            state.resetChart();
    };

    // get or create a chart state, given a DOM element
    NETDATA.chartState = function(element) {
        var state = $(element).data('netdata-state-object') || null;
        if(state === null) {
            state = new chartState(element);
            $(element).data('netdata-state-object', state);
        }
        return state;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Library functions

    // Load a script without jquery
    // This is used to load jquery - after it is loaded, we use jquery
    NETDATA._loadjQuery = function(callback) {
        if(typeof jQuery === 'undefined') {
            if(NETDATA.options.debug.main_loop === true)
                console.log('loading ' + NETDATA.jQuery);

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = NETDATA.jQuery;

            // script.onabort = onError;
            script.onerror = function() { NETDATA.error(101, NETDATA.jQuery); };
            if(typeof callback === "function")
                script.onload = callback;

            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(script, s);
        }
        else if(typeof callback === "function")
            return callback();
    };

    NETDATA._loadCSS = function(filename) {
        // don't use jQuery here
        // styles are loaded before jQuery
        // to eliminate showing an unstyled page to the user

        var fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", filename);

        if (typeof fileref !== 'undefined')
            document.getElementsByTagName("head")[0].appendChild(fileref);
    };

    NETDATA.colorHex2Rgb = function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    NETDATA.colorLuminance = function(hex, lum) {
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6)
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];

        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i*2,2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00"+c).substr(c.length);
        }

        return rgb;
    };

    NETDATA.guid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    NETDATA.zeropad = function(x) {
        if(x > -10 && x < 10) return '0' + x.toString();
        else return x.toString();
    };

    // user function to signal us the DOM has been
    // updated.
    NETDATA.updatedDom = function() {
        NETDATA.options.updated_dom = true;
    };

    NETDATA.ready = function(callback) {
        NETDATA.options.pauseCallback = callback;
    };

    NETDATA.pause = function(callback) {
        if(typeof callback === 'function') {
            if (NETDATA.options.pause === true)
                return callback();
            else
                NETDATA.options.pauseCallback = callback;
        }
    };

    NETDATA.unpause = function() {
        NETDATA.options.pauseCallback = null;
        NETDATA.options.updated_dom = true;
        NETDATA.options.pause = false;
    };

    // ----------------------------------------------------------------------------------------------------------------

    // this is purely sequential charts refresher
    // it is meant to be autonomous
    NETDATA.chartRefresherNoParallel = function(index) {
        if(NETDATA.options.debug.main_loop === true)
            console.log('NETDATA.chartRefresherNoParallel(' + index + ')');

        if(NETDATA.options.updated_dom === true) {
            // the dom has been updated
            // get the dom parts again
            NETDATA.parseDom(NETDATA.chartRefresher);
            return;
        }
        if(index >= NETDATA.options.targets.length) {
            if(NETDATA.options.debug.main_loop === true)
                console.log('waiting to restart main loop...');

            NETDATA.options.auto_refresher_fast_weight = 0;

            setTimeout(function() {
                NETDATA.chartRefresher();
            }, NETDATA.options.current.idle_between_loops);
        }
        else {
            var state = NETDATA.options.targets[index];

            if(NETDATA.options.auto_refresher_fast_weight < NETDATA.options.current.fast_render_timeframe) {
                if(NETDATA.options.debug.main_loop === true)
                    console.log('fast rendering...');

                setTimeout(function() {
                    state.autoRefresh(function () {
                        NETDATA.chartRefresherNoParallel(++index);
                    });
                }, 0);
            }
            else {
                if(NETDATA.options.debug.main_loop === true) console.log('waiting for next refresh...');
                NETDATA.options.auto_refresher_fast_weight = 0;

                setTimeout(function() {
                    state.autoRefresh(function() {
                        NETDATA.chartRefresherNoParallel(++index);
                    });
                }, NETDATA.options.current.idle_between_charts);
            }
        }
    };

    NETDATA.chartRefresherWaitTime = function() {
        return NETDATA.options.current.idle_parallel_loops;
    };

    // the default refresher
    NETDATA.chartRefresher = function() {
        // console.log('auto-refresher...');

        if(NETDATA.options.pause === true) {
            // console.log('auto-refresher is paused');
            setTimeout(NETDATA.chartRefresher,
                NETDATA.chartRefresherWaitTime());
            return;
        }

        if(typeof NETDATA.options.pauseCallback === 'function') {
            // console.log('auto-refresher is calling pauseCallback');
            NETDATA.options.pause = true;
            NETDATA.options.pauseCallback();
            NETDATA.chartRefresher();
            return;
        }

        if(NETDATA.options.current.parallel_refresher === false) {
            // console.log('auto-refresher is calling chartRefresherNoParallel(0)');
            NETDATA.chartRefresherNoParallel(0);
            return;
        }

        if(NETDATA.options.updated_dom === true) {
            // the dom has been updated
            // get the dom parts again
            // console.log('auto-refresher is calling parseDom()');
            NETDATA.parseDom(NETDATA.chartRefresher);
            return;
        }

        var parallel = [];
        var targets = NETDATA.options.targets;
        var len = targets.length;
        var state;
        while(len--) {
            state = targets[len];
            if(state.isVisible() === false || state.running === true)
                continue;

            if(state.library.initialized === false) {
                if(state.library.enabled === true) {
                    state.library.initialize(NETDATA.chartRefresher);
                    return;
                }
                else {
                    state.error('chart library "' + state.library_name + '" is not enabled.');
                }
            }

            parallel.unshift(state);
        }

        if(parallel.length > 0) {
            // console.log('auto-refresher executing in parallel for ' + parallel.length.toString() + ' charts');
            // this will execute the jobs in parallel
            $(parallel).each(function() {
                this.autoRefresh();
            })
        }
        //else {
        //    console.log('auto-refresher nothing to do');
        //}

        // run the next refresh iteration
        setTimeout(NETDATA.chartRefresher,
            NETDATA.chartRefresherWaitTime());
    };

    NETDATA.parseDom = function(callback) {
        NETDATA.options.last_page_scroll = Date.now();
        NETDATA.options.updated_dom = false;

        var targets = $('div[data-netdata]'); //.filter(':visible');

        if(NETDATA.options.debug.main_loop === true)
            console.log('DOM updated - there are ' + targets.length + ' charts on page.');

        NETDATA.options.targets = [];
        var len = targets.length;
        while(len--) {
            // the initialization will take care of sizing
            // and the "loading..." message
            NETDATA.options.targets.push(NETDATA.chartState(targets[len]));
        }

        if(typeof callback === 'function')
            return callback();
    };

    // this is the main function - where everything starts
    NETDATA.start = function() {
        // this should be called only once

        NETDATA.options.page_is_visible = true;

        $(window).blur(function() {
            if(NETDATA.options.current.stop_updates_when_focus_is_lost === true) {
                NETDATA.options.page_is_visible = false;
                if(NETDATA.options.debug.focus === true)
                    console.log('Lost Focus!');
            }
        });

        $(window).focus(function() {
            if(NETDATA.options.current.stop_updates_when_focus_is_lost === true) {
                NETDATA.options.page_is_visible = true;
                if(NETDATA.options.debug.focus === true)
                    console.log('Focus restored!');
            }
        });

        if(typeof document.hasFocus === 'function' && !document.hasFocus()) {
            if(NETDATA.options.current.stop_updates_when_focus_is_lost === true) {
                NETDATA.options.page_is_visible = false;
                if(NETDATA.options.debug.focus === true)
                    console.log('Document has no focus!');
            }
        }

        // bootstrap tab switching
        $('a[data-toggle="tab"]').on('shown.bs.tab', NETDATA.onscroll);

        // bootstrap modal switching
        var $modal = $('.modal');
        $modal.on('hidden.bs.modal', NETDATA.onscroll);
        $modal.on('shown.bs.modal', NETDATA.onscroll);

        // bootstrap collapse switching
        var $collapse = $('.collapse');
        $collapse.on('hidden.bs.collapse', NETDATA.onscroll);
        $collapse.on('shown.bs.collapse', NETDATA.onscroll);

        NETDATA.parseDom(NETDATA.chartRefresher);

        // Alarms initialization
        setTimeout(NETDATA.alarms.init, 1000);

        // Registry initialization
        setTimeout(NETDATA.registry.init, netdataRegistryAfterMs);

        if(typeof netdataCallback === 'function')
            netdataCallback();
    };

    // ----------------------------------------------------------------------------------------------------------------
    // peity

    NETDATA.peityInitialize = function(callback) {
        if(typeof netdataNoPeitys === 'undefined' || !netdataNoPeitys) {
            $.ajax({
                url: NETDATA.peity_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('peity', NETDATA.peity_js);
            })
            .fail(function() {
                NETDATA.chartLibraries.peity.enabled = false;
                NETDATA.error(100, NETDATA.peity_js);
            })
            .always(function() {
                if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.peity.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.peityChartUpdate = function(state, data) {
        state.peity_instance.innerHTML = data.result;

        if(state.peity_options.stroke !== state.chartColors()[0]) {
            state.peity_options.stroke = state.chartColors()[0];
            if(state.chart.chart_type === 'line')
                state.peity_options.fill = NETDATA.themes.current.background;
            else
                state.peity_options.fill = NETDATA.colorLuminance(state.chartColors()[0], NETDATA.chartDefaults.fill_luminance);
        }

        $(state.peity_instance).peity('line', state.peity_options);
        return true;
    };

    NETDATA.peityChartCreate = function(state, data) {
        state.peity_instance = document.createElement('div');
        state.element_chart.appendChild(state.peity_instance);

        var self = $(state.element);
        state.peity_options = {
            stroke: NETDATA.themes.current.foreground,
            strokeWidth: self.data('peity-strokewidth') || 1,
            width: state.chartWidth(),
            height: state.chartHeight(),
            fill: NETDATA.themes.current.foreground
        };

        NETDATA.peityChartUpdate(state, data);
        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // sparkline

    NETDATA.sparklineInitialize = function(callback) {
        if(typeof netdataNoSparklines === 'undefined' || !netdataNoSparklines) {
            $.ajax({
                url: NETDATA.sparkline_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('sparkline', NETDATA.sparkline_js);
            })
            .fail(function() {
                NETDATA.chartLibraries.sparkline.enabled = false;
                NETDATA.error(100, NETDATA.sparkline_js);
            })
            .always(function() {
                if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.sparkline.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.sparklineChartUpdate = function(state, data) {
        state.sparkline_options.width = state.chartWidth();
        state.sparkline_options.height = state.chartHeight();

        $(state.element_chart).sparkline(data.result, state.sparkline_options);
        return true;
    };

    NETDATA.sparklineChartCreate = function(state, data) {
        var self = $(state.element);
        var type = self.data('sparkline-type') || 'line';
        var lineColor = self.data('sparkline-linecolor') || state.chartColors()[0];
        var fillColor = self.data('sparkline-fillcolor') || ((state.chart.chart_type === 'line')?NETDATA.themes.current.background:NETDATA.colorLuminance(lineColor, NETDATA.chartDefaults.fill_luminance));
        var chartRangeMin = self.data('sparkline-chartrangemin') || undefined;
        var chartRangeMax = self.data('sparkline-chartrangemax') || undefined;
        var composite = self.data('sparkline-composite') || undefined;
        var enableTagOptions = self.data('sparkline-enabletagoptions') || undefined;
        var tagOptionPrefix = self.data('sparkline-tagoptionprefix') || undefined;
        var tagValuesAttribute = self.data('sparkline-tagvaluesattribute') || undefined;
        var disableHiddenCheck = self.data('sparkline-disablehiddencheck') || undefined;
        var defaultPixelsPerValue = self.data('sparkline-defaultpixelspervalue') || undefined;
        var spotColor = self.data('sparkline-spotcolor') || undefined;
        var minSpotColor = self.data('sparkline-minspotcolor') || undefined;
        var maxSpotColor = self.data('sparkline-maxspotcolor') || undefined;
        var spotRadius = self.data('sparkline-spotradius') || undefined;
        var valueSpots = self.data('sparkline-valuespots') || undefined;
        var highlightSpotColor = self.data('sparkline-highlightspotcolor') || undefined;
        var highlightLineColor = self.data('sparkline-highlightlinecolor') || undefined;
        var lineWidth = self.data('sparkline-linewidth') || undefined;
        var normalRangeMin = self.data('sparkline-normalrangemin') || undefined;
        var normalRangeMax = self.data('sparkline-normalrangemax') || undefined;
        var drawNormalOnTop = self.data('sparkline-drawnormalontop') || undefined;
        var xvalues = self.data('sparkline-xvalues') || undefined;
        var chartRangeClip = self.data('sparkline-chartrangeclip') || undefined;
        var chartRangeMinX = self.data('sparkline-chartrangeminx') || undefined;
        var chartRangeMaxX = self.data('sparkline-chartrangemaxx') || undefined;
        var disableInteraction = self.data('sparkline-disableinteraction') || false;
        var disableTooltips = self.data('sparkline-disabletooltips') || false;
        var disableHighlight = self.data('sparkline-disablehighlight') || false;
        var highlightLighten = self.data('sparkline-highlightlighten') || 1.4;
        var highlightColor = self.data('sparkline-highlightcolor') || undefined;
        var tooltipContainer = self.data('sparkline-tooltipcontainer') || undefined;
        var tooltipClassname = self.data('sparkline-tooltipclassname') || undefined;
        var tooltipFormat = self.data('sparkline-tooltipformat') || undefined;
        var tooltipPrefix = self.data('sparkline-tooltipprefix') || undefined;
        var tooltipSuffix = self.data('sparkline-tooltipsuffix') || ' ' + state.units;
        var tooltipSkipNull = self.data('sparkline-tooltipskipnull') || true;
        var tooltipValueLookups = self.data('sparkline-tooltipvaluelookups') || undefined;
        var tooltipFormatFieldlist = self.data('sparkline-tooltipformatfieldlist') || undefined;
        var tooltipFormatFieldlistKey = self.data('sparkline-tooltipformatfieldlistkey') || undefined;
        var numberFormatter = self.data('sparkline-numberformatter') || function(n){ return n.toFixed(2); };
        var numberDigitGroupSep = self.data('sparkline-numberdigitgroupsep') || undefined;
        var numberDecimalMark = self.data('sparkline-numberdecimalmark') || undefined;
        var numberDigitGroupCount = self.data('sparkline-numberdigitgroupcount') || undefined;
        var animatedZooms = self.data('sparkline-animatedzooms') || false;

        if(spotColor === 'disable') spotColor='';
        if(minSpotColor === 'disable') minSpotColor='';
        if(maxSpotColor === 'disable') maxSpotColor='';

        // state.log('sparkline type ' + type + ', lineColor: ' + lineColor + ', fillColor: ' + fillColor);

        state.sparkline_options = {
            type: type,
            lineColor: lineColor,
            fillColor: fillColor,
            chartRangeMin: chartRangeMin,
            chartRangeMax: chartRangeMax,
            composite: composite,
            enableTagOptions: enableTagOptions,
            tagOptionPrefix: tagOptionPrefix,
            tagValuesAttribute: tagValuesAttribute,
            disableHiddenCheck: disableHiddenCheck,
            defaultPixelsPerValue: defaultPixelsPerValue,
            spotColor: spotColor,
            minSpotColor: minSpotColor,
            maxSpotColor: maxSpotColor,
            spotRadius: spotRadius,
            valueSpots: valueSpots,
            highlightSpotColor: highlightSpotColor,
            highlightLineColor: highlightLineColor,
            lineWidth: lineWidth,
            normalRangeMin: normalRangeMin,
            normalRangeMax: normalRangeMax,
            drawNormalOnTop: drawNormalOnTop,
            xvalues: xvalues,
            chartRangeClip: chartRangeClip,
            chartRangeMinX: chartRangeMinX,
            chartRangeMaxX: chartRangeMaxX,
            disableInteraction: disableInteraction,
            disableTooltips: disableTooltips,
            disableHighlight: disableHighlight,
            highlightLighten: highlightLighten,
            highlightColor: highlightColor,
            tooltipContainer: tooltipContainer,
            tooltipClassname: tooltipClassname,
            tooltipChartTitle: state.title,
            tooltipFormat: tooltipFormat,
            tooltipPrefix: tooltipPrefix,
            tooltipSuffix: tooltipSuffix,
            tooltipSkipNull: tooltipSkipNull,
            tooltipValueLookups: tooltipValueLookups,
            tooltipFormatFieldlist: tooltipFormatFieldlist,
            tooltipFormatFieldlistKey: tooltipFormatFieldlistKey,
            numberFormatter: numberFormatter,
            numberDigitGroupSep: numberDigitGroupSep,
            numberDecimalMark: numberDecimalMark,
            numberDigitGroupCount: numberDigitGroupCount,
            animatedZooms: animatedZooms,
            width: state.chartWidth(),
            height: state.chartHeight()
        };

        $(state.element_chart).sparkline(data.result, state.sparkline_options);
        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // dygraph

    NETDATA.dygraph = {
        smooth: false
    };

    NETDATA.dygraphToolboxPanAndZoom = function(state, after, before) {
        if(after < state.netdata_first)
            after = state.netdata_first;

        if(before > state.netdata_last)
            before = state.netdata_last;

        state.setMode('zoom');
        state.globalSelectionSyncStop();
        state.globalSelectionSyncDelay();
        state.dygraph_user_action = true;
        state.dygraph_force_zoom = true;
        state.updateChartPanOrZoom(after, before);
        NETDATA.globalPanAndZoom.setMaster(state, after, before);
    };

    NETDATA.dygraphSetSelection = function(state, t) {
        if(typeof state.dygraph_instance !== 'undefined') {
            var r = state.calculateRowForTime(t);
            if(r !== -1)
                state.dygraph_instance.setSelection(r);
            else {
                state.dygraph_instance.clearSelection();
                state.legendShowUndefined();
            }
        }

        return true;
    };

    NETDATA.dygraphClearSelection = function(state) {
        if(typeof state.dygraph_instance !== 'undefined') {
            state.dygraph_instance.clearSelection();
        }
        return true;
    };

    NETDATA.dygraphSmoothInitialize = function(callback) {
        $.ajax({
            url: NETDATA.dygraph_smooth_js,
            cache: true,
            dataType: "script",
            xhrFields: { withCredentials: true } // required for the cookie
        })
        .done(function() {
            NETDATA.dygraph.smooth = true;
            smoothPlotter.smoothing = 0.3;
        })
        .fail(function() {
            NETDATA.dygraph.smooth = false;
        })
        .always(function() {
            if(typeof callback === "function")
                return callback();
        });
    };

    NETDATA.dygraphInitialize = function(callback) {
        if(typeof netdataNoDygraphs === 'undefined' || !netdataNoDygraphs) {
            $.ajax({
                url: NETDATA.dygraph_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('dygraph', NETDATA.dygraph_js);
            })
            .fail(function() {
                NETDATA.chartLibraries.dygraph.enabled = false;
                NETDATA.error(100, NETDATA.dygraph_js);
            })
            .always(function() {
                if(NETDATA.chartLibraries.dygraph.enabled === true && NETDATA.options.current.smooth_plot === true)
                    NETDATA.dygraphSmoothInitialize(callback);
                else if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.dygraph.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.dygraphChartUpdate = function(state, data) {
        var dygraph = state.dygraph_instance;

        if(typeof dygraph === 'undefined')
            return NETDATA.dygraphChartCreate(state, data);

        // when the chart is not visible, and hidden
        // if there is a window resize, dygraph detects
        // its element size as 0x0.
        // this will make it re-appear properly

        if(state.tm.last_unhidden > state.dygraph_last_rendered)
            dygraph.resize();

        var options = {
                file: data.result.data,
                colors: state.chartColors(),
                labels: data.result.labels,
                labelsDivWidth: state.chartWidth() - 70,
                visibility: state.dimensions_visibility.selected2BooleanArray(state.data.dimension_names)
        };

        if(state.dygraph_force_zoom === true) {
            if(NETDATA.options.debug.dygraph === true || state.debug === true)
                state.log('dygraphChartUpdate() forced zoom update');

            options.dateWindow = (state.requested_padding !== null)?[ state.view_after, state.view_before ]:null;
            options.isZoomedIgnoreProgrammaticZoom = true;
            state.dygraph_force_zoom = false;
        }
        else if(state.current.name !== 'auto') {
            if(NETDATA.options.debug.dygraph === true || state.debug === true)
                state.log('dygraphChartUpdate() loose update');
        }
        else {
            if(NETDATA.options.debug.dygraph === true || state.debug === true)
                state.log('dygraphChartUpdate() strict update');

            options.dateWindow = (state.requested_padding !== null)?[ state.view_after, state.view_before ]:null;
            options.isZoomedIgnoreProgrammaticZoom = true;
        }

        options.valueRange = state.dygraph_options.valueRange;

        var oldMax = null, oldMin = null;
        if(state.__commonMin !== null) {
            state.data.min = state.dygraph_instance.axes_[0].extremeRange[0];
            oldMin = options.valueRange[0] = NETDATA.commonMin.get(state);
        }
        if(state.__commonMax !== null) {
            state.data.max = state.dygraph_instance.axes_[0].extremeRange[1];
            oldMax = options.valueRange[1] = NETDATA.commonMax.get(state);
        }

        if(state.dygraph_smooth_eligible === true) {
            if((NETDATA.options.current.smooth_plot === true && state.dygraph_options.plotter !== smoothPlotter)
                || (NETDATA.options.current.smooth_plot === false && state.dygraph_options.plotter === smoothPlotter)) {
                NETDATA.dygraphChartCreate(state, data);
                return;
            }
        }

        dygraph.updateOptions(options);

        var redraw = false;
        if(oldMin !== null && oldMin > state.dygraph_instance.axes_[0].extremeRange[0]) {
            state.data.min = state.dygraph_instance.axes_[0].extremeRange[0];
            options.valueRange[0] = NETDATA.commonMin.get(state);
            redraw = true;
        }
        if(oldMax !== null && oldMax < state.dygraph_instance.axes_[0].extremeRange[1]) {
            state.data.max = state.dygraph_instance.axes_[0].extremeRange[1];
            options.valueRange[1] = NETDATA.commonMax.get(state);
            redraw = true;
        }

        if(redraw === true) {
            // state.log('forcing redraw to adapt to common- min/max');
            dygraph.updateOptions(options);
        }

        state.dygraph_last_rendered = Date.now();
        return true;
    };

    NETDATA.dygraphChartCreate = function(state, data) {
        if(NETDATA.options.debug.dygraph === true || state.debug === true)
            state.log('dygraphChartCreate()');

        var self = $(state.element);

        var chart_type = self.data('dygraph-type') || state.chart.chart_type;
        if(chart_type === 'stacked' && data.dimensions === 1) chart_type = 'area';

        var highlightCircleSize = (NETDATA.chartLibraries.dygraph.isSparkline(state) === true)?3:4;

        var smooth = (NETDATA.dygraph.smooth === true)
            ?(self.data('dygraph-smooth') || (chart_type === 'line' && NETDATA.chartLibraries.dygraph.isSparkline(state) === false))
            :false;

        state.dygraph_options = {
            colors:                 self.data('dygraph-colors') || state.chartColors(),

            // leave a few pixels empty on the right of the chart
            rightGap:               self.data('dygraph-rightgap')
                                    || 5,

            showRangeSelector:      self.data('dygraph-showrangeselector')
                                    || false,

            showRoller:             self.data('dygraph-showroller')
                                    || false,

            title:                  self.data('dygraph-title')
                                    || state.title,

            titleHeight:            self.data('dygraph-titleheight')
                                    || 19,

            legend:                 self.data('dygraph-legend')
                                    || 'always', // we need this to get selection events

            labels:                 data.result.labels,

            labelsDiv:              self.data('dygraph-labelsdiv')
                                    || state.element_legend_childs.hidden,

            labelsDivStyles:        self.data('dygraph-labelsdivstyles')
                                    || { 'fontSize':'1px' },

            labelsDivWidth:         self.data('dygraph-labelsdivwidth')
                                    || state.chartWidth() - 70,

            labelsSeparateLines:    self.data('dygraph-labelsseparatelines')
                                    || true,

            labelsShowZeroValues:   self.data('dygraph-labelsshowzerovalues')
                                    || true,

            labelsKMB:              false,
            labelsKMG2:             false,

            showLabelsOnHighlight:  self.data('dygraph-showlabelsonhighlight')
                                    || true,

            hideOverlayOnMouseOut:  self.data('dygraph-hideoverlayonmouseout')
                                    || true,

            includeZero:            self.data('dygraph-includezero')
                                    || (chart_type === 'stacked'),

            xRangePad:              self.data('dygraph-xrangepad')
                                    || 0,

            yRangePad:              self.data('dygraph-yrangepad')
                                    || 1,

            valueRange:             self.data('dygraph-valuerange')
                                    || [ null, null ],

            ylabel:                 state.units,

            yLabelWidth:            self.data('dygraph-ylabelwidth')
                                    || 12,

                                    // the function to plot the chart
            plotter:                null,

                                    // The width of the lines connecting data points.
                                    // This can be used to increase the contrast or some graphs.
            strokeWidth:            self.data('dygraph-strokewidth')
                                    || ((chart_type === 'stacked')?0.1:((smooth === true)?1.5:0.7)),

            strokePattern:          self.data('dygraph-strokepattern')
                                    || undefined,

                                    // The size of the dot to draw on each point in pixels (see drawPoints).
                                    // A dot is always drawn when a point is "isolated",
                                    // i.e. there is a missing point on either side of it.
                                    // This also controls the size of those dots.
            drawPoints:             self.data('dygraph-drawpoints')
                                    || false,

                                    // Draw points at the edges of gaps in the data.
                                    // This improves visibility of small data segments or other data irregularities.
            drawGapEdgePoints:      self.data('dygraph-drawgapedgepoints')
                                    || true,

            connectSeparatedPoints: self.data('dygraph-connectseparatedpoints')
                                    || false,

            pointSize:              self.data('dygraph-pointsize')
                                    || 1,

                                    // enabling this makes the chart with little square lines
            stepPlot:               self.data('dygraph-stepplot')
                                    || false,

                                    // Draw a border around graph lines to make crossing lines more easily
                                    // distinguishable. Useful for graphs with many lines.
            strokeBorderColor:      self.data('dygraph-strokebordercolor')
                                    || NETDATA.themes.current.background,

            strokeBorderWidth:      self.data('dygraph-strokeborderwidth')
                                    || (chart_type === 'stacked')?0.0:0.0,

            fillGraph:              self.data('dygraph-fillgraph')
                                    || (chart_type === 'area' || chart_type === 'stacked'),

            fillAlpha:              self.data('dygraph-fillalpha')
                                    || ((chart_type === 'stacked')
                                        ?NETDATA.options.current.color_fill_opacity_stacked
                                        :NETDATA.options.current.color_fill_opacity_area),

            stackedGraph:           self.data('dygraph-stackedgraph')
                                    || (chart_type === 'stacked'),

            stackedGraphNaNFill:    self.data('dygraph-stackedgraphnanfill')
                                    || 'none',

            drawAxis:               self.data('dygraph-drawaxis')
                                    || true,

            axisLabelFontSize:      self.data('dygraph-axislabelfontsize')
                                    || 10,

            axisLineColor:          self.data('dygraph-axislinecolor')
                                    || NETDATA.themes.current.axis,

            axisLineWidth:          self.data('dygraph-axislinewidth')
                                    || 1.0,

            drawGrid:               self.data('dygraph-drawgrid')
                                    || true,

            gridLinePattern:        self.data('dygraph-gridlinepattern')
                                    || null,

            gridLineWidth:          self.data('dygraph-gridlinewidth')
                                    || 1.0,

            gridLineColor:          self.data('dygraph-gridlinecolor')
                                    || NETDATA.themes.current.grid,

            maxNumberWidth:         self.data('dygraph-maxnumberwidth')
                                    || 8,

            sigFigs:                self.data('dygraph-sigfigs')
                                    || null,

            digitsAfterDecimal:     self.data('dygraph-digitsafterdecimal')
                                    || 2,

            valueFormatter:         self.data('dygraph-valueformatter')
                                    || undefined,

            highlightCircleSize:    self.data('dygraph-highlightcirclesize')
                                    || highlightCircleSize,

            highlightSeriesOpts:    self.data('dygraph-highlightseriesopts')
                                    || null, // TOO SLOW: { strokeWidth: 1.5 },

            highlightSeriesBackgroundAlpha: self.data('dygraph-highlightseriesbackgroundalpha')
                                    || null, // TOO SLOW: (chart_type === 'stacked')?0.7:0.5,

            pointClickCallback:     self.data('dygraph-pointclickcallback')
                                    || undefined,

            visibility:             state.dimensions_visibility.selected2BooleanArray(state.data.dimension_names),

            axes: {
                x: {
                    pixelsPerLabel: 50,
                    ticker: Dygraph.dateTicker,
                    axisLabelFormatter: function (d, gran) {
                        void(gran);
                        return NETDATA.zeropad(d.getHours()) + ":" + NETDATA.zeropad(d.getMinutes()) + ":" + NETDATA.zeropad(d.getSeconds());
                    }
                },
                y: {
                    pixelsPerLabel: 15,
                    axisLabelFormatter: function (y) {

                        // unfortunately, we have to call this every single time
                        state.legendFormatValueDecimalsFromMinMax(
                            this.axes_[0].extremeRange[0],
                            this.axes_[0].extremeRange[1]
                        );

                        return state.legendFormatValue(y);
                    }
                }
            },
            legendFormatter: function(data) {
                var elements = state.element_legend_childs;

                // if the hidden div is not there
                // we are not managing the legend
                if(elements.hidden === null) return;

                if (typeof data.x !== 'undefined') {
                    state.legendSetDate(data.x);
                    var i = data.series.length;
                    while(i--) {
                        var series = data.series[i];
                        if(series.isVisible === true)
                            state.legendSetLabelValue(series.label, series.y);
                        else
                            state.legendSetLabelValue(series.label, null);
                    }
                }

                return '';
            },
            drawCallback: function(dygraph, is_initial) {
                if(state.current.name !== 'auto' && state.dygraph_user_action === true) {
                    state.dygraph_user_action = false;

                    var x_range = dygraph.xAxisRange();
                    var after = Math.round(x_range[0]);
                    var before = Math.round(x_range[1]);

                    if(NETDATA.options.debug.dygraph === true)
                        state.log('dygraphDrawCallback(dygraph, ' + is_initial + '): ' + (after / 1000).toString() + ' - ' + (before / 1000).toString());

                    if(before <= state.netdata_last && after >= state.netdata_first)
                        state.updateChartPanOrZoom(after, before);
                }
            },
            zoomCallback: function(minDate, maxDate, yRanges) {
                void(yRanges);

                if(NETDATA.options.debug.dygraph === true)
                    state.log('dygraphZoomCallback()');

                state.globalSelectionSyncStop();
                state.globalSelectionSyncDelay();
                state.setMode('zoom');

                // refresh it to the greatest possible zoom level
                state.dygraph_user_action = true;
                state.dygraph_force_zoom = true;
                state.updateChartPanOrZoom(minDate, maxDate);
            },
            highlightCallback: function(event, x, points, row, seriesName) {
                void(seriesName);

                if(NETDATA.options.debug.dygraph === true || state.debug === true)
                    state.log('dygraphHighlightCallback()');

                state.pauseChart();

                // there is a bug in dygraph when the chart is zoomed enough
                // the time it thinks is selected is wrong
                // here we calculate the time t based on the row number selected
                // which is ok
                // var t = state.data_after + row * state.data_update_every;
                // console.log('row = ' + row + ', x = ' + x + ', t = ' + t + ' ' + ((t === x)?'SAME':(Math.abs(x-t)<=state.data_update_every)?'SIMILAR':'DIFFERENT') + ', rows in db: ' + state.data_points + ' visible(x) = ' + state.timeIsVisible(x) + ' visible(t) = ' + state.timeIsVisible(t) + ' r(x) = ' + state.calculateRowForTime(x) + ' r(t) = ' + state.calculateRowForTime(t) + ' range: ' + state.data_after + ' - ' + state.data_before + ' real: ' + state.data.after + ' - ' + state.data.before + ' every: ' + state.data_update_every);

                state.globalSelectionSync(x);

                // fix legend zIndex using the internal structures of dygraph legend module
                // this works, but it is a hack!
                // state.dygraph_instance.plugins_[0].plugin.legend_div_.style.zIndex = 10000;
            },
            unhighlightCallback: function(event) {
                void(event);

                if(NETDATA.options.debug.dygraph === true || state.debug === true)
                    state.log('dygraphUnhighlightCallback()');

                state.unpauseChart();
                state.globalSelectionSyncStop();
            },
            interactionModel : {
                mousedown: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.mousedown()');

                    state.dygraph_user_action = true;
                    state.globalSelectionSyncStop();

                    if(NETDATA.options.debug.dygraph === true)
                        state.log('dygraphMouseDown()');

                    // Right-click should not initiate a zoom.
                    if(event.button && event.button === 2) return;

                    context.initializeMouseDown(event, dygraph, context);

                    if(event.button && event.button === 1) {
                        if (event.altKey || event.shiftKey) {
                            state.setMode('pan');
                            state.globalSelectionSyncDelay();
                            Dygraph.startPan(event, dygraph, context);
                        }
                        else {
                            state.setMode('zoom');
                            state.globalSelectionSyncDelay();
                            Dygraph.startZoom(event, dygraph, context);
                        }
                    }
                    else {
                        if (event.altKey || event.shiftKey) {
                            state.setMode('zoom');
                            state.globalSelectionSyncDelay();
                            Dygraph.startZoom(event, dygraph, context);
                        }
                        else {
                            state.setMode('pan');
                            state.globalSelectionSyncDelay();
                            Dygraph.startPan(event, dygraph, context);
                        }
                    }
                },
                mousemove: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.mousemove()');

                    if(context.isPanning) {
                        state.dygraph_user_action = true;
                        state.globalSelectionSyncStop();
                        state.globalSelectionSyncDelay();
                        state.setMode('pan');
                        context.is2DPan = false;
                        Dygraph.movePan(event, dygraph, context);
                    }
                    else if(context.isZooming) {
                        state.dygraph_user_action = true;
                        state.globalSelectionSyncStop();
                        state.globalSelectionSyncDelay();
                        state.setMode('zoom');
                        Dygraph.moveZoom(event, dygraph, context);
                    }
                },
                mouseup: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.mouseup()');

                    if (context.isPanning) {
                        state.dygraph_user_action = true;
                        state.globalSelectionSyncDelay();
                        Dygraph.endPan(event, dygraph, context);
                    }
                    else if (context.isZooming) {
                        state.dygraph_user_action = true;
                        state.globalSelectionSyncDelay();
                        Dygraph.endZoom(event, dygraph, context);
                    }
                },
                click: function(event, dygraph, context) {
                    void(dygraph);
                    void(context);

                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.click()');

                    event.preventDefault();
                },
                dblclick: function(event, dygraph, context) {
                    void(event);
                    void(dygraph);
                    void(context);

                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.dblclick()');
                    NETDATA.resetAllCharts(state);
                },
                wheel: function(event, dygraph, context) {
                    void(context);

                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.wheel()');

                    // Take the offset of a mouse event on the dygraph canvas and
                    // convert it to a pair of percentages from the bottom left.
                    // (Not top left, bottom is where the lower value is.)
                    function offsetToPercentage(g, offsetX, offsetY) {
                        // This is calculating the pixel offset of the leftmost date.
                        var xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0];
                        var yar0 = g.yAxisRange(0);

                        // This is calculating the pixel of the highest value. (Top pixel)
                        var yOffset = g.toDomCoords(null, yar0[1])[1];

                        // x y w and h are relative to the corner of the drawing area,
                        // so that the upper corner of the drawing area is (0, 0).
                        var x = offsetX - xOffset;
                        var y = offsetY - yOffset;

                        // This is computing the rightmost pixel, effectively defining the
                        // width.
                        var w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset;

                        // This is computing the lowest pixel, effectively defining the height.
                        var h = g.toDomCoords(null, yar0[0])[1] - yOffset;

                        // Percentage from the left.
                        var xPct = w === 0 ? 0 : (x / w);
                        // Percentage from the top.
                        var yPct = h === 0 ? 0 : (y / h);

                        // The (1-) part below changes it from "% distance down from the top"
                        // to "% distance up from the bottom".
                        return [xPct, (1-yPct)];
                    }

                    // Adjusts [x, y] toward each other by zoomInPercentage%
                    // Split it so the left/bottom axis gets xBias/yBias of that change and
                    // tight/top gets (1-xBias)/(1-yBias) of that change.
                    //
                    // If a bias is missing it splits it down the middle.
                    function zoomRange(g, zoomInPercentage, xBias, yBias) {
                        xBias = xBias || 0.5;
                        yBias = yBias || 0.5;

                        function adjustAxis(axis, zoomInPercentage, bias) {
                            var delta = axis[1] - axis[0];
                            var increment = delta * zoomInPercentage;
                            var foo = [increment * bias, increment * (1-bias)];

                            return [ axis[0] + foo[0], axis[1] - foo[1] ];
                        }

                        var yAxes = g.yAxisRanges();
                        var newYAxes = [];
                        for (var i = 0; i < yAxes.length; i++) {
                            newYAxes[i] = adjustAxis(yAxes[i], zoomInPercentage, yBias);
                        }

                        return adjustAxis(g.xAxisRange(), zoomInPercentage, xBias);
                    }

                    if(event.altKey || event.shiftKey) {
                        state.dygraph_user_action = true;

                        state.globalSelectionSyncStop();
                        state.globalSelectionSyncDelay();

                        // http://dygraphs.com/gallery/interaction-api.js
                        var normal_def;
                        if(typeof event.wheelDelta === 'number' && !isNaN(event.wheelDelta))
                            // chrome
                            normal_def = event.wheelDelta / 40;
                        else
                            // firefox
                            normal_def = event.deltaY * -1.2;

                        var normal = (event.detail) ? event.detail * -1 : normal_def;
                        var percentage = normal / 50;

                        if (!(event.offsetX && event.offsetY)){
                            event.offsetX = event.layerX - event.target.offsetLeft;
                            event.offsetY = event.layerY - event.target.offsetTop;
                        }

                        var percentages = offsetToPercentage(dygraph, event.offsetX, event.offsetY);
                        var xPct = percentages[0];
                        var yPct = percentages[1];

                        var new_x_range = zoomRange(dygraph, percentage, xPct, yPct);
                        var after = new_x_range[0];
                        var before = new_x_range[1];

                        var first = state.netdata_first + state.data_update_every;
                        var last = state.netdata_last + state.data_update_every;

                        if(before > last) {
                            after -= (before - last);
                            before = last;
                        }
                        if(after < first) {
                            after = first;
                        }

                        state.setMode('zoom');
                        if(state.updateChartPanOrZoom(after, before) === true)
                            dygraph.updateOptions({ dateWindow: [ after, before ] });

                        event.preventDefault();
                    }
                },
                touchstart: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.touchstart()');

                    state.dygraph_user_action = true;
                    state.setMode('zoom');
                    state.pauseChart();

                    Dygraph.defaultInteractionModel.touchstart(event, dygraph, context);

                    // we overwrite the touch directions at the end, to overwrite
                    // the internal default of dygraph
                    context.touchDirections = { x: true, y: false };

                    state.dygraph_last_touch_start = Date.now();
                    state.dygraph_last_touch_move = 0;

                    if(typeof event.touches[0].pageX === 'number')
                        state.dygraph_last_touch_page_x = event.touches[0].pageX;
                    else
                        state.dygraph_last_touch_page_x = 0;
                },
                touchmove: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.touchmove()');

                    state.dygraph_user_action = true;
                    Dygraph.defaultInteractionModel.touchmove(event, dygraph, context);

                    state.dygraph_last_touch_move = Date.now();
                },
                touchend: function(event, dygraph, context) {
                    if(NETDATA.options.debug.dygraph === true || state.debug === true)
                        state.log('interactionModel.touchend()');

                    state.dygraph_user_action = true;
                    Dygraph.defaultInteractionModel.touchend(event, dygraph, context);

                    // if it didn't move, it is a selection
                    if(state.dygraph_last_touch_move === 0 && state.dygraph_last_touch_page_x !== 0) {
                        // internal api of dygraph
                        var pct = (state.dygraph_last_touch_page_x - (dygraph.plotter_.area.x + state.element.getBoundingClientRect().left)) / dygraph.plotter_.area.w;
                        var t = Math.round(state.data_after + (state.data_before - state.data_after) * pct);
                        if(NETDATA.dygraphSetSelection(state, t) === true)
                            state.globalSelectionSync(t);
                    }

                    // if it was double tap within double click time, reset the charts
                    var now = Date.now();
                    if(typeof state.dygraph_last_touch_end !== 'undefined') {
                        if(state.dygraph_last_touch_move === 0) {
                            var dt = now - state.dygraph_last_touch_end;
                            if(dt <= NETDATA.options.current.double_click_speed)
                                NETDATA.resetAllCharts(state);
                        }
                    }

                    // remember the timestamp of the last touch end
                    state.dygraph_last_touch_end = now;
                }
            }
        };

        if(NETDATA.chartLibraries.dygraph.isSparkline(state)) {
            state.dygraph_options.drawGrid = false;
            state.dygraph_options.drawAxis = false;
            state.dygraph_options.title = undefined;
            state.dygraph_options.ylabel = undefined;
            state.dygraph_options.yLabelWidth = 0;
            state.dygraph_options.labelsDivWidth = 120;
            state.dygraph_options.labelsDivStyles.width = '120px';
            state.dygraph_options.labelsSeparateLines = true;
            state.dygraph_options.rightGap = 0;
            state.dygraph_options.yRangePad = 1;
        }

        if(smooth === true) {
            state.dygraph_smooth_eligible = true;

            if(NETDATA.options.current.smooth_plot === true)
                state.dygraph_options.plotter = smoothPlotter;
        }
        else state.dygraph_smooth_eligible = false;

        state.dygraph_instance = new Dygraph(state.element_chart,
            data.result.data, state.dygraph_options);

        state.dygraph_force_zoom = false;
        state.dygraph_user_action = false;
        state.dygraph_last_rendered = Date.now();

        if(typeof state.dygraph_instance.axes_[0].extremeRange !== 'undefined') {
            state.__commonMin = self.data('common-min') || null;
            state.__commonMax = self.data('common-max') || null;
        }
        else {
            state.log('incompatible version of Dygraph detected');
            state.__commonMin = null;
            state.__commonMax = null;
        }

        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // morris

    NETDATA.morrisInitialize = function(callback) {
        if(typeof netdataNoMorris === 'undefined' || !netdataNoMorris) {

            // morris requires raphael
            if(!NETDATA.chartLibraries.raphael.initialized) {
                if(NETDATA.chartLibraries.raphael.enabled) {
                    NETDATA.raphaelInitialize(function() {
                        NETDATA.morrisInitialize(callback);
                    });
                }
                else {
                    NETDATA.chartLibraries.morris.enabled = false;
                    if(typeof callback === "function")
                        return callback();
                }
            }
            else {
                NETDATA._loadCSS(NETDATA.morris_css);

                $.ajax({
                    url: NETDATA.morris_js,
                    cache: true,
                    dataType: "script",
                    xhrFields: { withCredentials: true } // required for the cookie
                })
                .done(function() {
                    NETDATA.registerChartLibrary('morris', NETDATA.morris_js);
                })
                .fail(function() {
                    NETDATA.chartLibraries.morris.enabled = false;
                    NETDATA.error(100, NETDATA.morris_js);
                })
                .always(function() {
                    if(typeof callback === "function")
                        return callback();
                });
            }
        }
        else {
            NETDATA.chartLibraries.morris.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.morrisChartUpdate = function(state, data) {
        state.morris_instance.setData(data.result.data);
        return true;
    };

    NETDATA.morrisChartCreate = function(state, data) {

        state.morris_options = {
                element: state.element_chart.id,
                data: data.result.data,
                xkey: 'time',
                ykeys: data.dimension_names,
                labels: data.dimension_names,
                lineWidth: 2,
                pointSize: 3,
                smooth: true,
                hideHover: 'auto',
                parseTime: true,
                continuousLine: false,
                behaveLikeLine: false
        };

        if(state.chart.chart_type === 'line')
            state.morris_instance = new Morris.Line(state.morris_options);

        else if(state.chart.chart_type === 'area') {
            state.morris_options.behaveLikeLine = true;
            state.morris_instance = new Morris.Area(state.morris_options);
        }
        else // stacked
            state.morris_instance = new Morris.Area(state.morris_options);

        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // raphael

    NETDATA.raphaelInitialize = function(callback) {
        if(typeof netdataStopRaphael === 'undefined' || !netdataStopRaphael) {
            $.ajax({
                url: NETDATA.raphael_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('raphael', NETDATA.raphael_js);
            })
            .fail(function() {
                NETDATA.chartLibraries.raphael.enabled = false;
                NETDATA.error(100, NETDATA.raphael_js);
            })
            .always(function() {
                if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.raphael.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.raphaelChartUpdate = function(state, data) {
        $(state.element_chart).raphael(data.result, {
            width: state.chartWidth(),
            height: state.chartHeight()
        });

        return false;
    };

    NETDATA.raphaelChartCreate = function(state, data) {
        $(state.element_chart).raphael(data.result, {
            width: state.chartWidth(),
            height: state.chartHeight()
        });

        return false;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // C3

    NETDATA.c3Initialize = function(callback) {
        if(typeof netdataNoC3 === 'undefined' || !netdataNoC3) {

            // C3 requires D3
            if(!NETDATA.chartLibraries.d3.initialized) {
                if(NETDATA.chartLibraries.d3.enabled) {
                    NETDATA.d3Initialize(function() {
                        NETDATA.c3Initialize(callback);
                    });
                }
                else {
                    NETDATA.chartLibraries.c3.enabled = false;
                    if(typeof callback === "function")
                        return callback();
                }
            }
            else {
                NETDATA._loadCSS(NETDATA.c3_css);

                $.ajax({
                    url: NETDATA.c3_js,
                    cache: true,
                    dataType: "script",
                    xhrFields: { withCredentials: true } // required for the cookie
                })
                .done(function() {
                    NETDATA.registerChartLibrary('c3', NETDATA.c3_js);
                })
                .fail(function() {
                    NETDATA.chartLibraries.c3.enabled = false;
                    NETDATA.error(100, NETDATA.c3_js);
                })
                .always(function() {
                    if(typeof callback === "function")
                        return callback();
                });
            }
        }
        else {
            NETDATA.chartLibraries.c3.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.c3ChartUpdate = function(state, data) {
        state.c3_instance.destroy();
        return NETDATA.c3ChartCreate(state, data);

        //state.c3_instance.load({
        //  rows: data.result,
        //  unload: true
        //});

        //return true;
    };

    NETDATA.c3ChartCreate = function(state, data) {

        state.element_chart.id = 'c3-' + state.uuid;
        // console.log('id = ' + state.element_chart.id);

        state.c3_instance = c3.generate({
            bindto: '#' + state.element_chart.id,
            size: {
                width: state.chartWidth(),
                height: state.chartHeight()
            },
            color: {
                pattern: state.chartColors()
            },
            data: {
                x: 'time',
                rows: data.result,
                type: (state.chart.chart_type === 'line')?'spline':'area-spline'
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: function(x) {
                            return NETDATA.zeropad(x.getHours()) + ":" + NETDATA.zeropad(x.getMinutes()) + ":" + NETDATA.zeropad(x.getSeconds());
                        }
                    }
                }
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: true
                }
            },
            point: {
                show: false
            },
            line: {
                connectNull: false
            },
            transition: {
                duration: 0
            },
            interaction: {
                enabled: true
            }
        });

        // console.log(state.c3_instance);

        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // D3

    NETDATA.d3Initialize = function(callback) {
        if(typeof netdataStopD3 === 'undefined' || !netdataStopD3) {
            $.ajax({
                url: NETDATA.d3_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('d3', NETDATA.d3_js);
            })
            .fail(function() {
                NETDATA.chartLibraries.d3.enabled = false;
                NETDATA.error(100, NETDATA.d3_js);
            })
            .always(function() {
                if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.d3.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.d3ChartUpdate = function(state, data) {
        void(state);
        void(data);

        return false;
    };

    NETDATA.d3ChartCreate = function(state, data) {
        void(state);
        void(data);

        return false;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // google charts

    NETDATA.googleInitialize = function(callback) {
        if(typeof netdataNoGoogleCharts === 'undefined' || !netdataNoGoogleCharts) {
            $.ajax({
                url: NETDATA.google_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
            .done(function() {
                NETDATA.registerChartLibrary('google', NETDATA.google_js);
                google.load('visualization', '1.1', {
                    'packages': ['corechart', 'controls'],
                    'callback': callback
                });
            })
            .fail(function() {
                NETDATA.chartLibraries.google.enabled = false;
                NETDATA.error(100, NETDATA.google_js);
                if(typeof callback === "function")
                    return callback();
            });
        }
        else {
            NETDATA.chartLibraries.google.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.googleChartUpdate = function(state, data) {
        var datatable = new google.visualization.DataTable(data.result);
        state.google_instance.draw(datatable, state.google_options);
        return true;
    };

    NETDATA.googleChartCreate = function(state, data) {
        var datatable = new google.visualization.DataTable(data.result);

        state.google_options = {
            colors: state.chartColors(),

            // do not set width, height - the chart resizes itself
            //width: state.chartWidth(),
            //height: state.chartHeight(),
            lineWidth: 1,
            title: state.title,
            fontSize: 11,
            hAxis: {
            //  title: "Time of Day",
            //  format:'HH:mm:ss',
                viewWindowMode: 'maximized',
                slantedText: false,
                format:'HH:mm:ss',
                textStyle: {
                    fontSize: 9
                },
                gridlines: {
                    color: '#EEE'
                }
            },
            vAxis: {
                title: state.units,
                viewWindowMode: 'pretty',
                minValue: -0.1,
                maxValue: 0.1,
                direction: 1,
                textStyle: {
                    fontSize: 9
                },
                gridlines: {
                    color: '#EEE'
                }
            },
            chartArea: {
                width: '65%',
                height: '80%'
            },
            focusTarget: 'category',
            annotation: {
                '1': {
                    style: 'line'
                }
            },
            pointsVisible: 0,
            titlePosition: 'out',
            titleTextStyle: {
                fontSize: 11
            },
            tooltip: {
                isHtml: false,
                ignoreBounds: true,
                textStyle: {
                    fontSize: 9
                }
            },
            curveType: 'function',
            areaOpacity: 0.3,
            isStacked: false
        };

        switch(state.chart.chart_type) {
            case "area":
                state.google_options.vAxis.viewWindowMode = 'maximized';
                state.google_options.areaOpacity = NETDATA.options.current.color_fill_opacity_area;
                state.google_instance = new google.visualization.AreaChart(state.element_chart);
                break;

            case "stacked":
                state.google_options.isStacked = true;
                state.google_options.areaOpacity = NETDATA.options.current.color_fill_opacity_stacked;
                state.google_options.vAxis.viewWindowMode = 'maximized';
                state.google_options.vAxis.minValue = null;
                state.google_options.vAxis.maxValue = null;
                state.google_instance = new google.visualization.AreaChart(state.element_chart);
                break;

            default:
            case "line":
                state.google_options.lineWidth = 2;
                state.google_instance = new google.visualization.LineChart(state.element_chart);
                break;
        }

        state.google_instance.draw(datatable, state.google_options);
        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------

    NETDATA.easypiechartPercentFromValueMinMax = function(value, min, max) {
        if(typeof value !== 'number') value = 0;
        if(typeof min !== 'number') min = 0;
        if(typeof max !== 'number') max = 0;

        if(min > value) min = value;
        if(max < value) max = value;

        // make sure it is zero based
        if(min > 0) min = 0;
        if(max < 0) max = 0;

        var pcent = 0;
        if(value >= 0) {
            if(max !== 0)
                pcent = Math.round(value * 100 / max);
            if(pcent === 0) pcent = 0.1;
        }
        else {
            if(min !== 0)
                pcent = Math.round(-value * 100 / min);
            if(pcent === 0) pcent = -0.1;
        }

        return pcent;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // easy-pie-chart

    NETDATA.easypiechartInitialize = function(callback) {
        if(typeof netdataNoEasyPieChart === 'undefined' || !netdataNoEasyPieChart) {
            $.ajax({
                url: NETDATA.easypiechart_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function() {
                    NETDATA.registerChartLibrary('easypiechart', NETDATA.easypiechart_js);
                })
                .fail(function() {
                    NETDATA.chartLibraries.easypiechart.enabled = false;
                    NETDATA.error(100, NETDATA.easypiechart_js);
                })
                .always(function() {
                    if(typeof callback === "function")
                        return callback();
                })
        }
        else {
            NETDATA.chartLibraries.easypiechart.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.easypiechartClearSelection = function(state) {
        if(typeof state.easyPieChartEvent !== 'undefined') {
            if(state.easyPieChartEvent.timer !== undefined) {
                clearTimeout(state.easyPieChartEvent.timer);
            }

            state.easyPieChartEvent.timer = undefined;
        }

        if(state.isAutoRefreshable() === true && state.data !== null) {
            NETDATA.easypiechartChartUpdate(state, state.data);
        }
        else {
            state.easyPieChartLabel.innerText = state.legendFormatValue(null);
            state.easyPieChart_instance.update(0);
        }
        state.easyPieChart_instance.enableAnimation();

        return true;
    };

    NETDATA.easypiechartSetSelection = function(state, t) {
        if(state.timeIsVisible(t) !== true)
            return NETDATA.easypiechartClearSelection(state);

        var slot = state.calculateRowForTime(t);
        if(slot < 0 || slot >= state.data.result.length)
            return NETDATA.easypiechartClearSelection(state);

        if(typeof state.easyPieChartEvent === 'undefined') {
            state.easyPieChartEvent = {
                timer: undefined,
                value: 0,
                pcent: 0
            };
        }

        var value = state.data.result[state.data.result.length - 1 - slot];
        var min = (state.easyPieChartMin === null)?NETDATA.commonMin.get(state):state.easyPieChartMin;
        var max = (state.easyPieChartMax === null)?NETDATA.commonMax.get(state):state.easyPieChartMax;
        var pcent = NETDATA.easypiechartPercentFromValueMinMax(value, min, max);

        state.easyPieChartEvent.value = value;
        state.easyPieChartEvent.pcent = pcent;
        state.easyPieChartLabel.innerText = state.legendFormatValue(value);

        if(state.easyPieChartEvent.timer === undefined) {
            state.easyPieChart_instance.disableAnimation();

            state.easyPieChartEvent.timer = setTimeout(function() {
                state.easyPieChartEvent.timer = undefined;
                state.easyPieChart_instance.update(state.easyPieChartEvent.pcent);
            }, NETDATA.options.current.charts_selection_animation_delay);
        }

        return true;
    };

    NETDATA.easypiechartChartUpdate = function(state, data) {
        var value, min, max, pcent;

        if(NETDATA.globalPanAndZoom.isActive() === true || state.isAutoRefreshable() === false) {
            value = null;
            pcent = 0;
        }
        else {
            value = data.result[0];
            min = (state.easyPieChartMin === null)?NETDATA.commonMin.get(state):state.easyPieChartMin;
            max = (state.easyPieChartMax === null)?NETDATA.commonMax.get(state):state.easyPieChartMax;
            pcent = NETDATA.easypiechartPercentFromValueMinMax(value, min, max);
        }

        state.easyPieChartLabel.innerText = state.legendFormatValue(value);
        state.easyPieChart_instance.update(pcent);
        return true;
    };

    NETDATA.easypiechartChartCreate = function(state, data) {
        var self = $(state.element);
        var chart = $(state.element_chart);

        var value = data.result[0];
        var min = self.data('easypiechart-min-value') || null;
        var max = self.data('easypiechart-max-value') || null;
        var adjust = self.data('easypiechart-adjust') || null;

        if(min === null) {
            min = NETDATA.commonMin.get(state);
            state.easyPieChartMin = null;
        }
        else
            state.easyPieChartMin = min;

        if(max === null) {
            max = NETDATA.commonMax.get(state);
            state.easyPieChartMax = null;
        }
        else
            state.easyPieChartMax = max;

        var pcent = NETDATA.easypiechartPercentFromValueMinMax(value, min, max);

        chart.data('data-percent', pcent);

        var size;
        switch(adjust) {
            case 'width': size = state.chartHeight(); break;
            case 'min': size = Math.min(state.chartWidth(), state.chartHeight()); break;
            case 'max': size = Math.max(state.chartWidth(), state.chartHeight()); break;
            case 'height':
            default: size = state.chartWidth(); break;
        }
        state.element.style.width = size + 'px';
        state.element.style.height = size + 'px';

        var stroke = Math.floor(size / 22);
        if(stroke < 3) stroke = 2;

        var valuefontsize = Math.floor((size * 2 / 3) / 5);
        var valuetop = Math.round((size - valuefontsize - (size / 40)) / 2);
        state.easyPieChartLabel = document.createElement('span');
        state.easyPieChartLabel.className = 'easyPieChartLabel';
        state.easyPieChartLabel.innerText = state.legendFormatValue(value);
        state.easyPieChartLabel.style.fontSize = valuefontsize + 'px';
        state.easyPieChartLabel.style.top = valuetop.toString() + 'px';
        state.element_chart.appendChild(state.easyPieChartLabel);

        var titlefontsize = Math.round(valuefontsize * 1.6 / 3);
        var titletop = Math.round(valuetop - (titlefontsize * 2) - (size / 40));
        state.easyPieChartTitle = document.createElement('span');
        state.easyPieChartTitle.className = 'easyPieChartTitle';
        state.easyPieChartTitle.innerText = state.title;
        state.easyPieChartTitle.style.fontSize = titlefontsize + 'px';
        state.easyPieChartTitle.style.lineHeight = titlefontsize + 'px';
        state.easyPieChartTitle.style.top = titletop.toString() + 'px';
        state.element_chart.appendChild(state.easyPieChartTitle);

        var unitfontsize = Math.round(titlefontsize * 0.9);
        var unittop = Math.round(valuetop + (valuefontsize + unitfontsize) + (size / 40));
        state.easyPieChartUnits = document.createElement('span');
        state.easyPieChartUnits.className = 'easyPieChartUnits';
        state.easyPieChartUnits.innerText = state.units;
        state.easyPieChartUnits.style.fontSize = unitfontsize + 'px';
        state.easyPieChartUnits.style.top = unittop.toString() + 'px';
        state.element_chart.appendChild(state.easyPieChartUnits);

        var barColor = self.data('easypiechart-barcolor');
        if(typeof barColor === 'undefined' || barColor === null)
            barColor = state.chartColors()[0];
        else {
            // <div ... data-easypiechart-barcolor="(function(percent){return(percent < 50 ? '#5cb85c' : percent < 85 ? '#f0ad4e' : '#cb3935');})" ...></div>
            var tmp = eval(barColor);
            if(typeof tmp === 'function')
                barColor = tmp;
        }

        chart.easyPieChart({
            barColor: barColor,
            trackColor: self.data('easypiechart-trackcolor') || NETDATA.themes.current.easypiechart_track,
            scaleColor: self.data('easypiechart-scalecolor') || NETDATA.themes.current.easypiechart_scale,
            scaleLength: self.data('easypiechart-scalelength') || 5,
            lineCap: self.data('easypiechart-linecap') || 'round',
            lineWidth: self.data('easypiechart-linewidth') || stroke,
            trackWidth: self.data('easypiechart-trackwidth') || undefined,
            size: self.data('easypiechart-size') || size,
            rotate: self.data('easypiechart-rotate') || 0,
            animate: self.data('easypiechart-animate') || {duration: 500, enabled: true},
            easing: self.data('easypiechart-easing') || undefined
        });

        // when we just re-create the chart
        // do not animate the first update
        var animate = true;
        if(typeof state.easyPieChart_instance !== 'undefined')
            animate = false;

        state.easyPieChart_instance = chart.data('easyPieChart');
        if(animate === false) state.easyPieChart_instance.disableAnimation();
        state.easyPieChart_instance.update(pcent);
        if(animate === false) state.easyPieChart_instance.enableAnimation();
        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // gauge.js

    NETDATA.gaugeInitialize = function(callback) {
        if(typeof netdataNoGauge === 'undefined' || !netdataNoGauge) {
            $.ajax({
                url: NETDATA.gauge_js,
                cache: true,
                dataType: "script",
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function() {
                    NETDATA.registerChartLibrary('gauge', NETDATA.gauge_js);
                })
                .fail(function() {
                    NETDATA.chartLibraries.gauge.enabled = false;
                    NETDATA.error(100, NETDATA.gauge_js);
                })
                .always(function() {
                    if(typeof callback === "function")
                        return callback();
                })
        }
        else {
            NETDATA.chartLibraries.gauge.enabled = false;
            if(typeof callback === "function")
                return callback();
        }
    };

    NETDATA.gaugeAnimation = function(state, status) {
        var speed = 32;

        if(typeof status === 'boolean' && status === false)
            speed = 1000000000;
        else if(typeof status === 'number')
            speed = status;

        // console.log('gauge speed ' + speed);
        state.gauge_instance.animationSpeed = speed;
        state.___gaugeOld__.speed = speed;
    };

    NETDATA.gaugeSet = function(state, value, min, max) {
        if(typeof value !== 'number') value = 0;
        if(typeof min !== 'number') min = 0;
        if(typeof max !== 'number') max = 0;
        if(value > max) max = value;
        if(value < min) min = value;
        if(min > max) {
            var t = min;
            min = max;
            max = t;
        }
        else if(min === max)
            max = min + 1;

        // gauge.js has an issue if the needle
        // is smaller than min or larger than max
        // when we set the new values
        // the needle will go crazy

        // to prevent it, we always feed it
        // with a percentage, so that the needle
        // is always between min and max
        var pcent = (value - min) * 100 / (max - min);

        // bug fix for gauge.js 1.3.1
        // if the value is the absolute min or max, the chart is broken
        if(pcent < 0.001) pcent = 0.001;
        if(pcent > 99.999) pcent = 99.999;

        state.gauge_instance.set(pcent);
        // console.log('gauge set ' + pcent + ', value ' + value + ', min ' + min + ', max ' + max);

        state.___gaugeOld__.value = value;
        state.___gaugeOld__.min = min;
        state.___gaugeOld__.max = max;
    };

    NETDATA.gaugeSetLabels = function(state, value, min, max) {
        if(state.___gaugeOld__.valueLabel !== value) {
            state.___gaugeOld__.valueLabel = value;
            state.gaugeChartLabel.innerText = state.legendFormatValue(value);
        }
        if(state.___gaugeOld__.minLabel !== min) {
            state.___gaugeOld__.minLabel = min;
            state.gaugeChartMin.innerText = state.legendFormatValue(min);
        }
        if(state.___gaugeOld__.maxLabel !== max) {
            state.___gaugeOld__.maxLabel = max;
            state.gaugeChartMax.innerText = state.legendFormatValue(max);
        }
    };

    NETDATA.gaugeClearSelection = function(state) {
        if(typeof state.gaugeEvent !== 'undefined') {
            if(state.gaugeEvent.timer !== undefined) {
                clearTimeout(state.gaugeEvent.timer);
            }

            state.gaugeEvent.timer = undefined;
        }

        if(state.isAutoRefreshable() === true && state.data !== null) {
            NETDATA.gaugeChartUpdate(state, state.data);
        }
        else {
            NETDATA.gaugeAnimation(state, false);
            NETDATA.gaugeSet(state, null, null, null);
            NETDATA.gaugeSetLabels(state, null, null, null);
        }

        NETDATA.gaugeAnimation(state, true);
        return true;
    };

    NETDATA.gaugeSetSelection = function(state, t) {
        if(state.timeIsVisible(t) !== true)
            return NETDATA.gaugeClearSelection(state);

        var slot = state.calculateRowForTime(t);
        if(slot < 0 || slot >= state.data.result.length)
            return NETDATA.gaugeClearSelection(state);

        if(typeof state.gaugeEvent === 'undefined') {
            state.gaugeEvent = {
                timer: undefined,
                value: 0,
                min: 0,
                max: 0
            };
        }

        var value = state.data.result[state.data.result.length - 1 - slot];
        var min = (state.gaugeMin === null)?NETDATA.commonMin.get(state):state.gaugeMin;
        var max = (state.gaugeMax === null)?NETDATA.commonMax.get(state):state.gaugeMax;

        // make sure it is zero based
        if(min > 0) min = 0;
        if(max < 0) max = 0;

        state.gaugeEvent.value = value;
        state.gaugeEvent.min = min;
        state.gaugeEvent.max = max;
        NETDATA.gaugeSetLabels(state, value, min, max);

        if(state.gaugeEvent.timer === undefined) {
            NETDATA.gaugeAnimation(state, false);

            state.gaugeEvent.timer = setTimeout(function() {
                state.gaugeEvent.timer = undefined;
                NETDATA.gaugeSet(state, state.gaugeEvent.value, state.gaugeEvent.min, state.gaugeEvent.max);
            }, NETDATA.options.current.charts_selection_animation_delay);
        }

        return true;
    };

    NETDATA.gaugeChartUpdate = function(state, data) {
        var value, min, max;

        if(NETDATA.globalPanAndZoom.isActive() === true || state.isAutoRefreshable() === false) {
            value = 0;
            min = 0;
            max = 1;
            NETDATA.gaugeSetLabels(state, null, null, null);
        }
        else {
            value = data.result[0];
            min = (state.gaugeMin === null)?NETDATA.commonMin.get(state):state.gaugeMin;
            max = (state.gaugeMax === null)?NETDATA.commonMax.get(state):state.gaugeMax;
            if(value < min) min = value;
            if(value > max) max = value;

            // make sure it is zero based
            if(min > 0) min = 0;
            if(max < 0) max = 0;

            NETDATA.gaugeSetLabels(state, value, min, max);
        }

        NETDATA.gaugeSet(state, value, min, max);
        return true;
    };

    NETDATA.gaugeChartCreate = function(state, data) {
        var self = $(state.element);
        // var chart = $(state.element_chart);

        var value = data.result[0];
        var min = self.data('gauge-min-value') || null;
        var max = self.data('gauge-max-value') || null;
        var adjust = self.data('gauge-adjust') || null;
        var pointerColor = self.data('gauge-pointer-color') || NETDATA.themes.current.gauge_pointer;
        var strokeColor = self.data('gauge-stroke-color') || NETDATA.themes.current.gauge_stroke;
        var startColor = self.data('gauge-start-color') || state.chartColors()[0];
        var stopColor = self.data('gauge-stop-color') || void 0;
        var generateGradient = self.data('gauge-generate-gradient') || false;

        if(min === null) {
            min = NETDATA.commonMin.get(state);
            state.gaugeMin = null;
        }
        else
            state.gaugeMin = min;

        if(max === null) {
            max = NETDATA.commonMax.get(state);
            state.gaugeMax = null;
        }
        else
            state.gaugeMax = max;

        // make sure it is zero based
        if(min > 0) min = 0;
        if(max < 0) max = 0;

        var width = state.chartWidth(), height = state.chartHeight(); //, ratio = 1.5;
        //switch(adjust) {
        //  case 'width': width = height * ratio; break;
        //  case 'height':
        //  default: height = width / ratio; break;
        //}
        //state.element.style.width = width.toString() + 'px';
        //state.element.style.height = height.toString() + 'px';

        var lum_d = 0.05;

        var options = {
            lines: 12,                  // The number of lines to draw
            angle: 0.15,                // The span of the gauge arc
            lineWidth: 0.50,            // The line thickness
            radiusScale: 0.85,          // Relative radius
            pointer: {
                length: 0.8,            // 0.9 The radius of the inner circle
                strokeWidth: 0.035,     // The rotation offset
                color: pointerColor     // Fill color
            },
            limitMax: true,             // If false, the max value of the gauge will be updated if value surpass max
            limitMin: true,             // If true, the min value of the gauge will be fixed unless you set it manually
            colorStart: startColor,     // Colors
            colorStop: stopColor,       // just experiment with them
            strokeColor: strokeColor,   // to see which ones work best for you
            generateGradient: (generateGradient === true),
            gradientType: 0,
            highDpiSupport: true        // High resolution support
        };

        if (generateGradient.constructor === Array) {
            // example options:
            // data-gauge-generate-gradient="[0, 50, 100]"
            // data-gauge-gradient-percent-color-0="#FFFFFF"
            // data-gauge-gradient-percent-color-50="#999900"
            // data-gauge-gradient-percent-color-100="#000000"

            options.percentColors = [];
            var len = generateGradient.length;
            while(len--) {
                var pcent = generateGradient[len];
                var color = self.attr('data-gauge-gradient-percent-color-' + pcent.toString()) || false;
                if(color !== false) {
                    var a = [];
                    a[0] = pcent / 100;
                    a[1] = color;
                    options.percentColors.unshift(a);
                }
            }
            if(options.percentColors.length === 0)
                delete options.percentColors;
        }
        else if(generateGradient === false && NETDATA.themes.current.gauge_gradient === true) {
            //noinspection PointlessArithmeticExpressionJS
            options.percentColors = [
                [0.0, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 0))],
                [0.1, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 1))],
                [0.2, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 2))],
                [0.3, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 3))],
                [0.4, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 4))],
                [0.5, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 5))],
                [0.6, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 6))],
                [0.7, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 7))],
                [0.8, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 8))],
                [0.9, NETDATA.colorLuminance(startColor, (lum_d * 10) - (lum_d * 9))],
                [1.0, NETDATA.colorLuminance(startColor, 0.0)]];
        }

        state.gauge_canvas = document.createElement('canvas');
        state.gauge_canvas.id = 'gauge-' + state.uuid + '-canvas';
        state.gauge_canvas.className = 'gaugeChart';
        state.gauge_canvas.width  = width;
        state.gauge_canvas.height = height;
        state.element_chart.appendChild(state.gauge_canvas);

        var valuefontsize = Math.floor(height / 6);
        var valuetop = Math.round((height - valuefontsize - (height / 6)) / 2);
        state.gaugeChartLabel = document.createElement('span');
        state.gaugeChartLabel.className = 'gaugeChartLabel';
        state.gaugeChartLabel.style.fontSize = valuefontsize + 'px';
        state.gaugeChartLabel.style.top = valuetop.toString() + 'px';
        state.element_chart.appendChild(state.gaugeChartLabel);

        var titlefontsize = Math.round(valuefontsize / 2);
        var titletop = 10;
        state.gaugeChartTitle = document.createElement('span');
        state.gaugeChartTitle.className = 'gaugeChartTitle';
        state.gaugeChartTitle.innerText = state.title;
        state.gaugeChartTitle.style.fontSize = titlefontsize + 'px';
        state.gaugeChartTitle.style.lineHeight = titlefontsize + 'px';
        state.gaugeChartTitle.style.top = titletop.toString() + 'px';
        state.element_chart.appendChild(state.gaugeChartTitle);

        var unitfontsize = Math.round(titlefontsize * 0.9);
        state.gaugeChartUnits = document.createElement('span');
        state.gaugeChartUnits.className = 'gaugeChartUnits';
        state.gaugeChartUnits.innerText = state.units;
        state.gaugeChartUnits.style.fontSize = unitfontsize + 'px';
        state.element_chart.appendChild(state.gaugeChartUnits);

        state.gaugeChartMin = document.createElement('span');
        state.gaugeChartMin.className = 'gaugeChartMin';
        state.gaugeChartMin.style.fontSize = Math.round(valuefontsize * 0.75).toString() + 'px';
        state.element_chart.appendChild(state.gaugeChartMin);

        state.gaugeChartMax = document.createElement('span');
        state.gaugeChartMax.className = 'gaugeChartMax';
        state.gaugeChartMax.style.fontSize = Math.round(valuefontsize * 0.75).toString() + 'px';
        state.element_chart.appendChild(state.gaugeChartMax);

        // when we just re-create the chart
        // do not animate the first update
        var animate = true;
        if(typeof state.gauge_instance !== 'undefined')
            animate = false;

        state.gauge_instance = new Gauge(state.gauge_canvas).setOptions(options); // create sexy gauge!

        state.___gaugeOld__ = {
            value: value,
            min: min,
            max: max,
            valueLabel: null,
            minLabel: null,
            maxLabel: null
        };

        // we will always feed a percentage
        state.gauge_instance.minValue = 0;
        state.gauge_instance.maxValue = 100;

        NETDATA.gaugeAnimation(state, animate);
        NETDATA.gaugeSet(state, value, min, max);
        NETDATA.gaugeSetLabels(state, value, min, max);
        NETDATA.gaugeAnimation(state, true);
        return true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Charts Libraries Registration

    NETDATA.chartLibraries = {
        "dygraph": {
            initialize: NETDATA.dygraphInitialize,
            create: NETDATA.dygraphChartCreate,
            update: NETDATA.dygraphChartUpdate,
            resize: function(state) {
                if(typeof state.dygraph_instance.resize === 'function')
                    state.dygraph_instance.resize();
            },
            setSelection: NETDATA.dygraphSetSelection,
            clearSelection:  NETDATA.dygraphClearSelection,
            toolboxPanAndZoom: NETDATA.dygraphToolboxPanAndZoom,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'json'; },
            options: function(state) { void(state); return 'ms|flip'; },
            legend: function(state) {
                return (this.isSparkline(state) === false)?'right-side':null;
            },
            autoresize: function(state) { void(state); return true; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return true; },
            pixels_per_point: function(state) {
                return (this.isSparkline(state) === false)?3:2;
            },
            isSparkline: function(state) {
                if(typeof state.dygraph_sparkline === 'undefined') {
                    var t = $(state.element).data('dygraph-theme');
                    state.dygraph_sparkline = (t === 'sparkline');
                }
                return state.dygraph_sparkline;
            }
        },
        "sparkline": {
            initialize: NETDATA.sparklineInitialize,
            create: NETDATA.sparklineChartCreate,
            update: NETDATA.sparklineChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'array'; },
            options: function(state) { void(state); return 'flip|abs'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 3; }
        },
        "peity": {
            initialize: NETDATA.peityInitialize,
            create: NETDATA.peityChartCreate,
            update: NETDATA.peityChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'ssvcomma'; },
            options: function(state) { void(state); return 'null2zero|flip|abs'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 3; }
        },
        "morris": {
            initialize: NETDATA.morrisInitialize,
            create: NETDATA.morrisChartCreate,
            update: NETDATA.morrisChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'json'; },
            options: function(state) { void(state); return 'objectrows|ms'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 50; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 15; }
        },
        "google": {
            initialize: NETDATA.googleInitialize,
            create: NETDATA.googleChartCreate,
            update: NETDATA.googleChartUpdate,
            resize: null,
            setSelection: undefined, //function(state, t) { void(state); return true; },
            clearSelection: undefined, //function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'datatable'; },
            options: function(state) { void(state); return ''; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 300; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 4; }
        },
        "raphael": {
            initialize: NETDATA.raphaelInitialize,
            create: NETDATA.raphaelChartCreate,
            update: NETDATA.raphaelChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'json'; },
            options: function(state) { void(state); return ''; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 3; }
        },
        "c3": {
            initialize: NETDATA.c3Initialize,
            create: NETDATA.c3ChartCreate,
            update: NETDATA.c3ChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'csvjsonarray'; },
            options: function(state) { void(state); return 'milliseconds'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 15; }
        },
        "d3": {
            initialize: NETDATA.d3Initialize,
            create: NETDATA.d3ChartCreate,
            update: NETDATA.d3ChartUpdate,
            resize: null,
            setSelection: undefined, // function(state, t) { void(state); return true; },
            clearSelection: undefined, // function(state) { void(state); return true; },
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'json'; },
            options: function(state) { void(state); return ''; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return false; },
            pixels_per_point: function(state) { void(state); return 3; }
        },
        "easypiechart": {
            initialize: NETDATA.easypiechartInitialize,
            create: NETDATA.easypiechartChartCreate,
            update: NETDATA.easypiechartChartUpdate,
            resize: null,
            setSelection: NETDATA.easypiechartSetSelection,
            clearSelection: NETDATA.easypiechartClearSelection,
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'array'; },
            options: function(state) { void(state); return 'absolute'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return true; },
            pixels_per_point: function(state) { void(state); return 3; },
            aspect_ratio: 100
        },
        "gauge": {
            initialize: NETDATA.gaugeInitialize,
            create: NETDATA.gaugeChartCreate,
            update: NETDATA.gaugeChartUpdate,
            resize: null,
            setSelection: NETDATA.gaugeSetSelection,
            clearSelection: NETDATA.gaugeClearSelection,
            toolboxPanAndZoom: null,
            initialized: false,
            enabled: true,
            format: function(state) { void(state); return 'array'; },
            options: function(state) { void(state); return 'absolute'; },
            legend: function(state) { void(state); return null; },
            autoresize: function(state) { void(state); return false; },
            max_updates_to_recreate: function(state) { void(state); return 5000; },
            track_colors: function(state) { void(state); return true; },
            pixels_per_point: function(state) { void(state); return 3; },
            aspect_ratio: 70
        }
    };

    NETDATA.registerChartLibrary = function(library, url) {
        if(NETDATA.options.debug.libraries === true)
            console.log("registering chart library: " + library);

        NETDATA.chartLibraries[library].url = url;
        NETDATA.chartLibraries[library].initialized = true;
        NETDATA.chartLibraries[library].enabled = true;
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Load required JS libraries and CSS

    NETDATA.requiredJs = [
        {
            url: NETDATA.serverDefault + 'lib/bootstrap-3.3.7.min.js',
            async: false,
            isAlreadyLoaded: function() {
                // check if bootstrap is loaded
                if(typeof $().emulateTransitionEnd === 'function')
                    return true;
                else {
                    return (typeof netdataNoBootstrap !== 'undefined' && netdataNoBootstrap === true);
                }
            }
        },
        {
            url: NETDATA.serverDefault + 'lib/perfect-scrollbar-0.6.15.min.js',
            isAlreadyLoaded: function() { return false; }
        }
    ];

    NETDATA.requiredCSS = [
        {
            url: NETDATA.themes.current.bootstrap_css,
            isAlreadyLoaded: function() {
                return (typeof netdataNoBootstrap !== 'undefined' && netdataNoBootstrap === true);
            }
        },
        {
            url: NETDATA.serverDefault + 'css/font-awesome.min.css?v4.7.0',
            isAlreadyLoaded: function() { return false; }
        },
        {
            url: NETDATA.themes.current.dashboard_css,
            isAlreadyLoaded: function() { return false; }
        }
    ];

    NETDATA.loadedRequiredJs = 0;
    NETDATA.loadRequiredJs = function(index, callback) {
        if(index >= NETDATA.requiredJs.length) {
            if(typeof callback === 'function')
                return callback();
            return;
        }

        if(NETDATA.requiredJs[index].isAlreadyLoaded()) {
            NETDATA.loadedRequiredJs++;
            NETDATA.loadRequiredJs(++index, callback);
            return;
        }

        if(NETDATA.options.debug.main_loop === true)
            console.log('loading ' + NETDATA.requiredJs[index].url);

        var async = true;
        if(typeof NETDATA.requiredJs[index].async !== 'undefined' && NETDATA.requiredJs[index].async === false)
            async = false;

        $.ajax({
            url: NETDATA.requiredJs[index].url,
            cache: true,
            dataType: "script",
            xhrFields: { withCredentials: true } // required for the cookie
        })
        .done(function() {
            if(NETDATA.options.debug.main_loop === true)
                console.log('loaded ' + NETDATA.requiredJs[index].url);
        })
        .fail(function() {
            alert('Cannot load required JS library: ' + NETDATA.requiredJs[index].url);
        })
        .always(function() {
            NETDATA.loadedRequiredJs++;

            if(async === false)
                NETDATA.loadRequiredJs(++index, callback);
        });

        if(async === true)
            NETDATA.loadRequiredJs(++index, callback);
    };

    NETDATA.loadRequiredCSS = function(index) {
        if(index >= NETDATA.requiredCSS.length)
            return;

        if(NETDATA.requiredCSS[index].isAlreadyLoaded()) {
            NETDATA.loadRequiredCSS(++index);
            return;
        }

        if(NETDATA.options.debug.main_loop === true)
            console.log('loading ' + NETDATA.requiredCSS[index].url);

        NETDATA._loadCSS(NETDATA.requiredCSS[index].url);
        NETDATA.loadRequiredCSS(++index);
    };


    // ----------------------------------------------------------------------------------------------------------------
    // Registry of netdata hosts

    NETDATA.alarms = {
        onclick: null,                  // the callback to handle the click - it will be called with the alarm log entry
        chart_div_offset: 100,          // give that space above the chart when scrolling to it
        chart_div_id_prefix: 'chart_',  // the chart DIV IDs have this prefix (they should be NETDATA.name2id(chart.id))
        chart_div_animation_duration: 0,// the duration of the animation while scrolling to a chart

        ms_penalty: 0,                  // the time penalty of the next alarm
        ms_between_notifications: 500,  // firefox moves the alarms off-screen (above, outside the top of the screen)
                                        // if alarms are shown faster than: one per 500ms

        notifications: false,           // when true, the browser supports notifications (may not be granted though)
        last_notification_id: 0,        // the id of the last alarm_log we have raised an alarm for
        first_notification_id: 0,       // the id of the first alarm_log entry for this session
                                        // this is used to prevent CLEAR notifications for past events
        // notifications_shown: [],

        server: null,                   // the server to connect to for fetching alarms
        current: null,                  // the list of raised alarms - updated in the background
        callback: null,                 // a callback function to call every time the list of raised alarms is refreshed

        notify: function(entry) {
            // console.log('alarm ' + entry.unique_id);

            if(entry.updated === true) {
                // console.log('alarm ' + entry.unique_id + ' has been updated by another alarm');
                return;
            }

            var value_string = entry.value_string;

            if(NETDATA.alarms.current !== null) {
                // get the current value_string
                var t = NETDATA.alarms.current.alarms[entry.chart + '.' + entry.name];
                if(typeof t !== 'undefined' && entry.status === t.status && typeof t.value_string !== 'undefined')
                    value_string = t.value_string;
            }

            var name = entry.name.replace(/_/g, ' ');
            var status = entry.status.toLowerCase();
            var title = name + ' = ' + value_string.toString();
            var tag = entry.alarm_id;
            var icon = 'images/seo-performance-128.png';
            var interaction = false;
            var data = entry;
            var show = true;

            // console.log('alarm ' + entry.unique_id + ' ' + entry.chart + '.' + entry.name + ' is ' +  entry.status);

            switch(entry.status) {
                case 'REMOVED':
                    show = false;
                    break;

                case 'UNDEFINED':
                    return;

                case 'UNINITIALIZED':
                    return;

                case 'CLEAR':
                    if(entry.unique_id < NETDATA.alarms.first_notification_id) {
                        // console.log('alarm ' + entry.unique_id + ' is not current');
                        return;
                    }
                    if(entry.old_status === 'UNINITIALIZED' || entry.old_status === 'UNDEFINED') {
                        // console.log('alarm' + entry.unique_id + ' switch to CLEAR from ' + entry.old_status);
                        return;
                    }
                    if(entry.no_clear_notification === true) {
                        // console.log('alarm' + entry.unique_id + ' is CLEAR but has no_clear_notification flag');
                        return;
                    }
                    title = name + ' back to normal (' + value_string.toString() + ')';
                    icon = 'images/check-mark-2-128-green.png';
                    interaction = false;
                    break;

                case 'WARNING':
                    if(entry.old_status === 'CRITICAL')
                        status = 'demoted to ' + entry.status.toLowerCase();

                    icon = 'images/alert-128-orange.png';
                    interaction = false;
                    break;

                case 'CRITICAL':
                    if(entry.old_status === 'WARNING')
                        status = 'escalated to ' + entry.status.toLowerCase();
                    
                    icon = 'images/alert-128-red.png';
                    interaction = true;
                    break;

                default:
                    console.log('invalid alarm status ' + entry.status);
                    return;
            }

            /*
            // cleanup old notifications with the same alarm_id as this one
            // FIXME: it does not seem to work on any web browser!
            var len = NETDATA.alarms.notifications_shown.length;
            while(len--) {
                var n = NETDATA.alarms.notifications_shown[len];
                if(n.data.alarm_id === entry.alarm_id) {
                    console.log('removing old alarm ' + n.data.unique_id);

                    // close the notification
                    n.close.bind(n);

                    // remove it from the array
                    NETDATA.alarms.notifications_shown.splice(len, 1);
                    len = NETDATA.alarms.notifications_shown.length;
                }
            }
            */

            if(show === true) {

                setTimeout(function() {
                    // show this notification
                    // console.log('new notification: ' + title);
                    var n = new Notification(title, {
                        body: entry.hostname + ' - ' + entry.chart + ' (' + entry.family + ') - ' + status + ': ' + entry.info,
                        tag: tag,
                        requireInteraction: interaction,
                        icon: NETDATA.serverDefault + icon,
                        data: data
                    });

                    n.onclick = function(event) {
                        event.preventDefault();
                        NETDATA.alarms.onclick(event.target.data);
                    };

                    // console.log(n);
                    // NETDATA.alarms.notifications_shown.push(n);
                    // console.log(entry);
                }, NETDATA.alarms.ms_penalty);

                NETDATA.alarms.ms_penalty += NETDATA.alarms.ms_between_notifications;
            }
        },

        scrollToChart: function(chart_id) {
            if(typeof chart_id === 'string') {
                var offset = $('#' + NETDATA.alarms.chart_div_id_prefix + NETDATA.name2id(chart_id)).offset();
                if(typeof offset !== 'undefined') {
                    $('html, body').animate({ scrollTop: offset.top - NETDATA.alarms.chart_div_offset }, NETDATA.alarms.chart_div_animation_duration);
                    return true;
                }
            }
            return false;
        },

        scrollToAlarm: function(alarm) {
            if(typeof alarm === 'object') {
                var ret = NETDATA.alarms.scrollToChart(alarm.chart);

                if(ret === true && NETDATA.options.page_is_visible === false)
                    window.focus();
                //    alert('netdata dashboard will now scroll to chart: ' + alarm.chart + '\n\nThis alarm opened to bring the browser window in front of the screen. Click on the dashboard to prevent it from appearing again.');
            }

        },

        notifyAll: function() {
            // console.log('FETCHING ALARM LOG');
            NETDATA.alarms.get_log(NETDATA.alarms.last_notification_id, function(data) {
                // console.log('ALARM LOG FETCHED');

                if(data === null || typeof data !== 'object') {
                    console.log('invalid alarms log response');
                    return;
                }

                if(data.length === 0) {
                    console.log('received empty alarm log');
                    return;
                }

                // console.log('received alarm log of ' + data.length + ' entries, from ' + data[data.length - 1].unique_id.toString() + ' to ' + data[0].unique_id.toString());

                data.sort(function(a, b) {
                    if(a.unique_id > b.unique_id) return -1;
                    if(a.unique_id < b.unique_id) return 1;
                    return 0;
                });

                NETDATA.alarms.ms_penalty = 0;

                var len = data.length;
                while(len--) {
                    if(data[len].unique_id > NETDATA.alarms.last_notification_id) {
                        NETDATA.alarms.notify(data[len]);
                    }
                    //else
                    //    console.log('ignoring alarm (older) with id ' + data[len].unique_id.toString());
                }

                NETDATA.alarms.last_notification_id = data[0].unique_id;
                NETDATA.localStorageSet('last_notification_id', NETDATA.alarms.last_notification_id, null);
                // console.log('last notification id = ' + NETDATA.alarms.last_notification_id);
            })
        },

        check_notifications: function() {
            // returns true if we should fire 1+ notifications

            if(NETDATA.alarms.notifications !== true) {
                // console.log('notifications not available');
                return false;
            }

            if(Notification.permission !== 'granted') {
                // console.log('notifications not granted');
                return false;
            }

            if(typeof NETDATA.alarms.current !== 'undefined' && typeof NETDATA.alarms.current.alarms === 'object') {
                // console.log('can do alarms: old id = ' + NETDATA.alarms.last_notification_id + ' new id = ' + NETDATA.alarms.current.latest_alarm_log_unique_id);

                if(NETDATA.alarms.current.latest_alarm_log_unique_id > NETDATA.alarms.last_notification_id) {
                    // console.log('new alarms detected');
                    return true;
                }
                //else console.log('no new alarms');
            }
            // else console.log('cannot process alarms');

            return false;
        },

        get: function(what, callback) {
            $.ajax({
                url: NETDATA.alarms.server + '/api/v1/alarms?' + what.toString(),
                async: true,
                cache: false,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function(data) {
                    if(NETDATA.alarms.first_notification_id === 0 && typeof data.latest_alarm_log_unique_id === 'number')
                        NETDATA.alarms.first_notification_id = data.latest_alarm_log_unique_id;

                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(415, NETDATA.alarms.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        update_forever: function() {
            NETDATA.alarms.get('active', function(data) {
                if(data !== null) {
                    NETDATA.alarms.current = data;

                    if(NETDATA.alarms.check_notifications() === true) {
                        NETDATA.alarms.notifyAll();
                    }

                    if (typeof NETDATA.alarms.callback === 'function') {
                        NETDATA.alarms.callback(data);
                    }

                    // Health monitoring is disabled on this netdata
                    if(data.status === false) return;
                }

                setTimeout(NETDATA.alarms.update_forever, 10000);
            });
        },

        get_log: function(last_id, callback) {
            // console.log('fetching all log after ' + last_id.toString());
            $.ajax({
                url: NETDATA.alarms.server + '/api/v1/alarm_log?after=' + last_id.toString(),
                async: true,
                cache: false,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function(data) {
                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(416, NETDATA.alarms.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        init: function() {
            NETDATA.alarms.server = NETDATA.fixHost(NETDATA.serverDefault);

            NETDATA.alarms.last_notification_id =
                NETDATA.localStorageGet('last_notification_id', NETDATA.alarms.last_notification_id, null);

            if(NETDATA.alarms.onclick === null)
                NETDATA.alarms.onclick = NETDATA.alarms.scrollToAlarm;

            if(netdataShowAlarms === true) {
                NETDATA.alarms.update_forever();
            
                if('Notification' in window) {
                    // console.log('notifications available');
                    NETDATA.alarms.notifications = true;

                    if(Notification.permission === 'default')
                        Notification.requestPermission();
                }
            }
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Registry of netdata hosts

    NETDATA.registry = {
        server: null,         // the netdata registry server
        person_guid: null,    // the unique ID of this browser / user
        machine_guid: null,   // the unique ID the netdata server that served dashboard.js
        hostname: 'unknown',  // the hostname of the netdata server that served dashboard.js
        machines: null,       // the user's other URLs
        machines_array: null, // the user's other URLs in an array
        person_urls: null,

        parsePersonUrls: function(person_urls) {
            // console.log(person_urls);
            NETDATA.registry.person_urls = person_urls;

            if(person_urls) {
                NETDATA.registry.machines = {};
                NETDATA.registry.machines_array = [];

                var apu = person_urls;
                var i = apu.length;
                while(i--) {
                    if(typeof NETDATA.registry.machines[apu[i][0]] === 'undefined') {
                        // console.log('adding: ' + apu[i][4] + ', ' + ((now - apu[i][2]) / 1000).toString());

                        var obj = {
                            guid: apu[i][0],
                            url: apu[i][1],
                            last_t: apu[i][2],
                            accesses: apu[i][3],
                            name: apu[i][4],
                            alternate_urls: []
                        };
                        obj.alternate_urls.push(apu[i][1]);

                        NETDATA.registry.machines[apu[i][0]] = obj;
                        NETDATA.registry.machines_array.push(obj);
                    }
                    else {
                        // console.log('appending: ' + apu[i][4] + ', ' + ((now - apu[i][2]) / 1000).toString());

                        var pu = NETDATA.registry.machines[apu[i][0]];
                        if(pu.last_t < apu[i][2]) {
                            pu.url = apu[i][1];
                            pu.last_t = apu[i][2];
                            pu.name = apu[i][4];
                        }
                        pu.accesses += apu[i][3];
                        pu.alternate_urls.push(apu[i][1]);
                    }
                }
            }

            if(typeof netdataRegistryCallback === 'function')
                netdataRegistryCallback(NETDATA.registry.machines_array);
        },

        init: function() {
            if(netdataRegistry !== true) return;

            NETDATA.registry.hello(NETDATA.serverDefault, function(data) {
                if(data) {
                    NETDATA.registry.server = data.registry;
                    NETDATA.registry.machine_guid = data.machine_guid;
                    NETDATA.registry.hostname = data.hostname;

                    NETDATA.registry.access(2, function (person_urls) {
                        NETDATA.registry.parsePersonUrls(person_urls);

                    });
                }
            });
        },

        hello: function(host, callback) {
            host = NETDATA.fixHost(host);

            // send HELLO to a netdata server:
            // 1. verifies the server is reachable
            // 2. responds with the registry URL, the machine GUID of this netdata server and its hostname
            $.ajax({
                    url: host + '/api/v1/registry?action=hello',
                    async: true,
                    cache: false,
                    headers: {
                        'Cache-Control': 'no-cache, no-store',
                        'Pragma': 'no-cache'
                    },
                    xhrFields: { withCredentials: true } // required for the cookie
                })
                .done(function(data) {
                    if(typeof data.status !== 'string' || data.status !== 'ok') {
                        NETDATA.error(408, host + ' response: ' + JSON.stringify(data));
                        data = null;
                    }

                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(407, host);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        access: function(max_redirects, callback) {
            // send ACCESS to a netdata registry:
            // 1. it lets it know we are accessing a netdata server (its machine GUID and its URL)
            // 2. it responds with a list of netdata servers we know
            // the registry identifies us using a cookie it sets the first time we access it
            // the registry may respond with a redirect URL to send us to another registry
            $.ajax({
                    url: NETDATA.registry.server + '/api/v1/registry?action=access&machine=' + NETDATA.registry.machine_guid + '&name=' + encodeURIComponent(NETDATA.registry.hostname) + '&url=' + encodeURIComponent(NETDATA.serverDefault), // + '&visible_url=' + encodeURIComponent(document.location),
                    async: true,
                    cache: false,
                    headers: {
                        'Cache-Control': 'no-cache, no-store',
                        'Pragma': 'no-cache'
                    },
                    xhrFields: { withCredentials: true } // required for the cookie
                })
                .done(function(data) {
                    var redirect = null;
                    if(typeof data.registry === 'string')
                        redirect = data.registry;

                    if(typeof data.status !== 'string' || data.status !== 'ok') {
                        NETDATA.error(409, NETDATA.registry.server + ' responded with: ' + JSON.stringify(data));
                        data = null;
                    }

                    if(data === null) {
                        if(redirect !== null && max_redirects > 0) {
                            NETDATA.registry.server = redirect;
                            NETDATA.registry.access(max_redirects - 1, callback);
                        }
                        else {
                            if(typeof callback === 'function')
                                return callback(null);
                        }
                    }
                    else {
                        if(typeof data.person_guid === 'string')
                            NETDATA.registry.person_guid = data.person_guid;

                        if(typeof callback === 'function')
                            return callback(data.urls);
                    }
                })
                .fail(function() {
                    NETDATA.error(410, NETDATA.registry.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        delete: function(delete_url, callback) {
            // send DELETE to a netdata registry:
            $.ajax({
                url: NETDATA.registry.server + '/api/v1/registry?action=delete&machine=' + NETDATA.registry.machine_guid + '&name=' + encodeURIComponent(NETDATA.registry.hostname) + '&url=' + encodeURIComponent(NETDATA.serverDefault) + '&delete_url=' + encodeURIComponent(delete_url),
                async: true,
                cache: false,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function(data) {
                    if(typeof data.status !== 'string' || data.status !== 'ok') {
                        NETDATA.error(411, NETDATA.registry.server + ' responded with: ' + JSON.stringify(data));
                        data = null;
                    }

                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(412, NETDATA.registry.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        search: function(machine_guid, callback) {
            // SEARCH for the URLs of a machine:
            $.ajax({
                url: NETDATA.registry.server + '/api/v1/registry?action=search&machine=' + NETDATA.registry.machine_guid + '&name=' + encodeURIComponent(NETDATA.registry.hostname) + '&url=' + encodeURIComponent(NETDATA.serverDefault) + '&for=' + machine_guid,
                async: true,
                cache: false,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function(data) {
                    if(typeof data.status !== 'string' || data.status !== 'ok') {
                        NETDATA.error(417, NETDATA.registry.server + ' responded with: ' + JSON.stringify(data));
                        data = null;
                    }

                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(418, NETDATA.registry.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        },

        switch: function(new_person_guid, callback) {
            // impersonate
            $.ajax({
                url: NETDATA.registry.server + '/api/v1/registry?action=switch&machine=' + NETDATA.registry.machine_guid + '&name=' + encodeURIComponent(NETDATA.registry.hostname) + '&url=' + encodeURIComponent(NETDATA.serverDefault) + '&to=' + new_person_guid,
                async: true,
                cache: false,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                xhrFields: { withCredentials: true } // required for the cookie
            })
                .done(function(data) {
                    if(typeof data.status !== 'string' || data.status !== 'ok') {
                        NETDATA.error(413, NETDATA.registry.server + ' responded with: ' + JSON.stringify(data));
                        data = null;
                    }

                    if(typeof callback === 'function')
                        return callback(data);
                })
                .fail(function() {
                    NETDATA.error(414, NETDATA.registry.server);

                    if(typeof callback === 'function')
                        return callback(null);
                });
        }
    };

    // ----------------------------------------------------------------------------------------------------------------
    // Boot it!

    if(typeof netdataPrepCallback === 'function')
        netdataPrepCallback();

    NETDATA.errorReset();
    NETDATA.loadRequiredCSS(0);

    NETDATA._loadjQuery(function() {
        NETDATA.loadRequiredJs(0, function() {
            if(typeof $().emulateTransitionEnd !== 'function') {
                // bootstrap is not available
                NETDATA.options.current.show_help = false;
            }

            if(typeof netdataDontStart === 'undefined' || !netdataDontStart) {
                if(NETDATA.options.debug.main_loop === true)
                    console.log('starting chart refresh thread');

                NETDATA.start();
            }
        });
    });
})(window, document);
