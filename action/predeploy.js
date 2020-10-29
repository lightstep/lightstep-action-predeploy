const lightstepContext = require('./context/lightstep')
const rollbarContext = require('./context/rollbar')
const pagerdutyContext = require('./context/pagerduty')
const { assertActionInput, resolveActionInput } = require('./utils')

const core = require('@actions/core')
const path = require('path')
const fs = require('fs')
const template = require('lodash.template')


const tmplFile = fs.readFileSync(path.resolve('./pr.tmpl.md'), 'utf8')
const prTemplate = template(tmplFile)

/*
   * Determines status of all pre-deploy checks
   * @param  {...any} states array of context summary statuses
   */
const actionState = (...states) => {
    return (states.find(s => s === 'error') ||
        states.find(s => s === 'warn') ||
        states.find(s => s === 'unknown') ||
        'ok')
}

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

module.exports.predeploy = async function({ lightstepOrg, lightstepProj, lightstepToken, yamlFile }) {
    // Lightstep context
    var templateContext = { trafficLightStatus }
    templateContext.lightstep = await lightstepContext.getSummary(
        { lightstepOrg, lightstepProj, lightstepToken, lightstepConditions : yamlFile.conditions })

    // Rollbar context
    if (yamlFile.integrations && yamlFile.integrations.rollbar) {
        assertActionInput('rollbar_api_token')
        const token = resolveActionInput('rollbar_api_token')
        templateContext.rollbar = await rollbarContext.getSummary(
            { token : token, yamlConfig : yamlFile.integrations.rollbar })
    } else {
        templateContext.rollbar = false
    }

    // PagerDuty context
    if (yamlFile.integrations && yamlFile.integrations.pagerduty) {
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
    return Promise.resolve()
}
