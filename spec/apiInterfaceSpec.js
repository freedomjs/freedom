describe("fdom.proxy.apiInterface", function() {
  it("conforms simple arguments", function() {
    expect(fdom.proxy.conform("string", "mystring")).toEqual("mystring");
    expect(fdom.proxy.conform("number", "mystring")).toEqual(jasmine.any(Number));
    expect(fdom.proxy.conform("bool", "mystring")).toEqual(false);
    expect(fdom.proxy.conform("", "mystring")).toEqual(undefined);
  });

  it("conforms complex arguments", function() {
    expect(fdom.proxy.conform({"key":"string"}, {"key":"good", "other":"bad"})).
        toEqual({"key":"good"});
    expect(fdom.proxy.conform(["string"], ["test", 12])).toEqual(["test"]);
    expect(fdom.proxy.conform(["array", "string"], ["test", 12])).toEqual(["test", "12"]);
    expect(fdom.proxy.conform("object", {"simple":"string"})).toEqual({"simple": "string"});
    expect(fdom.proxy.conform.bind({}, "object", function() {})).toThrow();
  });

  it("conforms binary arguments", function() {
    // TODO: test Blob support (API is nonstandard between Node and Browsers)
    /*
     * var blob = new Blob(["test"]);
     * expect(conform("blob", blob)).toEqual(blob);
     * expect(conform("blob", "string")).toEqual(jasmine.any(Blob));
     */

    var buffer = new ArrayBuffer(4);
    expect(fdom.proxy.conform("buffer", buffer)).toEqual(buffer);
    expect(fdom.proxy.conform("buffer", "string")).toEqual(jasmine.any(ArrayBuffer));
  });
});
