import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// react-window needs measurable container dimensions in JSDOM/happy-dom
for (const proto of [HTMLElement.prototype, Element.prototype]) {
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get() {
      return 800;
    },
  });
  Object.defineProperty(proto, "offsetWidth", {
    configurable: true,
    get() {
      return 800;
    },
  });
  Object.defineProperty(proto, "clientHeight", {
    configurable: true,
    get() {
      return 800;
    },
  });
  Object.defineProperty(proto, "clientWidth", {
    configurable: true,
    get() {
      return 800;
    },
  });
}

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value() {
    return {
      width: 800,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 800,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    };
  },
});
