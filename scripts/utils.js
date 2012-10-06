/**
 * TODO This code isn't bad but I don't like the sub-groupings of functionality - like error functions &
 * vars, and the queue stuff. Separate module? Nest the return object to group them?
 */
define([
	"manager",
	"constants",
	"lang",
	"jquery-ui",
	"jquery-json",
], function(manager, C, L) {

	var MODULE_ID       = "core-utils";
	var _currentTab     = 1;
	var _errors         = [];
	var _messageVisible = false;
	var _domChangeQueue = [];

	return {
		selectTab: function(tab) {
			if (tab == _currentTab) {
				return false;
			}
			$("#gdTab" + _currentTab).removeClass("gdSelected");
			$("#gdTab" + tab).addClass("gdSelected");
			$("#gdTab" + _currentTab + "Content").hide();
			$("#gdTab" + tab + "Content").show();

			manager.publish({
				sender: MODULE_ID,
				type: C.EVENT.TAB.CHANGE,
				oldTab: _currentTab,
				newTab: tab
			});

			_currentTab = tab;
			return false;
		},

		// TODO: should temporarily save form settings in memory when switching between languages; or at least prompt the
		// user to let them know they're going to lose any changes unless they do it manually
		changeLanguage: function() {
			var lang_file = $("#gdSelectLanguage").val();
			if (lang_file != "") {
				window.location = "?lang=" + lang_file + "#t" + _currentTab;
			}
		},

		startProcessing: function() {
			$("#gdProcessingIcon").show();
		},

		stopProcessing: function() {
			$("#gdProcessingIcon").hide();
		},

		/**
		 * This adds an array of error objects, or just a single one.
		 */
		addValidationErrors: function(newErrors) {
			if ($.isArray(newErrors) && newErrors.length) {
				_errors = _errors.concat(_errors, newErrors);
			} else {
				_errors.push(newErrors);
			}
		},

		clearValidationErrors: function() {
			_errors = [];
			$("*").removeClass("gdProblemField");
		},

		hideValidationErrors: function(el, unhighlightProblemFields) {
			if (!_messageVisible) {
				return;
			}
			if (unhighlightProblemFields) {
				$("*").removeClass("gdProblemField");
			}
			$(el).closest(".gdMessage").hide("blind", null, 500);
			_errors = [];
			_messageVisible = false;

			return false;
		},

		/**
		 * Helper function to return the errors currently that have been logged.
		 */
		getValidationErrors: function() {
			return _errors;
		},

		/**
		 * Displays the errors
		 */
		displayValidationErrors: function(el) {
			var html = "<ul>";
			var hasFocus = false;

			for (var i=0; i<_errors.length; i++) {

				// style all offending fields and focus on the first one with a problem
				if (_errors[i].els != null) {
					for (var j=0; j<_errors[i].els.length; j++) {
						if (!hasFocus) {
							$(_errors[i].els[j]).focus();
							hasFocus = true;
						}
						$(_errors[i].els[j]).addClass("gdProblemField");
					}
				}

				html += "<li>" + _errors[i].error + "</li>";
			}
			$(el).removeClass("gdNotify").addClass("gdErrors gdMarginTop");
			$(el).find("div").html(html);

			// if this is the first time the errors are displayed (i.e. it's not already visible), blind it in
			if (!_messageVisible) {
				$(el).show("blind", null, 500);
			}

			_messageVisible = true;
		},


		displayMessage: function(message) {
			$("#gdMessages").removeClass("gdErrors").addClass("gdNotify gdMarginTop");
			$("#gdMessages div").html(message);

			// if this is the first time the errors are displayed (i.e. it's not already visible), blind it in
			if (!_messageVisible) {
				$("#gdMessages").show("blind", null, 500);
			}
			_messageVisible = true;
		},

		isNumber: function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		},

		/*
		This code handles problems caused by the time taken by browser HTML rendering engines to manipulate
		and redraw page content. It ensures a series of DOM-manipulation-intensive changes are completed
		sequentially. See my post here: http://www.benjaminkeen.com/?p=136

		This code relies on the _domChangeQueue array being populated with arrays with the following indexes:
			[0] : code to execute - (function)
			[1] : boolean test to determine completion - (function)
			[2] : interval ID (managed internally by script) - (integer)
		*/
		pushToQueue: function(arr) {
			_domChangeQueue.push(arr);
		},

		processQueue: function() {
			if (!_domChangeQueue.length) {
				return;
			}

			// if this code hasn't begun being executed, start 'er up
			if (!_domChangeQueue[0][2]) {
				setTimeout(function() { _domChangeQueue[0][0]() }, 10);
				var currObj = this;
				timeout_id = setInterval(function() { currObj.checkQueueItemComplete() }, 25);
				_domChangeQueue[0][2] = timeout_id;
			}
		},

		checkQueueItemComplete: function() {
			if (_domChangeQueue[0][1]()) {
				clearInterval(_domChangeQueue[0][2]);
				_domChangeQueue.shift();
				this.processQueue();
			}
		}
	}

});