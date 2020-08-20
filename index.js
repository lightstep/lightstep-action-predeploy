const core = require('@actions/core')

//const lightstepSdk = require('lightstep-js-sdk')
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

async function run() {
    try {
        const { lightstepOrg, lightstepProj, integrations } = config.loadConfig()

        if (!lightstepOrg) {
            core.setFailed('env LIGHTSTEP_ORG must be set or specified in .lightstep.yml')
            return
        }

        if (!lightstepProj) {
            core.setFailed('env LIGHTSTEP_PROJ must be set or specified in .lightstep.yml')
            return
        }

        const lightstepToken = process.env.LIGHTSTEP_API_TOKEN
        var templateContext = { trafficLightStatus }
        templateContext.lightstep = await lightstepContext.getSummary({ lightstepOrg, lightstepProj, lightstepToken })

        if (integrations.rollbar) {
            if (!process.env.ROLLBAR_API_TOKEN) {
                core.setFailed('env ROLLBAR_API_TOKEN must be set as a GitHub Action secret')
                return
            }
            const token = process.env.ROLLBAR_API_TOKEN
            templateContext.rollbar = await rollbarContext.getSummary({ token, ...integrations.rollbar})
        }

        if (integrations.pagerduty) {
            if (!process.env.PAGERDUTY_API_TOKEN) {
                core.setFailed('env PAGERDUTY_API_TOKEN must be set as a GitHub Action secret')
                return
            }
            const token = process.env.PAGERDUTY_API_TOKEN
            templateContext.pagerduty = await pagerdutyContext.getSummary({ token, ...integrations.pagerduty})
        }

        const markdown = prTemplate(templateContext)
        console.log(markdown)
        core.setOutput('lightstep_predeploy_md', markdown)
    } catch (error) {
        core.info(error)
        core.setFailed(error.message)
    }
}

if (!process.env.LIGHTSTEP_API_TOKEN) {
    core.setFailed('env LIGHTSTEP_API_TOKEN must be set must be set as a GitHub Action secret')
    return
}

run()
