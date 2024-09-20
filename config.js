//===================================================================================================================
// DO NOT EDIT THIS FILE - this file contains the defaults and might be overriden during an upgrade
// Add overriding configuration values to a config.json file (see config.json.example)
//===================================================================================================================

const fs = require("fs")
const path = require('path')
const utils = require('./lib/utils')

const version = require('./package.json').version;
const model = utils.model()

const global = {
    // Use the higher resolution video stream
    'highResVideo': model !== 'c100x'
}
const doorUnlock = {
    // Default behaviour is device ID 20, if you need more, add them to additionalLocks in config.json
    openSequence: '*8*19*20##' ,
    closeSequence: '*8*20*20##',
};

const additionalLocks = {}

const mqtt_config = {
    // Set to enable to publish events to an external MQTT server
    'enabled': false,
    // Publish all openwebnet events (can be noisy and overload your system?)
    'all_events_enabled': false,
    'enable_intercom_status': false,
    'status_polling_interval': 300,
    // Hostname or IP of the external MQTT server
    'host': '',
    'port': 1883,
    // If anonymous MQTT leave blank
    'username': '',
    'password': '',
    // MQTT Topic, will resolve to 'topic/eventname'
    'topic': 'bticino',
    // If retain is true, the message will be retained as a "last known good" value on the broker
    'retain': false,
    // Path of mosquitto_pub on the intercom
    'exec_path': '/usr/bin/mosquitto_pub'
}

const sip = {
    'from': undefined,
    'to': undefined,
    'domain': undefined,
    'debug': false,
    'expire': 300,
    'devaddr': model === 'c100x' ? utils.detectDevAddrOnC100X() : 20
}

const homeassistant = {
    'token': undefined,
    'url': undefined
}

const configFile = './config.json';

const configPath = path.join(__dirname, configFile);
const cwdConfigPath = path.join(process.cwd(), configFile);
const extraConfigPath = path.join( "/home/bticino/cfg/extra/", configFile )
const configPaths = [configPath, cwdConfigPath, extraConfigPath]

function overrideAndPrintValue( name, base, overridden ) {
    for(const key in overridden) {
        if( overridden[key] !== undefined && base[key] !== overridden[key] ) {
            if( name === "homeassistant" && key === "pages" )
                console.log( `${name}.${key}: ${JSON.stringify(  base[key], null, 2)} -> [${overridden[key].length} pages]`)
            else
                console.log( `${name}.${key}: ${JSON.stringify(  base[key], null, 2)} -> ${JSON.stringify( overridden[key], null, 2 )}`)
            base[key] = overridden[key]
        }
    }
}

function detectConfig() {
    for(let p of configPaths) {
        if( fs.existsSync(p) ) return p
    }
}

const detectedPath = detectConfig()
if( detectedPath ) {
    console.log(`FOUND config.json file at '${detectedPath}' and overriding the values from it.\r\n`)
    const config = JSON.parse( fs.readFileSync(detectedPath) )
    overrideAndPrintValue( "global", global, config.global)
    overrideAndPrintValue( "doorUnlock", doorUnlock, config.doorUnlock)
    overrideAndPrintValue( "additionalLocks", additionalLocks, config.additionalLocks)
    overrideAndPrintValue( "mqtt_config", mqtt_config, config.mqtt_config)
    overrideAndPrintValue( "sip", sip, config.sip)
    overrideAndPrintValue( "homeassistant", homeassistant, config.homeassistant)
    console.log("")
} else {
    console.log(`NO config.json file found in paths '${configPaths}', using built-in defaults.`)
}

if( global.highResVideo && utils.model() === 'c100x' ) {
    // If a c100x does force highResVideo, flip it back off since it doesn't support it.
    console.info("!!! Forcing highResVideo back to false on c100x")
    global.highResVideo = false
}

console.log(`============================== final config =====================================
\x1b[33m${JSON.stringify( { global, doorUnlock, additionalLocks, mqtt_config, sip }, null, 2 )}\x1b[0m
=================================================================================`)

module.exports = {
    doorUnlock, additionalLocks, mqtt_config, global, sip, homeassistant, version
}
