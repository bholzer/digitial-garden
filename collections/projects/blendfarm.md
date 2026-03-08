---
name: BlendFarm
description: An AWS Batch-based render farm for Blender 3D.
tags:
  - AWS
  - Rails
  - Blender
icon: mdi:blender
accent: "#60e6ebff"
featured: true
stage: Prototype
activity: Paused
github: https://github.com/bholzer/blendfarm
---

BlendFarm is a distributed render farm for [Blender](https://www.blender.org/). Upload a `.blend` file, define your render, and let a fleet of cloud workers chew through it. I wanted a cheap, reliable way to render animations for myself and learn along the way. I thought it might be valuable for others, so the goal was to open source it.

This project keeps pulling me back. It combines my interest in 3D graphics with real distributed systems problems — job orchestration, infrastructure provisioning, file distribution, cost optimization, containerized workloads. Every layer has something interesting worth solving.

## Past approaches

The first attempt used DynamoDB and Lambda. The idea was near-zero idle costs, but DynamoDB was a poor fit for relational data like projects, jobs, and frames. Lambda-based orchestration was painful to deploy and debug. I felt that the developer experience fought me constantly.

I rewrote it in **Rails**. It's what I know best, and the real goal was always to build something I'd actually use. The experimentation was valuable, but I wanted to spend more time on the problems I cared about and less time fighting the tools.

## Architecture

- **Rails app** — central hub for UI, API, project/job management, and render orchestration.
- **AWS Batch** — compute backend. Containerized Blender jobs run on EC2 with spot instance support. Batch handles scheduling, scaling, and retries.
- **S3 + EFS** — `.blend` files in, rendered frames out.
- **Terraform** — provisions static AWS resources (ECR, IAM, EFS, S3).
- **Docker** — versioned Blender containers pushed to ECR.

**Projects** contain **Jobs**. Each Job splits into frame tasks distributed across workers. Users configure the render parameters, pick a compute profile, and submit.

## Infrastructure: IaC vs. application

I am used to building infrastructure as code, where there is a clear separation between the application and the infrastructure. I find this project to be different — the lines between the two were blurry and the application needed to manage infrastructure for the best user experience.

Some resources are static — ECR repos, IAM roles, S3 buckets. These belong in IaC; they exist outside the application lifecycle.

Compute environments, job definitions, and queues are different. These resources are an administrative concern of the *running application*. The Rails app manages them directly as first-class objects with their own lifecycle, rather than requiring Terraform changes and redeployment.

## Status

Prototype stage. Core submission and rendering pipeline works. I am able to render frames with this setup. I have paused work for now, but there's no doubt I'll be back to it.

Some ideas for next steps:
- Job monitoring UI
- Output browsing
- Spot interruption handling
- Compute environment admin tooling
- Managed service layer (accounts, billing, quotas)
