
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {function(): Promise<SvelteComponent>} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {Object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {Object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {Object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/.pnpm/svelte-spa-router@3.0.3_svelte@3.29.0/node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.29.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix) {
    				if (typeof prefix == "string" && path.startsWith(prefix)) {
    					path = path.substr(prefix.length) || "/";
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/halaman/Beranda.svelte generated by Svelte v3.29.0 */

    const file = "src/halaman/Beranda.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let br0;
    	let t0;
    	let center;
    	let p0;
    	let strong;
    	let t2;
    	let p1;
    	let t4;
    	let br1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let p4;
    	let t11;
    	let br2;
    	let t12;
    	let p5;
    	let a;

    	const block = {
    		c: function create() {
    			div = element("div");
    			br0 = element("br");
    			t0 = space();
    			center = element("center");
    			p0 = element("p");
    			strong = element("strong");
    			strong.textContent = "PRIMA SOLUTIONS CONSULTANT";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Konsultan Psikologi Bidang Pendidikan";
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "BUKU SOAL";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "JAPA INTEREST SCALE";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "G-IV";
    			t11 = space();
    			br2 = element("br");
    			t12 = space();
    			p5 = element("p");
    			a = element("a");
    			a.textContent = "Baca instruksi";
    			add_location(br0, file, 1, 1, 25);
    			add_location(strong, file, 3, 5, 45);
    			add_location(p0, file, 3, 2, 42);
    			add_location(p1, file, 4, 2, 95);
    			add_location(br1, file, 5, 2, 142);
    			add_location(p2, file, 6, 2, 149);
    			add_location(p3, file, 7, 2, 168);
    			add_location(p4, file, 8, 2, 197);
    			add_location(br2, file, 9, 2, 211);
    			attr_dev(a, "href", "#/instruksi");
    			attr_dev(a, "class", "btn btn-success");
    			add_location(a, file, 10, 5, 221);
    			add_location(p5, file, 10, 2, 218);
    			add_location(center, file, 2, 1, 31);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, br0);
    			append_dev(div, t0);
    			append_dev(div, center);
    			append_dev(center, p0);
    			append_dev(p0, strong);
    			append_dev(center, t2);
    			append_dev(center, p1);
    			append_dev(center, t4);
    			append_dev(center, br1);
    			append_dev(center, t5);
    			append_dev(center, p2);
    			append_dev(center, t7);
    			append_dev(center, p3);
    			append_dev(center, t9);
    			append_dev(center, p4);
    			append_dev(center, t11);
    			append_dev(center, br2);
    			append_dev(center, t12);
    			append_dev(center, p5);
    			append_dev(p5, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Beranda", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Beranda> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Beranda extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Beranda",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/halaman/Instruksi.svelte generated by Svelte v3.29.0 */
    const file$1 = "src/halaman/Instruksi.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let br;
    	let t0;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let hr;
    	let t5;
    	let form;
    	let div0;
    	let label0;
    	let t7;
    	let input0;
    	let t8;
    	let div1;
    	let label1;
    	let t10;
    	let input1;
    	let t11;
    	let div2;
    	let label2;
    	let t13;
    	let input2;
    	let t14;
    	let div3;
    	let label3;
    	let t16;
    	let input3;
    	let t17;
    	let div4;
    	let input4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			br = element("br");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Selamat pagi adik-adik.";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Dalam buku ini terdapat sejumlah pernyataan untuk mengungkap minat pada bidang tertentu. Terdapat 99 pilihan. Tugas adik-adik adalah membaca semua pilihan tersebut. Kemudian, pilihlah 7 (tujuh) dari 99 yang menggambarkan diri adik. Tulislah nomor yang menggambarkan pilihan di kertas yang disediakan. Kemudian, rangkinglah dari 1 sampai dengan 7. Nomor 1 menunjukkan yang paling diminati, nomor 2 diminati, nomor 3 cukup diminati, dst.";
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nomor Tes";
    			t7 = space();
    			input0 = element("input");
    			t8 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Nama";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Kelas / Sekolah";
    			t13 = space();
    			input2 = element("input");
    			t14 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "JK";
    			t16 = space();
    			input3 = element("input");
    			t17 = space();
    			div4 = element("div");
    			input4 = element("input");
    			add_location(br, file$1, 1, 1, 25);
    			add_location(p0, file$1, 2, 1, 31);
    			add_location(p1, file$1, 3, 1, 63);
    			add_location(hr, file$1, 4, 1, 507);
    			attr_dev(label0, "for", "nomor-tes");
    			add_location(label0, file$1, 7, 6, 590);
    			attr_dev(input0, "id", "nomor-tes");
    			attr_dev(input0, "type", "tel");
    			attr_dev(input0, "class", "form-control");
    			input0.required = true;
    			add_location(input0, file$1, 8, 6, 637);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$1, 6, 5, 559);
    			attr_dev(label1, "for", "nama");
    			add_location(label1, file$1, 11, 6, 771);
    			attr_dev(input1, "id", "nama");
    			attr_dev(input1, "class", "form-control");
    			input1.required = true;
    			add_location(input1, file$1, 12, 6, 808);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$1, 10, 5, 740);
    			attr_dev(label2, "for", "kelas-sekolah");
    			add_location(label2, file$1, 15, 6, 922);
    			attr_dev(input2, "id", "kelas-sekolah");
    			attr_dev(input2, "class", "form-control");
    			input2.required = true;
    			add_location(input2, file$1, 16, 6, 979);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$1, 14, 5, 891);
    			attr_dev(label3, "for", "jk");
    			add_location(label3, file$1, 19, 6, 1110);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "jk");
    			input3.required = true;
    			attr_dev(input3, "name", "");
    			add_location(input3, file$1, 20, 6, 1143);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$1, 18, 5, 1079);
    			attr_dev(input4, "type", "submit");
    			attr_dev(input4, "class", "btn btn-info");
    			input4.value = "Lanjut...";
    			attr_dev(input4, "name", "");
    			add_location(input4, file$1, 23, 7, 1286);
    			attr_dev(div4, "class", "form-group text-center");
    			add_location(div4, file$1, 22, 5, 1242);
    			add_location(form, file$1, 5, 1, 513);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, br);
    			append_dev(div5, t0);
    			append_dev(div5, p0);
    			append_dev(div5, t2);
    			append_dev(div5, p1);
    			append_dev(div5, t4);
    			append_dev(div5, hr);
    			append_dev(div5, t5);
    			append_dev(div5, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t7);
    			append_dev(div0, input0);
    			set_input_value(input0, /*nomorTes*/ ctx[0]);
    			append_dev(form, t8);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t10);
    			append_dev(div1, input1);
    			set_input_value(input1, /*nama*/ ctx[1]);
    			append_dev(form, t11);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t13);
    			append_dev(div2, input2);
    			set_input_value(input2, /*kelasSekolah*/ ctx[2]);
    			append_dev(form, t14);
    			append_dev(form, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t16);
    			append_dev(div3, input3);
    			set_input_value(input3, /*jk*/ ctx[3]);
    			append_dev(form, t17);
    			append_dev(form, div4);
    			append_dev(div4, input4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*lanjut*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nomorTes*/ 1) {
    				set_input_value(input0, /*nomorTes*/ ctx[0]);
    			}

    			if (dirty & /*nama*/ 2 && input1.value !== /*nama*/ ctx[1]) {
    				set_input_value(input1, /*nama*/ ctx[1]);
    			}

    			if (dirty & /*kelasSekolah*/ 4 && input2.value !== /*kelasSekolah*/ ctx[2]) {
    				set_input_value(input2, /*kelasSekolah*/ ctx[2]);
    			}

    			if (dirty & /*jk*/ 8 && input3.value !== /*jk*/ ctx[3]) {
    				set_input_value(input3, /*jk*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Instruksi", slots, []);
    	let nomorTes = "";
    	let nama = "";
    	let kelasSekolah = "";
    	let jk = "";

    	const lanjut = () => {
    		localStorage.setItem("dataJapa", JSON.stringify({ nomorTes, nama, kelasSekolah, jk }));
    		push("/tes/1");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Instruksi> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		nomorTes = this.value;
    		$$invalidate(0, nomorTes);
    	}

    	function input1_input_handler() {
    		nama = this.value;
    		$$invalidate(1, nama);
    	}

    	function input2_input_handler() {
    		kelasSekolah = this.value;
    		$$invalidate(2, kelasSekolah);
    	}

    	function input3_input_handler() {
    		jk = this.value;
    		$$invalidate(3, jk);
    	}

    	$$self.$capture_state = () => ({
    		nomorTes,
    		nama,
    		kelasSekolah,
    		jk,
    		push,
    		lanjut
    	});

    	$$self.$inject_state = $$props => {
    		if ("nomorTes" in $$props) $$invalidate(0, nomorTes = $$props.nomorTes);
    		if ("nama" in $$props) $$invalidate(1, nama = $$props.nama);
    		if ("kelasSekolah" in $$props) $$invalidate(2, kelasSekolah = $$props.kelasSekolah);
    		if ("jk" in $$props) $$invalidate(3, jk = $$props.jk);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nomorTes,
    		nama,
    		kelasSekolah,
    		jk,
    		lanjut,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class Instruksi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Instruksi",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const data = [
        ["berpartisipasi pada pelatihan memberikan <strong>pertolongan pertama pada kecelakaan ringan.</strong>", "senang mempelajari cara <strong>mengenali, mencegah & mengobati penyakit tertentu.</strong>", "ingin mengetahui lebih banyak tentang <strong>stetoskop, tensimeter, thermometer, dll.</strong>"],
        ["berpartisipasi pada seminar <strong>sistem kekebalan tubuh manusia.</strong>", "senang mempelajari <strong>sistem syaraf, reproduksi, peredaran darah atau pernafasan manusia.</strong>", "bisa menjelaskan <strong>fungsi/proses pada jantung, paru-paru, ginjal, hati, atau usus manusia.</strong>"],
        ["berpartisipasi pada pelatihan <strong>cara merawat orang sakit.</strong>", "bisa menjelaskan cara supaya <strong>tubuh sehat dan bugar.</strong>", "bisa menjelaskan apa yang dilakukan jika ada yang <strong>demam ringan, pileks, atau batuk.</strong>"],
        ["bersedia menjadi tim yang membuat <strong>antibiotik bagi tubuh manusia.</strong>", "senang mempelajari tentang <strong>tanaman, bahan-bahan atau sesuatu yang bisa dijadikan obat.</strong>", "senang diajak meneliti <strong>khasiat dari jahe, kunyit, temulawak bagi kesehatan.</strong>"],
        ["berpartisipasi seminar memilih <strong>makanan yang sesuai dengan kebutuhan tubuh.</strong>", "senang mempelajari tentang <strong>kandungan protein, karbohidrat, vitamin, zat besi, omega 3</strong><strong> </strong>dari makanan/minuman tertentu.", "bersedia menjadi tim meneliti <strong>kandungan nutrisi suatu sayuran, buahan maupun daging.</strong>"],
        ["berpartisipasi pada tim yang mensurvey <strong>kebersihan suatu lingkungan (daerah).</strong>", "senang mempelajari tentang <strong>pola hidup sehat.</strong>", "bersedia menjadi tim yang memikirkan strategi supaya <strong>masyarakat lebih banyak mengkonsumsi sayuran, buahan & air putih.</strong>"],
        ["berpartisipasi seminar <strong>cara mengenali, mencegah, mengobati penyakit gusi & mulut.</strong>", "senang mempelajari <strong>cara memelihara gigi supaya sehat, kuat & bersih.</strong>", "ingin mengetahui lebih bayak tentang <strong>alat-alat kedokteran gigi.</strong>"],
        ["berpartisipasi pada seminar <strong>temuan terbaru kromosom.</strong>", "senang mempelajari tentang <strong>sel, mikroba, atau virus.</strong>", "bersedia menjadi tim yang meneliti <strong>manfaat suatu bakteri.</strong>"],
        ["senang <strong>memelihara atau merawat binatang.</strong>", "bisa menjelaskan <strong>bagian & fungsi tubuh hewan.</strong>", "bersedia menjadi tim yang meneliti <strong>sistem peredaran darah suatu hewan.</strong>"],
        ["berpartisipasi pada pelatihan <strong>memilih pakan ternak yang bermutu tinggi.</strong>", "senang mempelajari tentang <strong>pengembangbiakan ikan, cumi-cumi </strong>atau <strong>kepiting.</strong>", "bersedia menjadi tim yang membuat <strong>antibiotik bagi unggas.</strong>"],
        ["berpartisipasi pada seminar mengenali, mencegah, mengobati <strong>penyakit hewan kesayangan.</strong>", "senang mempelajari tentang bagaimana membuat <strong>hewan menjadi sehat dan kuat.</strong>", "menjadi tim yang mengobati <strong>hewan yang sakit.</strong>"],
        ["senang memelihara atau merawat <strong>tanaman.</strong>", "bisa menjelaskan <strong>bagian dan fungsi tumbuhan.</strong>", "menjadi bagian tim yang mengembangkan <strong>tumbuhan langka.</strong>"],
        ["berpartisipasi pada pelajatihan meningkatkan <strong>kualitas hasil buah-buahan dan sayur-sayuran.</strong>", "senang mempelajari tentang <strong>pengembangbiakan kol, cabe, kentang, jagung atau bawang.</strong>", "bersedia menjadi tim yang membuat <strong>pupuk bagi kesuburan tanah.</strong>"],
        ["berpartisipasi pada pelatihan cara menanam <strong>sawit.</strong>", "senang diajarkan cara menanam, merawat, maupun memetik <strong>cengkeh.</strong>", "bersedia menjadi bagian tim yang membuat antibiotik bagi ketahanan <strong>karet.</strong>"],
        ["berpartisipasi pada seminar <strong>memanfaatkan hasil-hasil hutan.</strong>", "senang mempelajari tentang bagaimana melestarikan <strong>hutan-hutan Indonesia.</strong>", "bersedia menjadi tim yang membudidayakan <strong>pohon untuk tanaman hutan.</strong>"],
        ["berpartisipasi pada seminar teknologi terkini <strong>pengolahan lahan pertanian.</strong>", "senang membaca tentang <strong>alat-alat pertanian.</strong>", "bersedia menjadi tim yang meneliti metode baru <strong>merawat hasil-hasil pertanian pasca panen.</strong>"],
        ["berpartisipasi pada seminar <strong>pemanfaatan hasil-hasil laut.</strong>", "senang membaca atau berdiskusi tentang <strong>biota di dasar laut.</strong>", "bersedia menjadi tim yang meneliti <strong>ekosistem di sebuah pantai.</strong>"],
        ["berpartisipasi pada kampanye <strong>menyelamatkan bumi dari pemanasan global.</strong>", "senang mempelajari tentang <strong>keanekaragaman hayati di sebuah ekosistem.</strong>", "bersedia menjadi tim yang memeriksa <strong>kondisi tanah, air atau udara </strong>di sebuah tempat."],
        ["berpartisipasi pada seminar dampak <strong>perubahan iklim </strong>terhadap kehidupan di bumi.", "senang membaca tentang <strong>cuaca.</strong>", "bersedia saat diajak ke <strong>Badan Meteorologi dan Geofisika </strong>untuk melihat proses disana."],
        ["berpartisipasi pada seminar temuan terbaru <strong>planet di tata surya.</strong>", "senang mempelajari tentang <strong>benda-benda luar angkasa.</strong>", "bersedia menjadi tim yang meneliti tentang <strong>UFO, meteor, bintang.</strong>"],
        ["berpartisipasi pada seminar <strong>‘temuan terbaru teori realitivitas energi’.</strong>", "senang mempraktikkan <strong>teori atau eksperimen Fisika dalam kehidupan sehari-hari.</strong>", "senang membaca <strong>materi Fisika </strong>yang belum diajarkan."],
        ["berpartisipasi pada seminar temuan terbaru di bidang <strong>atom.</strong>", "bersedia menjadi tim yang mensurvey <strong>kualitas energi nuklir untuk PLTN di suatu tempat.</strong>", "memilih menghadiri diskusi tentang memanfaatkan <strong>nuklir untuk kepentingan damai.</strong>"],
        ["berpartisipasi pada seminar teknologi terkini pada bidang <strong>HP, TV atau radio.</strong>", "senang mempelajari tentang cara membuat <strong>robot elektronik.</strong>", "bersedia menjadi tim membuat <strong>aliran listrik dari air terjun, sungai, tenaga surya atau angin.</strong>"],
        ["berpartisipasi pada pelatihan <strong>memperbaiki TV, radio, setrika, atau tape </strong>yang rusak.", "bisa menjelaskan <strong>nama/fungsi dari benda elektronik tertentu.</strong>", "senang <strong>mengotak-atik benda elektronik </strong>tertentu."],
        ["berpartisipasi pada pelatihan membuat <strong>desain mesin mobil yang canggih.</strong>", "senang mempelajari tentang <strong>teknologiterkini kendaraan bermotor.</strong>", "senang sekali jika diajak untuk membuat <strong>sepeda elektronik.</strong>"],
        ["berpartisipasi pada pelatihan <strong>cara memperbaiki mobil/motor yang bermasalah.</strong>", "bisa menjelaskan tentang nama/fungsi <strong>komponen kendaraan bermotor.</strong>", "senang <strong>memodifikasi motor/mobil.</strong>"],
        ["memilih menjadi bagian tim yang membuat <strong>alat penyaring air.</strong>", "senang memikirkan cara membuat <strong>mesin yang bermanfaat bagi kehidupan.</strong>", "bersedia saat diajak membuat <strong>alat pengolah sampah</strong>."],
        ["berpartisipasi pada seminar <strong>teknologi terkini di bidangkapal selam.</strong>", "senang mempelajari tentang <strong>teknologi mesin perkapalan.</strong>", "memilih menjadi bagian tim yang membuat <strong>speed boat elektronik.</strong>"],
        ["berpartisipasi pada pelatihan <strong>menjadi nahkoda kapal.</strong>", "senang diajak <strong>berlayar </strong>ke berbagai tempat.", "memiliki cita-cita menjadi <strong>pelaut.</strong>"],
        ["berpartisipasi pada seminar teknologi terkini di bidang <strong>kedirgantaraan (industry pesawat).</strong>", "senang mempelajari tentang <strong>pesawat terbang atau apollo.</strong>", "bersedia menjadi tim yang membuat <strong>helikopter mini.</strong>"],
        ["berpartisipasi pada pelatihan <strong>mengendarai helikopter.</strong>", "senang saat diajak <strong>keliling </strong>Indonesia dengan pesawat.", "memiliki cita-cita menjadi <strong>pilot.</strong><strong><u></u></strong>"],
        ["berpartisipasi pada pelatihan menjadi <strong>staf </strong>suatu <strong>maskapai penerbangan.</strong>", "mempelajari pengelolaan <strong>maskapai penerbangan.</strong>", "berniat menjadi <strong>pramugara (I).</strong>"],
        ["berpartisipasi pada seminar <strong>‘temuan terbaru teorama phytagoras’.</strong>", "senang mempelajari <strong>materi matematika </strong>yang belum diajarkan.", "bersedia menjadi tim yang mengembangkan <strong>model baru persamaan kuadrat.</strong>"],
        ["berpartisipasi pada seminar <strong>temuan terbaru di bidang statistik.</strong>", "bersedia menjadi tim yang <strong>mendata jumlah suatu penduduk.</strong>", "bisa menjelaskan tentang <strong>mean, median, modus, frekuensi atau korelasi.</strong>"],
        ["berpartisipasi pada pelatihan cara menggunakan <strong>bahasa pemrograman tertentu.</strong>", "ingin membuat aplikasi, seperti: <strong>facebook, twitter, Microsoft Office.</strong>", "bersedia menjadi tim yang membuat atau mengelola <strong>website sekolah.</strong>"],
        ["berpartisipasi pada pelatihan cara membuat <strong>jaringan antar komputer.</strong>", "menjadi bagian tim yang membuat <strong>jaringan internet dari panic bagi warga.</strong>", "senang mengamati <strong>teknologi terkini motherboard, memory, CPU.</strong>"],
        ["berpartisipasi pada pelatihan cara <strong>membuat desain/gambar suatu tempat, </strong>seperti taman bermain anak-anak, taman kota, jogging track.", "senang mempelajari tentang <strong>desain bangunan, seperti rumah, gedung, jembatan.</strong>", "bersedia menjadi tim yang <strong>merancang desain (gambar) kompleks bangunan, seperti: perkantoran, sekolah, pusat perbelanjaan </strong>yang baru."],
        ["bersedia menjadi tim yang mensurvey <strong>lokasi sarana dan prasarana kabupaten yang baru dibentuk.</strong>", "senang mempelajari cara mengelola <strong>(strategi) sebuah kawasan sehingga maju baik secara fisik, ekonomi maupun budaya.</strong>", "bersedia menjadi yang memikirkan memperbaiki <strong>tata kota yang semberaut.</strong>"],
        ["berpartisipasi pada tim yang membuat <strong>rumah tahan gempa.</strong>", "senang mempelajari tentang cara, alat dan bahan membuat suatu <strong>bangunan (konstruksi).</strong>", "bersedia saat diajarkan cara membuat <strong>jalan, irigasi, bendungan, gedung maupun bandara.</strong>"],
        ["berpartisipasi pada seminar <strong>pembangunan yang berwawasan lingkungan.</strong>", "senang mempelajari tentang bagaimana membuat <strong>bangunan fisik yang ramah lingkungan.</strong>", "bersedia menjadi tim yang membuat <strong>lingkungan menjadi hijau dan bersih.</strong>"],
        ["berpartisipasi pada seminar teori terbaru <strong>pembentukan daratan & lautan Indonesia.</strong>", "senang mempelajari tentang <strong>gunung, lembah, laut, samudera maupun sungai.</strong>", "memahami <strong>simbol-simbol peta.</strong><em></em>"],
        ["berpartisipasi pada seminar temuan terbaru <strong>bentuk & lapisan yang menyusun bumi.</strong>", "senang mempelajari tentang <strong>kandungan-kandungan yang ada di dalam perut bumi.</strong>", "bersedia menjadi tim yang meneliti <strong>jenis-jenis batuan </strong>di suatu lokasi."],
        ["menjadi tim yang meneliti <strong>pola keruangan (bentuk) suatu wilayah.</strong>", "senang membaca tentang <strong>sistem informasi geografi atau penginderaan jauh.</strong>", "bersedia menjadi tim yang <strong>memetakan tanah </strong>sebelum digunakan sebagai lahan."],
        ["berpartisipasi pada seminar <strong>‘memanfaatkan tenaga panas bumi untuk kehidupan’.</strong>", "menjadi bagian tim yang membuat <strong>alat pendeteksi gempa bumi.</strong>", "bersedia menjadi tim yang membuat <strong>aliran listrik dari tenaga uap.</strong>"],
        ["bepartisipasi pada seminar <strong>cadangan minyak Indonesia.</strong>", "senang mempelajari tentang <strong>pembentukan maupun eksplorasi minyak dari perut bumi.</strong>", "bersedia menjadi tim yang meneliti <strong>kandungan gas alam </strong>di daerah kami."],
        ["berpartisipasi pada seminar <strong>kekayaan sumber daya mineral Indonesia.</strong>", "senang mempelajari tentang <strong>pembentukan maupun eksplorasi tambang (emas, timah, besi) dari perut bumi.</strong>", "bersedia menjadi bagian tim yang meneliti <strong>kadar batubara di suatu wilayah.</strong>"],
        ["berpartisipasi pada seminar <strong>teknologi terkini pengolahan plastic, keramik maupun timah.</strong>", "senang mempelajari tentang <strong>mengolah perak, magan, besi menjadi benda bermanfaat.</strong>", "bersedia menjadi bagian tim yang <strong>mengolah alumunium menjadi benda pakai.</strong>"],
        ["berpartisipasi pada seminar temuan terbaru <strong>sistem periodik unsur.</strong>", "senang mempelajari/mempraktikkan <strong>teori Kimia </strong>dari buku.", "bersedia menjadi tim yang meneliti tentang <strong>rantai karbon.</strong>"],
        ["menjadi tim bereksperimen mengolah <strong>kayu menjadi bubuk kertas sehingga menjadi kertas.</strong>", "senang jika diajak membuat suatu <strong>pupuk dari bahan kimia.</strong>", "bersedia menjadi tim yang mengolah <strong>minyak mentah menjadi bensin, avtur atau pertamax.</strong>"],
        ["berpartisipasi pada seminar <strong>esensi dari kehidupan, tuhan atau manusia.</strong>", "senang mencari <strong>hikmah di balik sebuah kejadian </strong>baik pada diri saya, orang lain, masyarakat maupun alam semesta.", "senang membaca buku karya <strong>orang terkenal, </strong>seperti: Aristoteles, Nietze, Karl Max, Tan Malaka, Sukarno."],
        ["berpartisipasi pada seminar cara membuat <strong>umat manusia patuh pada perintah tuhan.</strong>", "senang membaca atau berdiskusi tentang <strong>keyakinan yang saya anut.</strong>", "bersedia menyebarkan <strong>agama yang saya anut.</strong>"],
        ["berpartisipasi pada seminar <strong>cara memahami diri sendiri maupun orang lain dengan baik.</strong>", "senang membaca atau berdiskusi tentang <strong>kepribadian, jiwa, emosi, motivasi, karakter, dll.</strong>", "senang mendengarkan <strong>curhatan hati teman </strong>atau <strong>mengamati perilaku orang lain.</strong>"],
        ["berpartisipasi pada pelatihan cara <strong>berkomunikasi dengan baik </strong>di hadapan khalayak ramai.", "bisa menjelaskan <strong>tips berbicara </strong>yang sesuai orang, waktu atau keadaan.", "bersedia menjadi <strong>moderator, pembaca acara, MC, juru bicara </strong>pada sebuah acara/kegiatan."],
        ["berpartisipasi pada seminar mengoptimalkan <strong>tumbuh kembang anak usia dini.</strong>", "senang bermain, bercerita atau mengasuh <strong>anak-anak kecil.</strong>", "bersedia saat diminta menjadi <strong>asisten guru TK.</strong>"],
        ["berpartisipasi kampanye menyadarkan masyarakat tentang kepedulian <strong>pada anak-anak berkebutuhan khusus.</strong>", "senang mempelajari tentang <strong>anak autism, ADHD, tuna grahita, down syndrome, dll.</strong>", "berniat membuat sekolah, klinik, atau rumah singgah bagi <strong>anak-anak yang memiliki kelainan.</strong>"],
        ["berpartisipasi pada seminar <strong>meningkatkan kualitas pendidikan Indonesia.</strong>", "senang berdiskusi tentang bagaimana <strong>meningkatkan semangat belajar.</strong>", "bersedia menjadi tim yang mengampanyekan <strong>‘penanaman minat baca sejak dini’.</strong>"],
        ["berpartisipasi pada <strong>pelatihan kepemimpinan.</strong>", "senang membuat <strong>perencanaan, melaksanakan & mengevaluasinya.</strong>", "senang terlibat <strong>aktif di suatu organisasi.</strong>"],
        ["berpartisipasi pada seminar cara <strong>mengelola sebuah usaha.</strong>", "senang berdiskusi tentang hal-hal apa saja yang <strong>layak dijadikan bisnis.</strong>", "ingin memiliki <strong>usaha pribadi.</strong>"],
        ["berpartisipasi pada seminar <strong>‘arah kebijakan Export Import Indonesia’.</strong>", "senang dengan sesuatu yang berhubungan dengan <strong>pertumbuhan ekonomi, PDB, valuta asing, saham atau kurs.</strong>", " senang membaca, mengamati atau berdiskusi tentang <strong>perkembangan ekonomi dunia.</strong>"],
        ["berpartisipasi pada seminar <strong>‘Rancangan Anggaran dan Pendapatan Belanja Negara’.</strong>", "senang berdiskusi tentang cara mengoptimalkan <strong>pendapatan Negara.</strong>", "ingin mengetahui lebih banyak tentang <strong>perpajakan.</strong>"],
        ["bersedia menjadi tim yang memeriksa <strong>laporan keuangan </strong>OSIS.", "senang dengan sesuatu berhubungan dengan <strong>Akuntansi.</strong>", "bersedia menjadi tim yang membuat <strong>anggaran perjalanan wisata sekolah.</strong>"],
        ["pelatihan cara <strong>mengelola keuangan </strong>yang efektif dan efisien.", "senang dengan sesuatu berhubungan dengan <strong>pengelolaan keuangan.</strong>", "senang berdiskusikan tentang bagaimana <strong>memaksimalkan pemasukan dan meminimalkan pengeluaran.</strong>"],
        ["memilih berpartisipasi seminar perkembangan <strong>perbankan syariah di Indonesia.</strong>", "senang jika diajarkan tentang proses pemberian <strong>pinjaman atau kresit </strong>di sebuah bank", "bisa menjelaskan tentang <strong>valuta asing, kurs atau deposito.</strong>"],
        ["berpartisipasi pada seminar <strong>‘munculnya negara adidaya baru’.</strong>", "senang mengamati, membaca atau berdiskusi tentang <strong>perkembangan politik, ekonomi, sosial, militer dunia internasional (antar bangsa).</strong>", "ingin membuat Indonesia menjadi <strong>negara yang disenangi/berperan aktif di mata internasional.</strong>"],
        ["berpartisipasi pada seminar <strong>pelaksanaan otonomi daerah.</strong>", "senang mengamati atau berdiskusi tentang <strong>kebijakan terkini yang dibuat oleh pemerintah.</strong>", "bersedia menjadi bagian tim yang mengampanyekan <strong>pemerintahan yang bersih (bersih KKN).</strong>"],
        ["berpartisipasi pada seminar tentang <strong>peta kekuatan partai-partai saat ini.</strong>", "senang berdiskusi tentang siapa yang mungkin menjadi <strong>bupati, walikota atau gubernur di daerah kami.</strong>", "bisa menjelaskan strategi untuk <strong>terpilih menjadi anggota dewan.</strong>"],
        ["berpartisipasi pada <strong>diskusi Amandemen UUD 1945.</strong>", "bersedia menjadi tim yang membuat <strong>peraturan bagi kelas, sekolah atau wilayah sekitar.</strong>", "senang mempelajari tentang <strong>penerapan hukum di Indonesia.</strong>"],
        ["berpartisipasi pada diskusi cara mengurangi <strong>tingkat kriminalitas dalam masyarakat.</strong>", "senang jika diajarkan cara mengungkap <strong>dalang di balik suatu kejahatan.</strong>", "bersedia menjadi tim yang menyelidiki <strong>kasus pencurian.</strong>"],
        ["berpartisipasi pada pelatihan <strong>‘menjadi Inteligen remaja’.</strong>", "senang mempelajari tentang <strong>dunia detektif.</strong>", "bersedia disusupkan sebagai <strong>agen rahasia </strong>ke sebuah tempat untuk mengumpulkan informasi penting."],
        ["berpartisipasi pada <strong>membaca makna dari suatu simbol huruf, lambang, angka tertentu.</strong>", "senang diajarkan cara memecahkan tentang <strong>kode </strong>tertentu.", "bersedia menjadi tim yang memecahkan <strong>misteri dari suatu peta atau petunjuk.</strong>"],
        ["berpartisipasi pada <strong>kegiatan Pramuka atau Paskibraka.</strong>", "merasa bersemangat saat mendengarkan <strong>lagu Indonesia Raya maupun lagu nasional lainnya.</strong>", "senang berdiskusi tentang meningkatkan <strong>rasa cinta tanah air pada generasi muda.</strong>"],
        ["berpartisipasi pada <strong>pelatihan ala militer (wajib militer).</strong>", "bersedia <strong>mengorbankan jiwa dan raga </strong>demi keutuhan Negara Kesatuan Republik Indonesia (NKRI).", "bersedia menjadi <strong>pasukan cadangan </strong>jika Indonesia diserang musuh."],
        ["berpartisipasi pada <strong>lomba olahraga </strong>yang digemari.", "bersedia menjadi <strong>wasit atau mengajarkan olahraga yang digemari.</strong>", "ingin <strong>mendalami olahraga </strong>yang digemari."],
        ["berpartisipasi pada seminar <strong>‘meningkatkan kesejahteraan rakyat’.</strong>", "bersedia menjadi <strong>relawan ke sebuah daerah bencana.</strong>", "ingin <strong>membuat panti/rumah singgah </strong>bagi orang yang terlantar."],
        ["bersedia menjadi tim meneliti <strong>kehidupan di sebuah desa terpencil.</strong>", "senang berdiskusi tentang <strong>perkembangan (dinamika) masyarakat saat ini.</strong>", "bisa menjelaskan pola <strong>hidup/karakter </strong>dari golongan, kabupaten atau budaya tertentu di Indonesia."],
        ["berpartisipasi pada kampanye melestarikan <strong>budaya leluhur kita.</strong>", "senang berdiskusi tentang <strong>suku-suku tradisional (pedalaman).</strong>", "senang membaca tentang <strong>tradisi asli Indonesia.</strong>"],
        ["berpartisipasi pada kampanye <strong>melestarikan bahasa daerah.</strong>", "mempelajari <strong>bahasa nusantara, </strong>seperti: Jawa, Minang, Minahasa, Batak, Melayu, Bugis.", "menjadi tim yang mengumpulkan <strong>sastra/tata bahasa </strong>suatu bahasa tradisional Indonesia untuk dijadikan buku."],
        ["berpartisipasi pada diskusi menjadikan <strong>budaya tradisional sebagai asset pariwisata.</strong>", "senang berdiskusi tentang cara <strong>menarik turis suoaya berkunjung ke Indonesia.</strong>", "ingin berkunjung ke <strong>tempat-tempat menarik di Indonesia atau dunia.</strong>"],
        ["berpartisipasi pada seminar <strong>teori terbaru asal usul nenek moyang bangsa Indonesia.</strong>", "bersedia menjadi tim yang meneliti <strong>fakta di balik sebuah peristiwa bersejarah.</strong>", "senang membaca tentang <strong>Peradaban Kuno (Yunani, Romawi, Persia, Cina, India).</strong>"],
        ["menjadi tim mengeksplorasi keberadaan <strong>arca, mumi atau barang-barang kuno.</strong>", "senang mempelajari tentang <strong>manusia purba beserta kehidupannya.</strong>", "bersedia menjadi tim yang memugar sebuah <strong>candi.</strong>"],
        ["berpartisipasi pada pelatihan berkomunikasi <strong>bahasa asing yang (digemari).</strong>", "senang mempelajari tentang <strong>tata bahasa bahasa asing tertentu (digemari).</strong>", "bisa mengajarkan cara <strong>menulis kata sederhana dari bahasa asing yang digemari.</strong>"],
        ["berpartisipasi pada <strong>festival kebudayaan negara asing yang (digemari).</strong>", "senang dengan <strong>pakaian atau benda-benda dari negara tertentu yang (digemari).</strong>", "ingin mengunjungi & tinggal di <strong>sebuah negara tertentu untuk melihat pola hidup mereka.</strong>"],
        ["berpartisipasi pada lomba membuat <strong>cerita pendek (cerpen).</strong>", "senang membuat <strong>puisi, prosa atau pantun.</strong>", "ingin membuat <strong>novel atau buku.</strong>"],
        ["menjadi bagian tim yang tampil membawakan <strong>lagu pada festival musik.</strong>", "senang <strong>bernyanyi, mendengarkan musik atau bermain alat musik.</strong>", "senang membuat <strong>lagu.</strong>"],
        ["bersedia menjadi bagian tim yang menampilkan <strong>drama pada acara sekolah.</strong>", "bersedia menjadi <strong>sutradara (pengarah acara) untuk sebuah pertunjukan.</strong>", "bersedia membuat <strong>naskah suatu drama.</strong>"],
        ["menjadi bagian yang menampilkan <strong>tarian tertentu pada acara sekolah.</strong>", "bersedia mengajarkan <strong>tarian yang dikuasai pada anak-anak kecil.</strong>", "ingin mempelajari <strong>tari kreasi baru, barat maupun internasional.</strong>"],
        ["berpartisipasi pada <strong>pelatihan cara memotret yang baik dan tepat.</strong>", "senang diajak ke sebuah <strong>tempat atau acara untuk memotret sesuatu.</strong>", "senang berdiskusi tentang cara meningkatkan <strong>kualitas hasil poto.</strong>"],
        ["berpartisipasi pada pelatihan cara membuat <strong>naskah film.</strong>", "bersedia menjadi tim yang membuat <strong>film dokumenter.</strong>", "senang berdiskusi tentang <strong>film tertentu.</strong>"],
        ["berpartisipasi pada <strong>pelatihan ‘menjadi reporter remaja’.</strong>", "bersedia menjadi <strong>editor bulletin atau majalah sekolah.</strong>", "ingin <strong>magang di radio atau televise lokal.</strong>"],
        ["berpartisipasi diskusi cara membuat <strong>masyarakat mau berkunjung ke perpustakaan.</strong>", "senang berkunjung <strong>ke perpustakaan.</strong>", "bersedia tim yang akan <strong>menyusun buku berdasarkan nomor urut di perpustakaan.</strong>"],
        ["berpartisipasi pada pelatihan <strong>membuat surat menyurat </strong>untuk berbagai keperluan.", "mempelajari cara membuat <strong>proposal untuk suatu kegiatam.</strong>", "bersedia menjadi <strong>sekretaris </strong>atau <strong>notulen </strong>untuk suatu kegiatan."],
        ["berpartisipasi pada pelatihan <strong>mendekorasi sebuah panggung pesta/acara.</strong>", "senang mempelajari tentang cara <strong>mendesain sebuah ruangan supaya menarik.</strong>", "bisa memberikan rekomendasi <strong>bentuk maupun tata letak suatu benda pada sebuah tempat.</strong>"],
        ["berpartisipasi pada pelatihan membuat <strong>film animasi.</strong>", "senang mempelajari bagaimana membuat <strong>komik atau karikatur.</strong>", "bersedia saat diminta mmebuat <strong>poster </strong>untuk kegiatan sekolah."],
        ["senang <strong>melukis.</strong>", "senang saat diajak membuat pot, guci atau benda lain dari <strong>tanah liat.</strong>", "bersedia menjadi tim yang membuat patung dari <strong>bongkahan es.</strong>"],
        ["berpartisipasi pada pelatihan memanfaatkan <strong>benda yang tidak dipakai lagi supaya bermanfaat.</strong>", "senang mempelajari atau membuat <strong>kerajinan tangan </strong>tertentu.", "senang saat diajak untuk membuat <strong>anyaman dari bambu.</strong>"],
        ["memilih berpartisipasi pada pelatihan <strong>tat arias pengantin.</strong>", "bisa memberikan rekomendasi tentang <strong>make up yang cocok </strong> bagi acara atau orang tertentu.", "bersedia saat diminta untuk <strong>mendandan </strong>seseorang."],
        ["senang mempelajari atau membuat <strong>desain suatu busana.</strong>", "bisa memberikan rekomendasi <strong>pakaian yang cocok </strong>untuk orang atau acara tertentu.", "memilih berpartisipasi pada pelatihan cara membuat <strong>corak bagi pakaian.</strong>"],
        ["berpartisipasi pada pelatihan <strong>cara membuat border pakaian.</strong>", "senang <strong>menjahit.</strong>", "bisa memperbaiki jika ada <strong>pakaian yang rusak.</strong>"],
        ["berpartisipasi pelatihan membuat <strong>beranekaragam minuman.</strong>", "senang mempelajari atau membuat <strong>masakan</strong> tertentu.", "bersedia diminta untuk menata <strong>hidangan </strong>pada suatu kegiatan."]
    ];

    /* src/halaman/Tes.svelte generated by Svelte v3.29.0 */
    const file$2 = "src/halaman/Tes.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (12:2) {:else}
    function create_else_block$1(ctx) {
    	let li;
    	let div;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			div.textContent = "Kelebihan";
    			attr_dev(div, "class", "page-link svelte-1l95zx9");
    			add_location(div, file$2, 12, 25, 452);
    			attr_dev(li, "class", "page-item");
    			add_location(li, file$2, 12, 3, 430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(12:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (3:2) {#if terkumpul.length <= 7}
    function create_if_block_1(ctx) {
    	let t;
    	let if_block_anchor;
    	let each_value_4 = Array(7);
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let if_block = /*terkumpul*/ ctx[1].length == 7 && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*terkumpul*/ 2) {
    				each_value_4 = Array(7);
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			if (/*terkumpul*/ ctx[1].length == 7) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(3:2) {#if terkumpul.length <= 7}",
    		ctx
    	});

    	return block;
    }

    // (4:3) {#each Array(7) as _, n}
    function create_each_block_4(ctx) {
    	let li;
    	let div;
    	let li_class_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			div.textContent = " ";
    			attr_dev(div, "class", "page-link svelte-1l95zx9");
    			add_location(div, file$2, 5, 5, 222);

    			attr_dev(li, "class", li_class_value = /*terkumpul*/ ctx[1].length >= /*n*/ ctx[8] + 1
    			? "active page-item"
    			: "page-item");

    			add_location(li, file$2, 4, 4, 143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*terkumpul*/ 2 && li_class_value !== (li_class_value = /*terkumpul*/ ctx[1].length >= /*n*/ ctx[8] + 1
    			? "active page-item"
    			: "page-item")) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(4:3) {#each Array(7) as _, n}",
    		ctx
    	});

    	return block;
    }

    // (9:3) {#if terkumpul.length == 7}
    function create_if_block_2(ctx) {
    	let li;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			a.textContent = "Lanjut...";
    			attr_dev(a, "href", "#/atur");
    			attr_dev(a, "class", "page-link svelte-1l95zx9");
    			add_location(a, file$2, 9, 26, 336);
    			attr_dev(li, "class", "page-item");
    			add_location(li, file$2, 9, 4, 314);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*simpan*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(9:3) {#if terkumpul.length == 7}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if params.halaman == n + 1}
    function create_if_block$1(ctx) {
    	let table;
    	let t;
    	let each_value_2 = Array(11);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(table, "class", "table table-bordered");
    			add_location(table, file$2, 20, 3, 603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(table, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*terkumpul, tambahkan, Array, data*/ 10) {
    				each_value_2 = Array(11);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(20:2) {#if params.halaman == n + 1}",
    		ctx
    	});

    	return block;
    }

    // (27:7) {#each Array(3) as _, p}
    function create_each_block_3(ctx) {
    	let li;
    	let raw_value = data[/*n*/ ctx[8] * 11 + /*o*/ ctx[11]][/*p*/ ctx[13]] + "";

    	const block = {
    		c: function create() {
    			li = element("li");
    			add_location(li, file$2, 27, 8, 881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			li.innerHTML = raw_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(27:7) {#each Array(3) as _, p}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#each Array(11) as _, o}
    function create_each_block_2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*n*/ ctx[8] * 11 + /*o*/ ctx[11] + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let ul;
    	let tr_class_value;
    	let mounted;
    	let dispose;
    	let each_value_3 = Array(3);
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*n*/ ctx[8], /*o*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(td0, file$2, 23, 6, 791);
    			add_location(ul, file$2, 25, 8, 836);
    			add_location(td1, file$2, 24, 6, 823);

    			attr_dev(tr, "class", tr_class_value = "" + (null_to_empty(/*terkumpul*/ ctx[1].includes(/*n*/ ctx[8] * 11 + /*o*/ ctx[11])
    			? "click active"
    			: "click") + " svelte-1l95zx9"));

    			add_location(tr, file$2, 22, 5, 675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 0) {
    				each_value_3 = Array(3);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (dirty & /*terkumpul*/ 2 && tr_class_value !== (tr_class_value = "" + (null_to_empty(/*terkumpul*/ ctx[1].includes(/*n*/ ctx[8] * 11 + /*o*/ ctx[11])
    			? "click active"
    			: "click") + " svelte-1l95zx9"))) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(22:4) {#each Array(11) as _, o}",
    		ctx
    	});

    	return block;
    }

    // (19:1) {#each Array(9) as _, n}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*params*/ ctx[0].halaman == /*n*/ ctx[8] + 1 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*params*/ ctx[0].halaman == /*n*/ ctx[8] + 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(19:1) {#each Array(9) as _, n}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#each Array(9) as _, n}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t_value = /*n*/ ctx[8] + 1 + "";
    	let t;
    	let a_href_value;
    	let li_class_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#/tes/" + (/*n*/ ctx[8] + 1));
    			attr_dev(a, "class", "page-link");
    			add_location(a, file$2, 40, 74, 1187);

    			attr_dev(li, "class", li_class_value = /*params*/ ctx[0].halaman == /*n*/ ctx[8] + 1
    			? "active page-item"
    			: "page-item");

    			add_location(li, file$2, 40, 3, 1116);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*params*/ 1 && li_class_value !== (li_class_value = /*params*/ ctx[0].halaman == /*n*/ ctx[8] + 1
    			? "active page-item"
    			: "page-item")) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(40:2) {#each Array(9) as _, n}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let ul0;
    	let t0;
    	let div1;
    	let br;
    	let t1;
    	let t2;
    	let div2;
    	let ul1;

    	function select_block_type(ctx, dirty) {
    		if (/*terkumpul*/ ctx[1].length <= 7) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = Array(9);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Array(9);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			ul0 = element("ul");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			br = element("br");
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "pagination justify-content-center tanpa-garis svelte-1l95zx9");
    			add_location(ul0, file$2, 1, 1, 22);
    			attr_dev(div0, "class", "header svelte-1l95zx9");
    			add_location(div0, file$2, 0, 0, 0);
    			add_location(br, file$2, 17, 1, 537);
    			attr_dev(div1, "class", "isi svelte-1l95zx9");
    			add_location(div1, file$2, 16, 0, 518);
    			attr_dev(ul1, "class", "pagination justify-content-center svelte-1l95zx9");
    			add_location(ul1, file$2, 38, 1, 1039);
    			attr_dev(div2, "class", "footer svelte-1l95zx9");
    			add_location(div2, file$2, 37, 0, 1017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, ul0);
    			if_block.m(ul0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, br);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(ul0, null);
    				}
    			}

    			if (dirty & /*Array, terkumpul, tambahkan, data, params*/ 11) {
    				each_value_1 = Array(9);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*params*/ 1) {
    				each_value = Array(9);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if_block.d();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tes", slots, []);
    	let bagian = 1;
    	let { params } = $$props;
    	let terkumpul = [];
    	const simpan = () => localStorage.setItem("japa", JSON.stringify(terkumpul));

    	const tambahkan = n => {
    		if (terkumpul.includes(n)) {
    			let posisi = terkumpul.indexOf(n);
    			terkumpul.splice(posisi, 1);
    			$$invalidate(1, terkumpul);
    		} else {
    			terkumpul.push(n);
    			$$invalidate(1, terkumpul);
    		}
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tes> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (n, o) => tambahkan(n * 11 + o);

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		bagian,
    		params,
    		data,
    		terkumpul,
    		simpan,
    		tambahkan
    	});

    	$$self.$inject_state = $$props => {
    		if ("bagian" in $$props) bagian = $$props.bagian;
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("terkumpul" in $$props) $$invalidate(1, terkumpul = $$props.terkumpul);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 1) {
    			 if (params) {
    				window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    			}
    		}
    	};

    	return [params, terkumpul, simpan, tambahkan, click_handler];
    }

    class Tes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tes",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !("params" in props)) {
    			console.warn("<Tes> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Tes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Tes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/halaman/Atur.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/halaman/Atur.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[5] = list;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (26:8) {#each data[x] as t}
    function create_each_block_1$1(ctx) {
    	let li;
    	let raw_value = /*t*/ ctx[7] + "";

    	const block = {
    		c: function create() {
    			li = element("li");
    			add_location(li, file$3, 26, 9, 616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			li.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pilihan*/ 1 && raw_value !== (raw_value = /*t*/ ctx[7] + "")) li.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(26:8) {#each data[x] as t}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#each pilihan as x, n}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*x*/ ctx[4] + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let ul;
    	let t2;
    	let td2;
    	let input;
    	let t3;
    	let mounted;
    	let dispose;
    	let each_value_1 = data[/*x*/ ctx[4]];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[3].call(input, /*n*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			td2 = element("td");
    			input = element("input");
    			t3 = space();
    			add_location(td0, file$3, 22, 6, 538);
    			add_location(ul, file$3, 24, 7, 573);
    			add_location(td1, file$3, 23, 6, 561);
    			attr_dev(input, "type", "tel");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "1-7");
    			add_location(input, file$3, 31, 7, 694);
    			add_location(td2, file$3, 30, 6, 682);
    			add_location(tr, file$3, 21, 5, 527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, input);
    			set_input_value(input, /*isian*/ ctx[1][/*n*/ ctx[6]]);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pilihan*/ 1 && t0_value !== (t0_value = /*x*/ ctx[4] + 1 + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data, pilihan*/ 1) {
    				each_value_1 = data[/*x*/ ctx[4]];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*isian*/ 2) {
    				set_input_value(input, /*isian*/ ctx[1][/*n*/ ctx[6]]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(21:4) {#each pilihan as x, n}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let br0;
    	let t0;
    	let p0;
    	let t1;
    	let strong0;
    	let t2_value = /*biodata*/ ctx[2].nomorTes + "";
    	let t2;
    	let br1;
    	let t3;
    	let strong1;
    	let t4_value = /*biodata*/ ctx[2].nama + "";
    	let t4;
    	let br2;
    	let t5;
    	let strong2;
    	let t6_value = /*biodata*/ ctx[2].kelasSekolah + "";
    	let t6;
    	let br3;
    	let t7;
    	let strong3;
    	let t8_value = /*biodata*/ ctx[2].jk + "";
    	let t8;
    	let t9;
    	let hr;
    	let t10;
    	let p1;
    	let t12;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t14;
    	let th1;
    	let t16;
    	let th2;
    	let t18;
    	let tbody;
    	let t19;
    	let div2;
    	let each_value = /*pilihan*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			br0 = element("br");
    			t0 = space();
    			p0 = element("p");
    			t1 = text("Nomor Tes: ");
    			strong0 = element("strong");
    			t2 = text(t2_value);
    			br1 = element("br");
    			t3 = text("\n\t\tNama: ");
    			strong1 = element("strong");
    			t4 = text(t4_value);
    			br2 = element("br");
    			t5 = text("\n\t\tKelas / Sekolah: ");
    			strong2 = element("strong");
    			t6 = text(t6_value);
    			br3 = element("br");
    			t7 = text("\n\t\tJK: ");
    			strong3 = element("strong");
    			t8 = text(t8_value);
    			t9 = space();
    			hr = element("hr");
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "Beri peringkat pada pernyataan yang sudah kamu pilih tadi";
    			t12 = space();
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "No";
    			t14 = space();
    			th1 = element("th");
    			th1.textContent = "Pernyataan";
    			t16 = space();
    			th2 = element("th");
    			th2.textContent = "Rank";
    			t18 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			div2 = element("div");
    			div2.textContent = "Peringkat tidak boleh ada yang sama";
    			add_location(br0, file$3, 1, 1, 25);
    			add_location(strong0, file$3, 3, 13, 48);
    			add_location(br1, file$3, 3, 48, 83);
    			add_location(strong1, file$3, 4, 8, 96);
    			add_location(br2, file$3, 4, 39, 127);
    			add_location(strong2, file$3, 5, 19, 151);
    			add_location(br3, file$3, 5, 58, 190);
    			add_location(strong3, file$3, 6, 6, 201);
    			add_location(p0, file$3, 2, 1, 31);
    			add_location(hr, file$3, 8, 1, 238);
    			add_location(p1, file$3, 9, 1, 244);
    			add_location(th0, file$3, 14, 5, 405);
    			add_location(th1, file$3, 15, 5, 422);
    			add_location(th2, file$3, 16, 5, 447);
    			add_location(tr, file$3, 13, 4, 395);
    			add_location(thead, file$3, 12, 3, 383);
    			add_location(tbody, file$3, 19, 3, 486);
    			attr_dev(table, "class", "table table-bordered");
    			add_location(table, file$3, 11, 2, 343);
    			attr_dev(div0, "class", "table-responsive");
    			add_location(div0, file$3, 10, 1, 310);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$3, 0, 0, 0);
    			attr_dev(div2, "class", "alert alert-warning melayang svelte-13cmoun");
    			add_location(div2, file$3, 39, 0, 847);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, br0);
    			append_dev(div1, t0);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(p0, strong0);
    			append_dev(strong0, t2);
    			append_dev(p0, br1);
    			append_dev(p0, t3);
    			append_dev(p0, strong1);
    			append_dev(strong1, t4);
    			append_dev(p0, br2);
    			append_dev(p0, t5);
    			append_dev(p0, strong2);
    			append_dev(strong2, t6);
    			append_dev(p0, br3);
    			append_dev(p0, t7);
    			append_dev(p0, strong3);
    			append_dev(strong3, t8);
    			append_dev(div1, t9);
    			append_dev(div1, hr);
    			append_dev(div1, t10);
    			append_dev(div1, p1);
    			append_dev(div1, t12);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t14);
    			append_dev(tr, th1);
    			append_dev(tr, t16);
    			append_dev(tr, th2);
    			append_dev(table, t18);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t19, anchor);
    			insert_dev(target, div2, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*biodata*/ 4 && t2_value !== (t2_value = /*biodata*/ ctx[2].nomorTes + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*biodata*/ 4 && t4_value !== (t4_value = /*biodata*/ ctx[2].nama + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*biodata*/ 4 && t6_value !== (t6_value = /*biodata*/ ctx[2].kelasSekolah + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*biodata*/ 4 && t8_value !== (t8_value = /*biodata*/ ctx[2].jk + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*isian, data, pilihan*/ 3) {
    				each_value = /*pilihan*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Atur", slots, []);
    	let pilihan = [];
    	let isian = [1, 1, 3, 4, 1, 6, 7];

    	let biodata = {
    		nomorTes: "",
    		nama: "",
    		kelasSekolah: "",
    		jk: ""
    	};

    	onMount(() => {
    		if (localStorage.japa) {
    			$$invalidate(0, pilihan = JSON.parse(localStorage.japa));
    		}

    		if (localStorage.dataJapa) {
    			$$invalidate(2, biodata = JSON.parse(localStorage.dataJapa));
    		}
    	});

    	afterUpdate(() => {
    		window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Atur> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(n) {
    		isian[n] = this.value;
    		$$invalidate(1, isian);
    	}

    	$$self.$capture_state = () => ({
    		data,
    		onMount,
    		afterUpdate,
    		pilihan,
    		isian,
    		biodata
    	});

    	$$self.$inject_state = $$props => {
    		if ("pilihan" in $$props) $$invalidate(0, pilihan = $$props.pilihan);
    		if ("isian" in $$props) $$invalidate(1, isian = $$props.isian);
    		if ("biodata" in $$props) $$invalidate(2, biodata = $$props.biodata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pilihan, isian, biodata, input_input_handler];
    }

    class Atur extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Atur",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */

    function create_fragment$5(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const routes = {
    		"/": Beranda,
    		"/instruksi": Instruksi,
    		"/tes/:halaman": Tes,
    		"/atur": Atur
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Beranda,
    		Instruksi,
    		Tes,
    		Atur,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
