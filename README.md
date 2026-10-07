# Profile Backend

Цифровая API визитка: TypeScript, Node.js, NestJS, Prisma, GraphQL и PostgreSQL.

----

<details>
<summary><strong>Локальный запуск</strong></summary>

```sh
make run
```

Apollo Sandbox: [localhost:3000/graphql](http://localhost:3000/graphql)
при `APP_PUBLISHED_PORT=3000`. Health: `/health/liveness` и `/health/readiness`.

```graphql
query ProfileCard {
  profile {
    name
    description
    links {
      label
      url
    }
    skills(first: 100) {
      edges {
        node {
          name
        }
      }
    }
    experience {
      edges {
        node {
          company
          position
          startDate
          endDate
          achievements
        }
      }
    }
    projects {
      edges {
        node {
          name
          url
        }
      }
    }
  }
}
```

</details>

----

<details>
<summary><strong>Команды</strong></summary>

Для локальных проверок установите Node.js и pnpm версий из `package.json`, затем выполните `make install`.

| Команда                            | Назначение                                                  |
|:-----------------------------------|:------------------------------------------------------------|
| `make run`                         | Подготовка окружения, сборка, запуск, миграции, сидирование |
| `make build / up / down / restart` | Сборка и управление контейнерами                            |
| `make compile / generate`          | Сборка TypeScript / генерация Prisma Client                 |
| `make check`                       | Env, TypeScript, ESLint, Knip и тесты                       |
| `make lint / lint-fix`             | Статический анализ и исправление форматирования             |
| `make utest / itest`               | Запуск Unit / интеграционных тестов                         |
| `make coverage`                    | Покрытие тестами                                            |
| `make migrate / seed`              | Миграции / сидирование                                      |
| `make hooks`                       | Установка Git hooks                                         |

</details>
