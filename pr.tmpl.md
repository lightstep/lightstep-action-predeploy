<% hasError = (status === 'warn' || status === 'error' || status === 'unknown') %>
<% if (hasError) { %>### :warning: Deploy with caution :warning:

> There are errors or warnings in production.<% } %>
<% if (!hasError) { %>### :100: Pre-deploy Checks Passed :100: <% } %>
### System Health
| Status | External Link | Summary |
|--|--|--|<% if (isRollup) { %>
| <%=trafficLightStatus(lightstep.status)%> | <img src="<%=lightstep.logo%>" height="14px" alt="Lightstep Logo"/> [Monitoring Conditions](<%=lightstep.summaryLink%>) | _<%=lightstep.message%>_ |<% } else { %><% for (var i=0; i < lightstep.context.length; i++) { %>
| <%=conditionStatus(lightstep.context[i])%> | [<%= lightstep.context[i].name %>](<%=lightstep.context[i].streamLink%>) | value: `<%= lightstep.context[i].description %>` |<% } %><% } %><% if (rollbar) { %>| <%=trafficLightStatus(rollbar.status)%> | <img src="<%=rollbar.logo%>" height="14px" alt="Rollbar Logo"/> [New Items in Latest Version](<%=rollbar.summaryLink%>) | _<%=rollbar.message%>_ |<% } %>

<% if (pagerduty) { %>#### Incident Response
<img src="<%=pagerduty.logo%>" height="14px" alt="PagerDuty Logo"/> [<%=pagerduty.message%>](<%=pagerduty.summaryLink%>)<% } %>

<% if (hasError && isRollup) { %><details>
<summary>
Lightstep has detected some conditions in an unknown or error state in the project.
</summary>

<% lightstep.details.forEach(function(c) { %><%=c.message%>
<% }) %>
</details><% } %>