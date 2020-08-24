const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const core = require('@actions/core')

const LIGHTSTEP_CONFIG_FILE = process.env.LIGHTSTEP_CONFIG_FILE || '.lightstep.yml'

function configExists() {
    return fs.existsSync(path.join(process.env.GITHUB_WORKSPACE, LIGHTSTEP_CONFIG_FILE))
}

function loadConfig() {
    try {
        let fileContents = fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, LIGHTSTEP_CONFIG_FILE), 'utf8')
        const yamlConfig = yaml.safeLoadAll(fileContents)
        return {
            lightstepOrg : process.env.LIGHTSTEP_ORG
                || core.getInput('lightstep_org') || yamlConfig[0].organization,
            lightstepProj : process.env.LIGHTSTEP_PROJECT
                || core.getInput('lightstep_project') || yamlConfig[0].project,
            integrations : yamlConfig[0].integrations
        }
    } catch (e) {
        return null
    }
}

exports.configExists = configExists
exports.loadConfig = loadConfig