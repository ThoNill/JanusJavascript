var JanusRules = (function() {



	
	var ruleFunctions = {};

	function callRuleFunction(name, command, values, callOnOk, callOnError) {
		return (ruleFunctions[name])(command, values, callOnOk, callOnError);
	}

	var dialogValue = {}

	var rukeTag = {

		RULES : {
			bind : function() {
				if (this.childs) {
					for (var i = 0; i < this.childs.length; i++) {
						this.childs[i].addListener(this);
					}
				}
			},
			configure : function() {
			},
			check : function(values) {
				this.forAllChilds("check", values);
			},
			hasError : function( rule ) {
				this.fireError(rule);
			}
			
		},

		REGEXP : {
			bind : function() {
			},
			configure : function() {
				this.varname = this.attributes['at'];
				this.regexp = new RegExp(this.attributes['re']);
				this.status = 'valid';
			},
			isOk : function(values) {
				return this.regexp.test(values[this.varname]);
			},
			check : function(values) {
				var ok = this.isOk(values);
				if (this.childs) {
					if (ok) {
						this.childs[0].forAllChilds("check", values);
					} else {
						this.childs[1].forAllChilds("check", values);
					}
				} else {
					if (!ok) {
						this.fireError(this);
					}
				}
			}
		},

		MOVE : {
			bind : function() {
			},
			configure : function() {
				this.status = 'valid';
			},
			isOk : function(values) {
				return true;
			},
			check : function(values) {
				if (!this, alreadyCalled) {
					this.fireError();
				}
			}
		}

	}

	function newRule(name, sourceType, attributes) {
		var source = Object.create(sourceType);
		source.name = name;
		source.attributes = attributes;
		source.status = 'init';
		source.addChild = addChild;
		source.addListener = addListener;
		source.doUpdate = true;
		source.priority = attributes['priority'];
		source.message = attributes['message'];
		source.alreadyCalled = false;
		source.positions = [];
		var ptext = source.attributes['move'];
		if (ptext) {
			source.positions = ptext.split(/ *, */);
			source.positionIndex = 0;
			source.currentPosition = source.positions[0];
		}

		source.forAllChilds = function(whatToDo, accumulator) {
			if (this.childs) {
				for (var i = 0; i < this.childs.length; i++) {
					if (typeof whatToDo === "function") {
						whatToDo.apply(this.childs[i], accumulator);
					} else {
						if (typeof this[whatToDo] === "function") {
							((this.childs[i])[whatToDo])(accumulator);
						}
					}
				}
			}
		}

		source.clear = function() {
			this.allreadyCalled = false;
			this.forAllChilds(this.clear);
		}

		source.nextPosition = function() {
			this.positionIndex++;
			if (this.positionIndex >= this.positions.length) {
				this.positionIndex = 0;
			}
			if (this.positionIndex < this.positions.length) {
				this.currentPosition = this.positions[this.positionIndex];
			}
		}

		source.showMessage = function() {
			return this.priority > 2
					|| (this.priority > 1 && this.allreadyCalled == false);
		}

		source.selected = function() {
			this.alreadyCalled = true;
			this.nextPosition();
		}

		source.fireError = function( rule) {
			if (this.listeners == undefined) {
				return;
			}
			if (this.listeners) {
				for (var i = 0; i < this.listeners.length; i++) {
					var u = this.listeners[i];
					u.hasError(rule);
				}
			}
		}

		return source;
	}

	function newRuleElementFromDOM(element, prefix) {
		if (element.nodeType == 1) {
			var proto = rukeTag[element.nodeName];
			if (proto != undefined) {
				var attributes = convertToAttributeHash(element.attributes);
				var name = attributes['name'];
				var dataElement = newRule(name, proto, attributes);
				for (var i = 0; i < element.childNodes.length; i++) {
					var c = element.childNodes.item(i);
					if (c.nodeType == 1) {
						dataElement.addChild(newRuleElementFromDOM(c,
								dataElement.prefix));
					}
				}
				dataElement.configure();
				return dataElement;
			}
			return undefined;
		}
		return undefined;
	}


	function buildRulePage(element) {
		if (element.nodeType == 1) {
		

			var ruleElement= newRuleElementFromDOM(element);

			ruleElement.data = {};
			ruleElement.data.addChild = addChild;
			for (var i = 0; i < element.childNodes.length; i++) {
				var c = element.childNodes.item(i);
				if (c.nodeType == 1) {
					var source = newRuleElementFromDOM(c, '');
					if (source) {
						ruleElement.data.addChild(source);
					}
				}
			}
			ruleElement.bind();
			return ruleElement;
		}
		JanusJS.addError("" + element.nodeName + " hat keine Zuordnung");
		return undefined;
	}

	return {
		prepareRulePage : function (text) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(text, "text/xml");
			
			if (xmlDoc.documentElement.innerHTML) {
				if (xmlDoc.documentElement.innerHTML.toString().indexOf(
				'parsererror') > 0) {
					JanusJS.addError(xmlDoc.documentElement.innerHTML);
					return undefined;
				}
			}
			
			var page = buildRulePage(xmlDoc.documentElement);
			return page;
		},

		loadRulePage : function(name, onOk) {
			jQuery.ajax({
						url : 'rules/' + name + '.xml',
						data : '',
						success : function(data) {
							try {
								var page = JanusRules.prepareRulePage(data);
								onOk(page);
							} catch (e) {
								JanusJS
										.addError(' Die Seite '
												+ this.url
												+ ' kann nicht initialisiert werden<br>'
												+ e);
							}
						},
						error : function(xhr, ajaxOptions, thrownError) {
							JanusJS.addError(' Die Seite ' + this.url
									+ ' konnte nicht geladen werden');
						},
						dataType : 'text'
					});
		},

		addRuleFunction : function(name, f) {
			ruleFunctions[name] = f;
		},

	};

})();
