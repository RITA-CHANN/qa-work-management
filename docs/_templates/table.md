---
title: <table_name>
type: table
status: draft # draft | review | approved | deprecated
phase: <N>
owner: <who>
reviewers: [Linh]
approved:
model: <PrismaModel>
updated: YYYY-MM-DD
---

# <table_name>

What one row means, and who writes and reads it. Column definitions follow ISO/IEC 11179 (one precise sentence
saying what the value **is**); data quality rules follow ISO/IEC 25012.

## Columns

| Column | Type | Null | Default | Key | Definition | Classification | Rule | Since phase |
| ------ | ---- | ---- | ------- | --- | ---------- | -------------- | ---- | ----------- |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API).
Times are stored in UTC and shown as ISO 8601.

## Indexes and constraints

| Name | Columns | Kind | Why |
| ---- | ------- | ---- | --- |

## Relationships

| Column | References | On delete | Meaning |
| ------ | ---------- | --------- | ------- |

## Lifecycle

When rows are created, updated and deleted.

## Retention

How long rows are kept and how they are removed.

## Data quality rules

| Rule | Checked by |
| ---- | ---------- |

## Seed data

## Used by

API and design docs that read or write this table.

## Change log

| Date | Change | Migration | Why |
| ---- | ------ | --------- | --- |
