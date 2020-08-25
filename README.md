# lightstep-action-predeploy

The `lightstep/lightstep-action-predeploy` action provides insight into the health of production service(s) during software delivery. 

This Javascript-based action can be used when a pull request is approved by GitHub reviewers and uses APIs to provide a summary of deployment risk ahead of a code change going to a production environment.

## Requirements

### GitHub
  * Repository that corresponds to a service running in a production environment
    * Github action workflow for the repository that uses the Lightstep GitHub action
    * API token(s) defined as secrets in the repository configuration settings
    * `.lightstep.yml` configuration file in root directory of repository

### Lightstep
  * Instrumented service(s) running in a production environment
    * Deployment tracking configured for the service
    * Streams created for instrumented service
    * Alerts threshold(s) defined for streams
    * Lightstep [public API key](https://docs.lightstep.com/docs/create-and-manage-api-keys)

## Usage

This action can be run on `ubuntu-latest` GitHub Actions runner.

```
    steps:  
      - name: Checkout
        uses: actions/checkout@v2

      - name: Lightstep Pre-Deploy Check
        uses: lightstep/lightstep-action-predeploy
```

## Examples

TBD

## Inputs

Inputs can be specified using any combination of a `.lightstep.yml` file in the root of the repository using the action, as inputs to the action, as environment varables.

API keys are always passed as inputs or environment variables.

The following are **required**:

| Action Input             | `.lightstep.yml`| Env var                   |
| ------------------------ | --------------- | ------------------------- |
| `lightstep_organization` | `organization`  | `LIGHTSTEP_ORGANIZATION`  |
| `lightstep_project`      | `project`       | `LIGHTSTEP_PROJECT`       |
| `lightstep_api_key`      | N/A             | `LIGHTSTEP_API_KEY`       |

Additional inputs (_optional_):

| Action Input         | `.lightstep.yml`  | Env var                |
| -------------------- | ----------------- | ---------------------- | 
| `pagerduty_api_token`| N/A               | `PAGERDUTY_API_TOKEN`  |
| `rollbar_api_token`  | N/A               | `ROLLBAR_API_TOKEN`    |

## Outputs

* `lightstep_organization` - Lightstep organization associated with an account

* `lightstep_project` - Lightstep project associated with an organization

* `lightstep_predeploy_md` - Markdown-formatted summary of pre-deploy checks

* `lightstep_predeploy_status` - Status of pre-deploy checks: `ok`, `warn`, `error` or `unknown`

## License

Apache License 2.0