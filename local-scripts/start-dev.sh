#!/usr/bin/env bash
set -e

parse_args() {
  for arg in "$@"; do
    case "$arg" in
      -[^=]*=*)
        k="${arg%%=*}"; k="${k#-}"; v="${arg#*=}"
        eval "ARGS_${k}=\$v"
        ;;
    esac
  done
}

get_arg() {
  eval "printf '%s' \"\${ARGS_$1}\""
}

get_required_arg() {
  eval "val=\${ARGS_$1}"
  if [ -z "$val" ]; then
    echo "Error: -$1 argument is required" >&2
    exit 1
  fi
  printf '%s' "$val"
}

confirm_value() {
  label="$1"; value="$2"
  while true; do
    read -r -p "The $label is '$value'. Type the $label again to confirm: " input
    if [ "$input" = "$value" ]; then
      break
    fi
    echo "$label does not match."
  done
}


confirm_with_yes() {
  label="$1"; value="$2"
  while true; do
    read -r -p "The $label is '$value'. Type the yes to confirm and continue: " input
    if [ "$input" = "yes" ]; then
      break
    fi
    echo "You did not type yes"
  done
}

confirm_not_empty_var() {
  var_name="$1"
  eval "val=\${$var_name}"
  if [ -z "$val" ]; then
    echo "Error: $var_name cannot be empty." >&2
    exit 1
  fi
}

gcp_switch_project() {
  project="$1"
  gcloud config set project "$project" >/dev/null
  current="$(gcloud config get-value project 2>/dev/null)"
  if [ "$current" != "$project" ]; then
    echo "Error: Failed to switch to project '$project'." >&2
    exit 1
  fi

}

# ---------- usage ----------
# parse CLI like: ./start-dev.sh -mode=prod -env=dev
parse_args "$@"

gcp_project="agoat-publisher-dev"
confirm_with_yes "project name" "$gcp_project"
gcp_switch_project "$gcp_project"

db1_secret_name_ca="agoat-publisher-db-main-cockroach-ca"
db1_secret_name_dsn="agoat-publisher-db-main-cockroach-dsn"
  # checkov:skip=CKV_SECRET_6: ADD REASON

confirm_not_empty_var db1_secret_name_ca
confirm_not_empty_var db1_secret_name_dsn

export CA="$(gcloud secrets versions access latest --secret="$db1_secret_name_ca" --project="$gcp_project")"
export DSN="$(gcloud secrets versions access latest --secret="$db1_secret_name_dsn" --project="$gcp_project")"

go run  "$(dirname "$0")/../app/main.go"
# examples:
mode="$(get_arg mode)"
env="$(get_arg env)"
