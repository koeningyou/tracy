(() => {
  // sendToAPI sends the tracers generated from an XHR request to
  // the API for storage.
  const sendToAPI = async (xhr, tracers = []) => {
    if (!xhr.tracers) xhr.tracers = [];
    const tr = xhr.tracers.concat(tracers);
    if (tr.length === 0) {
      return;
    }
    tr.map(
      t =>
        window.postMessage({
          "message-type": "database",
          query: "addTracer",
          tracer: t
        }),
      "*"
    );
  };

  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      if (al.length !== 1 || !al[0]) {
        sendToAPI(thisa);
        return Reflect.apply(t, thisa, al);
      }

      replace.body(al[0]).then(r => {
        sendToAPI(thisa, r.tracers);

        return r.tracers.length === 0
          ? Reflect.apply(t, thisa, al)
          : Reflect.apply(t, thisa, [r.body]);
      });
    }
  });

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply: (t, thisa, al) => {
      if (al.length < 2) return Reflect.apply(t, thisa, al);
      thisa.method = al[0];
      thisa.url = al[1];
      const b = replace.str(al[1]);
      if (b.tracers.length === 0) return Reflect.apply(t, thisa, al);
      thisa.url = b.str;
      if (!thisa.tracers) thisa.tracers = [];
      thisa.tracers = thisa.tracers.concat(b.tracers);

      al[1] = b.str;
      return Reflect.apply(t, thisa, al);
    }
  });

  XMLHttpRequest.prototype.setRequestHeader = new Proxy(
    XMLHttpRequest.prototype.setRequestHeader,
    {
      apply: (t, thisa, al) => {
        if (al.length !== 2) return Reflect.apply(t, thisa, al);
        const key = replace.str(al[0]);
        const value = replace.str(al[1]);
        const tracers = key.tracers.concat(value.tracers);
        if (tracers.length === 0) return Reflect.apply(t, thisa, al);
        if (!thisa.tracers) thisa.tracers = [];
        thisa.tracers = thisa.tracers.concat(tracers);
        if (!thisa.headers) thisa.headers = "";
        thisa.headers = `${thisa.headers}
${key.str}: ${value.str}`;
        return Reflect.apply(t, thisa, [key.str, value.str]);
      }
    }
  );
})();
