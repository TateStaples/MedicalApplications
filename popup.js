document.addEventListener('DOMContentLoaded', loadPresets);  // when the page is loaded, insert previous configs
document.addEventListener('click', savePreferences);  // whenever they click a button, save the change

function savePreferences() {
	// alert("saving preferences")
	let dictionary = {};  // initialize the replace
	getPromise().then(function (configs) {
		for (let key in configs) {
			let element = document.getElementById(key);  // get the html input representing the setting
			let preference = element.checked;  // get whether or not it is checked
			dictionary[key] = preference;  // add the pair into the replacement dict
			// alert(key + ", " + preference)
		}
		save(dictionary);  // save the configs
	})
}

function loadPresets() {
	// alert("loading preferences")
	setUpConfigs(  // establish that configs have been set up
	getPromise().then(function (configs) {  // get the configs
		for (let key in configs) {  // for each config in the settings
			let preference = configs[key];  // get the value of the item
			let element = document.getElementById(key);  // get corresponding html element
			element.checked = preference; // set the saved preference
		}
	}));
}