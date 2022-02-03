function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    };
}
function createElement(type, props) {
    for(var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
        children[_key - 2] = arguments[_key];
    }
    return {
        type: type,
        props: _objectSpread({}, props, {
            children: children.map(function(child) {
                return typeof child === "object" ? child : createTextElement(child);
            })
        })
    };
}
function createDom(fiber) {
    console.log('Creating dom for fiber', fiber);
    var dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type);
    updateDom(dom, {}, fiber.props);
    return dom;
}
function updateDom(dom, prevProps, nextProps) {
    var result = {
        dom: dom,
        removeEventListener: [],
        addEventListener: [],
        removeAttribute: [],
        upsertAttribute: []
    };
    Object.keys(prevProps).filter(isEvent).filter(function(key) {
        return !(key in nextProps) || isNew(prevProps, nextProps)(key);
    }).forEach(function(name) {
        var eventType = name.toLocaleLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
        result.removeEventListener.push(name);
    });
    Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).forEach(function(name) {
        var eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
        result.addEventListener.push(name);
    });
    Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(function(name) {
        dom[name] = "";
        result.removeAttribute.push(name);
    });
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(function(name) {
        dom[name] = nextProps[name];
        result.upsertAttribute.push(name);
    });
    console.log('Dom update', result);
}
function commitRoot() {
    currentRoot = wipRoot;
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    wipRoot = null;
}
function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}
function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    var domParentFiber = fiber.parent;
    while(!domParentFiber.dom){
        domParentFiber = domParentFiber.parent;
    }
    var domParent = domParentFiber.dom;
    if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
        domParent.removeChild(fiber.dom);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}
function render(element1, container1) {
    wipRoot = {
        dom: container1,
        props: {
            children: [
                element1
            ]
        },
        alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
}
// work loop setup
var nextUnitOfWork = null;
var wipRoot = null;
var currentRoot = null;
var deletions = [];
var isEvent = function(key) {
    return key.startsWith("on");
};
var isProperty = function(key) {
    return key !== "children" && !isEvent(key);
};
var isNew = function(prev, next) {
    return function(key) {
        return prev[key] !== next[key];
    };
};
var isGone = function(prev, next) {
    return function(key) {
        return !(key in next);
    };
};
function workLoop(deadline) {
    var shouldYeild = false;
    while(nextUnitOfWork && !shouldYeild){
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYeild = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);
function reconcileChildren(elements, wipFiber1) {
    var index = 0;
    var oldFiber = wipFiber1.alternate && wipFiber1.alternate.child;
    var prevSibling = null;
    while(index < elements.length || oldFiber != null){
        var element2 = elements[index];
        var newFiber = null;
        var sameType = oldFiber && element2 && element2.type === oldFiber.type;
        if (sameType) {
            console.log('reconciling update..', element2);
            newFiber = {
                type: oldFiber.type,
                props: element2.props,
                parent: wipFiber1,
                dom: oldFiber.dom,
                alternate: oldFiber,
                effectTag: "UPDATE"
            };
        }
        if (element2 && !sameType) {
            console.log('reconciling placement..', element2);
            newFiber = {
                type: element2.type,
                props: element2.props,
                parent: wipFiber1,
                dom: null,
                alternate: null,
                effectTag: "PLACEMENT"
            };
        }
        if (oldFiber && !sameType) {
            console.log('reconciling deletion..', element2);
            oldFiber.effectTag = "DELETION";
            deletions.push(oldFiber);
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }
        if (index === 0) {
            wipFiber1.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
}
var wipFiber = null;
var hookIndex = null;
function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    var children = [
        fiber.type(fiber.props)
    ];
    reconcileChildren(children, fiber);
}
function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    var elements = fiber.props.children;
    reconcileChildren(elements, fiber);
}
function performUnitOfWork(fiber) {
    console.log('Working on ', fiber);
    var isFunctionalComponent = _instanceof(fiber.type, Function);
    if (isFunctionalComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }
    if (fiber.child) {
        return fiber.child;
    }
    var nextFiber = fiber;
    while(nextFiber){
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
}
function useState(initial) {
    var oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    var hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    };
    wipFiber.hooks.push(hook);
    hookIndex++;
    var actions = oldHook ? oldHook.queue : [];
    actions.forEach(function(action) {
        hook.state = action(hook.state);
    });
    var setState = function(action) {
        hook.queue.push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        };
        nextUnitOfWork = wipRoot;
        deletions = [];
    };
    return [
        hook.state,
        setState
    ];
}
function useEffect(action) {}
var Didact = {
    createElement: createElement,
    render: render,
    useState: useState
};
var clickCount = 0;
var handler = function(e) {
    console.log(e);
    clickCount++;
    Didact.render(element, container);
};
/** @jsx Didact.createElement */ function CountSummary(props) {
    return(/*#__PURE__*/ Didact.createElement("h3", null, "Click count ", props.count));
}
/** @jsx Didact.createElement */ function App(props) {
    var ref = _slicedToArray(Didact.useState(0), 2), state = ref[0], setState = ref[1];
    return(/*#__PURE__*/ Didact.createElement("div", {
        id: "foo"
    }, /*#__PURE__*/ Didact.createElement("a", {
        id: "test",
        href: "https://scoutdi.com"
    }, "Goto scout-di website ", props.name), /*#__PURE__*/ Didact.createElement("b", null), /*#__PURE__*/ Didact.createElement("div", null, /*#__PURE__*/ Didact.createElement(CountSummary, {
        count: state
    }), /*#__PURE__*/ Didact.createElement("button", {
        onClick: function() {
            return setState(function(c) {
                return c + 1;
            });
        }
    }, "Test"))));
}
var element = /*#__PURE__*/ Didact.createElement(App, {
    name: "now"
});
var container = document.getElementById("root");
Didact.render(element, container);


//# sourceMappingURL=app.js.map