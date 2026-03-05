---
title: Distributed Authentication & Security
description: A modular infrastructure stack for Node.js and edge frameworks.
---


::UPageHero{:links="links"}
---
headline: Riavzon Ecosystem
title: Distributed Authentication & Security
description: A modular infrastructure stack for Node.js and edge frameworks.
orientation: horizontal
---

#default
::UTabs
---
variant: "link"
ui:
 list: overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-hide
 trigger: shrink-0
 label: whitespace-nowrap
items:
  - label: "Protect"
    icon: "i-lucide-shield-check"
    slot: "protect"
  - label: "Personalize"
    icon: "i-lucide-user-cog"
    slot: "personalize"
  - label: "Rotate Tokens"
    icon: "i-lucide-refresh-cw"
    slot: "rotate"
  - label: "Bots"
    icon: "i-lucide-bot"
    slot: "bots"
---

#protect
```ts [protect.ts]
export default defineAuthenticatedEventHandler((async) => {
    const { userId } = event.context.authorizedData;
    // Do authenticated stuff
})
```
#personalize
```ts [personalize.ts]
import { defineOptionalAuthenticationEvent } from 'auth-h3client';
 export default defineOptionalAuthenticationEvent((event) => {
    const {authorized, userId} = event.context.authorizedData;
    if (authorized) {
        // Do stuff with userId
    }
});
```
#rotate
```ts [rotate.ts]
import {ensureValidCredentials} from 'auth-h3client'
export default defineEventHandler( async (event) => {
    const value = await ensureValidCredentials(event);
    const newToken = event.context.accessToken;
    const newRefreshToken = event.context.session;
})
```
#bots
```ts [bots.ts]
    import {botDetectorMiddleware} from 'auth-h3client'
    export default defineEventHandler( async (event) => {
        await botDetectorMiddleware(event);
    })

```
::
