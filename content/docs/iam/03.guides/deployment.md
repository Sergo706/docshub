---
title: Deployment
description: Different way to deploy the auth service.
icon: i-lucide-terminal
---

The best way to deploy the service is using the public docker image.
It handles everything, setting up the `mmdbctl` and `age` binary, to starting the service and deleting the raw unencrypted config.

In your compose file, you will need to provide a couple of things before starting the service, however you can automate this with scripts, see the [operation scripts guide](/docs/iam/guides/operation-scripts).

Make sure your environments haves the following installed first:

| Tool | Purpose |
|------|---------|
| [age](https://github.com/FiloSottile/age) | Encrypts the configuration file with age encryption |
| [age-keygen](https://github.com/FiloSottile/age) | Generates the age keypair |
| [Docker](https://www.docker.com/) + [Compose](https://docs.docker.com/compose/) | Builds and runs the service container |

Make a [configuration](/docs/iam/configuration) file:

```json [config.json]
{
    "store": {
        "main": {
            "host": "mysql",
            "port": 3306,
            "user": "alice",
            "password": "very_secure_password",
            "database": "my_auth"
        },
        "rate_limiters_pool": {
            "store": {
                "host": "mysql",
                "port": 3306,
                "user": "alice",
                "database": "my_auth",
                "password": "very_secure_password"
            },
            "dbName": "my_auth"
        }
    },
    "service": {
    "Hmac": {
        "sharedSecret": "1234567890",
        "clientId": "1234",
        "maxClockSkew": 300000
        },
        "proxy": {
            "trust": true,
            "ipToTrust": "172.20.5.4",
            "server": "172.20.5.4"
        },
        "port": 10000,
        "ipAddress": "0.0.0.0",
        "clientIp": "172.20.5.4"
    },
    "password": {
        "pepper": "pepper-secret",
        "hashLength": 50,
        "timeCost": 4,
        "memoryCost": 262144
    },
    "botDetector": {
        "enableBotDetector": false
    },
    "htmlSanitizer": {
        "IrritationCount": 50,
        "maxAllowedInputLength": 20000
    },
    "magic_links": {
        "jwt_secret_key": "long_secret",
        "expiresIn": "20m",
        "domain": "http://your-domain:10000",
        "notificationEmail": {
            "websiteName": "My Cool Website",
            "privacyPolicyLink": "https://your-domain/privacy",
            "contactPageLink": "https://your-domain/contact",
            "changePasswordPageLink": "https://your-domain/accounts",
            "loginPageLink": "https://your-domain/accounts"
        }
    },
    "providers": [
            {
                "name": "google",
                "fields": {
                    "iss": "safeString?",
                    "azp": "safeString?",
                    "sub": "string",
                    "email": "safeString",
                    "email_verified": "boolean",
                    "name": "safeString",
                    "given_name": "safeString",
                    "picture": "safeString",
                    "family_name": "safeString?",
                    "locale": "safeString?"
                }
            },
            {
                "name": "github",
                "useStandardProfile": true
            },
            {
                "name": "x",
                "useStandardProfile": true
            },
            {
                "name": "linkedin",
                "useStandardProfile": true
            }
    ],
    
    "jwt": {
        "jwt_secret_key": "super_long_secret",
        "access_tokens": {
            "expiresIn": "15m",
            "expiresInMs": 900000,
            "algorithm": "HS512"
        },
        "refresh_tokens": {
            "refresh_ttl": 259200000,
            "domain": "localhost",
            "MAX_SESSION_LIFE": 2592000000,
            "maxAllowedSessionsPerUser": 5,
            "byPassAnomaliesFor": 10800000
        }
    },
    "email": {
        "resend_key": "12345",
        "email": "noreply@example.com"
    },
    "logLevel": "info"
}
```
Generate a key-pair for encrypting your config:

```bash [Terminal]
age-keygen -o age_key && age-keygen -y age_key > public_key
```
This will generate 2 files:
- `age_key` This is your private key, loosing it will prevent you from decrypting your config file, access to it from unauthorized actors will gain access to your configuration file.

::warning
Make sure you store it in a appropriate secret manager
::

- `public_key` this is the public key, you can delete it in any time and generate a new one, it does not contain sensitive information.

Encrypt your configuration file: 

```bash [Terminal]
age -a -e -r "$(cat public_key)" -o config.json.age config.json
```
This will output the encrypted config file `config.json.age`. The docker image uses this file, and does the following:
- Pick it up from the docker secrets
- Decrypts it via the entrypoint script
- Starts the service
- The service loads the configuration file parses it and starts.
- The service is then deletes the raw file from the container.

::caution
The `age_key` file and `config.json.age` are kept. They needed for restarts.
Without the `age_key` file, the service could not restart.
::

Write your compose file:

```yaml [docker-compose.yml]
services:
  mysql: 
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: very_secure_password
      MYSQL_DATABASE: my_auth
      MYSQL_USER: alice
      MYSQL_PASSWORD: very_secure_password
    cap_drop: ["ALL"]
    user: "999:999"
    security_opt: 
      - "no-new-privileges:true"
    volumes:
      - sql_db:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "bash -lc 'exec 3<>/dev/tcp/127.0.0.1/3306'"]
      interval: 10s
      timeout: 8s 
      retries: 5
      start_period: 7m
    networks:
      backend:
        ipv4_address: 172.20.5.3   

  auth:
    image: sergio68/auth
    read_only: true  
    restart: unless-stopped
    cap_drop: ["ALL"]
    user: 10001:10001
    volumes: 
      - ./auth-logs/server:/app/auth-logs:rw
      - ./auth-logs/server/bot-detector:/app/bot-detector-logs:rw
      - bot-detector-data:/app/node_modules/@riavzon/bot-detector/dist/_data-sources:rw
      - email-data:/app/dist/email-db:rw
    tmpfs:
      - /run/app:rw,noexec,nosuid,nodev,uid=10001,gid=10001,size=1m
    pids_limit: 200
    secrets:
      - age_key
      - encrypted_config
    security_opt:
      - "no-new-privileges:true"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      backend:
        ipv4_address: 172.20.5.2 
      egress: 
        ipv4_address: 172.22.20.2

  app:
    # Your app container
    build: .
    depends_on:
      auth:
        condition: service_healthy
    networks:
      frontend: 
        ipv4_address: 172.21.10.4 # Can be omitted
      backend:
        ipv4_address: 172.20.5.4

volumes:
  sql_db:  
  bot-detector-data:
  email-data:

secrets:
  age_key:
    file: ./secrets/auth/age_key
  encrypted_config:
    file: ./secrets/auth/config.json.age
    
networks: 
  backend: 
    internal: true
    enable_ipv6: false
    ipam:
      config:
        - subnet: 172.20.0.0/16
          ip_range: 172.20.5.0/24
          gateway: 172.20.5.1
  frontend:
    enable_ipv6: false
    ipam:
      config:
        - subnet: 172.21.10.0/24
          gateway: 172.21.10.1
  egress:
    internal: false
    enable_ipv6: false
    ipam:
      config:
        - subnet: 172.22.20.0/24
          gateway: 172.22.20.1
```

The volume that required are: 
- `path/to/local/folder/logs:/app/auth-logs:rw` Logs for the auth service.
- `path/to/local/folder/logs:/app/bot-detector-logs:rw` Logs for the bot-detector service.
- `named-volume:/app/node_modules/@riavzon/bot-detector/dist/_data-sources:rw` - For the data sources that the bot detector uses, it used to keep the data fresh.
- `named-volume:/app/dist/email-db:rw` - For the disposable email lmdb the auth service uses, also to keep it fresh.
- [`tmpfs`](https://docs.docker.com/engine/storage/tmpfs/) - Do not change it. it used to decrypt the config put it in there, and load it. after it does so it deletes it.

Optional are `./config.json:/run/app/config.json`.

you can skip encryption, and docker secrets, if you don't want it, and provide your configuration as a [bind mount](https://docs.docker.com/engine/storage/bind-mounts/).

Couple of key things to understand is the `service.proxy.server`, `service.proxy.ipToTrust` and `service.clientIp` configuration options and how the docker compose network is configured to use so.

## Network & Proxy Trust

The compose file defines three isolated networks:

| Network | Subnet | Purpose |
|---------|--------|---------|
| `backend` | `172.20.0.0/16` | Internal only. Connects `auth`, `mysql`, and your `app`. No external access. |
| `frontend` | `172.21.10.0/24` | Connects your `app` to the reverse proxy (Caddy, Nginx, etc.) and the outside world. |
| `egress` | `172.22.20.0/24` | Not internal. Allows `auth` to reach external services |

The `backend` network is marked `internal: true`, which means containers on it cannot reach the internet. The auth service and the database live here, completely isolated from direct outside access. Your app container bridges `backend` and `frontend`. It is the only service that can talk to both networks. See [Docker Networking docs](https://docs.docker.com/engine/network/)

The `egress` network is **not** marked as internal, so it allows outbound internet access. Only the auth service is connected to it. The auth service needs outbound access for:

- Emails via Resend
- Fetching fresh bot-detector data sources


The auth service runs behind your app, which acts as a reverse proxy / intermediary. When `service.proxy.trust` is `true`, the auth service configures Express's [trust proxy](https://expressjs.com/en/guide/behind-proxies.html) setting with a callback that only trusts specific IPs:

```ts
if (config.service?.proxy.trust) {
    app.set("trust proxy", (ip: string) => {
        if (ip === config.service?.proxy.server || ip === config.service?.proxy.ipToTrust) return true;
        return false;
    });
}
```

This means the auth service only accepts forwarded headers (`X-Forwarded-For`, `X-Forwarded-Proto`, etc.) from the IPs you explicitly whitelist. Any other source is untrusted.

This is useful when using the BFF pattern described in [Backend for Frontend](/docs/iam/essentials/bff).

::tip
If you use a [nitro](https://nitro.build/)/[h3](https://h3.dev/) based frameworks such as [Nuxt](https://nuxt.com/) you should consider using the [Auth-H3Client](/docs/auth-h3client) wrapper.
It does all the heavy lifting for you, haves a full OAuth client implemention, logging, and provide you with a set of higher order functions to use in your application, for easily protecting an endpoint.

Here is a small example:

```ts [example.ts]
import { defineAuthenticatedEventHandler } from 'auth-h3client';

export default defineAuthenticatedEventHandler((event) => {
  const user = event.context.authorizedData;
  
  // Do authenticated stuff
  return {
    message: `Hello ${user.userId}!`,
    roles: user.roles
  };
});

```
::
### Configuration Options

| Option | Value in example | Purpose |
|--------|-----------------|---------|
| `service.proxy.trust` | `true` | Enables proxy trust mode. Required when running behind another container. |
| `service.proxy.ipToTrust` | `172.20.5.4` | The IP address trusted to forward headers. This is your **app container's** backend IP. |
| `service.proxy.server` | `172.20.5.4` | Fallback trusted IP (typically the same as `ipToTrust`). If omitted, defaults to the `ipAddress` bind address. |
| `service.clientIp` | `172.20.5.4` | The IP allowed to call privileged internal endpoints (e.g. custom MFA flows, operational config). Falls back to `ipToTrust` if not set. |


In the compose file, your app container is assigned `172.20.5.4` on the backend network:

```yaml
app:
    networks:
      backend:
        ipv4_address: 172.20.5.4
```

The auth service config sets `ipToTrust: "172.20.5.4"` and `clientIp: "172.20.5.4"`, matching that exact IP. This is how the auth service knows:

1. To only accept forwarded headers from `172.20.5.4`.
2. To only allow privileged internal requests from `172.20.5.4`. Any request from a different IP is rejected with `403 Forbidden`.

::warning
If you change the app container's backend IP in the compose file, you **must** update `service.proxy.ipToTrust`, `service.proxy.server`, and `service.clientIp` in your auth configuration to match. A mismatch means the auth service rejects all forwarded requests and blocks internal API calls.
::

### Using the service

Your app can uses the [auth-h3client](/docs/iam/essentials/h3-client) library for H3/Nitro based frameworks, or any other http backend:

```bash [Terminal]
curl http://auth:10000/health
```

If you get back `OK`, the auth service is running and reachable from your app container, explore the docs to get an understanding of the service.


## Deploying locally

If you prefer to run the auth service directly on a host machine without Docker, you will need to handle dependency installation, data source compilation, and data refresh yourself. The Docker image automates all of this, so consider it first if simplicity is a priority.

Before you start, make sure your environment has the following:

| Dependency | Purpose |
|------------|---------|
| [Node.js 20+](https://nodejs.org/) | Runtime for the auth service |
| [MySQL 8+](https://dev.mysql.com/downloads/) | Database backend for users, sessions, rate limiters, and bot detection tables |
| [`mmdbctl`](https://github.com/ipinfo/mmdbctl) | Compiles MMDB databases for geolocation and threat intelligence lookups |

The `mmdbctl` binary is installed automatically during the `bot-detector init` step if it is not already present on the system.

::steps{level="4"}

#### Install the package

Install `@riavzon/auth` along with its required peer dependencies:

::code-group

```bash [pnpm]
pnpm add @riavzon/auth express cookie-parser mysql2
```

```bash [yarn]
yarn add @riavzon/auth express cookie-parser mysql2
```

```bash [npm]
npm install @riavzon/auth express cookie-parser mysql2
```

```bash [bun]
bun add @riavzon/auth express cookie-parser mysql2
```

::

#### Compile the Bot Detector data sources

The auth service depends on [Bot Detector](/docs/bot-detection) for IP analysis, threat scoring, and bot classification. Before starting the service for the first time, download and compile all required data sources:

::code-group

```bash [pnpm]
pnpm bot-detector init --contact="YourApp - you@example.com"
```

```bash [yarn]
yarn bot-detector init --contact="YourApp - you@example.com"
```

```bash [npm]
npx bot-detector init --contact="YourApp - you@example.com"
```

```bash [bun]
bunx bot-detector init --contact="YourApp - you@example.com"
```

::

The `--contact` flag sets the User-Agent string used when downloading BGP and ASN data from [BGP.tools](https://bgp.tools). This is a requirement from their API. The command compiles MMDB and LMDB databases. See the [Bot Detector CLI reference](/docs/bot-detection/cli) for the full list of subcommands and options.

#### Create a configuration file

Write a `config.json` with your database credentials, secrets, and service settings. The full schema is documented in the [Configuration reference](/docs/iam/configuration). A minimal working example:

```json [config.json]
{
    "store": {
        "main": {
            "host": "localhost",
            "port": 3306,
            "user": "auth_user",
            "password": "secure_password",
            "database": "auth_db"
        },
        "rate_limiters_pool": {
            "store": {
                "host": "localhost",
                "port": 3306,
                "user": "auth_user",
                "password": "secure_password",
                "database": "auth_db"
            },
            "dbName": "auth_db"
        }
    },
    "service": {
        "port": 10000,
        "ipAddress": "0.0.0.0"
    },
    "password": {
        "pepper": "your-pepper-secret"
    },
    "botDetector": {
        "enableBotDetector": true
    },
    "magic_links": {
        "jwt_secret_key": "long-random-secret",
        "domain": "https://your-domain.com",
        "notificationEmail": {
            "websiteName": "Your App",
            "privacyPolicyLink": "https://your-domain.com/privacy",
            "contactPageLink": "https://your-domain.com/contact",
            "changePasswordPageLink": "https://your-domain.com/settings",
            "loginPageLink": "https://your-domain.com/login"
        }
    },
    "jwt": {
        "jwt_secret_key": "another-long-random-secret",
        "access_tokens": {},
        "refresh_tokens": {
            "refresh_ttl": 604800000,
            "domain": "your-domain.com",
            "MAX_SESSION_LIFE": 2592000000,
            "maxAllowedSessionsPerUser": 5,
            "byPassAnomaliesFor": 300000
        }
    },
    "email": {
        "resend_key": "your-resend-api-key",
        "email": "noreply@your-domain.com"
    }
}
```

When running locally without a reverse proxy, you can omit the `service.proxy` and `service.clientIp` fields entirely. Those are only needed when the auth service sits behind another container or proxy that forwards requests on its behalf. If you do place a reverse proxy in front of the service, configure `service.proxy.trust`, `service.proxy.ipToTrust`, and `service.clientIp` to match the proxy's IP address as described in the [Network & Proxy Trust](#network--proxy-trust) section above.

#### Initialize the database

The `auth` CLI creates all required MySQL tables and compiles the [disposable email domain blocklist](/docs/shield-base/data-sources/email) into an LMDB database. Run it once before starting the service for the first time:

```bash [Terminal]
npx @riavzon/auth ./config.json
```

The CLI accepts the config path as a positional argument, or reads it from the `CONFIG_PATH` environment variable. If neither is provided, it defaults to `./config.json`.

This command runs three tasks:

1. Creates all auth MySQL tables for users, sessions, rate limiters, and related data.
2. Creates the Bot Detector tables used for IP analysis and threat scoring.
3. Downloads and compiles the disposable email domain blocklist into `dist/email-db/disposable-emails.mdb`.

You can also call it programmatically if you prefer to run initialization from your own startup script:

```ts [init.ts]
import { initAuthData } from '@riavzon/auth'
import config from './config.ts'

await initAuthData(config)
```

#### Start the service

The package exports `startServer` from `@riavzon/auth/service`. This function reads your configuration file, calls `bootstrapApp` internally to wire up the full middleware chain, starts listening, and schedules all data refresh tasks in the background. Set `CONFIG_PATH` to point at your config file and `SKIP_CONFIG_UNLINK` to `true` so the service does not delete it after loading:

```bash [Terminal]
SKIP_CONFIG_UNLINK=true CONFIG_PATH=./config.json node ./node_modules/@riavzon/auth/dist/service.mjs
```

The service binds to the `service.port` and `service.ipAddress` values from your configuration, defaulting to `0.0.0.0:10000`. Once running, it schedules three background refresh tasks on a loop:
- bot-detector data source refresh every 24 hours
- detection database regeneration every 3 days
- disposable email list recompilation every 7 days.

You do not need to set up cron jobs for these when using `startServer`.

If you prefer to embed the auth service into your own Express application instead of running the standalone process, see the [Library quick start](/docs/iam/getting-started#quick-start-library-mode) in the Getting Started guide. The library path gives you full control over the middleware chain and route mounting.

::

### Keeping data sources fresh

Both the Docker image and the standalone `startServer` process schedule background refresh tasks automatically after startup. If you use either of those, the data stays current without any extra configuration.

If you integrate `@riavzon/auth` as a library and manage your own Express server, you are responsible for keeping the data fresh. The simplest way is to call `refreshData` after your server starts listening. It schedules all three tasks on a recurring loop with the intervals you provide:

```ts [server.ts]
import { refreshData } from '@riavzon/auth'

app.listen(10000, () => {
  refreshData(
    1000 * 60 * 60 * 24,       // bot-detector refresh: every 24 hours
    1000 * 60 * 60 * 24 * 3,   // bot-detector generate: every 3 days
    1000 * 60 * 60 * 24 * 7,   // shield-base email list: every 7 days
  )
})
```

See the [`refreshData` API reference](/docs/iam/api/api#refreshdatadatasourceinterval-generatorinterval-disposableemaillist) for parameter details.

Alternatively, you can run the same tasks as cron jobs or scheduled tasks on the host:

```bash [crontab]
# Daily at 3:00 AM - refresh bot-detector data sources
0 3 * * * cd /path/to/your/app && npx bot-detector refresh

# Every 3 days at 4:00 AM - regenerate compiled databases
0 4 */3 * * cd /path/to/your/app && npx bot-detector generate

# Weekly on Sunday at 5:00 AM - refresh disposable email list
0 5 * * 0 cd /path/to/your/app && npx @riavzon/shield-base --email --path=dist
```

```ts [server.ts]
import { scheduleTask } from '@riavzon/auth'
scheduleTask('my-cleanup', './node_modules/.bin/my-tool', ['--clean'], 1000 * 60 * 60 * 12)
```
::tip
See the [`scheduleTask` API reference](/docs/iam/api/api#scheduletaskname-cmd-args-interval) for details.
::

Without either approach, the geolocation databases, threat lists, and email blocklist will become stale over time. The `bot-detector refresh` task is the most important one since threat intelligence feeds change frequently. See the [Bot Detector CLI reference](/docs/bot-detection/cli) for details on each subcommand and the [Shield Base CLI reference](/docs/shield-base/cli) for the email compilation flags.




