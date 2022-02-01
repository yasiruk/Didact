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

function render(element, container) {
	const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type);
	const isProperty = key => key !== "children";

	Object.keys(element.props)
		.filter(isProperty)
		.forEach(name => {
			dom[name] = element.props[name]
		});

	element.props.children.forEach(child => {
		if (child) {
			render(child, dom)
		}
	}
	);
	container.appendChild(dom);
}


// work loop setup

let nextUnitOfWork = null;

function workLoop(deadline) {
	let shouldYeild = false;
	while(nextUnitOfWork && !shouldYeild) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

		shouldYeild = deadline.timeRemaining() < 1;
	}
	requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
	
}

const Didact = {
	createElement,
	render,
};

/** @jsx Didact.createElement */
const element = (
<div id="foo">
    <a id="test" href="https://scoutdi.com">Goto scout di website</a>
    <b />
  </div>
); 
// const element = createTextElement("My test element text");

const container = document.getElementById("root")
Didact.render(element, container)

