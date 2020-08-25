<% hasError = (status === 'warn' || status === 'error' || status === 'unknown') %>
<% if (hasError) { %>} ### :warning: Deploy with caution :warning:

> There are errors or warnings in production.<% } %>
<% if (!hasError) { %>### :100: Pre-deploy Checks Passed :100: <% } %>
### System Health
| Status | External Link | Summary |
|--|--|--|
| <%=trafficLightStatus(lightstep.status)%> | <img src="<%=lightstep.logo%>" height="14px" alt="Lightstep Logo"/> [Monitoring Conditions](<%=lightstep.summaryLink%>) | _<%=lightstep.message%>_ |
<% if (rollbar) { %>| <%=trafficLightStatus(rollbar.status)%> | <img src="<%=rollbar.logo%>" height="14px" alt="Rollbar Logo"/> [New Items in Latest Version](<%=rollbar.summaryLink%>) | _<%=rollbar.message%>_ |<% } %>

#### Details
<% if (hasError) { %><details>
<summary>
Lightstep has detected some conditions in an unknown or error state in the project.
</summary>

<% lightstep.details.forEach(function(c) { %><%=c.message%>
<% }) %>
</details><% } %>

<% if (pagerduty) { %>#### Incident Response
<img src="<%=pagerduty.logo%>" height="14px" alt="PagerDuty Logo"/> [<%=pagerduty.message%>](<%=pagerduty.summaryLink%>)<% } %>