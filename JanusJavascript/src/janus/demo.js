
JanusJS.updateGui = function(ifNeeded) {
	if (ifNeeded == true) {
		activePage.fillIfNeeded({});
	} else {
		this.showResult('place', activePage.fill({}));
	}
	if (activePage.urtext) {
		var i = activePage.urtext.toString().indexOf('&lt;VBOX&gt;');
		if (i >= 0) {
			this.showResult('dataResult', activePage.urtext.substr(0, i));
			this.showResult('guiResult', activePage.urtext.substr(i));
		} else {
			this.showResult('dataResult', '');
			this.showResult('guiResult', activePage.urtext);
		}
	}
	if (ifNeeded) {
	} else {
		JanusJS.addMessage("Dialog wird angezeigt");
	}
}

JanusJS.addError = function(text) {
	$(function() {
		setTimeout(function() {
			$.Notify({
				keepOpen : true,
				type : 'alert',
				caption : 'Fehler',
				content : text
			});
		}, 100);
	});
}

JanusJS.addMessage = function(text) {
	$(function() {
		setTimeout(function() {
			$.Notify({
				type : 'success',
				caption : 'Ok',
				content : text
			});
		}, 1000);
	});
}

JanusJS.showResult = function(place, text) {
	var place = document.getElementById(place);
	if (place != undefined) {
		place.innerHTML = text;
	}
	return place;
}

function loadXMLPage(pages, name, initFunction) {
	$.ajax({
		url : 'pages/' + name + '.xml',
		data : '',
		success : function(data) {
			try {
				var page = preparePage(data);
				if (page) {
					pages[name] = page;
					initFunction(page);
				} else {
					JanusJS.addError('Seite kann nicht angezeigt werden');
				}
			} catch (e) {
				JanusJS.addError(' Die Seite ' + this.url
						+ ' kann nicht initialisiert werden<br>' + e);
			}
		},
		error : function(xhr, ajaxOptions, thrownError) {
			JanusJS.addError(' Die Seite ' + this.url
					+ ' konnte nicht geladen werden');
		},
		dataType : 'text'
	});
}

function preparePage(text) {
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(text, "text/xml");

	if (xmlDoc.documentElement.innerHTML) {
		if (xmlDoc.documentElement.innerHTML.toString().indexOf('parsererror') > 0) {
			JanusJS.addError(xmlDoc.documentElement.innerHTML);
			return undefined;
		}
	}

	text = text.replace(/&/g, '&amp;');
	text = text.replace(/"/g, '&quot;');
	text = text.replace(/</g, '&lt;');
	text = text.replace(/>/g, '&gt;');
	text = text.replace(/\t/g, '   ');
	text = text.replace(/ /g, '&nbsp;');
	text = text.replace(/\n/g, '<br>');

	var page = JanusJS.buildPage(xmlDoc.documentElement);
	page.urtext = text;
	return page;
}

var pages = {};

loadXMLPage(pages, 'tabs', function(page) {
});

loadXMLPage(pages, 'textfield', function(page) {
});

loadXMLPage(pages, 'actions', function(page) {
});

loadXMLPage(pages, 'textfieldUpdates', function(page) {
});

loadXMLPage(pages, 'maptable', function(page) {
});

loadXMLPage(pages, 'listen', function(page) {
});

loadXMLPage(pages, 'listenAuswahl', function(page) {
});

loadXMLPage(pages, 'rules', function(page) {
});

function setClassOfDomElement(domElement, className) {
	domElement.className += " " + className;
}

JanusJS.addClassFunction('setClass', setClassOfDomElement);

function removeClassOfDomElement(domElement, className) {
	var regexp = new RegExp("(?:^|\\s)" + className + "(?!\\S)");
	domElement.className = domElement.className.replace(regexp, '');
}

JanusJS.addClassFunction('removeClass', removeClassOfDomElement);

function showActivePage(command, values, callIfOk, callIfError) {
	var page = pages[command];
	if (page) {
		activePage = page;
		page.callOnVisit();
		callIfOk();
		JanusJS.updateGui();
		if (page.DataSources.rules) {
			page.DataSources.rules.refresh();
		}
	} else {
		callIfError('Seite kann nicht angezeigt werden');
	}
}

JanusJS.addClassFunction('menuauswahl', showActivePage);

JanusJS.addClassFunction('spaetLaden', function(command, values, callIfOk,
		callIfError) {

	loadXMLPage(pages, command, function() {
		showActivePage(command, values, callIfOk, callIfError);
	});
});
loadXMLPage(pages, 'menu', function(page) {
	JanusJS.showResult('menu', page.fill({}));
});

JanusJS.addClassFunction('rezeptSpeichern', function(command, values, callIfOk,
		callIfError) {

	JanusJS.addMessage("Rezept gespeichert");

});

JanusJS.addClassFunction('refresh', function(action, callOnOk, callOnError) {
	action.refresh();
	if (callOnOk) {
		callOnOk();
	}
})

function clearRezeptGui(page) {
	page.callOnInit();
}

loadXMLPage(pages, 'rezepte', clearRezeptGui);
