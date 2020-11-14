let configsName = "NoterConfigs";  // the name that the configs are saved under in chrome.storage.local

// the default configs that are loaded
let configDefaults = {"perpetual": false, "Automatic": true,
    "Exam1": true, "ExamCS": true, "ExamCK": true, "Licensure": false,
    "Med": true, "UG": true, "AOA": true, "SSP": true, "GHHS": false, "PhD": false,
    "URM": true, "Military": true, "Match": true, "Citizen": true,
    "Crime": true,
    "Publications": false
};


function save(configs) {
    // save an updated config dictionary
    chrome.storage.local.set({"NoterConfigs": configs}, function () {})
}

function get(func) {
    // activate callback with configs as args
    chrome.storage.local.get(configsName, function (items) {
        func(items["NoterConfigs"]);
    });
}

function getPromise() {
    // return promise with configs in resolve
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get(configsName, function (items) {
            resolve(items[configsName]);
        })
    });
}


function setUpConfigs(callback) {
    // chrome.storage.local.set({"NoterConfigs": configDefaults}, function() {
    //     chrome.storage.local.get("NoterConfigs", function(data) {
    //         alert(data["NoterConfigs"]);
    //         alert(data["NoterConfigs"]["waitTime"]);
    //     });
    //     alert(syncGet());
    // });

    // import the default configs if they haven't already been loaded
    get(function (configs) {
        console.log("configs found");
        // if the configs don't exist or don't match most recent version
        if (configs == undefined || Object.keys(configs).length !== Object.keys(configDefaults).length) {
            console.log("configs being set")
            // set the config to the default
            chrome.storage.local.set({"NoterConfigs": configDefaults}, function () {
                console.log("defaults set");
                callback();  // activate callback function
            });
        } else callback();  // activate callback function
    });

}