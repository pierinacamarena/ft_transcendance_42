all:
	docker compose up -d --build

start:
	docker compose up -d

stop:
	docker compose stop

down:
	docker compose down

delete:
	docker compose down	-v --rmi all

.PHONY: all start stop down delete
