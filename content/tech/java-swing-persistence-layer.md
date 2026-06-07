---
title: "Java Swing Persistence Layer"
slug: "java-swing-persistence-layer"
date: "2025-11-20"
category: "Linux"
excerpt: "Architecting a desktop application for student attendance. The goal was to build a robust GUI using Java Swing while maintaining a highly normalized MySQL database structure."
---

Architecting a desktop application for student attendance. The goal was to build a robust GUI using Java Swing while maintaining a highly normalized MySQL database structure. Implementing an event-driven architecture decoupled the UI from the database transactions.

### Multi-tiered Architecture

```
  [ Swing GUI ] <---> [ Action Listeners ] <---> [ Service Layer ]
                                                        |
                                                        v
  [ MySQL DB ]  <------------------------------> [ JDBC DAO Layer ]
```

This clean decoupling of database DAO interfaces prevented standard thread blocking issues in Swing and kept the interface fully liquid and interactive.
