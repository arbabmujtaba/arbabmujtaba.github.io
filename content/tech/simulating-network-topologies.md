---
title: "Simulating Network Topologies"
slug: "simulating-network-topologies"
date: "2026-05-10"
category: "Networking"
excerpt: "Building a custom network simulation tool to model packet transfers, network topologies, and routing algorithms."
---

Building a custom network simulation tool to model packet transfers, network topologies, and routing algorithms. The core challenge was implementing a reliable transmission protocol over an unreliable simulated medium without bottlenecking the main execution thread.

### Network Topology Architecture

```
  [Node A] --(Simulated Link)--> [Router] --(Lossy Medium)--> [Node B]
     |                              |                            |
     |---[ Buffer ]                 |---[ Routing Table ]        |---[ Reassembly ]
     |---[ Retransmission ]         |---[ Congestion Ctrl]       |---[ ACK Queue ]
```

By separating packet retransmissions and buffer queues into event-driven pools, congestion was measured and managed exactly like real-world network routing layers.
