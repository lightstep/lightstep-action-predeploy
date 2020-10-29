const core = require('@actions/core')
const assert = require('assert')

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

module.exports = { assertActionInput, resolveActionInput }