# Fitted — Docker Deployment

This folder contains everything needed to package the built Fitted site into a
Docker image and serve it with Apache (`httpd`).

## 1. How the Dockerfile works

The `Dockerfile` uses a **two-stage build**:

1. **Build stage** (`node:20-alpine`) — installs the npm dependencies from
   `package.json` and runs `npm run build`, which invokes Vite. Vite compiles
   the five HTML entry points (Home, About, Contact, App, Login) and their
   React/JS/CSS into a single static `dist/` folder.
2. **Final stage** (`httpd:2.4-alpine`) — a small Apache image. It copies
   *only* the compiled `dist/` folder from the build stage into Apache's
   document root (`/usr/local/apache2/htdocs/`). Node.js, `node_modules`,
   and the raw source code are never included in the final image — just the
   static files a browser needs.

Because the React "App" page uses a **hash-based router** (`HashRouter`, e.g.
`app.html#/shop`), every route the site needs is either a real static file
(`index.html`, `about.html`, `contact.html`, `app.html`, `login.html`) or a
URL fragment handled entirely in the browser. That means the default Apache
configuration works with **no custom rewrite rules** — one less thing to
configure or debug on EC2 later.

## 2. Building the Docker image

Run this from the **project root** (the folder containing `package.json`),
not from inside `DockerContainer/`, since the Dockerfile needs the whole
project as its build context:

```bash
docker build -t fitted -f DockerContainer/Dockerfile .
```

## 3. Running the container locally

```bash
docker run -p 8080:80 fitted
```

Then visit **http://localhost:8080** in a browser.

## 4. Which port is exposed

The container exposes **port 80** (Apache's default). The `docker run`
command above maps the host's port `8080` to the container's port `80` — you
can change `8080` to any free port on your machine.

## 5. How the website files are served

Apache's `httpd-foreground` process serves whatever is in
`/usr/local/apache2/htdocs/` using its default configuration. Requesting
`/` serves `index.html` (the Home page); requesting `/about.html`,
`/contact.html`, `/app.html`, or `/login.html` serves those files directly.
Everything under `/assets/`, `/css/`, `/js/`, and `/images/` (bundled or
copied there by the Vite build) is served as plain static files.

## 6. Steps for deploying to an Ubuntu AWS EC2 instance (later)

These are the general steps for Project 2 — no AWS configuration is done in
Project 1:

1. Launch an Ubuntu EC2 instance and install Docker (`sudo apt-get install
   docker.io`).
2. Copy this project onto the instance (e.g. `git clone` or `scp`).
3. Build the image on the instance: `docker build -t fitted -f
   DockerContainer/Dockerfile .`
4. Run the container, mapping the container's port 80 to the host's port 80:
   `docker run -d -p 80:80 --restart unless-stopped fitted`
5. Open the EC2 instance's security group to allow inbound traffic on port
   80 (and 443, once HTTPS/a reverse proxy is added).
6. Point a domain name's DNS record at the instance's public IP, if desired.

Setting up the actual AWS security group, Elastic IP, and domain is
intentionally left for a later step.
