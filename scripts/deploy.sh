#!/bin/bash

VERB=$1
PROJECT=$2

terraform -chdir=infra init 

terraform -chdir=infra $VERB -var-file=${PROJECT}.tfvars -state=${PROJECT}-terraform.tfstate
