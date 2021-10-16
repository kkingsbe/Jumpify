
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
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

    /* src\components\icon.svelte generated by Svelte v3.19.1 */

    const file = "src\\components\\icon.svelte";

    function create_fragment(ctx) {
    	let icon;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			icon = element("icon");
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1tdqh8n");
    			add_location(img, file, 5, 4, 56);
    			add_location(icon, file, 4, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, icon, anchor);
    			append_dev(icon, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(icon);
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

    function instance($$self, $$props, $$invalidate) {
    	let { src } = $$props;
    	const writable_props = ["src"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	$$self.$capture_state = () => ({ src });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { src: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<Icon> was created without expected prop 'src'");
    		}
    	}

    	get src() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\sidebar-item.svelte generated by Svelte v3.19.1 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\sidebar-item.svelte";

    // (12:4) {#if selected}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "selected-div svelte-1sn4pgf");
    			add_location(div, file$1, 12, 8, 242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:4) {#if selected}",
    		ctx
    	});

    	return block;
    }

    // (15:4) {#if !selected}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "unselected-div svelte-1sn4pgf");
    			add_location(div, file$1, 15, 8, 316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:4) {#if !selected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let sidebar_item;
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p;
    	let t3;
    	let dispose;
    	let if_block0 = /*selected*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = !/*selected*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			sidebar_item = element("sidebar-item");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p = element("p");
    			t3 = text(/*text*/ ctx[2]);
    			if (img.src !== (img_src_value = /*icon*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1sn4pgf");
    			add_location(img, file$1, 17, 4, 367);
    			attr_dev(p, "class", "svelte-1sn4pgf");
    			add_location(p, file$1, 18, 4, 389);
    			set_custom_element_data(sidebar_item, "class", "svelte-1sn4pgf");
    			add_location(sidebar_item, file$1, 10, 0, 180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, sidebar_item, anchor);
    			if (if_block0) if_block0.m(sidebar_item, null);
    			append_dev(sidebar_item, t0);
    			if (if_block1) if_block1.m(sidebar_item, null);
    			append_dev(sidebar_item, t1);
    			append_dev(sidebar_item, img);
    			append_dev(sidebar_item, t2);
    			append_dev(sidebar_item, p);
    			append_dev(p, t3);
    			dispose = listen_dev(sidebar_item, "click", /*select*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*selected*/ ctx[0]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(sidebar_item, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*selected*/ ctx[0]) {
    				if (!if_block1) {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(sidebar_item, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*icon*/ 2 && img.src !== (img_src_value = /*icon*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(sidebar_item);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { selected } = $$props;
    	let { icon } = $$props;
    	let { text } = $$props;

    	function select() {
    		$$invalidate(0, selected = true);
    	}

    	const writable_props = ["selected", "icon", "text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Sidebar_item> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ selected, icon, text, select, console });

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected*/ 1) {
    			 console.log(selected);
    		}
    	};

    	return [selected, icon, text, select];
    }

    class Sidebar_item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { selected: 0, icon: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar_item",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console_1.warn("<Sidebar_item> was created without expected prop 'selected'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !("icon" in props)) {
    			console_1.warn("<Sidebar_item> was created without expected prop 'icon'");
    		}

    		if (/*text*/ ctx[2] === undefined && !("text" in props)) {
    			console_1.warn("<Sidebar_item> was created without expected prop 'text'");
    		}
    	}

    	get selected() {
    		throw new Error("<Sidebar_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Sidebar_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Sidebar_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Sidebar_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Sidebar_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Sidebar_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\sidebar.svelte generated by Svelte v3.19.1 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\components\\sidebar.svelte";

    function create_fragment$2(ctx) {
    	let sidebar;
    	let t0;
    	let div;
    	let updating_selected;
    	let t1;
    	let updating_selected_1;
    	let t2;
    	let updating_selected_2;
    	let current;

    	const icon = new Icon({
    			props: { src: "./res/icon.png" },
    			$$inline: true
    		});

    	function sidebaritem0_selected_binding(value) {
    		/*sidebaritem0_selected_binding*/ ctx[7].call(null, value);
    	}

    	let sidebaritem0_props = { icon: "./res/home.svg", text: "Home" };

    	if (/*homeSelected*/ ctx[0] !== void 0) {
    		sidebaritem0_props.selected = /*homeSelected*/ ctx[0];
    	}

    	const sidebaritem0 = new Sidebar_item({
    			props: sidebaritem0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(sidebaritem0, "selected", sidebaritem0_selected_binding));

    	function sidebaritem1_selected_binding(value) {
    		/*sidebaritem1_selected_binding*/ ctx[8].call(null, value);
    	}

    	let sidebaritem1_props = { icon: "./res/jumps.png", text: "Jumps" };

    	if (/*jumpsSelected*/ ctx[1] !== void 0) {
    		sidebaritem1_props.selected = /*jumpsSelected*/ ctx[1];
    	}

    	const sidebaritem1 = new Sidebar_item({
    			props: sidebaritem1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(sidebaritem1, "selected", sidebaritem1_selected_binding));

    	function sidebaritem2_selected_binding(value) {
    		/*sidebaritem2_selected_binding*/ ctx[9].call(null, value);
    	}

    	let sidebaritem2_props = { icon: "./res/import.png", text: "Import" };

    	if (/*importSelected*/ ctx[2] !== void 0) {
    		sidebaritem2_props.selected = /*importSelected*/ ctx[2];
    	}

    	const sidebaritem2 = new Sidebar_item({
    			props: sidebaritem2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(sidebaritem2, "selected", sidebaritem2_selected_binding));

    	const block = {
    		c: function create() {
    			sidebar = element("sidebar");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(sidebaritem0.$$.fragment);
    			t1 = space();
    			create_component(sidebaritem1.$$.fragment);
    			t2 = space();
    			create_component(sidebaritem2.$$.fragment);
    			attr_dev(div, "class", "items svelte-pyz5hc");
    			add_location(div, file$2, 59, 4, 1202);
    			attr_dev(sidebar, "class", "svelte-pyz5hc");
    			add_location(sidebar, file$2, 57, 0, 1150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, sidebar, anchor);
    			mount_component(icon, sidebar, null);
    			append_dev(sidebar, t0);
    			append_dev(sidebar, div);
    			mount_component(sidebaritem0, div, null);
    			append_dev(div, t1);
    			mount_component(sidebaritem1, div, null);
    			append_dev(div, t2);
    			mount_component(sidebaritem2, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sidebaritem0_changes = {};

    			if (!updating_selected && dirty & /*homeSelected*/ 1) {
    				updating_selected = true;
    				sidebaritem0_changes.selected = /*homeSelected*/ ctx[0];
    				add_flush_callback(() => updating_selected = false);
    			}

    			sidebaritem0.$set(sidebaritem0_changes);
    			const sidebaritem1_changes = {};

    			if (!updating_selected_1 && dirty & /*jumpsSelected*/ 2) {
    				updating_selected_1 = true;
    				sidebaritem1_changes.selected = /*jumpsSelected*/ ctx[1];
    				add_flush_callback(() => updating_selected_1 = false);
    			}

    			sidebaritem1.$set(sidebaritem1_changes);
    			const sidebaritem2_changes = {};

    			if (!updating_selected_2 && dirty & /*importSelected*/ 4) {
    				updating_selected_2 = true;
    				sidebaritem2_changes.selected = /*importSelected*/ ctx[2];
    				add_flush_callback(() => updating_selected_2 = false);
    			}

    			sidebaritem2.$set(sidebaritem2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(sidebaritem0.$$.fragment, local);
    			transition_in(sidebaritem1.$$.fragment, local);
    			transition_in(sidebaritem2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(sidebaritem0.$$.fragment, local);
    			transition_out(sidebaritem1.$$.fragment, local);
    			transition_out(sidebaritem2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(sidebar);
    			destroy_component(icon);
    			destroy_component(sidebaritem0);
    			destroy_component(sidebaritem1);
    			destroy_component(sidebaritem2);
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
    	let { page } = $$props;
    	var homeSelected = false;
    	var jumpsSelected = false;
    	var importSelected = false;

    	switch (page) {
    		case 1:
    			homeSelected = true;
    			break;
    		case 2:
    			jumpsSelected = true;
    			break;
    		case 3:
    			importSelected = true;
    			break;
    	}

    	function selectHome() {
    		$$invalidate(0, homeSelected = true);
    		$$invalidate(1, jumpsSelected = false);
    		$$invalidate(2, importSelected = false);
    	}

    	function selectJumps() {
    		$$invalidate(0, homeSelected = false);
    		$$invalidate(1, jumpsSelected = true);
    		$$invalidate(2, importSelected = false);
    		console.log(jumpsSelected);
    	}

    	function selectImport() {
    		$$invalidate(0, homeSelected = false);
    		$$invalidate(1, jumpsSelected = false);
    		$$invalidate(2, importSelected = true);
    	}

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	function sidebaritem0_selected_binding(value) {
    		homeSelected = value;
    		$$invalidate(0, homeSelected);
    	}

    	function sidebaritem1_selected_binding(value) {
    		jumpsSelected = value;
    		$$invalidate(1, jumpsSelected);
    	}

    	function sidebaritem2_selected_binding(value) {
    		importSelected = value;
    		$$invalidate(2, importSelected);
    	}

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(3, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		SidebarItem: Sidebar_item,
    		page,
    		homeSelected,
    		jumpsSelected,
    		importSelected,
    		selectHome,
    		selectJumps,
    		selectImport,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(3, page = $$props.page);
    		if ("homeSelected" in $$props) $$invalidate(0, homeSelected = $$props.homeSelected);
    		if ("jumpsSelected" in $$props) $$invalidate(1, jumpsSelected = $$props.jumpsSelected);
    		if ("importSelected" in $$props) $$invalidate(2, importSelected = $$props.importSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*homeSelected*/ 1) {
    			 if (homeSelected) {
    				selectHome();
    				$$invalidate(3, page = 1);
    			}
    		}

    		if ($$self.$$.dirty & /*jumpsSelected*/ 2) {
    			 if (jumpsSelected) {
    				selectJumps();
    				$$invalidate(3, page = 2);
    			}
    		}

    		if ($$self.$$.dirty & /*importSelected*/ 4) {
    			 if (importSelected) {
    				selectImport();
    				$$invalidate(3, page = 3);
    			}
    		}
    	};

    	return [
    		homeSelected,
    		jumpsSelected,
    		importSelected,
    		page,
    		selectHome,
    		selectJumps,
    		selectImport,
    		sidebaritem0_selected_binding,
    		sidebaritem1_selected_binding,
    		sidebaritem2_selected_binding
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { page: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[3] === undefined && !("page" in props)) {
    			console_1$1.warn("<Sidebar> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\home-banner.svelte generated by Svelte v3.19.1 */

    const file$3 = "src\\components\\home-banner.svelte";

    function create_fragment$3(ctx) {
    	let banner;
    	let p;

    	const block = {
    		c: function create() {
    			banner = element("banner");
    			p = element("p");
    			p.textContent = "Hello, Kyle";
    			attr_dev(p, "class", "svelte-1qrpy5y");
    			add_location(p, file$3, 5, 4, 59);
    			attr_dev(banner, "class", "svelte-1qrpy5y");
    			add_location(banner, file$3, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, banner, anchor);
    			append_dev(banner, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(banner);
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
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home_banner> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class Home_banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home_banner",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Home_banner> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Home_banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Home_banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\stat-card.svelte generated by Svelte v3.19.1 */

    const file$4 = "src\\components\\stat-card.svelte";

    function create_fragment$4(ctx) {
    	let card;
    	let div;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;

    	const block = {
    		c: function create() {
    			card = element("card");
    			div = element("div");
    			p0 = element("p");
    			t0 = text(/*statType*/ ctx[0]);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*statValue*/ ctx[1]);
    			attr_dev(p0, "class", "type svelte-1tkkchg");
    			add_location(p0, file$4, 28, 8, 668);
    			attr_dev(p1, "class", "value svelte-1tkkchg");
    			add_location(p1, file$4, 29, 8, 708);
    			attr_dev(div, "class", "text svelte-1tkkchg");
    			add_location(div, file$4, 27, 4, 640);
    			attr_dev(card, "class", "svelte-1tkkchg");
    			add_location(card, file$4, 26, 0, 628);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, card, anchor);
    			append_dev(card, div);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*statType*/ 1) set_data_dev(t0, /*statType*/ ctx[0]);
    			if (dirty & /*statValue*/ 2) set_data_dev(t2, /*statValue*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(card);
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
    	let { statType } = $$props;
    	let statValue;

    	switch (statType) {
    		case "Jumps Logged":
    			statValue = "36";
    			break;
    		case "Freefall Time Logged":
    			statValue = "158sec";
    			break;
    		case "Jumps Logged Today":
    			statValue = "1";
    			break;
    		case "Maximum Speed":
    			statValue = "198mph";
    			break;
    		case "Maximum Altitude":
    			statValue = "15,552ft";
    			break;
    		case "Average Deployment Altitude":
    			statValue = "4,205ft";
    			break;
    	}

    	const writable_props = ["statType"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stat_card> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("statType" in $$props) $$invalidate(0, statType = $$props.statType);
    	};

    	$$self.$capture_state = () => ({ statType, statValue });

    	$$self.$inject_state = $$props => {
    		if ("statType" in $$props) $$invalidate(0, statType = $$props.statType);
    		if ("statValue" in $$props) $$invalidate(1, statValue = $$props.statValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [statType, statValue];
    }

    class Stat_card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { statType: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stat_card",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*statType*/ ctx[0] === undefined && !("statType" in props)) {
    			console.warn("<Stat_card> was created without expected prop 'statType'");
    		}
    	}

    	get statType() {
    		throw new Error("<Stat_card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set statType(value) {
    		throw new Error("<Stat_card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\stat-card-container.svelte generated by Svelte v3.19.1 */
    const file$5 = "src\\components\\stat-card-container.svelte";

    function create_fragment$5(ctx) {
    	let container;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let current;

    	const card0 = new Stat_card({
    			props: { statType: "Jumps Logged" },
    			$$inline: true
    		});

    	const card1 = new Stat_card({
    			props: { statType: "Freefall Time Logged" },
    			$$inline: true
    		});

    	const card2 = new Stat_card({
    			props: { statType: "Jumps Logged Today" },
    			$$inline: true
    		});

    	const card3 = new Stat_card({
    			props: { statType: "Maximum Speed" },
    			$$inline: true
    		});

    	const card4 = new Stat_card({
    			props: { statType: "Maximum Altitude" },
    			$$inline: true
    		});

    	const card5 = new Stat_card({
    			props: { statType: "Average Deployment Altitude" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			container = element("container");
    			div0 = element("div");
    			create_component(card0.$$.fragment);
    			t0 = space();
    			create_component(card1.$$.fragment);
    			t1 = space();
    			create_component(card2.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(card3.$$.fragment);
    			t3 = space();
    			create_component(card4.$$.fragment);
    			t4 = space();
    			create_component(card5.$$.fragment);
    			attr_dev(div0, "class", "row svelte-1o1d03h");
    			add_location(div0, file$5, 5, 4, 83);
    			attr_dev(div1, "class", "row svelte-1o1d03h");
    			add_location(div1, file$5, 10, 4, 273);
    			attr_dev(container, "class", "svelte-1o1d03h");
    			add_location(container, file$5, 4, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, container, anchor);
    			append_dev(container, div0);
    			mount_component(card0, div0, null);
    			append_dev(div0, t0);
    			mount_component(card1, div0, null);
    			append_dev(div0, t1);
    			mount_component(card2, div0, null);
    			append_dev(container, t2);
    			append_dev(container, div1);
    			mount_component(card3, div1, null);
    			append_dev(div1, t3);
    			mount_component(card4, div1, null);
    			append_dev(div1, t4);
    			mount_component(card5, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(card3.$$.fragment, local);
    			transition_in(card4.$$.fragment, local);
    			transition_in(card5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(card3.$$.fragment, local);
    			transition_out(card4.$$.fragment, local);
    			transition_out(card5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(container);
    			destroy_component(card0);
    			destroy_component(card1);
    			destroy_component(card2);
    			destroy_component(card3);
    			destroy_component(card4);
    			destroy_component(card5);
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
    	$$self.$capture_state = () => ({ Card: Stat_card });
    	return [];
    }

    class Stat_card_container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stat_card_container",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\home.svelte generated by Svelte v3.19.1 */
    const file$6 = "src\\components\\home.svelte";

    function create_fragment$6(ctx) {
    	let home;
    	let t;
    	let current;
    	const homebanner = new Home_banner({ $$inline: true });
    	const statcardcontainer = new Stat_card_container({ $$inline: true });

    	const block = {
    		c: function create() {
    			home = element("home");
    			create_component(homebanner.$$.fragment);
    			t = space();
    			create_component(statcardcontainer.$$.fragment);
    			attr_dev(home, "class", "svelte-zx1v3f");
    			add_location(home, file$6, 6, 0, 156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, home, anchor);
    			mount_component(homebanner, home, null);
    			append_dev(home, t);
    			mount_component(statcardcontainer, home, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(homebanner.$$.fragment, local);
    			transition_in(statcardcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(homebanner.$$.fragment, local);
    			transition_out(statcardcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(home);
    			destroy_component(homebanner);
    			destroy_component(statcardcontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name, HomeBanner: Home_banner, StatCardContainer: Stat_card_container });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Home> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\jump-selector.svelte generated by Svelte v3.19.1 */

    const file$7 = "src\\components\\jump-selector.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (24:8) {#each jumpDates as date}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*date*/ ctx[5].date + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*date*/ ctx[5].date;
    			option.value = option.__value;
    			add_location(option, file$7, 24, 8, 607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*jumpDates*/ 2 && t_value !== (t_value = /*date*/ ctx[5].date + "")) set_data_dev(t, t_value);

    			if (dirty & /*jumpDates*/ 2 && option_value_value !== (option_value_value = /*date*/ ctx[5].date)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:8) {#each jumpDates as date}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let selector;
    	let select;
    	let option;
    	let dispose;
    	let each_value = /*jumpDates*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			selector = element("selector");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select Jump:";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.__value = "Select Jump:";
    			option.value = option.__value;
    			add_location(option, file$7, 22, 8, 533);
    			if (/*selectedJump*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$7, 21, 4, 489);
    			add_location(selector, file$7, 20, 0, 473);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, selector, anchor);
    			append_dev(selector, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedJump*/ ctx[0]);
    			dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[4]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*jumpDates*/ 2) {
    				each_value = /*jumpDates*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedJump*/ 1) {
    				select_option(select, /*selectedJump*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(selector);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	var Datastore = require("nedb");
    	var db = new Datastore("C:/Program Files/Jumpify/jumps.db");
    	var jumpDates = [];
    	let { selectedJump } = $$props;

    	db.loadDatabase(function (err) {
    		if (err) alert(err);

    		db.find({}, { date: 1 }, function (err, docs) {
    			if (err) alert(err); else {
    				$$invalidate(1, jumpDates = docs);
    			} //console.log(jumpDates)
    		});
    	});

    	const writable_props = ["selectedJump"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jump_selector> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selectedJump = select_value(this);
    		$$invalidate(0, selectedJump);
    		$$invalidate(1, jumpDates);
    	}

    	$$self.$set = $$props => {
    		if ("selectedJump" in $$props) $$invalidate(0, selectedJump = $$props.selectedJump);
    	};

    	$$self.$capture_state = () => ({
    		Datastore,
    		db,
    		jumpDates,
    		selectedJump,
    		require,
    		alert
    	});

    	$$self.$inject_state = $$props => {
    		if ("Datastore" in $$props) Datastore = $$props.Datastore;
    		if ("db" in $$props) db = $$props.db;
    		if ("jumpDates" in $$props) $$invalidate(1, jumpDates = $$props.jumpDates);
    		if ("selectedJump" in $$props) $$invalidate(0, selectedJump = $$props.selectedJump);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedJump, jumpDates, Datastore, db, select_change_handler];
    }

    class Jump_selector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { selectedJump: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jump_selector",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selectedJump*/ ctx[0] === undefined && !("selectedJump" in props)) {
    			console.warn("<Jump_selector> was created without expected prop 'selectedJump'");
    		}
    	}

    	get selectedJump() {
    		throw new Error("<Jump_selector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedJump(value) {
    		throw new Error("<Jump_selector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\display-mode-select.svelte generated by Svelte v3.19.1 */

    const file$8 = "src\\components\\display-mode-select.svelte";

    function create_fragment$8(ctx) {
    	let modeSelect;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;

    	const block = {
    		c: function create() {
    			modeSelect = element("modeSelect");
    			div0 = element("div");
    			div0.textContent = "Graphs";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Ground Track";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "3D Track";
    			attr_dev(div0, "class", "mode selected svelte-1mu30nr");
    			add_location(div0, file$8, 5, 4, 43);
    			attr_dev(div1, "class", "mode svelte-1mu30nr");
    			add_location(div1, file$8, 6, 4, 88);
    			attr_dev(div2, "class", "mode svelte-1mu30nr");
    			add_location(div2, file$8, 7, 4, 130);
    			attr_dev(modeSelect, "class", "svelte-1mu30nr");
    			add_location(modeSelect, file$8, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, modeSelect, anchor);
    			append_dev(modeSelect, div0);
    			append_dev(modeSelect, t1);
    			append_dev(modeSelect, div1);
    			append_dev(modeSelect, t3);
    			append_dev(modeSelect, div2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(modeSelect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Display_mode_select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display_mode_select",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\altgraph.svelte generated by Svelte v3.19.1 */

    const { console: console_1$2 } = globals;
    const file$9 = "src\\components\\altgraph.svelte";

    function create_fragment$9(ctx) {
    	let graph;
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			graph = element("graph");
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "id", "altitude");
    			add_location(canvas_1, file$9, 58, 8, 1717);
    			attr_dev(div, "class", "container svelte-5r718z");
    			add_location(div, file$9, 57, 4, 1684);
    			add_location(graph, file$9, 56, 0, 1671);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, graph, anchor);
    			append_dev(graph, div);
    			append_dev(div, canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(graph);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	var Chart = require("chart.js");
    	let { jump } = $$props;
    	var labels = [];
    	var datapoints = [];
    	var altChart;
    	const writable_props = ["jump"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Altgraph> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    	};

    	$$self.$capture_state = () => ({
    		Chart,
    		jump,
    		labels,
    		datapoints,
    		altChart,
    		canvas,
    		require,
    		console,
    		document
    	});

    	$$self.$inject_state = $$props => {
    		if ("Chart" in $$props) $$invalidate(4, Chart = $$props.Chart);
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    		if ("labels" in $$props) $$invalidate(1, labels = $$props.labels);
    		if ("datapoints" in $$props) $$invalidate(2, datapoints = $$props.datapoints);
    		if ("altChart" in $$props) $$invalidate(3, altChart = $$props.altChart);
    		if ("canvas" in $$props) $$invalidate(5, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*jump, labels, datapoints, altChart*/ 15) {
    			 if (typeof jump !== "undefined") {
    				console.log(jump);
    				let startSec;
    				$$invalidate(1, labels = []);
    				$$invalidate(2, datapoints = []);

    				jump.forEach(point => {
    					//console.log(point)
    					let h = point.timestamp.substring(0, 2);

    					let min = point.timestamp.substring(2, 4);
    					let sec = point.timestamp.substring(4);
    					let a = [h, min, sec];
    					let seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];

    					if (typeof startSec == "undefined") {
    						startSec = seconds;
    						seconds = 0;
    					} else {
    						seconds -= startSec;
    					}

    					labels.push(seconds);
    					datapoints.push(point.alt);
    				});

    				console.log(labels);
    				if (typeof altChart !== "undefined") altChart.destroy();
    				var canvas = document.getElementById("altitude");

    				$$invalidate(3, altChart = new Chart(canvas,
    				{
    						type: "line",
    						data: {
    							labels,
    							datasets: [
    								{
    									label: "Altitude (m) over time",
    									data: datapoints,
    									fill: true,
    									backgroundColor: "rgba(255, 99, 132, 0.2)",
    									borderColor: "rgba(255, 99, 132, 1)",
    									cubicInterpolationMode: "monotone",
    									tension: 0.4
    								}
    							]
    						}
    					}));
    			}
    		}
    	};

    	return [jump];
    }

    class Altgraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, { jump: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Altgraph",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*jump*/ ctx[0] === undefined && !("jump" in props)) {
    			console_1$2.warn("<Altgraph> was created without expected prop 'jump'");
    		}
    	}

    	get jump() {
    		throw new Error("<Altgraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jump(value) {
    		throw new Error("<Altgraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\VSGraph.svelte generated by Svelte v3.19.1 */

    const { console: console_1$3 } = globals;
    const file$a = "src\\components\\VSGraph.svelte";

    function create_fragment$a(ctx) {
    	let graph;
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			graph = element("graph");
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "id", "vs");
    			add_location(canvas_1, file$a, 81, 8, 2350);
    			attr_dev(div, "class", "container svelte-5r718z");
    			add_location(div, file$a, 80, 4, 2317);
    			add_location(graph, file$a, 79, 0, 2304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, graph, anchor);
    			append_dev(graph, div);
    			append_dev(div, canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(graph);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	var Chart = require("chart.js");
    	let { jump } = $$props;
    	var labels = [];
    	var datapoints = [];
    	var vsChart;
    	const writable_props = ["jump"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<VSGraph> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    	};

    	$$self.$capture_state = () => ({
    		Chart,
    		jump,
    		labels,
    		datapoints,
    		vsChart,
    		canvas,
    		require,
    		console,
    		document
    	});

    	$$self.$inject_state = $$props => {
    		if ("Chart" in $$props) $$invalidate(4, Chart = $$props.Chart);
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    		if ("labels" in $$props) $$invalidate(1, labels = $$props.labels);
    		if ("datapoints" in $$props) $$invalidate(2, datapoints = $$props.datapoints);
    		if ("vsChart" in $$props) $$invalidate(3, vsChart = $$props.vsChart);
    		if ("canvas" in $$props) $$invalidate(5, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*jump, labels, datapoints, vsChart*/ 15) {
    			 if (typeof jump !== "undefined") {
    				console.log(jump);
    				let startSec;
    				$$invalidate(1, labels = []);
    				$$invalidate(2, datapoints = []);
    				let lastAlt = -999;
    				let lastTime = -1;

    				jump.forEach(point => {
    					let h = point.timestamp.substring(0, 2);
    					let min = point.timestamp.substring(2, 4);
    					let sec = point.timestamp.substring(4);
    					let a = [h, min, sec];
    					let seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
    					let vs;
    					let dz;
    					let dt;

    					if (typeof startSec == "undefined") {
    						startSec = seconds;
    						seconds = 0;
    					} else {
    						seconds -= startSec;
    					}

    					if (lastAlt == -999) {
    						lastAlt = point.alt;
    						dz = 0;
    					} else {
    						dz = lastAlt - point.alt;
    						lastAlt = point.alt;
    					}

    					if (lastTime == -1) {
    						vs = 0;
    						dt = 0;
    						lastTime = seconds;
    					} else {
    						dt = seconds - lastTime;
    						lastTime = seconds;
    						vs = dz / dt;
    					}

    					console.log(dt);
    					labels.push(seconds);
    					datapoints.push(vs);
    				});

    				//console.log(labels)
    				//console.log(datapoints)
    				if (typeof vsChart !== "undefined") vsChart.destroy();

    				var canvas = document.getElementById("vs");

    				$$invalidate(3, vsChart = new Chart(canvas,
    				{
    						type: "line",
    						data: {
    							labels,
    							datasets: [
    								{
    									label: "Vertical Speed (m/s) over time",
    									data: datapoints,
    									fill: true,
    									backgroundColor: "rgba(255, 99, 132, 0.2)",
    									borderColor: "rgba(255, 99, 132, 1)",
    									cubicInterpolationMode: "monotone",
    									tension: 0.4
    								}
    							]
    						}
    					}));
    			}
    		}
    	};

    	return [jump];
    }

    class VSGraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, { jump: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VSGraph",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*jump*/ ctx[0] === undefined && !("jump" in props)) {
    			console_1$3.warn("<VSGraph> was created without expected prop 'jump'");
    		}
    	}

    	get jump() {
    		throw new Error("<VSGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jump(value) {
    		throw new Error("<VSGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\jump-graphs.svelte generated by Svelte v3.19.1 */
    const file$b = "src\\components\\jump-graphs.svelte";

    function create_fragment$b(ctx) {
    	let graphs;
    	let updating_jump;
    	let t;
    	let updating_jump_1;
    	let current;

    	function altgraph_jump_binding(value) {
    		/*altgraph_jump_binding*/ ctx[1].call(null, value);
    	}

    	let altgraph_props = {};

    	if (/*jump*/ ctx[0] !== void 0) {
    		altgraph_props.jump = /*jump*/ ctx[0];
    	}

    	const altgraph = new Altgraph({ props: altgraph_props, $$inline: true });
    	binding_callbacks.push(() => bind(altgraph, "jump", altgraph_jump_binding));

    	function vsgraph_jump_binding(value) {
    		/*vsgraph_jump_binding*/ ctx[2].call(null, value);
    	}

    	let vsgraph_props = {};

    	if (/*jump*/ ctx[0] !== void 0) {
    		vsgraph_props.jump = /*jump*/ ctx[0];
    	}

    	const vsgraph = new VSGraph({ props: vsgraph_props, $$inline: true });
    	binding_callbacks.push(() => bind(vsgraph, "jump", vsgraph_jump_binding));

    	const block = {
    		c: function create() {
    			graphs = element("graphs");
    			create_component(altgraph.$$.fragment);
    			t = space();
    			create_component(vsgraph.$$.fragment);
    			attr_dev(graphs, "class", "svelte-alkr4u");
    			add_location(graphs, file$b, 6, 0, 134);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, graphs, anchor);
    			mount_component(altgraph, graphs, null);
    			append_dev(graphs, t);
    			mount_component(vsgraph, graphs, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const altgraph_changes = {};

    			if (!updating_jump && dirty & /*jump*/ 1) {
    				updating_jump = true;
    				altgraph_changes.jump = /*jump*/ ctx[0];
    				add_flush_callback(() => updating_jump = false);
    			}

    			altgraph.$set(altgraph_changes);
    			const vsgraph_changes = {};

    			if (!updating_jump_1 && dirty & /*jump*/ 1) {
    				updating_jump_1 = true;
    				vsgraph_changes.jump = /*jump*/ ctx[0];
    				add_flush_callback(() => updating_jump_1 = false);
    			}

    			vsgraph.$set(vsgraph_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(altgraph.$$.fragment, local);
    			transition_in(vsgraph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(altgraph.$$.fragment, local);
    			transition_out(vsgraph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(graphs);
    			destroy_component(altgraph);
    			destroy_component(vsgraph);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { jump } = $$props;
    	const writable_props = ["jump"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jump_graphs> was created with unknown prop '${key}'`);
    	});

    	function altgraph_jump_binding(value) {
    		jump = value;
    		$$invalidate(0, jump);
    	}

    	function vsgraph_jump_binding(value) {
    		jump = value;
    		$$invalidate(0, jump);
    	}

    	$$self.$set = $$props => {
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    	};

    	$$self.$capture_state = () => ({ jump, Altgraph, VSGraph });

    	$$self.$inject_state = $$props => {
    		if ("jump" in $$props) $$invalidate(0, jump = $$props.jump);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [jump, altgraph_jump_binding, vsgraph_jump_binding];
    }

    class Jump_graphs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, { jump: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jump_graphs",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*jump*/ ctx[0] === undefined && !("jump" in props)) {
    			console.warn("<Jump_graphs> was created without expected prop 'jump'");
    		}
    	}

    	get jump() {
    		throw new Error("<Jump_graphs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jump(value) {
    		throw new Error("<Jump_graphs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\jumps.svelte generated by Svelte v3.19.1 */
    const file$c = "src\\components\\jumps.svelte";

    function create_fragment$c(ctx) {
    	let jumps;
    	let updating_selectedJump;
    	let t0;
    	let t1;
    	let current;

    	function jumpselector_selectedJump_binding(value) {
    		/*jumpselector_selectedJump_binding*/ ctx[6].call(null, value);
    	}

    	let jumpselector_props = {};

    	if (/*selectedJump*/ ctx[0] !== void 0) {
    		jumpselector_props.selectedJump = /*selectedJump*/ ctx[0];
    	}

    	const jumpselector = new Jump_selector({
    			props: jumpselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(jumpselector, "selectedJump", jumpselector_selectedJump_binding));
    	const modeselect = new Display_mode_select({ $$inline: true });

    	const jumpgraphs = new Jump_graphs({
    			props: { jump: /*selectedData*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			jumps = element("jumps");
    			create_component(jumpselector.$$.fragment);
    			t0 = space();
    			create_component(modeselect.$$.fragment);
    			t1 = space();
    			create_component(jumpgraphs.$$.fragment);
    			attr_dev(jumps, "class", "svelte-cgmf7z");
    			add_location(jumps, file$c, 32, 0, 900);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, jumps, anchor);
    			mount_component(jumpselector, jumps, null);
    			append_dev(jumps, t0);
    			mount_component(modeselect, jumps, null);
    			append_dev(jumps, t1);
    			mount_component(jumpgraphs, jumps, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const jumpselector_changes = {};

    			if (!updating_selectedJump && dirty & /*selectedJump*/ 1) {
    				updating_selectedJump = true;
    				jumpselector_changes.selectedJump = /*selectedJump*/ ctx[0];
    				add_flush_callback(() => updating_selectedJump = false);
    			}

    			jumpselector.$set(jumpselector_changes);
    			const jumpgraphs_changes = {};
    			if (dirty & /*selectedData*/ 2) jumpgraphs_changes.jump = /*selectedData*/ ctx[1];
    			jumpgraphs.$set(jumpgraphs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumpselector.$$.fragment, local);
    			transition_in(modeselect.$$.fragment, local);
    			transition_in(jumpgraphs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumpselector.$$.fragment, local);
    			transition_out(modeselect.$$.fragment, local);
    			transition_out(jumpgraphs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(jumps);
    			destroy_component(jumpselector);
    			destroy_component(modeselect);
    			destroy_component(jumpgraphs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	var Datastore = require("nedb");
    	var db = new Datastore("C:/Program Files/Jumpify/jumps.db");
    	var selectedJump;
    	var selectedData;
    	var dbLoaded = false;

    	//$: console.log(selectedData)
    	var data = {};

    	db.loadDatabase(function (err) {
    		$$invalidate(2, dbLoaded = true);
    		if (err) alert(err);

    		db.find({}, function (err, docs) {
    			if (err) alert(err); else {
    				data = docs;
    			}
    		});
    	});

    	function jumpselector_selectedJump_binding(value) {
    		selectedJump = value;
    		$$invalidate(0, selectedJump);
    	}

    	$$self.$capture_state = () => ({
    		JumpSelector: Jump_selector,
    		ModeSelect: Display_mode_select,
    		JumpGraphs: Jump_graphs,
    		Datastore,
    		db,
    		selectedJump,
    		selectedData,
    		dbLoaded,
    		data,
    		require,
    		alert
    	});

    	$$self.$inject_state = $$props => {
    		if ("Datastore" in $$props) Datastore = $$props.Datastore;
    		if ("db" in $$props) $$invalidate(5, db = $$props.db);
    		if ("selectedJump" in $$props) $$invalidate(0, selectedJump = $$props.selectedJump);
    		if ("selectedData" in $$props) $$invalidate(1, selectedData = $$props.selectedData);
    		if ("dbLoaded" in $$props) $$invalidate(2, dbLoaded = $$props.dbLoaded);
    		if ("data" in $$props) data = $$props.data;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedJump, dbLoaded*/ 5) {
    			 if (selectedJump != "Select Jump:" && dbLoaded && typeof selectedJump !== "undefined") {
    				db.find({ date: selectedJump }, function (err, docs) {
    					if (err) alert(err);
    					$$invalidate(1, selectedData = docs[0].data);
    				});
    			}
    		}
    	};

    	return [
    		selectedJump,
    		selectedData,
    		dbLoaded,
    		data,
    		Datastore,
    		db,
    		jumpselector_selectedJump_binding
    	];
    }

    class Jumps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumps",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\import.svelte generated by Svelte v3.19.1 */

    const file$d = "src\\components\\import.svelte";

    function create_fragment$d(ctx) {
    	let import_1;
    	let input_1;
    	let t0;
    	let div;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			import_1 = element("import");
    			input_1 = element("input");
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "Import!";
    			attr_dev(input_1, "id", "fileselector");
    			attr_dev(input_1, "type", "file");
    			add_location(input_1, file$d, 92, 4, 3313);
    			attr_dev(p, "class", "svelte-7hrd5i");
    			add_location(p, file$d, 94, 8, 3435);
    			attr_dev(div, "class", "btn svelte-7hrd5i");
    			add_location(div, file$d, 93, 4, 3385);
    			attr_dev(import_1, "class", "svelte-7hrd5i");
    			add_location(import_1, file$d, 91, 0, 3299);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, import_1, anchor);
    			append_dev(import_1, input_1);
    			/*input_1_binding*/ ctx[8](input_1);
    			append_dev(import_1, t0);
    			append_dev(import_1, div);
    			append_dev(div, p);

    			dispose = [
    				listen_dev(input_1, "change", /*input_1_change_handler*/ ctx[9]),
    				listen_dev(div, "click", /*importFiles*/ ctx[2], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(import_1);
    			/*input_1_binding*/ ctx[8](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	var fs = require("fs"); // Load the File System to execute our common tasks (CRUD)
    	var nmea = require("nmea");
    	var Datastore = require("nedb");
    	var db = new Datastore("C:/Program Files/Jumpify/jumps.db");
    	db.loadDatabase();
    	let input;
    	let files;
    	var existingJumpDates = [];

    	db.loadDatabase(function (err) {
    		if (err) alert(err);

    		db.find({}, { date: 1 }, function (err, docs) {
    			if (err) alert(err); else {
    				existingJumpDates = docs;
    			}
    		});
    	});

    	function importFiles() {
    		console.log(files);

    		for (let i = 0; i < files.length; i++) {
    			let file = files[i];

    			fs.readFile(file.path, "utf-8", (err, data) => {
    				if (err) {
    					alert("An error ocurred reading the file :" + err.message);
    					return;
    				}

    				let lines = data.split("\n");
    				let parsedData = [];
    				let date = 0;

    				lines.forEach(line => {
    					let parsed;

    					try {
    						parsed = nmea.parse(line);
    					} catch(e) {
    						console.log(e); //console.log(parsed)
    					}

    					if (typeof parsed !== "undefined" && parsed.sentence == "RMC" && date == 0) {
    						let parseddate = parsed.date;
    						let timestamp = parsed.timestamp;
    						let d = parseddate.substring(0, 2);
    						let m = parseddate.substring(2, 4);
    						let y = parseddate.substring(4, 6);
    						let h = timestamp.substring(0, 2);
    						let min = timestamp.substring(2, 4);
    						let sec = timestamp.substring(4, 6);
    						let utc_str = `20${y}-${m}-${d}T${h}:${min}:${sec}Z`;
    						let dt = new Date(utc_str);
    						date = dt.toString();
    					}

    					if (typeof parsed !== "undefined" && parsed.sentence == "GGA") {
    						parsedData.push(parsed);
    					}

    					if (typeof parsed !== "undefined" && parsed.sentence == "RMC") {
    						console.log(parsed.speedKnots);
    						parsedData[parsedData.length - 1].speedKnots = parsed.speedKnots;
    					}
    				});

    				let alreadyExists = false;

    				existingJumpDates.forEach(d => {
    					if (d.date == date) alreadyExists = true;
    				});

    				if (!alreadyExists) {
    					console.log(existingJumpDates);
    					var doc = { date, data: parsedData };

    					db.insert(doc, function (err, newDoc) {
    						if (err) alert(err);
    					});

    					alert("Import Success");
    				} else {
    					alert("ERROR: Jump already imported");
    				}

    				$$invalidate(0, input.value = "", input);
    			});
    		}
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, input = $$value);
    		});
    	}

    	function input_1_change_handler() {
    		files = this.files;
    		$$invalidate(1, files);
    	}

    	$$self.$capture_state = () => ({
    		fs,
    		nmea,
    		Datastore,
    		db,
    		input,
    		files,
    		existingJumpDates,
    		importFiles,
    		require,
    		alert,
    		console,
    		Date
    	});

    	$$self.$inject_state = $$props => {
    		if ("fs" in $$props) fs = $$props.fs;
    		if ("nmea" in $$props) nmea = $$props.nmea;
    		if ("Datastore" in $$props) Datastore = $$props.Datastore;
    		if ("db" in $$props) db = $$props.db;
    		if ("input" in $$props) $$invalidate(0, input = $$props.input);
    		if ("files" in $$props) $$invalidate(1, files = $$props.files);
    		if ("existingJumpDates" in $$props) existingJumpDates = $$props.existingJumpDates;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		input,
    		files,
    		importFiles,
    		existingJumpDates,
    		fs,
    		nmea,
    		Datastore,
    		db,
    		input_1_binding,
    		input_1_change_handler
    	];
    }

    class Import extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Import",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */
    const file$e = "src\\App.svelte";

    // (12:1) {#if page == 1}
    function create_if_block_2(ctx) {
    	let current;
    	const home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(12:1) {#if page == 1}",
    		ctx
    	});

    	return block;
    }

    // (15:1) {#if page == 2}
    function create_if_block_1$1(ctx) {
    	let current;
    	const jumps = new Jumps({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(jumps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(jumps, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(jumps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(15:1) {#if page == 2}",
    		ctx
    	});

    	return block;
    }

    // (18:1) {#if page == 3}
    function create_if_block$1(ctx) {
    	let current;
    	const import_1 = new Import({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(import_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(import_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(import_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(import_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(import_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:1) {#if page == 3}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let main;
    	let updating_page;
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	function sidebar_page_binding(value) {
    		/*sidebar_page_binding*/ ctx[2].call(null, value);
    	}

    	let sidebar_props = {};

    	if (/*page*/ ctx[0] !== void 0) {
    		sidebar_props.page = /*page*/ ctx[0];
    	}

    	const sidebar = new Sidebar({ props: sidebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidebar, "page", sidebar_page_binding));
    	let if_block0 = /*page*/ ctx[0] == 1 && create_if_block_2(ctx);
    	let if_block1 = /*page*/ ctx[0] == 2 && create_if_block_1$1(ctx);
    	let if_block2 = /*page*/ ctx[0] == 3 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(main, "class", "svelte-1thuva1");
    			add_location(main, file$e, 9, 0, 254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(sidebar, main, null);
    			append_dev(main, t0);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t2);
    			if (if_block2) if_block2.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sidebar_changes = {};

    			if (!updating_page && dirty & /*page*/ 1) {
    				updating_page = true;
    				sidebar_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			sidebar.$set(sidebar_changes);

    			if (/*page*/ ctx[0] == 1) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t1);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] == 2) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t2);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] == 3) {
    				if (!if_block2) {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, null);
    				} else {
    					transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(sidebar);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	var page = 2;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function sidebar_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name, Sidebar, Home, Jumps, Import, page });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, name, sidebar_page_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$e, safe_not_equal, { name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
