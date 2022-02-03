function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    };
}

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object" ? child : createTextElement(child)
            )
        }
    };
}

function createDom(fiber) {
    console.log('Creating dom for fiber', fiber)
    const dom =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode(fiber.props.nodeValue)
            : document.createElement(fiber.type);


    updateDom(dom, {}, fiber.props)

    return dom;
}

function updateDom(dom, prevProps, nextProps) {
    const result = {
        dom,
        removeEventListener: [],
        addEventListener: [],
        removeAttribute: [],
        upsertAttribute: []
    }
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLocaleLowerCase()
                .substring(2)
            dom.removeEventListener(eventType, prevProps[name])
            result.removeEventListener.push(name)
        });

    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            dom.addEventListener(eventType, nextProps[name])
            result.addEventListener.push(name)
        });

    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = ""
            result.removeAttribute.push(name)
        });

    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
            result.upsertAttribute.push(name)
        });

    console.log('Dom update', result)
}

function commitRoot() {
    currentRoot = wipRoot
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    wipRoot = null;
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }

    const domParent = domParentFiber.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
        domParent.removeChild(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
}


// work loop setup

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = []
const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function workLoop(deadline) {
    let shouldYeild = false;
    while (nextUnitOfWork && !shouldYeild) {
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
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber = null;
        const sameType = oldFiber && element && element.type === oldFiber.type;
        if (sameType) {
            console.log('reconciling update..', element)
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                parent: wipFiber,
                dom: oldFiber.dom,
                alternate: oldFiber,
                effectTag: "UPDATE"
            };
        }

        if (element && !sameType) {
            console.log('reconciling placement..', element)
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: null,
                alternate: null,
                effectTag: "PLACEMENT"
            };
        }

        if (oldFiber && !sameType) {
            console.log('reconciling deletion..', element)
            oldFiber.effectTag = "DELETION"
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

let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []

    const children = [fiber.type(fiber.props)];

    reconcileChildren(children, fiber);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }

    const elements = fiber.props.children;

    reconcileChildren(elements, fiber);
}

function performUnitOfWork(fiber) {
    console.log('Working on ', fiber)
    const isFunctionalComponent = fiber.type instanceof Function;

    if (isFunctionalComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber)
    }

    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;

    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;

    }
}

function useState(initial) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];

    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    };

    wipFiber.hooks.push(hook)
    hookIndex++;

    const actions = oldHook ? oldHook.queue : []

    actions.forEach(action => {
        hook.state = action(hook.state)
    });

    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = wipRoot
        deletions = []
    };

    return [hook.state, setState]
}

function useEffect(action) {

}

const Didact = {
    createElement,
    render,
    useState
};

let clickCount = 0;

const handler = e => {
    console.log(e);
    clickCount++;
    Didact.render(element, container)
}

/** @jsx Didact.createElement */
function CountSummary(props) {
    return (
        <h3>Click count {props.count}</h3>
    )
}

/** @jsx Didact.createElement */
function App(props) {
    const [state, setState] = Didact.useState(0);

    return <div id="foo">
        <a id="test" href="https://scoutdi.com">Goto scout-di website {props.name}</a>
        <b/>
        <div>
            <CountSummary count={state}/>
            <button onClick={() => setState(c => c + 1)}>Test</button>
        </div>
    </div>;
}

const element = <App name='now'/>

const container = document.getElementById("root")
Didact.render(element, container)

