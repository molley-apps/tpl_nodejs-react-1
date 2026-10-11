---
trigger: always_on
---


# DDD (documentation driven development) Workflow with npm boats - Implementation Guide

OpenAPI Specification file used to generate boiler plate API code and frontend API consumers.

## Project Structure
```
project/
├── api_spec/src/
│   ├── index.yml              # Entry point
│   ├── paths/                 # URL structure = folder structure
│   └── components/            # Shared OpenAPI parts
├── api/
│   └── domain/                # YOUR CODE (preserved)
│   └── http/                  # AUTO-GENERATED (don't edit)
│   └── database/              # YOUR CODE (preserved)
│   └── services/              # YOUR CODE (preserved)
│   └── utils/                 # YOUR CODE (preserved)
├── frontends/
│   └── apis/                  # Generated API consumers
```

## High Level Flow
1. Evolve the OpenAPI specification by adjusting the files in `api_spec/src/`
2. From `api_spec/`, run `npm run build`
3. From `api/`, run `npm run generate:server`, then complete the domain logic
4. From `frontends/apis/`, run `npm run generate:api-consumers`
5. Use the generated API consumers in your frontend applications

---

## Part 1: Evolving the OpenAPI Spec

**Tooling:** [BOATS](https://j-d-carmichael.github.io/boats/#/)

### Path & File Conventions
- Create folders matching your URLs in `api_spec/src/paths/`:
```
  paths/user/index.yml        → GET /user
  paths/user/{id}/index.yml   → GET /user/{id}
```
- All path files are named by their HTTP verb only (e.g. `get.yml`, `post.yml`)
- Path params are indicated in the folder name with curly braces like `{id}`

### Components Conventions
- In `components/parameters/`, each file name clearly indicates its purpose — path or query — e.g. `pathCompanyId.yml`, `queryLimit.yml`
- In `components/schemas/`, the **only** permitted file names are: `put`, `post`, `patch`, `model`, `models`, `baseAttributes`, and `enum`
  - `model` and `post`/`put` use `baseAttributes` and add their own attributes as needed using the `allOf` operator
- In `components/schemas/` when creating a pagination block always use the mixin `pagination.yml` and pass the model and models as variables ensuring the directory traversal is relative to the current file.

### Rules
- **Always** use `$ref` for all parameters and components — never inline them ever
- **Never** use `oneOf` or `anyOf` — only `allOf` is permitted
- The `inject` template Nunjucks helper is used to inject common content into path files so it doesn't need to be duplicated unless overriding
- The main `index.yml` is the entry point and uses the BOATS inject helper to inject common elements

### Build Command
```bash
cd api_spec
npm run build
```
Outputs the compiled spec to `api_spec/release/api_spec.yml`.

### Example Spec Files
```yaml
# api_spec/src/paths/idea/{companyId}/post.yml
parameters:
  - $ref: ../../../components/parameters/pathCompanyId.yml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: ../../../components/schemas/idea/post.yml
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: ../../../components/schemas/idea/model.yml
```
```yaml
# api_spec/src/components/schemas/idea/post.yml
allOf:
  - $ref: ./baseAttributes.yml
```
```yaml
# api_spec/src/components/schemas/idea/model.yml
allOf:
  - $ref: ./baseAttributes.yml
  - type: object
    required:
      - _id
      - companyId
      - title
      - createdAt
      - updatedAt
      - createdBy
    properties:
      _id:
        type: string
        format: uuid
      companyId:
        type: string
        format: uuid
      updatedAt:
        type: string
        format: date-time
      createdBy:
        type: string
        format: uuid
      isArchived:
        type: boolean
      archiveMetadata:
        $ref: ./archiveMetadata/model.yml
```

---

## Part 2: Regenerating the Server

**Tooling:** [generate-it](https://acr-lfr.github.io/generate-it/)
```bash
cd api
npm run generate:server
```

- The `http/` folder is **deleted and fully regenerated** on each run — never edit files in it directly
- All routes, input/output validation etc and TypeScript interfaces live in `http/`
- The generated server uses the compiled OpenAPI file for each run
- The interfaces generated in `http/nodegen/interfaces/**` are used by the domain logic


### Package.json Scripts Reference
```json
// api_spec
{ "scripts": { "build": "boats -i ./src/index.yml -o ./release/api-spec.yml -x -O" } }

// api
{ "scripts": { "generate:server": "generate-it ../api-spec/release/api-spec.yml --yes -t https://github.com/johncarmichael-rgb/gen-tpl-express-server.git" } }

// frontends/apis
{ "scripts": { "generate:api-consumers": "node generate-apis.js && pnpm lint:fix" } }
```

---

## Part 3: Implementing Domain Logic

After generation, complete the domain files — they will be stubs for new domains, or require new stubs added when a domain is expanded.
After each generation there is an empty example of the domain `apis/api-mono/api/.openapi-nodegen/cache/compare/src/domains` to review for reference of what the domain would have been if generated from scratch.
Always follow the interface the domain implements.

### Rules
- Generated interfaces in `http/` tell you exactly what methods to implement
- **Only** implement methods defined in the generated interface — do not add extra methods to domain classes
- Custom/shared logic belongs in `utils/` or `services/` classes as appropriate
- The database layer uses **typegoose**
- All queries must be implemented **only** in the repository class — never anywhere else
- Never call a model directly anywhere outside its own repository class
- When code is mission-critical or complex, add a unit test to verify correct behaviour
- **"Find it, report it, fix it"** — if you spot obvious mistakes unrelated to the current task, report them and ask whether to fix them; never silently ignore them
- Never add other methods to the domains, only the methods defined in the interface, additional code should be added to a util or service class

### Example Domain Implementation
```typescript
// api/src/domains/IdeaDomain.ts
import {
  Idea,
  IdeaCompanyIdGetPath,
  IdeaCompanyIdPostPath,
  IdeaCompanyIdPostPost,
  Ideas,
} from '@/http/nodegen/interfaces';
import { IdeaDomainInterface } from '@/http/nodegen/domainInterfaces/IdeaDomainInterface';

class IdeaDomain implements IdeaDomainInterface {
  public async ideaCompanyIdPost(
    body: IdeaCompanyIdPostPost,
    params: IdeaCompanyIdPostPath
  ): Promise<Idea> {
    return {}; // TODO: implement business logic
  }
}

export default new IdeaDomain();
```

---

## Part 4: Implementing Frontend

From `frontends/apis/`, run `npm run generate:api-consumers`which generates all http consumers that can be used in the frontend.

The API expects auth to be handled via cookies hence frontends/services/src/HttpService.ts withCredentials: true,

Follow the patterns set in whichever frontend app you are evolving.



## ESLint Compliance

Before writing or modifying code in **any** app (API, frontend, extension, etc.), read the ESLint configuration file (`.eslintrc.*`) located in the root of that app's directory. Respect all rules defined there — do not introduce code that would fail linting. Every app may have its own ESLint rules, so always check the config relative to the app you are currently working in.

---

## Quick Reference

| What | Where | Rule |
|------|-------|------|
| API spec | `api_spec/src/` | ✅ Edit freely |
| Business logic | `api/domain/` | ✅ Edit freely — preserved on regeneration |
| Database queries | `api/database/` (repository classes only) | ✅ Queries here and nowhere else |
| Generated server | `api/http/` | ❌ Never edit — deleted on each regeneration |


## Coding principles to apply
1. DRY - don't repeat yourself. It is fine to write some code in a method class once, but when you need it in another place lift it out into a reusable util function or service class.
2. KISS - Keep it simple and stupid. Use common sense here, do not create overly complex solutions when something simple would suffice. Build for today, not for a hypothecial tomorrow.
3. DDD - documentation driven development - see above