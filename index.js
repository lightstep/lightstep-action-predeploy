const core = require('@actions/core')
const config = require('./action/config')
const { assertActionInput, resolveActionInput } = require('./action/utils')
const { predeploy } = require('./action/predeploy')

async function run() {
    try {
        const yamlFile = config.loadConfig()

        assertActionInput('lightstep_api_key')
        assertActionInput('lightstep_organization', yamlFile)
        assertActionInput('lightstep_project', yamlFile)

        const lightstepOrg = resolveActionInput('lightstep_organization', yamlFile)
        const lightstepProj = resolveActionInput('lightstep_project', yamlFile)
        const lightstepToken = resolveActionInput('lightstep_api_key')
        await predeploy({ lightstepOrg, lightstepProj, lightstepToken, yamlFile })

        core.setOutput('lightstep_organization', lightstepOrg)
        core.setOutput('lightstep_project', lightstepProj)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
