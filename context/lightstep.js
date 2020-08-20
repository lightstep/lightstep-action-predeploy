const lightstepSdk = require('lightstep-js-sdk')

const getApiContext = async ({lightstepProj, lightstepOrg, lightstepToken}) => {
    const apiClient = await lightstepSdk.init(lightstepOrg, lightstepToken)

    const conditionsResponse = await apiClient.sdk.apis.Conditions.listConditionsID({
        organization : lightstepOrg,
        project      : lightstepProj
    })
    const conditionIds = conditionsResponse.body.data.map(c => c.id)
    const conditionStatusPromises = conditionIds.map(id => apiClient.sdk.apis.Conditions.getConditionStatusID({
        'condition-id' : id,
        organization   : lightstepOrg,
        project        : lightstepProj
    })
    )
    const conditionStatusResponses = await Promise.all(conditionStatusPromises)
    const conditionStatuses = conditionStatusResponses.map(s => {
        const cleanId = s.body.data.id.replace('-status', '')
        return {
            id    : cleanId,
            name  : conditionsResponse.body.data.find(s => s.id === cleanId).attributes.name,
            state : s.body.data.attributes.state
        }
    })
    return conditionStatuses
}

exports.getSummary = async ({lightstepProj, lightstepOrg, lightstepToken}) => {
    const context = await getApiContext({lightstepProj, lightstepOrg, lightstepToken})

    var status = "unknown"
    var message = "Condition status is unknown"
    const logo = "https://user-images.githubusercontent.com/27153/90803298-6510e300-e2cd-11ea-91fa-5795a4481e20.png"
    const details = context.map(c => {
        return { message : `${c.name}: ${c.state}` }
    })
    const summaryLink = `https://app.lightstep.com/${lightstepProj}/service-directory`
    const noViolations = context.filter(c => c.state === 'not-violated')
    const violated = context.filter(c => c.state === 'violated')

    if (noViolations.count === context.length) {
        status = "ok"
        message = "No conditions have violations"
    }


    if (violated.count > 1) {
        status = "error"
        message = "Condition(s) have violations"
    }

    return {
        status,
        message,
        summaryLink,
        details,
        context,
        logo
    }
}
