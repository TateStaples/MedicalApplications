console.log("launching scraper");
let personalLink = "applicationTabs__personalTab";
let educationLink = "applicationTabs__educationPanel";
let examsLink = "applicationTabs__examslicenseTab";
let crimesLink = "applicationTabs__limitingAndFelonyTab";
let publicationLink = "applicationTabs__PublicationPanel"

// top level functions
function runIfValid() {
    if (document.documentURI === "https://apps.aamc.org/eras-pdws-web/home/application/application") {  // make sure the url is correct
        let previousNotes = document.getElementsByClassName("notepanel-note");
        if (previousNotes.length === 0) {  // check there are no other notes
            let p = getPromise(); // get settings
            p.then(runApplicant)  // run applicant with settings
        }
        else {
            console.log("already notes");
            console.log(previousNotes);
        }
    }
    else alert("This page is invalid! If you keep getting this message, uninstall your Noter chrome extension!")
}

function runApplicant(configs) {
    console.log(configs);
    if (configs["Automatic"]) { // if set to do it
        load(); // load all the information
        getMessage(configs);  // start scraping
    }
}

// main functions
function nextPage() {
    let buttons = document.getElementsByTagName("button");  // list of all buttons on the page
    for (let index in buttons) {
        let b = buttons[index];
        if (b.textContent === "Next") {  // if the button is labeled "Next"
            console.log(b);
            // b.dispatchEvent(new MouseEvent('button'));
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent("click", true, true, window,
                0, 0, 0, 0, 0,
                false, false, false, false,
                0, null);
            b.dispatchEvent(event);  // click the button
        }
    }
    // alert("button not found")
}

function getMessage(c) {
    console.log("getting message");
    let configs = c;
    var educ; var exam; var pers; var crim; var pubs;  // initialize variables
    let i = setInterval(function () { // keep trying to load the information if it didn't load first time
        // console.log("interval");
        console.log(educ === undefined, exam === undefined, pers === undefined, crim === undefined, pubs === undefined)
        load(educ === undefined, exam === undefined, pers === undefined, crim === undefined, pubs === undefined);
    }, 500)

    // wait for each section to load and then scrape
    educ = stallFor(function () {let doc = document.getElementById("SocietiesMembershipTable"); return doc !== undefined && doc !== null;},
        function () {return getEducationDetails(educationLink, configs)});
    exam = stallFor(function () {let doc = document.getElementById("ExamsTable"); return doc !== undefined && doc !== null;},
        function () {return getExamDetails(examsLink, configs)});
    pers = stallFor(function () {let doc = document.getElementById("PersonalInfoTable"); return doc !== undefined && doc !== null;},
        function () {return getPersonalDetails(personalLink, configs)});
    crim = stallFor(function () {let doc = document.getElementById("LimitingFactorsTable"); return doc !== undefined && doc !== null},
        function () {return getCrimeDetails(crimesLink, configs)});
    pubs = stallFor(function () {let elems = document.getElementsByClassName("x-panel-header-text"); for (let i in elems) {if (i === "length") return false; if (elems[i].textContent.includes("Publications (")) return true;} return false;},
        function () {return getPublicationDetails(publicationLink, configs)});

    // wait until all information is loaded
    stallFor(function () {
        console.log(educ, exam, pers, crim, pubs);
        return educ !== undefined && exam !== undefined && pers !== undefined && crim !== undefined && pubs !== undefined;
    }, function () {
        let all = Promise.all([educ, exam, pers, crim, pubs]);  // get array of information
        all.then(function (msgs) {
            clearInterval(i);  // stop loading
            console.log(msgs);
            let s = "";
            for (let index in msgs)
                s += msgs[index];  // concatenate the strings
            submit(s);  // submit the string into notes
            if (configs["perpetual"]) {  // if set to do all
                nextPage();  // go to the next page
            }
        })
    })
}

function getPersonalDetails(personalLink, configs) {
    // click(personalLink);
    let s = "";

    if (configs["URM"] && getURM()) {
        s += "URM\n";
    }

    if (configs["Match"]) {
        let matching = getMatch();
        if (matching !== "" && matching != null) {s += matching + "\n";}
    }

    if (configs["Military"]) {
        let military = inMilitary();
        if (military == null || military) {s += "Might have military obligations\n";}
    }

    if (configs["Citizen"] && !usCitizen()) {
        s += "Might not be US citizen\n";
    }

    console.log("personal: ", s);
    if (s.length) s+="\n";  // add a section break if you wrote something
    return s;
}

function getExamDetails(examsLink, configs) {
    // click(examsLink);
    let s = "";
    if (configs["Exam1"]) {s += "Exam 1: " + getExam1() + "\n";}
    if (configs["ExamCK"]) {s += "Exam Clincal Knowledge: " + getExam2CK() + "\n";}
    if (configs["ExamCS"]) {s += "Exam Clincal Skills: " + getExam2CS() + "\n";}
    if (configs["Licensure"] && getLicensureLimitations()) {s += "potential issues with medical license\n";}
    console.log("Exams: ", s);
    if (s.length) s+="\n";  // add a section break if you wrote something
    return s;
}

function getEducationDetails(educationLink, configs) {
    // click(educationLink);
    let s = "";
    if (configs["UG"]) {s += "Undergraduate: " + getUndergraduate() + "\n";}
    if (configs["Med"]) {s += "Medical School: " + getMedicalSchool() + "\n";}
    if (configs["AOA"] && getAOA()) {s += "AOA\n";}
    if (configs["SSP"] && getSSP()) {s += "SSP\n";}
    if (configs["GHHS"] && getGHHS()) {s += "GHHS\n";}
    if (configs["PhD"] && getPHD()) {s += "PhD\n";}
    console.log("\nEducation: \n" + s);
    if (s.length) s+="\n";  // add a section break if you wrote something
    return s;
}

function getCrimeDetails(crimesLink, configs) {
    // click(crimesLink);
    let criminality = isCrimes();
    if (configs["Crime"] && (criminality == null || criminality)) {return "Might have criminal record\n";}
    return "";
}

function getPublicationDetails(crimesLink, configs) {
    let s = "";
    if (configs["Publications"]) {s+="Number of publications: " + numPublications() + "\n"}
    console.log("Publications: ", s);
    return s;
}


// utility functions
function load(pe=true, ed=true, ex=true, cr=true, pu=true) {  // optional parameter for which tabs to click
    if (pe) click(personalLink);
    if (ed) click(educationLink);
    if (ex) click(examsLink);
    if (cr) click(crimesLink);
    if (pu) click(publicationLink);
}

function click(id) {
    let tag = document.getElementById(id); // get the tag
    // console.log("Click tag of ", id, " is ", tag);
    let hrefs = tag.getElementsByTagName("a");  // get all the links in the element
    let button = hrefs[1];  // the correct one is the 2nd
    // console.log("Clicking: ", button);
    button.click();  // click the button
}

function searchTable(table, description) {
    let topics = table.getElementsByClassName("fieldDescription"); // get all the descriptions
    let answers = table.getElementsByClassName("fieldAnswer");  // get all answers
    let answer = "not found";
    // check for answer corresponding to description
    for (let i =0; i < answers.length; i++) {if (topics[i].textContent === description) {answer = answers[i].textContent; break;}}
    return answer;
}

async function stallFor(func, callback) {
    let p = new Promise(function (resolve, reject) {  // create async function
        let interval = setInterval(function () {  // keep checking until condition func is fulfilled
            if (func()) {
                console.log("loop done")
                clearInterval(interval);  // stop looping
                // setTimeout(function () {
                    resolve(callback());
                // }, 50)  // give a couple more mils to make sure everything loaded
            }
        }, 100)
    })
    let t = await p;  // wait until promise is done running
    return t;  // return the promise
}

function submit(text) {
    let section = document.getElementById("notesSection");
    let notes = section.getElementsByTagName("textarea")[0];
    console.log(notes);
    let saveButton = section.getElementsByTagName("button")[1];
    console.log(saveButton);
    notes.value = text;
    notes.select();
    notes.dispatchEvent(new KeyboardEvent('keyup',{'key':'Backspace'}));
    saveButton.click();
}


// personal
function getURM() {
    try {
        // let personal = getPersonal()
        let URMs = ["african", "hispanic", "pacific", "black", "mexican", "puerto", "cuban", "native"];
        // console.log(personal.getElementById("PermanentAddressTable").getElementsByClassName("fieldAnswer"));
        let addrTable = document.getElementById("PermanentAddressTable");
        let personalTable = document.getElementById("PersonalInfoTable");
        let race = searchTable(personalTable, "Self-Identification").toLowerCase();
        let country = searchTable(addrTable, "Country");
        console.log("race:", race);
        console.log("country:", country)
        if (country === "United States of America") {
            for (let urm in URMs) {
                if (race.includes(urm)) {
                    return true;
                }
            }
        }
        return false;
    } catch (e) {console.log(e); return null;}
}

function getMatch() {
    try {
        let matchInfoTable = document.getElementById("MatchInfoTable");
        let answers = matchInfoTable.getElementsByClassName("fieldAnswer");
        if (answers.length > 2 && answers[2].textContent === "yes") {
            let matchName = answers[3].textContent;
            let matchSpecialty = answers[4].textContent;
            return "Matching with " + matchName + " (" + matchSpecialty + ")";
        }
        return "";
    } catch (e) {console.log(e); return null;}
}

function inMilitary() {
    try {
        let tab = document.getElementById("personalTab");
        let table = tab.getElementsByClassName("styled applicantfields")[6];
        let militaryAnswer = searchTable(table, "Military");
        console.log("Military: " + militaryAnswer);
        return militaryAnswer !== "None";
    }catch (e) {console.log(e); return null;}
}

function usCitizen() {
    try {
        let table = document.getElementById("WorkAuthorization");
        let authorization = searchTable(table, "Current Work Authorization");
        return authorization.includes("U.S. Citizen");
    } catch (e) {console.log(e); return null;}
}


// exams
function getExam1() {
    try {
        // console.log(exams);
        let table = document.getElementById("ExamsTable");
        // console.log("Exam Table: ", table);
        // let score = searchTable(table, )
        let elements = table.getElementsByClassName("even")[0].getElementsByClassName("fieldAnswer");
        return elements[0].textContent;
    } catch (e) {console.log(e); return null;}
}

function getExam2CK() {
    try {
        let table = document.getElementById("ExamsTable");
        return table.getElementsByClassName("odd")[0].getElementsByClassName("fieldAnswer")[0].textContent;
    } catch (e) {console.log(e); return null;}
}

function getExam2CS() {
    try {
        let table = document.getElementById("ExamsTable");
        let exam = table.getElementsByClassName("even")[1];
        return exam.getElementsByClassName("fieldDescription")[1].textContent;
    }catch (e) {console.log(e); return null;}
}

function getLicensureLimitations() {
    try {
        let answers = document.getElementById("LicensureInfoTable").getElementsByClassName("fieldAnswer");
        console.log(answers);
        for (let index in answers) {
            if (index === "length") return false;
            let answer = answers[index].innerText;
            if (answer !== "No") {
                console.log(answer, index);
                return true;
            }
        }
        return false;
    } catch (e) {console.log(e); return null;}
}


//education
function getMedicalSchool() {
    try {
        let medTab = document.getElementById("educationTab");
        let medSchoolTable = medTab.getElementsByClassName("x-grid-group-body")[0];
        // console.log("Med School Table:", medSchoolTable);
        let data = medSchoolTable.getElementsByClassName("medicalexp_firstcolumn_cls")[0];
        // console.log(data);
        return data.getElementsByTagName("li")[0].textContent;
    } catch (e) {console.log(e); return null;}
}

function getUndergraduate() {
    try {
        let medTab = document.getElementById("educationTab");
        let tables = medTab.getElementsByClassName("x-grid-group-body");
        if (tables.length === 1) return "not found";
        let schools = tables[1].getElementsByClassName("x-grid3-row");
        // console.log("School Table:", schools);
        for (let index in schools) {
            // console.log("School index", index);
            let school = schools[index];
            // console.log("School", school);
            if (typeof school === typeof 1) {
                // console.log("broke school loop");
                break;
            }
            let degree = school.getElementsByClassName("education_grid_degree_expected_or_earned")[0].textContent;
            let undergraduate = school.textContent.includes("Undergraduate");
            // console.log("Degree response", degree);
            if (degree.includes("Yes") && undergraduate) {
                let data = school.getElementsByClassName("medicalexp_firstcolumn_cls")[0];
                let name = data.getElementsByTagName("li")[0].textContent;
                return name;
            }
        }
        return "not found";
    } catch (e) {console.log(e); return null;}
}

function getAOA() {
    try {
        // console.log(document);
        // console.log(document.textContent.includes("Applicant did not answer"));
        let society = document.getElementById("SocietiesMembershipTable");
        // console.log(society);
        let AOA = searchTable(society, "Alpha Omega Alpha");
        console.log("AOA: ", AOA)
        return !!(AOA !== "Applicant did not answer" && AOA !== "No" && AOA !== "No Alpha Omega Alpha (AOA) chapter at my school");
    } catch (e) {console.log(e); return null;}
}

function getSSP() {
    try {
        // console.log(document);
        // console.log(document.textContent.includes("Applicant did not answer"));
        let society = document.getElementById("SocietiesMembershipTable");
        // console.log(society);
        let SSP = searchTable(society, "Sigma Sigma Phi");
        console.log("SSP: ", SSP);
        return !!(SSP !== "Applicant did not answer" && SSP !== "No" && SSP !== "No Sigma Sigma Phi (SSP) chapter at my school");
    } catch (e) {console.log(e); return null;}
}

function getGHHS() {
    try {
        let society = document.getElementById("SocietiesMembershipTable");
        let GHHS = searchTable(society, "Gold Humanism Honor Society");
        console.log("GHHS: ", GHHS);
        return (GHHS !== "Applicant did not answer" && GHHS !== "No" && GHHS !== "No Gold Humanism Honor Society (GHHS) chapter at my school");
    } catch (e) {console.log(e); return null;}
}

function getPHD() {try {
    let table = document.getElementsByClassName("x-grid-group-body")[1];
    let schools = table.getElementsByClassName("x-grid3-row");
    // console.log("School Table:", schools);
    for (let index in schools) {
        // console.log("School index", index);
        let school = schools[index];
        // console.log("School", school);
        if (typeof school === typeof 1) {
            // console.log("broke school loop");
            break;
        }
        let degree = school.getElementsByClassName("education_grid_degree_expected_or_earned")[0].textContent;
        let undergraduate = school.textContent.toLowerCase().includes("p.h.d");
        // console.log("Degree response", degree);
        if (degree.includes("Yes") && undergraduate) {
            return true;
        }
    }
    return false;
} catch (e) {console.log(e); return null;}}


//limiting factors
function isCrimes() {
    try {
        let tab = document.getElementById("limitingAndFelonyTab");
        let answers = tab.getElementsByClassName("fieldAnswer");
        console.log(answers);
        let misdemeanor = answers[1].textContent;
        let felony = answers[2].textContent;
        console.log("misdemeanor:", misdemeanor);
        console.log("felony:", felony);
        return misdemeanor !== "No" || felony !== "No";
    } catch (e) {console.log(e); return null;}
}

// publications
function numPublications() {
    try {
        let headers = document.getElementsByClassName("x-panel-header-text");
        for (let index in headers) {
            if (typeof index == typeof 0)
                break;
            let element = headers[index];
            let content = element.textContent;
            if (content.includes("Publications")) {
                return content.substring(content.indexOf("(")+1, content.indexOf(")"));
            }
        }
        return null;
    } catch (e) {
        console.log(e); return null;
    }
}
