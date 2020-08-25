const fetch = require('node-fetch')

const ROLLBAR_API = 'https://api.rollbar.com'


const getApiContext = async ({token, environment}) => {
    const HEADERS = { "X-Rollbar-Access-Token" : token }
    const deployResponse = await fetch(`${ROLLBAR_API}/api/1/deploys`, { headers : HEADERS })
    const deploys = await deployResponse.json()

    if (deploys.err === 1) {
        throw new Error(deploys.message)
    }

    if (deploys.err === 0 && deploys.result.deploys.length === 0 ){
        return null
    }

    const lastDeploy = deploys.result.deploys[0]
    const versionsResponse =
        await fetch(`${ROLLBAR_API}/api/1/versions/${lastDeploy.revision}?environment=${environment}`,
            { headers : HEADERS })
    const versions = await versionsResponse.json()

    if (versions.err === 1) {
        throw new Error(versions.message)
    }
    return versions.result
}

exports.getSummary = async ({token, yamlConfig}) => {
    const { environment, account, project } = yamlConfig
    const context = await getApiContext({token, environment})
    // todo: handle error case

    if (context === null) {
        return {
            "status"  : "unknown",
            "message" : "Rollbar data unavailable"
        }
    }
    var status = "unknown"
    var message = "Rollbar data unavailable"
    const logo = "https://user-images.githubusercontent.com/27153/90803304-65a97980-e2cd-11ea-8267-a711fdcc6bc9.png"
    const details = [
        {
            message : `Version ${context.version} has ${context.item_stats.new.critical} critical errors.`
        }
    ]

    const errors = context.item_stats.new.error
    if (errors > 0) {
        status = "warn"
        message = "New errors have been detected since last deploy"
    }

    const critical = context.item_stats.new.critical
    if (critical > 0) {
        status = "error"
        message = "New critical errors have been detected since last deploy"
    }

    if (errors + critical === 0) {
        status = "ok"
        message = "No new errors detected since last deploy"
    }

    // eslint-disable-next-line max-len
    const summaryLink = `https://rollbar.com/${account}/${project}/versions/${environment}/${context.version}`

    return {
        status,
        message,
        summaryLink,
        details,
        context,
        logo
    }
}
