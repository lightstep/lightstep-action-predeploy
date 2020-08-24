const core = require('@actions/core')

const path = require('path')
const fs = require('fs')
const template = require('lodash.template')
const config = require('./config')

const tmplFile = fs.readFileSync(path.resolve('./pr.tmpl.md'), 'utf8')
const prTemplate = template(tmplFile)

const lightstepContext = require('./context/lightstep')
const rollbarContext = require('./context/rollbar')
const pagerdutyContext = require('./context/pagerduty')

function trafficLightStatus(s) {
    switch (s) {
    case "unknown":
        return ":white_circle:"
    case "error":
        return ":red_circle:"
    case "ok":
        return ":green_circle:"
    }
}

/**
 * Resolves input as an enviornment variable or action input
 * @param {*} name input name
 */
const resolveActionInput = (name, config = {}) => {
    if (typeof name !== 'string') {
        return null
    }
    const configName = name.replace('lightstep_', '')
    return process.env[name.toUpperCase()] || core.getInput(name) || config[configName]
}

/**
 * Fails action if input does not exist
 * @param {*} name input name
 */
const assertActionInput = (name, config) => {
    if (!resolveActionInput(name, config)) {
        core.setFailed(
            `Input ${name} must be set as an env var, passed as an action input, or specified in .lightstep.yml`)
    }
}

async function run() {
    try {
        const yamlFile = config.loadConfig()

        assertActionInput('lightstep_api_key')
        assertActionInput('lightstep_organization', yamlFile)
        assertActionInput('lightstep_project', yamlFile)

        const lightstepOrg = resolveActionInput('lightstep_organization')
        const lightstepProj = resolveActionInput('lightstep_project')
        const lightstepToken = resolveActionInput('lightstep_api_key')

        var templateContext = { trafficLightStatus }
        templateContext.lightstep = await lightstepContext.getSummary({ lightstepOrg, lightstepProj, lightstepToken })

        if (yamlFile.integrations.rollbar) {
            assertActionInput('rollbar_api_token')
            const token = resolveActionInput('rollbar_api_token')
            templateContext.rollbar = await rollbarContext.getSummary(
                { token : token, rollbar : yamlFile.integrations.rollbar })
        } else {
            templateContext.rollbar = false
        }

        if (yamlFile.integrations.pagerduty) {
            assertActionInput('pagerduty_api_token')
            const token = resolveActionInput('pagerduty_api_token')
            templateContext.pagerduty = await pagerdutyContext.getSummary(
                { token : token, pagerduty : yamlFile.integrations.pagerduty })
        } else {
            templateContext.pagerduty = false
        }

        const markdown = prTemplate(templateContext)

        core.setOutput('lightstep_predeploy_md', markdown)
    } catch (error) {
        console.error(error)
        core.info(error)
        core.setFailed(error.message)
    }
}

run()
