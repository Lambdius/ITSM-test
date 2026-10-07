.PHONY: run env build up down restart logs install hooks compile generate lint lint-fix tsc knip env-check migrate seed test utest itest coverage coverage-unit coverage-integration check

# Infrastructure
env:
	@test -f .env || cp .env.example .env
run:
	$(MAKE) env
	$(MAKE) build
	$(MAKE) up
	$(MAKE) migrate
	$(MAKE) seed
build:
	docker compose build service
up:
	docker compose up -d --wait
down:
	docker compose down
restart: down up

# Development
install:
	pnpm install --frozen-lockfile
	pnpm run generate
hooks:
	pnpm run hooks:install
compile:
	pnpm run build
generate:
	pnpm run generate
lint:
	pnpm run lint
lint-fix:
	@pnpm --silent run lint:fix
tsc:
	pnpm run tsc
knip:
	pnpm run knip
env-check:
	pnpm run env:check
check: tsc lint knip env-check coverage

# Database
migrate:
	docker compose run --rm service pnpm run db:migrate
seed:
	docker compose run --rm service pnpm run db:seed

# Test
utest:
	pnpm run utest
itest:
	pnpm run itest
coverage:
	pnpm run coverage:all
coverage-unit:
	pnpm run coverage:unit
coverage-integration:
	pnpm run coverage:integration
