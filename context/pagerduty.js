const fetch = require('node-fetch')

const PD_API = 'https://api.pagerduty.com'

const getApiContext = async ({token, service}) => {
    const HEADERS = {
        "Authorization" : `Token token=${token}`,
        "Accept"        : "application/json"
    }
    const serviceResponse = await fetch(`${PD_API}/services/${service}`, { headers : HEADERS })
    if (serviceResponse.status !== 200) {
        throw new Error(`PagerDuty API error fetching service '${service}' ${serviceResponse.status}`)
    }

    const serviceJson = await serviceResponse.json()
    const escalationPolicyId = serviceJson.service.escalation_policy.id

    const onCallResponse = await fetch(`${PD_API}/oncalls?include[]=&escalation_policy_ids[]=${escalationPolicyId}`,
        { headers : HEADERS })
    if (onCallResponse.status !== 200) {
        throw new Error(`PagerDuty API error fetching oncalls ${serviceResponse.status}`)
    }

    const oncallsJson = await onCallResponse.json()

    return {
        service : serviceJson.service,
        oncalls : oncallsJson.oncalls
    }
}

exports.getSummary = async ({token, yamlConfig}) => {
    const { service } = yamlConfig
    const context = await getApiContext({token, service})
    // todo: handle error case

    var status = "unknown"
    var onCallNames = context.oncalls.map(o => o.user.summary)
    var summaryLink = context.service.html_url
    var message = `On-call for *${context.service.name}*: ${onCallNames}`
    const logo = "https://user-images.githubusercontent.com/27153/90803915-4fe88400-e2ce-11ea-803f-47b9c244799d.png"
    return {
        status,
        message,
        summaryLink,
        logo
    }
}
