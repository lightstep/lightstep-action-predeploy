const core = require('@actions/core')

const path = require('path')
const fs = require('fs')
const assert = require('assert')
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
        const msg = `Input ${name} must be set as an env var, passed as an action input, or specified in .lightstep.yml`
        core.setFailed(msg)
        assert.fail(msg)
    }
}

/**
 * Determines status of all pre-deploy checks
 * @param  {...any} states array of context summary statuses
 */
const actionState = (...states) => {
    return (states.find(s => s === 'error') ||
        states.find(s => s === 'warn') ||
        states.find(s => s === 'unknown') ||
        'ok')
}

async function run() {
    try {
        const yamlFile = config.loadConfig()

        assertActionInput('lightstep_api_key')
        assertActionInput('lightstep_organization', yamlFile)
        assertActionInput('lightstep_project', yamlFile)

        const lightstepOrg = resolveActionInput('lightstep_organization', yamlFile)
        const lightstepProj = resolveActionInput('lightstep_project', yamlFile)
        const lightstepToken = resolveActionInput('lightstep_api_key')

        core.setOutput('lightstep_organization', lightstepOrg)
        core.setOutput('lightstep_project', lightstepProj)

        // Lightstep context
        var templateContext = { trafficLightStatus }
        templateContext.lightstep = await lightstepContext.getSummary({ lightstepOrg, lightstepProj, lightstepToken })

        // Rollbar context
        if (yamlFile.integrations.rollbar) {
            assertActionInput('rollbar_api_token')
            const token = resolveActionInput('rollbar_api_token')
            templateContext.rollbar = await rollbarContext.getSummary(
                { token : token, yamlConfig : yamlFile.integrations.rollbar })
        } else {
            templateContext.rollbar = false
        }

        // PagerDuty context
        if (yamlFile.integrations.pagerduty) {
            assertActionInput('pagerduty_api_token')
            const token = resolveActionInput('pagerduty_api_token')
            templateContext.pagerduty = await pagerdutyContext.getSummary(
                { token : token, yamlConfig : yamlFile.integrations.pagerduty })
        } else {
            templateContext.pagerduty = false
        }

        templateContext.status = actionState(
            templateContext.lightstep.status,
            templateContext.rollbar && templateContext.rollbar.status)
        const markdown = prTemplate(templateContext)

        core.setOutput('lightstep_predeploy_status', templateContext.status)
        core.setOutput('lightstep_predeploy_md', markdown)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
