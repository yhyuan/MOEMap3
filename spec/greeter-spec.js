'use strict';

describe("greeter", function(){
	it("should greet with hello", function(){
		expect(new Greeter().greeting()).toEqual("hello");
	});
});	