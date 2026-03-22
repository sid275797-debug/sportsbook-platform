terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
  backend "s3" {
    bucket = "sportsbook-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source  = "./modules/vpc"
  name    = "sportsbook-vpc"
  cidr    = "10.0.0.0/16"
  azs     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

module "eks" {
  source          = "./modules/eks"
  cluster_name    = "sportsbook-${var.environment}"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  node_groups = {
    general = { instance_types = ["m6i.xlarge"], min_size = 2, max_size = 10, desired_size = 3 }
    high_mem = { instance_types = ["r6i.2xlarge"], min_size = 1, max_size = 5, desired_size = 2 }
  }
}

module "rds" {
  source            = "./modules/rds"
  identifier        = "sportsbook-postgres"
  engine_version    = "16.2"
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 200
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  multi_az          = true
}

module "elasticache" {
  source         = "./modules/elasticache"
  cluster_id     = "sportsbook-redis"
  node_type      = "cache.r6g.large"
  num_nodes      = 3
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
}

module "msk" {
  source         = "./modules/msk"
  cluster_name   = "sportsbook-kafka"
  kafka_version  = "3.6.0"
  broker_nodes   = 3
  instance_type  = "kafka.m5.large"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
}

module "cloudfront" {
  source          = "./modules/cloudfront"
  origin_domain   = "api.sportsbook.example.com"
  aliases         = ["sportsbook.example.com", "www.sportsbook.example.com"]
}
