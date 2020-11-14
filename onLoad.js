// this is the start of the actions
// it is started automatically upon opening the correct page

click("app-notes-panel__notesSection");  // switch to notes
setUpConfigs(function () {
    stallFor(function () {
        return document.getElementsByTagName("textarea").length}, // wait until notes are loaded
        runIfValid)  // then run (function in scraper.js)
});