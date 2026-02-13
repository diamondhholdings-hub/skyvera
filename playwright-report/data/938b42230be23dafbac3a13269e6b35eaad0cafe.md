# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e4]:
      - link "Skyvera" [ref=e6] [cursor=pointer]:
        - /url: /dashboard
        - img "Skyvera" [ref=e7]
      - generic [ref=e8]:
        - link "Dashboard" [ref=e9] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e10]
        - link "Accounts" [ref=e15] [cursor=pointer]:
          - /url: /accounts
          - img [ref=e16]
        - link "Alerts" [ref=e20] [cursor=pointer]:
          - /url: /alerts
          - img [ref=e21]
        - link "Scenarios" [ref=e24] [cursor=pointer]:
          - /url: /scenario
          - img [ref=e25]
        - link "DM Strategy" [ref=e29] [cursor=pointer]:
          - /url: /dm-strategy
          - img [ref=e30]
        - link "Ask" [ref=e33] [cursor=pointer]:
          - /url: /query
          - img [ref=e34]
  - main [ref=e36]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e53] [cursor=pointer]:
    - img [ref=e54]
  - alert [ref=e57]: Customer Accounts - Skyvera
```