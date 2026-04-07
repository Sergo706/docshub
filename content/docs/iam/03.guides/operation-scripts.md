---
title: Operation Scripts
description: Template shell scripts for encrypting configuration, launching the IAM service container, and cleaning up sensitive files after deployment.
icon: i-lucide-terminal
---

The IAM service Docker image does not include startup or encryption scripts. These are template scripts you copy into your project and adapt to your deployment workflow. They handle [age](https://github.com/FiloSottile/age) key generation, configuration encryption, container orchestration, and post-launch cleanup.

::note
These scripts are not part of the `@riavzon/auth` npm package. Copy them into your project and adjust paths to match your directory structure.
::

---

## Standalone deployment

Use `start.sh` when the IAM service is the only container you need to deploy. The script handles everything in a single command: dependency verification, key generation, config encryption, container launch, and post-launch cleanup.

### Prerequisites

| Tool | Purpose |
|------|---------|
| [age](https://github.com/FiloSottile/age) | Encrypts the configuration file with age encryption |
| [age-keygen](https://github.com/FiloSottile/age) | Generates the age keypair |
| [Docker](https://www.docker.com/) + [Compose](https://docs.docker.com/compose/) | Builds and runs the service container |

### Usage

```bash [Terminal]
# Auto-detects config.dev.json or config.json
./start.sh

# Specify a config file explicitly
./start.sh /path/to/my-config.json
```

### How it works

The script starts by checking that `age`, `age-keygen`, and `docker` are available on the host. If any dependency is missing, it exits immediately with an error message.

Next it resolves the configuration file. You can pass a file path as an argument, otherwise the script looks for `config.dev.json` first, then falls back to `config.json`. If no configuration file is found at all, it exits.

The script generates a fresh [age](https://github.com/FiloSottile/age) keypair on every run. It removes any existing `age_key` and `public_key` files, generates new ones with `age-keygen`, and uses the public key to encrypt the resolved configuration into `config.json.age`. This encrypted file is the only form of configuration that enters the container.

After encryption, it temporarily widens the `age_key` permissions to `750` so Docker can read it during container startup, creates the log directories, and launches the container with `docker compose up --build -d --force-recreate auth`.

::tip
Remove `auth` from `docker compose up --build -d --force-recreate auth` to start the whole compose file
::

Once the container is running, the script tightens `age_key` back to `600`, deletes the `public_key`, and if the original config file was `config.json`, deletes it from the host. Development config files are kept for convenience.

::caution
The script deletes `config.json` after a successful launch. the only way to restore it, is by decrypting `config.json.age` with your new `age_key`.
::

### Script

```bash [start.sh]
#!/bin/sh

set -eu

die() { echo "Error: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"; }

need age
need age-keygen
need docker

CONFIG_FILE=${1:-}

if [ -n "$CONFIG_FILE" ]; then
    if [ ! -f "$CONFIG_FILE" ]; then
        die "Config file not found: $CONFIG_FILE"
    fi
    echo "Using provided config: $CONFIG_FILE"
elif [ -f "config.dev.json" ]; then
    CONFIG_FILE="config.dev.json"
    echo "Using dev config: $CONFIG_FILE"
elif [ -f "config.json" ]; then
    CONFIG_FILE="config.json"
    echo "Using default config.json"
else
    die "Missing config.json (or config.dev.json) in project root."
fi

echo "generating secrets..."
rm -f age_key public_key
age-keygen -o age_key || die "age-keygen failed"
age-keygen -y age_key > public_key || die "failed to derive public key"

echo "encrypting config..."
age -a -e -r "$(cat public_key)" -o config.json.age "$CONFIG_FILE" || die "encryption failed"

echo "changing permissions..."
chmod 750 age_key || die "chmod age_key failed"

echo "starting docker service..."
mkdir -p app-logs detector-logs || die "mkdir logs failed"
chmod 777 age_key ./app-logs ./detector-logs || die "chmod logs failed"

docker compose up --build -d --force-recreate auth || die "docker compose failed"

chmod 600 age_key || true
rm -f public_key

if [ "$CONFIG_FILE" = "config.json" ]; then
  rm -f config.json
  echo "Deleted sensitive config.json"
else
  echo "Keeping config file: $CONFIG_FILE"
fi
```

### Docker Compose

The script expects a `docker-compose.yml` in the same directory. Here is a minimal example with MySQL and the IAM service using age-encrypted secrets:

```yaml [docker-compose.yml]
services:
  mysql: 
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: secure_password
      MYSQL_DATABASE: auth_db
      MYSQL_USER: auth_user
      MYSQL_PASSWORD: secure_password
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

  auth:
    image: riavzon/auth:latest
    read_only: true  
    restart: unless-stopped
    cap_drop: ["ALL"]
    user: 10001:10001
    volumes: 
      - ./app-logs:/app/auth-logs:rw
      - ./detector-logs:/app/bot-detector-logs:rw
      - bot-detector-data:/app/node_modules/@riavzon/bot-detector/dist/_data-sources:rw
      - email-data:/app/dist/email-db:rw
    tmpfs:
      - /run/app:rw,noexec,nosuid,nodev,uid=10001,gid=10001,size=1m
    pids_limit: 200
    ports:
      - "10000:10000"
    secrets:
      - age_key
      - encrypted_config
    security_opt:
      - "no-new-privileges:true"
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  sql_db:  
  bot-detector-data:
  email-data:

secrets:
  age_key:
    file: ./age_key
  encrypted_config:
    file: ./config.json.age
```

The `age_key` and `config.json.age` files are created by `start.sh` before it runs `docker compose up`. See the [Getting Started](/docs/iam/getting-started) guide for a full walkthrough of each volume and secret.

---

## Multi-service deployment

When the IAM service runs alongside your application in a shared [Docker Compose](https://docs.docker.com/compose/) stack, you do not use `start.sh` directly. Instead, you source two shell functions into your own startup script: `encrypt_auth_config` for the encryption step, and `cleanup_auth_secrets` for post-launch cleanup.

Save the script below as `scripts/encrypt-auth.sh` in your project. Your main startup script sources it with `. ./scripts/encrypt-auth.sh` and calls the functions at the right points in your flow.

### How it differs from `start.sh`

| Behavior | `start.sh` | `encrypt_auth_config` |
|----------|------------|----------------------|
| Key generation | Fresh keypair on every run | Reuses existing key if present |
| Missing config | Exits with error | Falls back to existing `config.json.age` |
| Container launch | Runs `docker compose up` | Does not launch anything |
| Cleanup | Built into the same script | Separate `cleanup_auth_secrets` function |

The key reuse behavior makes `encrypt_auth_config` safe to call on every deploy without rotating the keypair. If a config file is present, it encrypts it. If only a previously encrypted `config.json.age` exists, it skips encryption and uses what is already there. This is useful in CI pipelines where the age key and encrypted config may be pre-provisioned.

### `cleanup_auth_secrets`

After your containers are running, call `cleanup_auth_secrets`. It tightens the age key to `600` (owner read/write), sets the encrypted config to `640`, and deletes any production `config.json` from the secrets directory. Development configs (`config.dev.json`) are kept.

### Script

```bash [scripts/encrypt-auth.sh]
set -eu

encrypt_auth_config() {
  AUTH_SECRETS_DIR="./secrets/auth"
  AUTH_KEY="${AUTH_SECRETS_DIR}/age_key"

  if [ ! -f "$AUTH_KEY" ]; then
    echo "Generating new auth age key pair..."
    age-keygen -o "$AUTH_KEY" || die "auth age-keygen failed"
  else
    echo "Using existing auth age key."
  fi

  AUTH_CONFIG=""
  if [ -f "${AUTH_SECRETS_DIR}/config.dev.json" ]; then
    AUTH_CONFIG="${AUTH_SECRETS_DIR}/config.dev.json"
    echo "Using auth dev config: $AUTH_CONFIG"
  elif [ -f "${AUTH_SECRETS_DIR}/config.json" ]; then
    AUTH_CONFIG="${AUTH_SECRETS_DIR}/config.json"
    echo "Using auth config: $AUTH_CONFIG"
  fi

  AUTH_CONFIG_AGE="${AUTH_SECRETS_DIR}/config.json.age"

  if [ -n "$AUTH_CONFIG" ]; then
    AUTH_PUB="$(age-keygen -y "$AUTH_KEY")" || die "failed to derive auth public key"
    echo "encrypt: $AUTH_CONFIG"
    age -a -e -r "$AUTH_PUB" -o "$AUTH_CONFIG_AGE" "$AUTH_CONFIG" || die "encrypt failed: $AUTH_CONFIG"
  else
    [ -f "$AUTH_CONFIG_AGE" ] || die "No auth config found: provide config.json or config.dev.json in $AUTH_SECRETS_DIR"
    echo "skip (using existing): $AUTH_CONFIG_AGE"
  fi

  echo "Auth config encryption complete."
}

cleanup_auth_secrets() {
  AUTH_SECRETS_DIR="./secrets/auth"
  AUTH_KEY="${AUTH_SECRETS_DIR}/age_key"
  AUTH_CONFIG_AGE="${AUTH_SECRETS_DIR}/config.json.age"

  chmod 600 "$AUTH_KEY" || true
  chmod 640 "$AUTH_CONFIG_AGE" || true

  for f in "${AUTH_SECRETS_DIR}/config.json" "${AUTH_SECRETS_DIR}/config.dev.json"; do
    if [ -f "$f" ]; then
      case "$f" in
        *dev*) echo "Keeping dev config: $f" ;;
        *)     rm -f "$f"; echo "Deleted sensitive auth config: $f" ;;
      esac
    fi
  done
}
```

### Usage example

Source the file in your main startup script and call both functions around your `docker compose` commands:

```bash [scripts/start.sh]
#!/bin/sh
set -eu

die() { echo "Error: $*" >&2; exit 1; }

. ./scripts/encrypt-auth.sh

encrypt_auth_config

docker compose up --build -d || die "docker compose failed"

cleanup_auth_secrets
```

### Directory layout

Place the IAM configuration and age key under `./secrets/auth/` in your project root:

```
your-project/
  secrets/
    auth/
      config.dev.json 
      age_key           
      config.json.age    
  scripts/
    encrypt-auth.sh
    start.sh
  docker-compose.yml
```

Your [Compose file](https://docs.docker.com/compose/how-tos/production/) mounts the age key and encrypted config as [Docker secrets](https://docs.docker.com/compose/how-tos/use-secrets/). The secrets point to `./secrets/auth/` where `encrypt_auth_config` writes its output:

```yaml [docker-compose.yml]
services:
  mysql: 
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: secure_password
      MYSQL_DATABASE: auth_db
      MYSQL_USER: auth_user
      MYSQL_PASSWORD: secure_password
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

  auth:
    image: riavzon/auth:latest
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

  app:
    # Your app container
    build: .
    depends_on:
      auth:
        condition: service_healthy

volumes:
  sql_db:  
  bot-detector-data:
  email-data:

secrets:
  age_key:
    file: ./secrets/auth/age_key
  encrypted_config:
    file: ./secrets/auth/config.json.age
```