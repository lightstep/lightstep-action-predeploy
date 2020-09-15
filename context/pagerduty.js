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

const ICON_IMG = "https://user-images.githubusercontent.com/27153/90803915-4fe88400-e2ce-11ea-803f-47b9c244799d.png"

exports.getSummary = async ({token, yamlConfig}) => {
    const { service } = yamlConfig

    try {
        const context = await getApiContext({token, service})
        var onCallNames = context.oncalls.map(o => o.user.summary)
        var summaryLink = context.service.html_url
        var message = `On-call for *${context.service.name}*: ${onCallNames}`
        return {
            status : "unknown",
            message,
            summaryLink,
            logo   : ICON_IMG
        }
    } catch (e) {
        return {
            status      : "unknown",
            message     : `PagerDuty API Error: ${e.message}`,
            summaryLink : "http://www.pagerduty.com",
            logo        : ICON_IMG
        }
    }

}
