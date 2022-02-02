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
function reconcileChildren(elements, wipFiber) {
    var index = 0;
    var oldFiber = wipFiber.alternate && wipFiber.alternate.child;
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
                parent: wipFiber,
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
                parent: wipFiber,
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
            wipFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
}
function updateFunctionComponent(fiber) {
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
var Didact = {
    createElement: createElement,
    render: render
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
    return(/*#__PURE__*/ Didact.createElement("div", {
        id: "foo"
    }, /*#__PURE__*/ Didact.createElement("a", {
        id: "test",
        href: "https://scoutdi.com"
    }, "Goto scout-di website ", props.name), /*#__PURE__*/ Didact.createElement("b", null), /*#__PURE__*/ Didact.createElement("div", null, /*#__PURE__*/ Didact.createElement(CountSummary, {
        count: clickCount
    }), /*#__PURE__*/ Didact.createElement("button", {
        onClick: handler
    }, "Test"))));
}
var element = /*#__PURE__*/ Didact.createElement(App, {
    name: "now"
});
var container = document.getElementById("root");
Didact.render(element, container);


//# sourceMappingURL=app.js.map