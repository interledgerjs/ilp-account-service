#! /bin/sh

export CONNECTOR_URL="grpc://localhost:5550"
export ACCOUNT_ID="test-plugin"
read -r -d '' _account_info << EOM
{
  "relation":"peer",
  "plugin":"ilp-plugin-btp",
  "assetCode":"USD",
  "assetScale":"9"
}
EOM
export ACCOUNT_INFO="$_account_info"
export DEBUG="*"

node build/index.js