# TODO

## Message Sending

`taskBuilder.message()` should do more than simple attach a function to the task's prototype.

Messages need to first-class objects so we can inspect the sender.

Possibile idea: create 2 methods

	task.message = function(arg1, arg2, arg3, sender) {
		return task._message({
			foo 	: arg1,
			bar 	: arg2,
			baz 	: arg3,
			sender 	: sender || null
		});
	}

	task._message = function(msg) {
		// unwrap message in here
	}

So it's now possible to send the message using a standard method call or use the public send() interface (which would delegate to _message automatically).

It would be possible to create asynchronous messages, and for message handlers to delcare their return values.

Promises are probably the best bet for asynchronicity.