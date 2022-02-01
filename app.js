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
function render(element1, container1) {
    var dom = element1.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element1.type);
    var isProperty = function(key) {
        return key !== "children";
    };
    Object.keys(element1.props).filter(isProperty).forEach(function(name) {
        dom[name] = element1.props[name];
    });
    element1.props.children.forEach(function(child) {
        if (child) {
            render(child, dom);
        }
    });
    container1.appendChild(dom);
}
// work loop setup
var nextUnitOfWork = null;
function workLoop(deadline) {
    var shouldYeild = false;
    while(nextUnitOfWork && !shouldYeild){
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYeild = deadline.timeRemaining() < 1;
    }
    requestIdleCallback(workLoop);
}
function performUnitOfWork(fiber) {}
var Didact = {
    createElement: createElement,
    render: render
};
/** @jsx Didact.createElement */ var element = /*#__PURE__*/ Didact.createElement("div", {
    id: "foo"
}, /*#__PURE__*/ Didact.createElement("a", {
    id: "test",
    href: "https://scoutdi.com"
}, "Goto scout di website"), /*#__PURE__*/ Didact.createElement("b", null));
// const element = createTextElement("My test element text");
var container = document.getElementById("root");
Didact.render(element, container);


//# sourceMappingURL=app.js.map