const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')

const LIGHTSTEP_CONFIG_FILE = process.env.LIGHTSTEP_CONFIG_FILE || '.lightstep.yml'

function configExists() {
    return fs.existsSync(path.join(process.env.GITHUB_WORKSPACE, LIGHTSTEP_CONFIG_FILE))
}

function loadConfig() {
    try {
        let fileContents = fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, LIGHTSTEP_CONFIG_FILE), 'utf8')
        const yamlConfig = yaml.safeLoadAll(fileContents)
        return yamlConfig[0]
    } catch (e) {
        return { integrations : {} }
    }
}

exports.configExists = configExists
exports.loadConfig = loadConfig