
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
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (18:8) {#each jumpDates as date}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*date*/ ctx[3].date + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*date*/ ctx[3].date;
    			option.value = option.__value;
    			add_location(option, file$7, 18, 8, 407);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*jumpDates*/ 1 && t_value !== (t_value = /*date*/ ctx[3].date + "")) set_data_dev(t, t_value);

    			if (dirty & /*jumpDates*/ 1 && option_value_value !== (option_value_value = /*date*/ ctx[3].date)) {
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
    		source: "(18:8) {#each jumpDates as date}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let selector;
    	let select;
    	let each_value = /*jumpDates*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			selector = element("selector");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(select, file$7, 16, 4, 354);
    			add_location(selector, file$7, 15, 0, 338);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, selector, anchor);
    			append_dev(selector, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*jumpDates*/ 1) {
    				each_value = /*jumpDates*/ ctx[0];
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(selector);
    			destroy_each(each_blocks, detaching);
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

    	db.loadDatabase(function (err) {
    		db.find({}, { date: 1 }, function (err, docs) {
    			$$invalidate(0, jumpDates = docs);
    			console.log(jumpDates);
    		});
    	});

    	$$self.$capture_state = () => ({
    		Datastore,
    		db,
    		jumpDates,
    		require,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("Datastore" in $$props) Datastore = $$props.Datastore;
    		if ("db" in $$props) db = $$props.db;
    		if ("jumpDates" in $$props) $$invalidate(0, jumpDates = $$props.jumpDates);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [jumpDates];
    }

    class Jump_selector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jump_selector",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\jumps.svelte generated by Svelte v3.19.1 */
    const file$8 = "src\\components\\jumps.svelte";

    function create_fragment$8(ctx) {
    	let selector;
    	let current;
    	const jumpselector = new Jump_selector({ $$inline: true });

    	const block = {
    		c: function create() {
    			selector = element("selector");
    			create_component(jumpselector.$$.fragment);
    			add_location(selector, file$8, 4, 0, 79);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, selector, anchor);
    			mount_component(jumpselector, selector, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumpselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumpselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(selector);
    			destroy_component(jumpselector);
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

    function instance$8($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ JumpSelector: Jump_selector });
    	return [];
    }

    class Jumps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumps",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\import.svelte generated by Svelte v3.19.1 */

    const file$9 = "src\\components\\import.svelte";

    function create_fragment$9(ctx) {
    	let import_1;
    	let input;
    	let t0;
    	let div;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			import_1 = element("import");
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "Import!";
    			attr_dev(input, "id", "fileselector");
    			attr_dev(input, "type", "file");
    			add_location(input, file$9, 63, 4, 2333);
    			attr_dev(p, "class", "svelte-7hrd5i");
    			add_location(p, file$9, 65, 8, 2437);
    			attr_dev(div, "class", "btn svelte-7hrd5i");
    			add_location(div, file$9, 64, 4, 2387);
    			attr_dev(import_1, "class", "svelte-7hrd5i");
    			add_location(import_1, file$9, 62, 0, 2319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, import_1, anchor);
    			append_dev(import_1, input);
    			append_dev(import_1, t0);
    			append_dev(import_1, div);
    			append_dev(div, p);

    			dispose = [
    				listen_dev(input, "change", /*input_change_handler*/ ctx[6]),
    				listen_dev(div, "click", /*importFiles*/ ctx[1], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(import_1);
    			run_all(dispose);
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

    function instance$9($$self, $$props, $$invalidate) {
    	var fs = require("fs"); // Load the File System to execute our common tasks (CRUD)
    	var nmea = require("nmea");
    	var Datastore = require("nedb");
    	var db = new Datastore("C:/Program Files/Jumpify/jumps.db");
    	db.loadDatabase();
    	console.log(db);
    	let files;

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
    				let parsedRMCData = [];
    				let date = 0;

    				lines.forEach(line => {
    					let parsed;

    					try {
    						parsed = nmea.parse(line);
    					} catch(e) {
    						console.log(e); //console.log(parsed)
    					}

    					if (typeof parsed !== "undefined" && parsed.sentence == "RMC") {
    						if (date == 0) {
    							let parseddate = parsed.date;
    							let timestamp = parsed.timestamp;
    							let d = parseddate.substring(0, 2);
    							let m = parseddate.substring(2, 4);
    							let y = parseddate.substring(4, 6);
    							let h = timestamp.substring(0, 2);
    							let min = timestamp.substring(2, 4);
    							let utc_str = `20${y}-${m}-${d}T${h}:${min}Z`;
    							let dt = new Date(utc_str);
    							date = dt.toString();
    						}

    						parsedRMCData.push(parsed);
    					}
    				});

    				// Change how to handle the file content
    				//console.log("The file content is : " + data);
    				var doc = { date, data: parsedRMCData };

    				db.insert(doc, function (err, newDoc) {
    					if (err) alert(err);
    				});
    			});
    		}
    	}

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	$$self.$capture_state = () => ({
    		fs,
    		nmea,
    		Datastore,
    		db,
    		files,
    		importFiles,
    		require,
    		console,
    		alert,
    		Date
    	});

    	$$self.$inject_state = $$props => {
    		if ("fs" in $$props) fs = $$props.fs;
    		if ("nmea" in $$props) nmea = $$props.nmea;
    		if ("Datastore" in $$props) Datastore = $$props.Datastore;
    		if ("db" in $$props) db = $$props.db;
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [files, importFiles, fs, nmea, Datastore, db, input_change_handler];
    }

    class Import extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Import",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */
    const file$a = "src\\App.svelte";

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

    function create_fragment$a(ctx) {
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
    			add_location(main, file$a, 9, 0, 254);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	var page = 3;
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
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
