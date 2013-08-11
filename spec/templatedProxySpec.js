describe("fdom.Proxy.templatedproxy", function() {
  it("conforms simple arguments", function() {
    expect(conform("string", "mystring")).toEqual("mystring");
    expect(conform("number", "mystring")).toEqual(jasmine.any(Number));
    expect(conform("bool", "mystring")).toEqual(false);
    expect(conform("", "mystring")).toEqual(undefined);
  });

  it("conforms complex arguments", function() {
    expect(conform({"key":"string"}, {"key":"good", "other":"bad"})).
        toEqual({"key":"good"});
    expect(conform(["string"], ["test", 12])).toEqual(["test"]);
    expect(conform(["array", "string"], ["test", 12])).toEqual(["test", "12"]);
    expect(conform("object", {"simple":"string"})).toEqual({"simple": "string"});
    expect(conform.bind({}, "object", function() {})).toThrow();
  });

  it("conforms binary arguments", function() {
    // TODO: test Blob support (API is nonstandard between Node and Browsers)
    /*
     * var blob = new Blob(["test"]);
     * expect(conform("blob", blob)).toEqual(blob);
     * expect(conform("blob", "string")).toEqual(jasmine.any(Blob));
     */

    var buffer = new ArrayBuffer(4);
    expect(conform("buffer", buffer)).toEqual(buffer);
    expect(conform("buffer", "string")).toEqual(jasmine.any(ArrayBuffer));
  });

  it("conforms channel movement", function() {
    var channel = jasmine.createSpyObj('chan', ['on','postMessage']);
    channel.flow = 'customflow';
    channel.app = {id: 'customapp'};
    var proxy = new fdom.Proxy(channel);
    expect(conform("proxy", proxy)).toEqual(['customapp', 'customflow', undefined]);
  });
});
