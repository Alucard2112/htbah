import { htbah, readConfig } from './config.js';
import HTBAHActor from './actor/entity.js';
import HTBAHItemSheet from './item/sheet.js';
import HTBAHActorSheet from './actor/sheet.js';
import { checkRoll } from './roll.js';

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/htbah/templates/partials/actor-sheet-pc-header.hbs",
        "systems/htbah/templates/partials/actor-sheet-npc-header.hbs",
        "systems/htbah/templates/partials/actor-sheet-character-content.hbs",
        "systems/htbah/templates/partials/actor-sheet-creature-content.hbs",
        "systems/htbah/templates/partials/actor-sheet-tab-items-content.hbs",
        "systems/htbah/templates/partials/actor-sheet-tab-skills-content.hbs"
    ];

    return loadTemplates(templatePaths);
}

Hooks.once("init", function () {
    console.log("htbah | Initializing System");

    // Register system settings
    game.settings.register("htbah", "heroStyle", {
        name: "htbah.settings.heroStyle.name",
        hint: "htbah.settings.heroStyle.hint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        onChange: () => readConfig()
    });

    game.settings.register("htbah", "totalSkillPoints", {
        name: "htbah.settings.totalSkillPoints.name",
        hint: "htbah.settings.totalSkillPoints.hint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        onChange: () => readConfig()
    });

    //read config and write it to config object
    readConfig();
    CONFIG.htbah = htbah;

    // Override default actort class
    CONFIG.Actor.documentClass = HTBAHActor;

    Actors.unregisterSheet("core", ActorSheet); //unregister default (core)
    Actors.registerSheet("htbah", HTBAHActorSheet, { makeDefault: true }); //register systems sheet

    Items.unregisterSheet("core", ItemSheet); //unregister default (core)
    Items.registerSheet("htbah", HTBAHItemSheet, { makeDefault: true }); //register systems sheet  

    preloadHandlebarsTemplates();

    Handlebars.registerHelper("add", function (a, b) {
        const aInt = parseInt(a, 10);
        const bInt = parseInt(b, 10);
        if (isNaN(aInt) || isNaN(bInt)) {
            return 0;
        }
        return aInt+bInt;
    });

    Handlebars.registerHelper("divRounded", function (a, b) {
        const aInt = parseInt(a, 10);
        const bInt = parseInt(b, 10);
        if (isNaN(aInt) || isNaN(bInt) || aInt == 0) {
            return 0;
        }
        return Math.round(aInt/bInt);
    });

    Handlebars.registerHelper("hasItems", function (items, type) {
        for (let i = 0; i < items.length; ++i) {
            if (items[i].type == type) {
                return true;
            }
        }
        return false;
    });

    Handlebars.registerHelper("totalSkillPointsSpent", function (items) {
        let spentPoints = 0;
        for (let i = 0; i < items.length; ++i) {
            if(items[i].type == 'skill') {
                let currentPoints = parseInt(items[i].data.points,10);
                if(!isNaN(currentPoints)) {
                    spentPoints += currentPoints;
                }
            }
        }
        return spentPoints;
    });

    Hooks.on("chatMessage", (chatlog, messageText, chatData) => {
        return handleChatMessage(chatlog, messageText, chatData);
    });
});

function handleChatMessage(chatlog, messageText, chatData) {
    const re = new RegExp("^\\/check\\s(\\d{1,3})\\s?(.*)?$","gi");
    const match = re.exec(messageText);

    if(match) {
        const checkAgainst = parseInt(match[1], 10);
        const checkText = (match[2]) ? match[2] : game.i18n.localize("htbah.general.unknown");
        const actor = (chatData.speaker.actor) ? game.actors.get(chatData.speaker.actor) : chatData.speaker.alias;
        checkRoll(checkAgainst, checkText, chatData.user, actor);
        return false;
    }
    
    return true;
}