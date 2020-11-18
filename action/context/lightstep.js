const lightstepSdk = require('lightstep-js-sdk')

const LIGHTSTEP_WEB_HOST = 'app.lightstep.com'

const getApiContext = async ({lightstepProj, lightstepOrg, lightstepToken, lightstepConditions = []}) => {
    const apiClient = await lightstepSdk.init(lightstepOrg, lightstepToken)
    // if no conditions are specified, use all conditions from project
    var conditionsResponse = []
    var lightstepConditionIds = []
    var conditionStreams = {}
    if (lightstepConditions.length === 0) {
        conditionsResponse = await apiClient.sdk.apis.Conditions.listConditionsID({
            organization : lightstepOrg,
            project      : lightstepProj
        })
        conditionsResponse = conditionsResponse.obj.data
        lightstepConditionIds = conditionsResponse.map(c => c.id)
    } else {
        const lightstepConditionPromises = lightstepConditions.map(id => {
            return apiClient.sdk.apis.Conditions.getConditionID(
                {'condition-id' : id, organization : lightstepOrg, project : lightstepProj})
        })
        const lightstepConditionsResp = await Promise.all(lightstepConditionPromises)
        conditionsResponse = lightstepConditionsResp.map(r => r.obj.data)
        lightstepConditionIds = conditionsResponse.map(c => c.id)
    }
    conditionStreams = conditionsResponse.reduce((obj, c) => {
        const parts = c.relationships.stream.links.related.split('/')
        obj[c.id] = parts[parts.length-1]
        return obj
    }, {})
    const conditionStatusPromises = lightstepConditionIds.map(
        id => apiClient.sdk.apis.Conditions.getConditionStatusID({
            'condition-id' : id,
            organization   : lightstepOrg,
            project        : lightstepProj
        })
    )
    const conditionStatusResponses = await Promise.all(conditionStatusPromises)
    const conditionStatuses = conditionStatusResponses.map(s => {
        const cleanId = s.body.data.id.replace('-status', '')
        const streamLink =
            `https://app.lightstep.com/demo/stream/${conditionStreams[cleanId]}?selected_condition_id=${cleanId}`
        return {
            id          : cleanId,
            stream      : conditionStreams[cleanId],
            streamLink  : streamLink,
            name        : s.body.data.attributes.expression,
            description : s.body.data.attributes.description,
            state       : s.body.data.attributes.state
        }
    })
    return conditionStatuses
}

const ICON_IMG = "https://user-images.githubusercontent.com/27153/90803298-6510e300-e2cd-11ea-91fa-5795a4481e20.png"

exports.getSummary = async ({lightstepProj, lightstepOrg, lightstepToken, lightstepConditions}) => {
    try {
        const context = await getApiContext({lightstepProj, lightstepOrg, lightstepToken, lightstepConditions})

        // todo: handle no conditions

        var status = "unknown"
        var message = "Condition status is unknown"
        const details = context.map(c => {
            return { message : `${c.name}: ${c.state}` }
        })
        const summaryLink = `https://${LIGHTSTEP_WEB_HOST}/${lightstepProj}/monitoring/conditions`
        const noViolations = context.filter(c => c.state === 'false')
        const violated = context.filter(c => c.state === 'true')

        if (noViolations.length === context.length) {
            status = "ok"
            message = "No conditions have violations"
        } else if (violated.length > 1) {
            status = "error"
            message = "Condition(s) have violations"
        }

        return {
            status,
            message,
            summaryLink,
            details,
            context,
            logo : ICON_IMG
        }
    } catch (e) {
        return {
            status      : "unknown",
            message     : `Lightstep API Error: ${e.message}`,
            summaryLink : "https://lightstep.com",
            details     : [],
            logo        : ICON_IMG
        }
    }

}
