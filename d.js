var D = (function () {

	var ret = {};

	ret.$ = function (query)  { return document.querySelector(query); };
	
	var last = new Date().getTime();
	ret.rateLimit = function (/* f, ctx, arg0, ... */) {
		var args = Array.prototype.slice.apply(arguments);		
		var now = new Date().getTime();
		var elapsed = now - last;
		var delay = THROTTLE - elapsed;
		if (delay > 0) {
			if (VERBOSE)
				console.warn('delay for rate limiting', args, delay + 'ms');
			setTimeout(function () {
				ret.rateLimit.apply(this, args);
			}, delay);
		} else {
			last = now;
			var f = args.shift();
			var ctx = args.shift();
			f.apply(ctx, args);
		}
	};
	
	ret.xhrJSON = function (url, cb) {
		var go = function (url, cb) {
			if (VERBOSE) console.log('sending xhr', url); 
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var resO = null;
					var err = null;
					try {
						resO = JSON.parse(xhr.responseText);
						if (!resO) err = {err: "no xhr res", val: resO};
					} catch (e) {
						console.error('failed xhr parse', url, e, xhr.responseText, cb);
						err = {error: e};
					}					
					cb(err, resO);				
					if (VERBOSE) console.log('  received xhr', url, resO);
				}
				//if (VERBOSE) console.log(xhr);			
			};
			xhr.send(null);		
		};
		ret.rateLimit(go, {}, url, cb);
	};
	
	var callbackCount = 0;
	ret.jsonP = function (makeUrl, cb) {
		var go = function (makeUrl, cb) {
			callbackCount++;
			var funcName = 'jsonp_' + callbackCount;
			var url = makeUrl(funcName);
			if (VERBOSE) console.log('sending jsonP',funcName,url.substring(0,20));
		
			window[funcName] = function (v) {
				if (VERBOSE) console.log('  received jsonP', url.substring(0,20), v);
				delete window[funcName];
				cb(null, v);
			};	
				
			var elt = document.createElement("script");
			elt.setAttribute('type', 'text/javascript');
			elt.setAttribute('src', url);
			
			document.getElementsByTagName('head')[0].appendChild(elt);	
		};
		ret.rateLimit(go, {}, makeUrl, cb);
	}
	
	var res = {};
	for (var i in ret) res[i] = ret[i];
	return res;
}());