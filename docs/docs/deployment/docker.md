---
icon: fontawesome/brands/docker
tags:
  - Deployment
---

# Docker Deployment

This documentation has the goal of showing a user how to deploy PowerBeacon using Docker. This is the recommended deployment method for most users,
as it provides a good balance between ease of use and flexibility. It is also the best option for users who want to deploy PowerBeacon on their own infrastructure, such as on-premises or in a private cloud.

## Configure and run PowerBeacon with Docker

1. Create a directory on the container host machine to store PowerBeacon configuration and data:=
    ```bash
    mkdir -p ./powerbeacon
    cd ./powerbeacon
    ```
2. Create a `docker-compose.yml` file in the `powerbeacon` directory with the following content:

    ```yaml
    services:
      db:
        image: postgres:16-alpine
        container_name: powerbeacon-db
        environment:
          POSTGRES_USER: powerbeacon
          POSTGRES_PASSWORD: ${DB_PASSWORD:-changeMe}
          POSTGRES_DB: powerbeacon
        volumes:
          - powerbeacon_data:/var/lib/postgresql/data
        networks:
          - powerbeacon_network
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U powerbeacon"]
          interval: 10s
          timeout: 5s
          retries: 5

      powerbeacon:
        image: kotsiossp97/powerbeacon:latest
        container_name: powerbeacon
        environment:
          DB_URL: postgresql://powerbeacon:${DB_PASSWORD:-changeMe}@db:5432/powerbeacon
          JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
        ports:
          - "8000:80"
        depends_on:
          db:
            condition: service_healthy
        networks:
          - powerbeacon_network

    volumes:
      powerbeacon_data:

    networks:
      powerbeacon_network:
        driver: bridge
    ```
    !!! tip "Note"
        Alternatively you can use the following command to download the `docker-compose.yml` file directly from the repository:

        ```bash
        curl -o docker-compose.yml https://raw.githubusercontent.com/kotsiossp97/powerbeacon/main/example.compose.yml
        ```

    Also if you have an external database you can omit the `db` service and update the `DB_URL` environment variable in the `powerbeacon` service to point to your external database. And an even simpler option is to use the following command to create a container directly without using `docker-compose`:

    ```bash
    docker run -d \
      --name powerbeacon \
      -p 8000:80 \
      -e DB_URL=postgresql://powerbeacon:changeMe@db:5432/powerbeacon \
      -e JWT_SECRET=your-secret-key-change-in-production \
      powerbeacon:latest
    ```
